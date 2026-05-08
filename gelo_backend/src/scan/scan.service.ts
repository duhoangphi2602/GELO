import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cloudinary } from '../common/cloudinary.config';
import { DiagnosticStatus, ImageQuality } from '@prisma/client';
import { AiIntegrationService } from '../common/services/ai-integration.service';

import { BaseService } from '../common/services/base.service';

@Injectable()
export class ScanService extends BaseService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiIntegrationService,
  ) {
    super();
  }

  async initiateScan(patientId: number, imageUrls: string[], imageQuality: string = 'CLEAR') {
    this.logger.log(`Initiating AI-only scan for patient ${patientId} (Quality: ${imageQuality})`);

    // 1. Create SkinScan and ScanImages (Initial record)
    const scan = await this.prisma.skinScan.create({
      data: {
        patientId,
        imageQuality: imageQuality as ImageQuality,
        images: {
          create: imageUrls.map((url) => ({ imageUrl: url })),
        },
      },
    });

    try {
      // 2. Call AI Service
      const result: {
        disease_id: number;
        code?: string;
        diagnosticStatus: string;
        confidence: number;
        name?: string;
        model_version?: string;
      } = await this.aiService.request('/ai/predict', {
        method: 'POST',
        body: JSON.stringify({ image_urls: imageUrls, scan_id: scan.id }),
      });

      // Normalize confidence (0–100)
      const aiConfidence = Math.min(
        100,
        Math.max(0, Math.round((result.confidence || 0) * 100)),
      );
      const modelVer = result.model_version || 'v1.0.0';
      const diagnosticStatus =
        (result.diagnosticStatus as DiagnosticStatus) ??
        DiagnosticStatus.UNKNOWN;

      let trueDiseaseId: number | null = null;
      if (result.code && result.code !== 'UNKNOWN') {
        const dbDisease = await this.prisma.disease.findUnique({
          where: { code: result.code },
        });
        if (dbDisease) {
          trueDiseaseId = dbDisease.id;
        } else {
          this.logger.warn(
            `AI predicted code '${result.code}' but it was not found in DB!`,
          );
        }
      }

      const aiDiseaseId =
        trueDiseaseId ??
        (result.disease_id && result.disease_id !== 0
          ? result.disease_id
          : null);
      const decision =
        aiConfidence >= 50 ? 'high_confidence' : 'low_confidence';

      // 3. Atomically save all results & training data in a single TRANSACTION
      await this.prisma.$transaction(async (tx) => {
        // Create Prediction
        await tx.prediction.create({
          data: {
            scanId: scan.id,
            diagnosticStatus,
            diseaseId: aiDiseaseId,
            confidence: aiConfidence,
            modelVersion: modelVer,
          },
        });

        // Create DiagnosisResult
        await tx.diagnosisResult.create({
          data: {
            scanId: scan.id,
            diagnosticStatus: diagnosticStatus,
            predictedDiseaseId: aiDiseaseId,
            finalDiseaseId: aiDiseaseId,
            aiConfidence: Number.isNaN(aiConfidence) ? 0 : aiConfidence,
            decision: decision,
          },
        });

        // Auto-save training image if high confidence
        const autoTrainThreshold = Number(
          process.env.AUTO_TRAIN_THRESHOLD ?? 85,
        );
        if (aiConfidence >= autoTrainThreshold && aiDiseaseId) {
          const firstImage = await tx.scanImage.findFirst({
            where: { scanId: scan.id },
          });
          if (firstImage) {
            await tx.diseaseImage.create({
              data: {
                diseaseId: aiDiseaseId,
                scanId: scan.id,
                imageUrl: firstImage.imageUrl,
              },
            });
          }
        }
      });

      this.logger.log(
        `Scan ${scan.id} complete — ${decision} (${aiConfidence}%) → ${diagnosticStatus}`,
      );
      return { scanId: scan.id, message: 'Scan analysis complete' };
    } catch (error) {
      this.logger.error(
        `AI Analysis failed for scan ${scan.id}. Cleaning up...`,
      );
      // CLEANUP: If AI fails, remove the "incomplete" scan and images from Cloudinary
      await this.cleanupFailedScan(scan.id, imageUrls);

      throw new ServiceUnavailableException(
        error.message?.includes('AI Service')
          ? error.message
          : 'AI Diagnostic Service failure. Your request was cancelled and no data was saved.',
      );
    }
  }

  /** Removes scan record and Cloudinary assets if the analysis stage fails */
  private async cleanupFailedScan(scanId: number, imageUrls: string[]) {
    try {
      await this.prisma.skinScan
        .delete({ where: { id: scanId } })
        .catch(() => {});
      await this.deleteImagesFromCloudinary(imageUrls);
    } catch (err) {
      this.logger.error(`Cleanup failed for scan ${scanId}: ${err.message}`);
    }
  }

  /** Returns all scans for a patient (for history view) */
  async getScansForPatient(patientId: number) {
    return this.prisma.skinScan.findMany({
      where: { patientId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        diagnosis: {
          include: { predictedDisease: true },
        },
        predictions: { take: 1 },
        images: true,
        feedback: true,
      },
    });
  }

  /** Patient: get list of diseases currently enabled in AI Engine */
  async getSupportedDiseases() {
    try {
      const config: any = await this.aiService.request('/ai/config');
      const enabledCodes = config.enabled_disease_codes || [];

      if (enabledCodes.length === 0) return [];

      return this.prisma.disease.findMany({
        where: { code: { in: enabledCodes } },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to get supported diseases: ${error.message}`);
      return [];
    }
  }

  /** Soft Delete: Marks scan as deleted for patient but keeps data for Admin dataset */
  async deleteScan(patientId: number, scanId: number) {
    const scan = await this.handleNotFound(
      this.prisma.skinScan.findFirst({
        where: { id: scanId, patientId, isDeleted: false },
      }),
      'Scan not found or access denied.',
    );

    // Just mark as deleted, don't touch Cloudinary or other records
    await this.prisma.skinScan.update({
      where: { id: scanId },
      data: { isDeleted: true },
    });

    return { success: true, message: 'Scan removed from your history.' };
  }

  /** Soft Delete All: Marks all scans as deleted for patient */
  async deleteAllScans(patientId: number) {
    const result = await this.prisma.skinScan.updateMany({
      where: { patientId, isDeleted: false },
      data: { isDeleted: true },
    });

    return { success: true, count: result.count };
  }

  private async deleteImagesFromCloudinary(imageUrls: string[]) {
    if (!imageUrls.length) return;
    await Promise.all(
      imageUrls.map(async (url) => {
        try {
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1].split('.')[0];
          const publicId = `gelo/scans/${fileName}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          this.logger.error(
            `Failed to delete Cloudinary asset: ${err.message}`,
          );
        }
      }),
    );
  }
}
