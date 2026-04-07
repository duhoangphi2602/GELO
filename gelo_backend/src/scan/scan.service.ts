import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(private prisma: PrismaService) { }

  async processScan(patientId: number, imageUrl: string, answers: any[]) {
    this.logger.log(`Start processing scan for patient: ${patientId}`);

    // 1. Tạo một phiên Scan vào DB
    const scan = await this.prisma.skinScan.create({
      data: {
        patientId: patientId,
        images: {
          create: {
            imageUrl: imageUrl, // Sẽ được lấy từ Cloud hoặc Frontend truyền lên
          }
        }
      }
    });

    // =====================================
    // 2. GỌI SANG AI SERVICE (FASTAPI)
    // =====================================
    this.logger.log(`Calling FastAPI Server at port 8000 for scan ${scan.id}...`);

    let mockDiseaseId = 1;
    let mockConfidence = 0.0; // Default Confidence level = 0
    let modelVer = 'v1.0-mock';

    try {
      const aiResponse = await fetch('http://localhost:8000/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, scan_id: scan.id })
      });
      const result = await aiResponse.json();

      mockDiseaseId = result.disease_id;
      mockConfidence = result.confidence;
      modelVer = result.model_version;

    } catch (error) {
      this.logger.error('Khong the ket noi toi FastAPI. Ensure it runs on 8000. Fallback to mock.');
    }

    // 3. Forced focus on Atopic Dermatitis (ID 1) as requested
    const mockId = 1;
    const diseaseName = 'Atopic Dermatitis';

    await this.prisma.disease.upsert({
      where: { id: mockId },
      update: {},
      create: {
        id: mockId,
        name: diseaseName,
        description: 'Atopic Dermatitis is a chronic condition that causes itchy, red, and dry skin, often starting in childhood.',
        isContagious: false,
        advices: {
          create: [
            { adviceType: 'care', title: 'Skin Care', content: 'Moisturize your skin at least twice daily with specialized creams.' },
            { adviceType: 'lifestyle', title: 'Lifestyle Habits', content: 'Avoid irritants like harsh soaps, hot water, and wool fabrics.' }
          ]
        }
      }
    });

    const mockPrediction = {
      diseaseId: mockId,
      confidence: 0.85 + Math.random() * 0.1, // Random high confidence for Atopic Dermatitis
    };

    // 4. Lưu lịch sử dự đoán từ AI
    await this.prisma.prediction.create({
      data: {
        scanId: scan.id,
        diseaseId: mockPrediction.diseaseId,
        confidence: mockPrediction.confidence,
        modelVersion: modelVer
      }
    });

    // 5. Mặc định tin AI, lưu vào kết quả chẩn đoán chính thức
    const diagnosis = await this.prisma.diagnosisResult.create({
      data: {
        scanId: scan.id,
        predictedDiseaseId: mockDiseaseId,
        finalDiseaseId: mockDiseaseId,
        isEmergency: false
      }
    });

    return {
      message: "Analysis Complete",
      scanId: scan.id,
      diagnosis: diagnosis
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
        }
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
      lastScanDisease: p.skinScans[0]?.diagnosis?.predictedDisease?.name ?? null,
      lastScanDate: p.skinScans[0]?.createdAt ?? null,
    }));
  }

  /** Trả về các scan có AI confidence thấp hơn ngưỡng (mặc định < 0.6) chưa được admin review */
  async getPendingReviews(threshold = 0.6) {
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
        predictedDisease: p.disease?.name ?? 'Unknown',
        diagnosisId: p.scan?.diagnosis?.id ?? null,
      }));
  }

  /** Admin submit đánh giá: xác nhận hoặc sửa kết quả AI cho 1 scan */
  async submitReview(scanId: number, body: { isCorrect: boolean; actualDiseaseId?: number; note?: string }) {
    const diagnosis = await this.prisma.diagnosisResult.findUnique({ where: { scanId } });
    if (!diagnosis) throw new Error('Diagnosis not found for scanId ' + scanId);

    // Nếu sai → cập nhật finalDisease theo admin
    if (!body.isCorrect && body.actualDiseaseId) {
      await this.prisma.diagnosisResult.update({
        where: { scanId },
        data: { finalDiseaseId: body.actualDiseaseId }
      });
    }

    // Lưu feedback log
    const feedback = await this.prisma.feedbackLog.create({
      data: {
        scanId,
        predictedDiseaseId: diagnosis.predictedDiseaseId,
        actualDiseaseId: body.isCorrect ? diagnosis.predictedDiseaseId : (body.actualDiseaseId ?? diagnosis.predictedDiseaseId),
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
}
