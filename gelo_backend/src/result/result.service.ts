import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosticStatus, UserRole } from '@prisma/client';

@Injectable()
export class ResultService {
  constructor(private prisma: PrismaService) {}

  async getDiagnosticResult(scanId: number, patientId: number, role: UserRole) {
    const result = await this.prisma.diagnosisResult.findUnique({
      where: { scanId },
      include: {
        predictedDisease: {
          include: { advices: true },
        },
        scan: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!result) throw new NotFoundException('Diagnostic result not found for this scan ID');

    // Security: only owner or admin can view
    if (role !== UserRole.ADMIN && result.scan.patientId !== patientId) {
      throw new ForbiddenException('You do not have permission to view this diagnostic result.');
    }

    // aiConfidence is stored 0–100; return directly, no multiplication needed
    const isUnknown = result.diagnosticStatus === DiagnosticStatus.UNKNOWN;
    const isHealthy = result.diagnosticStatus === DiagnosticStatus.HEALTHY;

    return {
      scanId: result.scanId,
      scannedAt: result.createdAt,
      decision: result.decision ?? 'low_confidence',
      aiConfidence: (result as any).aiConfidence !== undefined && (result as any).aiConfidence !== null 
        ? Math.round((result as any).aiConfidence) 
        : 0,
      diagnosticStatus: result.diagnosticStatus,
      disease: isUnknown 
        ? 'Analysis Inconclusive' 
        : isHealthy 
          ? 'Healthy Skin' 
          : (result.predictedDisease?.name ?? 'Unknown'),
      description: isUnknown
        ? 'The AI model could not identify a specific condition with high certainty from the provided image.'
        : isHealthy
          ? 'No significant skin abnormalities were detected in the analyzed area.'
          : (result.predictedDisease?.description ?? null),
      images: result.scan.images.map((img) => img.imageUrl),
      advices: (result.predictedDisease?.advices ?? []).map((ad) => ({
        type: ad.adviceType,
        title: ad.title,
        content: ad.content,
      })),
    };
  }

  async submitFeedback(
    scanId: number,
    body: { isCorrect: boolean; note?: string },
    patientId: number,
  ) {
    const diagnosis = await this.prisma.diagnosisResult.findUnique({
      where: { scanId },
      include: { scan: true },
    });

    if (!diagnosis) throw new NotFoundException('Diagnosis result not found.');

    // Security: patient can only feedback their own scans
    if (diagnosis.scan.patientId !== patientId) {
      throw new ForbiddenException('You can only submit feedback for your own diagnostic results.');
    }

    const feedback = await this.prisma.feedbackLog.create({
      data: {
        scanId,
        diagnosticStatus: diagnosis.diagnosticStatus,
        predictedDiseaseId: diagnosis.predictedDiseaseId,
        isCorrect: body.isCorrect,
        note: body.note ?? 'User self-feedback',
        actualDiseaseId: body.isCorrect ? diagnosis.predictedDiseaseId : null,
      },
    });

    // If user confirms correct AND disease detected → save as training data
    if (
      body.isCorrect &&
      diagnosis.diagnosticStatus === DiagnosticStatus.DISEASE &&
      diagnosis.predictedDiseaseId
    ) {
      const alreadySaved = await this.prisma.diseaseImage.findFirst({
        where: { scanId, diseaseId: diagnosis.predictedDiseaseId },
      });

      if (!alreadySaved) {
        const scanImage = await this.prisma.scanImage.findFirst({ where: { scanId } });
        if (scanImage) {
          await this.prisma.diseaseImage.create({
            data: {
              diseaseId: diagnosis.predictedDiseaseId,
              scanId,
              imageUrl: scanImage.imageUrl,
            },
          });
        }
      }
    }

    return feedback;
  }
}
