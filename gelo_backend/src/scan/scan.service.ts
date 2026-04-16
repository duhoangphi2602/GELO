import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosticEngineService } from './diagnostic-engine.service';
import { cloudinary } from '../common/cloudinary.config';
import { DiagnosticStatus } from '@prisma/client';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    private prisma: PrismaService,
    private engine: DiagnosticEngineService
  ) { }

  /** Phase 1: Nhận ảnh, gọi AI và trả về bộ câu hỏi phù hợp */
  async initiateScan(patientId: number, imageUrls: string[]) {
    this.logger.log(`Phase 1: Initiating scan for patient ${patientId}`);

    // 1. Tạo bản ghi Scan và ScanImage
    const scan = await this.prisma.skinScan.create({
      data: {
        patientId: patientId,
        images: {
          create: imageUrls.map(url => ({ imageUrl: url }))
        }
      }
    });

    // 2. GỌI SANG AI SERVICE (FASTAPI)
    let aiDiseaseId: number | null = null;
    let aiConfidence = 0.0;
    let modelVer = 'v1.0.0';
    let diagnosticStatus: DiagnosticStatus = DiagnosticStatus.UNKNOWN;

    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const apiKey = process.env.INTERNAL_API_KEY || '';

      const aiResponse = await fetch(`${aiUrl}/ai/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': apiKey,
        },
        body: JSON.stringify({ image_urls: imageUrls, scan_id: scan.id })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        this.logger.error(`AI Service returned error (${aiResponse.status}): ${errorText}`);
        throw new ServiceUnavailableException('AI Diagnostic Service is currently unavailable or returned an error.');
      }

      const result = await aiResponse.json();
      const rawId = result.disease_id;

      // Nếu AI trả về 0 hoặc null -> UNKNOWN
      if (rawId === 0 || !rawId) {
        aiDiseaseId = null;
        diagnosticStatus = DiagnosticStatus.UNKNOWN;
      } else {
        aiDiseaseId = rawId;
        diagnosticStatus = (result.diagnosticStatus as DiagnosticStatus) || DiagnosticStatus.DISEASE;
      }

      aiConfidence = result.confidence;
      modelVer = result.model_version || modelVer;
    } catch (error) {
      this.logger.error(`AI Service communication failure: ${error.message}`);
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('AI Diagnostic Service is unreachable. Please try again later.');
    }

    // 4. Lưu lại dự đoán ban đầu
    await this.prisma.prediction.create({
      data: {
        scanId: scan.id,
        diagnosticStatus,
        diseaseId: aiDiseaseId,
        confidence: aiConfidence * 100,
        modelVersion: modelVer
      }
    });

    // 5. Lấy bộ câu hỏi dựa trên kết quả AI
    // Nếu AI đoán được bệnh -> Lấy rules của bệnh đó.
    // Nếu AI không đoán được -> Lấy rules của "General Inquiry" (Mặc định ID=1 hoặc category chung)
    let questionsDiseaseId = aiDiseaseId;
    if (!questionsDiseaseId || diagnosticStatus !== DiagnosticStatus.DISEASE) {
      // Fallback: Nếu AI không nhận diện được bệnh cụ thể, dùng bệnh đầu tiên trong DB làm bộ khảo sát mặc định
      const fallbackDisease = await this.prisma.disease.findFirst({ orderBy: { id: 'asc' } });
      questionsDiseaseId = fallbackDisease?.id || null;
    }

    const rules = await this.prisma.diseaseRule.findMany({
      where: { diseaseId: questionsDiseaseId, isActive: true },
      include: { question: true }
    });

    const questions = rules
      .filter(r => r.question)
      .map(r => ({
        id: r.question!.id,
        text: r.question!.questionText,
        isEmergency: r.question!.isEmergency
      }));

    return {
      scanId: scan.id,
      predictedDisease: aiDiseaseId ? (await this.prisma.disease.findUnique({ where: { id: aiDiseaseId } }))?.name : 'Unknown',
      diagnosticStatus,
      confidence: aiConfidence * 100,
      questions
    };
  }

  /** Phase 2: Nhận câu trả lời, tính điểm Hybrid và chốt kết quả */
  async completeScan(scanId: number, answers: any[], patientId: number) {
    this.logger.log(`Phase 2: Completing scan ${scanId} for patient ${patientId} with answers`);

    // 1. Lấy lại Scan và Prediction, đảm bảo quyền sở hữu
    const scan = await this.prisma.skinScan.findFirst({
      where: { id: scanId, patientId: patientId },
      include: { predictions: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!scan || scan.predictions.length === 0) {
      throw new BadRequestException('Scan not found or access denied');
    }

    const prediction = scan.predictions[0];
    const diseaseId = prediction.diseaseId;

    // 2. Lấy Rules để chấm điểm
    const rules = await this.prisma.diseaseRule.findMany({
      where: { diseaseId: diseaseId, isActive: true },
      include: { question: true }
    });

    // 3. Tính điểm Hybrid
    const aiScore = prediction.confidence || 0;
    const engineResult = this.engine.calculateHybridScore(aiScore, answers, rules);

    // 4. Lưu kết quả chẩn đoán cuối cùng
    const diagnosis = await this.prisma.$transaction(async (tx) => {
      // Lưu Rule Logs
      if (engineResult.ruleLogs.length > 0) {
        await tx.ruleScoreLog.createMany({
          data: engineResult.ruleLogs.map((log) => ({
            scanId: scanId,
            questionId: log.questionId,
            patientAnswer: log.patientAnswer,
            expectedAnswer: log.expectedAnswer,
            isMatch: log.isMatch,
            weight: log.weight,
            scoreContribution: log.scoreContribution,
          }))
        });
      }

      // Tạo DiagnosisResult
      const finalStatus = (engineResult.decision === 'positive' || engineResult.decision === 'emergency') ? DiagnosticStatus.DISEASE : prediction.diagnosticStatus;

      const result = await tx.diagnosisResult.create({
        data: {
          scanId: scanId,
          diagnosticStatus: finalStatus,
          predictedDiseaseId: diseaseId,
          finalDiseaseId: diseaseId,
          isEmergency: engineResult.isEmergency,
          ruleScore: engineResult.ruleScore,
          maxRuleScore: engineResult.maxRuleScore,
          normalizedScore: engineResult.normalizedScore,
          decision: engineResult.decision,
        }
      });

      // Step 4 logic: Nếu kết quả dương tính và điểm cao (ví dụ > ngưỡng cấu hình), lưu vào DiseaseImage để làm training data
      const autoTrainThreshold = Number(process.env.AUTO_TRAIN_THRESHOLD || 85);
      if (engineResult.decision === 'positive' && engineResult.normalizedScore >= autoTrainThreshold && diseaseId) {
        const firstImage = await tx.scanImage.findFirst({ where: { scanId } });
        if (firstImage) {
          await tx.diseaseImage.create({
            data: {
              diseaseId: diseaseId,
              scanId: scanId,
              imageUrl: firstImage.imageUrl,
            }
          });
        }
      }

      return result;
    });

    return {
      message: "Diagnosis Complete",
      scanId,
      diagnosis
    };
  }

  async getScansForPatient(patientId: number) {
    return await this.prisma.skinScan.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        diagnosis: {
          include: {
            predictedDisease: true
          }
        },
        predictions: { take: 1 }
      }
    });
  }

  /** Trả về danh sách bệnh nhân kèm số lượng scan và bệnh gần nhất */
  async getAdminPatients() {
    const patients = await this.prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { email: true, username: true, role: true } },
        skinScans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            diagnosis: { include: { predictedDisease: true } }
          }
        },
        _count: { select: { skinScans: true, diaries: true } }
      }
    });
    return patients.map(p => ({
      id: p.id,
      fullName: p.fullName,
      age: p.age,
      gender: p.gender,
      createdAt: p.createdAt,
      email: p.account?.email,
      username: p.account?.username,
      totalScans: p._count.skinScans,
      totalDiaries: p._count.diaries,
      lastScanDisease: p.skinScans[0]?.diagnosis?.diagnosticStatus === DiagnosticStatus.HEALTHY
        ? 'Healthy'
        : p.skinScans[0]?.diagnosis?.diagnosticStatus === DiagnosticStatus.UNKNOWN
          ? 'Unknown'
          : (p.skinScans[0]?.diagnosis?.predictedDisease?.name ?? null),
      lastScanDate: p.skinScans[0]?.createdAt ?? null,
    }));
  }

  async getAdminStats() {
    const totalDiagnoses = await this.prisma.skinScan.count();
    const totalPatients = await this.prisma.patient.count();

    // 1. Lấy tất cả bệnh đang có trong hệ thống
    const diseases = await this.prisma.disease.findMany({
      select: {
        id: true,
        name: true,
        feedbackPredicted: {
          select: { isCorrect: true }
        }
      }
    });

    // 2. Tính toán hiệu suất cho từng bệnh (Precision)
    const diseaseStats = diseases.map(d => {
      const totalReviews = d.feedbackPredicted.length;
      const correctCount = d.feedbackPredicted.filter(f => f.isCorrect).length;
      const accuracy = totalReviews > 0 ? (correctCount / totalReviews) * 100 : 100.0; // Mặc định 100 nếu chưa có data

      return {
        diseaseId: d.id,
        name: d.name,
        totalReviews,
        correctCount,
        accuracy
      };
    });

    // 3. Tính độ chính xác tổng quát của Model (chỉ tính trên những ca đã được review)
    const totalReviews = diseaseStats.reduce((sum, d) => sum + d.totalReviews, 0);
    const totalCorrect = diseaseStats.reduce((sum, d) => sum + d.correctCount, 0);
    const modelAccuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 100.0;

    return {
      totalDiagnoses,
      totalPatients,
      modelAccuracy,
      diseaseStats // Trả về thêm mảng stats chi tiết
    };
  }

  /** Trả về các scan có AI confidence thấp hơn ngưỡng (mặc định cấu hình) chưa được admin review */
  async getPendingReviews(threshold?: number) {
    const reviewThreshold = threshold ?? Number(process.env.LOW_CONFIDENCE_THRESHOLD || 60);
    const predictions = await this.prisma.prediction.findMany({
      where: { confidence: { lt: reviewThreshold } },
      orderBy: { createdAt: 'desc' },
      include: {
        scan: {
          include: {
            patient: { select: { fullName: true, id: true } },
            images: { take: 1 },
            diagnosis: { include: { predictedDisease: true, finalDisease: true } },
            feedback: { take: 1 }
          }
        },
        disease: true
      }
    });
    // Lọc: chỉ lấy scan chưa có feedback (chưa review)
    return predictions
      .filter(p => p.scan?.feedback?.length === 0)
      .map(p => ({
        predictionId: p.id,
        scanId: p.scanId,
        confidence: p.confidence,
        modelVersion: p.modelVersion,
        createdAt: p.createdAt,
        patientId: p.scan?.patient?.id,
        patientName: p.scan?.patient?.fullName,
        imageUrl: p.scan?.images?.[0]?.imageUrl ?? null,
        predictedDisease: p.diagnosticStatus === DiagnosticStatus.HEALTHY ? 'Healthy' : p.diagnosticStatus === DiagnosticStatus.UNKNOWN ? 'Unknown' : (p.disease?.name ?? 'Unknown'),
        diagnosisId: p.scan?.diagnosis?.id ?? null,
      }));
  }

  /** Admin submit đánh giá: xác nhận hoặc sửa kết quả AI cho 1 scan */
  async submitReview(scanId: number, body: { isCorrect: boolean; actualDiseaseId?: number; actualStatus?: string; note?: string }) {
    const diagnosis = await this.prisma.diagnosisResult.findUnique({ where: { scanId } });
    if (!diagnosis) throw new Error('Diagnosis not found for scanId ' + scanId);

    // Nếu sai → cập nhật finalDisease theo admin
    if (!body.isCorrect) {
      await this.prisma.diagnosisResult.update({
        where: { scanId },
        data: {
          finalDiseaseId: body.actualDiseaseId || null,
          diagnosticStatus: (body.actualStatus as DiagnosticStatus) || (body.actualDiseaseId ? DiagnosticStatus.DISEASE : diagnosis.diagnosticStatus)
        }
      });
    }

    // Ghi feedback log
    const feedback = await this.prisma.feedbackLog.create({
      data: {
        scanId,
        diagnosticStatus: (body.actualStatus as DiagnosticStatus) || diagnosis.diagnosticStatus,
        predictedDiseaseId: diagnosis.predictedDiseaseId,
        actualDiseaseId: body.isCorrect ? diagnosis.predictedDiseaseId : (body.actualDiseaseId || null),
        isCorrect: body.isCorrect,
        note: body.note ?? 'Admin review',
      }
    });

    return { message: 'Review submitted', feedbackId: feedback.id };
  }

  /** Lấy danh sách tất cả các bệnh để admin chọn khi review */
  async getAllDiseases() {
    return await this.prisma.disease.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    });
  }

  private async deleteImagesFromCloudinary(imageUrls: string[]) {
    if (imageUrls.length === 0) return;

    try {
      const deletePromises = imageUrls.map(async (url) => {
        const urlParts = url.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExt.split('.')[0];
        const publicId = `gelo/scans/${fileName}`;

        try {
          this.logger.log(`Deleting Cloudinary asset: ${publicId}`);
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          this.logger.error(`Failed to delete asset ${publicId}: ${err.message}`);
          // Không throw lỗi ở đây để tránh làm gián đoạn việc xóa các ảnh khác
        }
      });

      await Promise.all(deletePromises);
    } catch (error) {
      this.logger.error(`Unexpected error during Cloudinary cleanup: ${error.message}`);
    }
  }

  async deleteScan(patientId: number, scanId: number) {
    const scan = await this.prisma.skinScan.findFirst({
      where: { id: scanId, patientId },
      include: { images: true }
    });

    if (!scan) {
      throw new BadRequestException('Scan not found or access denied.');
    }

    // Xóa ảnh song song trước
    const imageUrls = scan.images.map(img => img.imageUrl);
    await this.deleteImagesFromCloudinary(imageUrls);

    await this.prisma.$transaction([
      this.prisma.ruleScoreLog.deleteMany({ where: { scanId } }),
      this.prisma.diagnosisResult.deleteMany({ where: { scanId } }),
      this.prisma.prediction.deleteMany({ where: { scanId } }),
      this.prisma.scanImage.deleteMany({ where: { scanId } }),
      this.prisma.feedbackLog.deleteMany({ where: { scanId } }),
      this.prisma.skinDiary.updateMany({ where: { scanId }, data: { scanId: null } }),
      this.prisma.skinScan.delete({ where: { id: scanId } }),
    ]);

    return { success: true };
  }

  async deleteAllScans(patientId: number) {
    const scans = await this.prisma.skinScan.findMany({
      where: { patientId },
      include: { images: true }
    });

    if (scans.length === 0) {
      return { success: true, count: 0 };
    }

    const scanIds = scans.map(s => s.id);
    const allImageUrls = scans.flatMap(s => s.images.map(img => img.imageUrl));

    // Xóa tất cả ảnh của tất cả các scan song song (Parallel)
    await this.deleteImagesFromCloudinary(allImageUrls);

    // Transactional DB cleanup
    await this.prisma.$transaction([
      this.prisma.ruleScoreLog.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.diagnosisResult.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.prediction.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.scanImage.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.feedbackLog.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.skinDiary.updateMany({ where: { scanId: { in: scanIds } }, data: { scanId: null } }),
      this.prisma.skinScan.deleteMany({ where: { id: { in: scanIds } } }),
    ]);

    return { success: true, count: scanIds.length };
  }
}
