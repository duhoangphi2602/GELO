import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosticEngineService } from './diagnostic-engine.service';
import { cloudinary } from '../common/cloudinary.config';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    private prisma: PrismaService,
    private engine: DiagnosticEngineService
  ) { }

  async processScan(patientId: number, imageUrls: string[], answers: any[]) {
    this.logger.log(`Start processing scan for patient: ${patientId}`);

    // 1. Tạo một phiên Scan vào DB
    if (!patientId) {
      this.logger.error('Attempted to process scan with undefined patientId');
      throw new BadRequestException('Patient profile ID is missing. Please log out and log in again.');
    }

    const scan = await this.prisma.skinScan.create({
      data: {
        patientId: patientId,
        images: {
          create: imageUrls.map(url => ({ imageUrl: url }))
        }
      }
    });

    // =====================================
    // 2. GỌI SANG AI SERVICE (FASTAPI)
    // =====================================
    this.logger.log(`Calling FastAPI Server at port 8000 for scan ${scan.id}...`);

    let mockDiseaseId: number | null = 1;
    let mockConfidence = 0.0; // Default Confidence level = 0
    let modelVer = 'v1.0-mock';
    let diagnosticStatus = 'DISEASE';

    try {
      // Step A: Pre-flight Ping
      const healthRes = await fetch('http://localhost:8000/ai/health', { method: 'GET' });
      if (!healthRes.ok) throw new Error('AI Health Check responded with an error');

      const healthData = await healthRes.json();
      if (!healthData.model_loaded) {
        throw new Error('AI Service is online but model is not loaded (model_loaded=false)');
      }

      // Step B: Inference
      const aiResponse = await fetch('http://localhost:8000/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_urls: imageUrls, scan_id: scan.id })
      });

      if (!aiResponse.ok) {
        const errData = await aiResponse.json().catch(() => ({}));
        throw new Error(`AI Prediction failed: HTTP ${aiResponse.status} - ${errData.detail || 'Unknown error'}`);
      }

      const result = await aiResponse.json();

      mockDiseaseId = result.disease_id || null;
      mockConfidence = result.confidence;
      // Truncate strings to prevent DB errors (Varsize constraints)
      modelVer = (result.model_version || 'v1.0-mock').substring(0, 250);
      diagnosticStatus = (result.diagnosticStatus || 'DISEASE').substring(0, 45);

    } catch (error) {
      this.logger.error(`AI Pipeline bypassed due to error: ${error.message}. Fallback to Rule Engine Confidence 0.0`);
    }

    // 3. Ensure Atopic Dermatitis is in DB (upsert by name, not id)
    let dbDisease = await this.prisma.disease.findFirst({
      where: { name: 'Atopic Dermatitis' }
    });

    if (!dbDisease) {
      dbDisease = await this.prisma.disease.create({
        data: {
          name: 'Atopic Dermatitis',
          description: 'A chronic condition that causes itchy, red, and dry skin, often starting in childhood.',
          isContagious: false,
        }
      });
    }

    // 4. Determine which disease to evaluate rules for
    // If AI found a specific disease, use it. Otherwise, default to Atopic Dermatitis (ID=1).
    let validDiseaseId: number = dbDisease.id;
    if (diagnosticStatus === 'DISEASE' && mockDiseaseId) {
      const aiDisease = await this.prisma.disease.findUnique({ where: { id: mockDiseaseId } });
      if (aiDisease) {
        validDiseaseId = mockDiseaseId;
      }
    }

    // 4. Fetch Active Rules for Atopic Dermatitis
    const diseaseRules = await this.prisma.diseaseRule.findMany({
      where: { diseaseId: validDiseaseId, isActive: true },
      include: { question: true }
    });

    // 5. Calculate Hybrid Score
    const engineResult = this.engine.calculateHybridScore(mockConfidence, answers || [], diseaseRules);

    // 6. Transactional Save of Predictions, Logs, and Result
    const diagnosis = await this.prisma.$transaction(async (tx) => {
      // 6.1 Save mock prediction
      await tx.prediction.create({
        data: {
          scanId: scan.id,
          diagnosticStatus: diagnosticStatus,
          diseaseId: validDiseaseId,
          confidence: mockConfidence * 100,
          modelVersion: modelVer
        }
      });

      // 6.2 Save Rule Score Logs
      if (engineResult.ruleLogs.length > 0) {
        await tx.ruleScoreLog.createMany({
          data: engineResult.ruleLogs.map((log) => ({
            scanId: scan.id,
            questionId: log.questionId,
            patientAnswer: log.patientAnswer,
            expectedAnswer: log.expectedAnswer,
            isMatch: log.isMatch,
            weight: log.weight,
            scoreContribution: log.scoreContribution,
          }))
        });
      }

      // 6.3 Save Diagnosis Result
      const predictedId = engineResult.decision === 'positive' || engineResult.decision === 'emergency' ? validDiseaseId : null;
      const finalStatus = (engineResult.decision === 'positive' || engineResult.decision === 'emergency') ? 'DISEASE' : diagnosticStatus;

      return await tx.diagnosisResult.create({
        data: {
          scanId: scan.id,
          diagnosticStatus: finalStatus,
          predictedDiseaseId: predictedId,
          finalDiseaseId: predictedId,
          isEmergency: engineResult.isEmergency,
          ruleScore: engineResult.ruleScore,
          maxRuleScore: engineResult.maxRuleScore,
          normalizedScore: engineResult.normalizedScore,
          decision: engineResult.decision,
        }
      });
    });

    return {
      message: "Analysis Complete",
      scanId: scan.id,
      diagnosis: diagnosis,
      decision: engineResult.decision
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
      lastScanDisease: p.skinScans[0]?.diagnosis?.diagnosticStatus === 'HEALTHY'
        ? 'Healthy'
        : p.skinScans[0]?.diagnosis?.diagnosticStatus === 'UNKNOWN'
          ? 'Unknown'
          : (p.skinScans[0]?.diagnosis?.predictedDisease?.name ?? null),
      lastScanDate: p.skinScans[0]?.createdAt ?? null,
    }));
  }

  async getAdminStats() {
    const totalDiagnoses = await this.prisma.skinScan.count();
    const totalPatients = await this.prisma.patient.count();

    // Accuracy based on feedback
    const feedbacks = await this.prisma.feedbackLog.findMany({
      select: { isCorrect: true }
    });

    let modelAccuracy = 100.0;
    if (feedbacks.length > 0) {
      const correctCount = feedbacks.filter(f => f.isCorrect).length;
      modelAccuracy = (correctCount / feedbacks.length) * 100;
    }

    return {
      totalDiagnoses,
      totalPatients,
      modelAccuracy
    };
  }

  /** Trả về các scan có AI confidence thấp hơn ngưỡng (mặc định < 0.6) chưa được admin review */
  async getPendingReviews(threshold = 60) {
    const predictions = await this.prisma.prediction.findMany({
      where: { confidence: { lt: threshold } },
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
        predictedDisease: p.diagnosticStatus === 'HEALTHY' ? 'Healthy' : p.diagnosticStatus === 'UNKNOWN' ? 'Unknown' : (p.disease?.name ?? 'Unknown'),
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
          diagnosticStatus: body.actualStatus || (body.actualDiseaseId ? 'DISEASE' : diagnosis.diagnosticStatus)
        }
      });
    }

    // Ghi feedback log
    const feedback = await this.prisma.feedbackLog.create({
      data: {
        scanId,
        diagnosticStatus: body.actualStatus || diagnosis.diagnosticStatus,
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

  async deleteScan(patientId: number, scanId: number) {
    const scan = await this.prisma.skinScan.findFirst({
      where: { id: scanId, patientId },
    });
    if (!scan) {
      throw new BadRequestException('Scan not found or access denied.');
    }

    // --- Xóa ảnh trên Cloudinary trước khi xóa bản ghi DB ---
    try {
      const images = await this.prisma.scanImage.findMany({
        where: { scanId }
      });

      for (const img of images) {
        // Trích xuất public_id từ URL Cloudinary
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123.../folder/public_id.jpg
        const urlParts = img.imageUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExt.split('.')[0];

        // Public ID bao gồm cả folder: gelo/scans/public_id
        const publicId = `gelo/scans/${fileName}`;

        this.logger.log(`Deleting Cloudinary asset: ${publicId}`);
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      this.logger.error(`Failed to delete Cloudinary assets for scan ${scanId}: ${error.message}`);
      // Vẫn tiếp tục xóa DB ngay cả khi xóa Cloudinary lỗi để tránh kẹt dữ liệu
    }

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
}
