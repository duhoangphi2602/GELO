import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResultService {
  constructor(private prisma: PrismaService) {}

  async getDiagnosticResult(scanId: number) {
    // Tìm kết quả Diagnosis kết nối chéo (JOIN) sang bảng Disease và Scan
    const result = await this.prisma.diagnosisResult.findUnique({
      where: { scanId },
      include: {
        predictedDisease: {
          include: { advices: true } // Lấy tên Bệnh + Lời khuyên 
        },
        scan: {
          include: { 
            images: true, 
            predictions: true // Include predictions to get confidence 
          } 
        }
      }
    });

    if (!result) throw new NotFoundException('Diagnostic result not found for this scan ID');

    return {
      scanId: result.scanId,
      scannedAt: result.createdAt,
      isEmergency: result.isEmergency,
      disease: result.predictedDisease?.name || 'Unknown',
      description: result.predictedDisease?.description,
      images: result.scan.images.map(img => img.imageUrl),
      confidence: result.scan.predictions?.[0]?.confidence ? Math.round(result.scan.predictions[0].confidence * 100) : 0,
      advices: result.predictedDisease?.advices.map(ad => ({
        type: ad.adviceType,
        title: ad.title,
        content: ad.content
      })) || []
    };
  }
}
