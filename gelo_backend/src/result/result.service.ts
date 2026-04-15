import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosticStatus, UserRole } from '@prisma/client';

@Injectable()
export class ResultService {
  constructor(private prisma: PrismaService) {}

  async getDiagnosticResult(scanId: number, patientId: number, role: UserRole) {
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
            predictions: true,
            ruleScoreLogs: {
              include: { question: true }
            }
          } 
        }
      }
    });

    if (!result) throw new NotFoundException('Diagnostic result not found for this scan ID');

    // SECURITY CHECK: Chỉ chính chủ hoặc Admin mới được xem
    if (role !== UserRole.ADMIN && result.scan.patientId !== patientId) {
      throw new ForbiddenException('You do not have permission to view this diagnostic result.');
    }

    return {
      scanId: result.scanId,
      scannedAt: result.createdAt,
      isEmergency: result.isEmergency,
      decision: result.decision || 'unknown',
      normalizedScore: result.normalizedScore !== null ? Math.round(result.normalizedScore) : 0,
      ruleScore: result.ruleScore,
      maxRuleScore: result.maxRuleScore,
      disease: result.predictedDisease?.name || 'Unknown',
      description: result.predictedDisease?.description,
      images: result.scan.images.map(img => img.imageUrl),
      confidence: result.scan.predictions?.[0]?.confidence ? Math.round(result.scan.predictions[0].confidence) : 0,
      advices: result.predictedDisease?.advices.map(ad => ({
        type: ad.adviceType,
        title: ad.title,
        content: ad.content
      })) || [],
      logs: result.scan.ruleScoreLogs.map(log => ({
        questionText: log.question.questionText,
        patientAnswer: log.patientAnswer,
        expectedAnswer: log.expectedAnswer ? 'Yes' : 'No',
        isMatch: log.isMatch,
        scoreContribution: log.scoreContribution,
        weight: log.weight
      }))
    };
  }

  async submitFeedback(scanId: number, body: { isCorrect: boolean; note?: string }, patientId: number) {
    // 1. Verify scan and diagnosis exist
    const diagnosis = await this.prisma.diagnosisResult.findUnique({
      where: { scanId },
      include: { scan: true }
    });

    if (!diagnosis) {
      throw new NotFoundException('Diagnosis result not found to apply feedback.');
    }

    // SECURITY CHECK: Bệnh nhân chỉ được feedback cho scan của mình
    if (diagnosis.scan.patientId !== patientId) {
      throw new ForbiddenException('You can only submit feedback for your own diagnostic results.');
    }

    // 2. Create FeedbackLog
    const feedback = await this.prisma.feedbackLog.create({
      data: {
        scanId,
        diagnosticStatus: diagnosis.diagnosticStatus,
        predictedDiseaseId: diagnosis.predictedDiseaseId,
        isCorrect: body.isCorrect,
        note: body.note || 'User self-feedback',
        actualDiseaseId: body.isCorrect ? diagnosis.predictedDiseaseId : null,
      }
    });

    // 3. Nếu người dùng xác nhận đúng (isCorrect) và chẩn đoán là Bệnh -> Lưu vào làm dữ liệu huấn luyện
    if (body.isCorrect && diagnosis.diagnosticStatus === DiagnosticStatus.DISEASE && diagnosis.predictedDiseaseId) {
      // Kiểm tra xem đã có trong DiseaseImage chưa để tránh trùng lặp
      const alreadySaved = await this.prisma.diseaseImage.findFirst({
        where: { scanId, diseaseId: diagnosis.predictedDiseaseId }
      });

      if (!alreadySaved) {
        const scanImage = await this.prisma.scanImage.findFirst({ where: { scanId } });
        if (scanImage) {
          await this.prisma.diseaseImage.create({
            data: {
              diseaseId: diagnosis.predictedDiseaseId,
              scanId: scanId,
              imageUrl: scanImage.imageUrl,
            }
          });
        }
      }
    }

    return feedback;
  }
}
