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

    // 3. Đảm bảo Bệnh (Disease) này tồn tại trong CSDL để không lỗi Foreign Key
    const diseaseName = mockDiseaseId === 1 ? 'Contact Dermatitis' : mockDiseaseId === 2 ? 'Acne' : mockDiseaseId === 3 ? 'Eczema' : 'Melanoma';

    await this.prisma.disease.upsert({
      where: { id: mockDiseaseId },
      update: {},
      create: {
        id: mockDiseaseId,
        name: diseaseName,
        description: 'Auto-generated disease from AI prediction.',
        isContagious: false,
        advices: {
          create: [
            { adviceType: 'care', title: 'Daily Care', content: 'Clean the infected area gently.' },
            { adviceType: 'lifestyle', title: 'Healthy Diet', content: 'Drink more water and avoid fast food.' }
          ]
        }
      }
    });

    // 4. Lưu lịch sử dự đoán từ AI
    await this.prisma.prediction.create({
      data: {
        scanId: scan.id,
        diseaseId: mockDiseaseId,
        confidence: mockConfidence,
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
}
