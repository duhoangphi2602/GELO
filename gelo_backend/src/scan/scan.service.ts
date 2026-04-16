import { Injectable, Logger, BadRequestException, ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cloudinary } from '../common/cloudinary.config';
import { DiagnosticStatus } from '@prisma/client';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * AI-Only Diagnostic Flow (single phase):
   * 1. Create SkinScan + ScanImages
   * 2. Call AI Service (with cleanup if it fails)
   * 3. Save all results in a single Transaction
   */
  async initiateScan(patientId: number, imageUrls: string[]) {
    this.logger.log(`Initiating AI-only scan for patient ${patientId}`);

    // 1. Create SkinScan and ScanImages (Initial record)
    const scan = await this.prisma.skinScan.create({
      data: {
        patientId,
        images: {
          create: imageUrls.map((url) => ({ imageUrl: url })),
        },
      },
    });

    try {
      // 2. Call AI Service
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const apiKey = process.env.INTERNAL_API_KEY || '';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const aiResponse = await fetch(`${aiUrl}/ai/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': apiKey,
        },
        body: JSON.stringify({ image_urls: imageUrls, scan_id: scan.id }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!aiResponse.ok) {
        throw new Error(`AI Service returned ${aiResponse.status}`);
      }

      const result: {
        disease_id: number;
        diagnosticStatus: string;
        confidence: number;
        model_version?: string;
      } = await aiResponse.json();

      // Normalize confidence (0–100)
      const aiConfidence = Math.min(100, Math.max(0, Math.round((result.confidence || 0) * 100)));
      const modelVer = result.model_version || 'v1.0.0';
      const diagnosticStatus = (result.diagnosticStatus as DiagnosticStatus) ?? DiagnosticStatus.UNKNOWN;
      const aiDiseaseId = (result.disease_id && result.disease_id !== 0) ? result.disease_id : null;
      const decision = aiConfidence >= 50 ? 'high_confidence' : 'low_confidence';

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
        const autoTrainThreshold = Number(process.env.AUTO_TRAIN_THRESHOLD ?? 85);
        if (aiConfidence >= autoTrainThreshold && aiDiseaseId) {
          const firstImage = await tx.scanImage.findFirst({ where: { scanId: scan.id } });
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

      this.logger.log(`Scan ${scan.id} complete — ${decision} (${aiConfidence}%) → ${diagnosticStatus}`);
      return { scanId: scan.id, message: 'Scan analysis complete' };

    } catch (error) {
      this.logger.error(`AI Analysis failed for scan ${scan.id}. Cleaning up...`);
      // CLEANUP: If AI fails, remove the "incomplete" scan and images from Cloudinary
      await this.cleanupFailedScan(scan.id, imageUrls);
      
      throw new ServiceUnavailableException(
        error.message?.includes('AI Service') 
        ? error.message 
        : 'AI Diagnostic Service failure. Your request was cancelled and no data was saved.'
      );
    }
  }

  /** Removes scan record and Cloudinary assets if the analysis stage fails */
  private async cleanupFailedScan(scanId: number, imageUrls: string[]) {
    try {
      await this.prisma.skinScan.delete({ where: { id: scanId } }).catch(() => {});
      await this.deleteImagesFromCloudinary(imageUrls);
    } catch (err) {
      this.logger.error(`Cleanup failed for scan ${scanId}: ${err.message}`);
    }
  }

  /** Returns all scans for a patient (for history view) */
  async getScansForPatient(patientId: number) {
    return this.prisma.skinScan.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        diagnosis: {
          include: { predictedDisease: true },
        },
        predictions: { take: 1 },
        images: true,
      },
    });
  }

  /** Admin: list all patients with their scan summary */
  async getAdminPatients() {
    const patients = await this.prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { email: true, username: true, role: true } },
        skinScans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            diagnosis: { include: { predictedDisease: true } },
          },
        },
        _count: { select: { skinScans: true, diaries: true } },
      },
    });

    return patients.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      age: p.age,
      gender: p.gender,
      createdAt: p.createdAt,
      email: p.account?.email,
      username: p.account?.username,
      totalScans: p._count.skinScans,
      totalDiaries: p._count.diaries,
      lastScanDisease:
        p.skinScans[0]?.diagnosis?.diagnosticStatus === DiagnosticStatus.HEALTHY
          ? 'Healthy'
          : p.skinScans[0]?.diagnosis?.diagnosticStatus === DiagnosticStatus.UNKNOWN
            ? 'Unknown'
            : (p.skinScans[0]?.diagnosis?.predictedDisease?.name ?? null),
      lastScanDate: p.skinScans[0]?.createdAt ?? null,
    }));
  }

  /** Admin: dashboard statistics */
  async getAdminStats() {
    const [totalDiagnoses, totalPatients, diseases] = await Promise.all([
      this.prisma.skinScan.count(),
      this.prisma.patient.count(),
      this.prisma.disease.findMany({
        select: {
          id: true,
          name: true,
          feedbackPredicted: { select: { isCorrect: true } },
        },
      }),
    ]);

    const diseaseStats = diseases.map((d) => {
      const totalReviews = d.feedbackPredicted.length;
      const correctCount = d.feedbackPredicted.filter((f) => f.isCorrect).length;
      const accuracy = totalReviews > 0 ? (correctCount / totalReviews) * 100 : 100.0;
      return { diseaseId: d.id, name: d.name, totalReviews, correctCount, accuracy };
    });

    const totalReviews = diseaseStats.reduce((sum, d) => sum + d.totalReviews, 0);
    const totalCorrect = diseaseStats.reduce((sum, d) => sum + d.correctCount, 0);
    const modelAccuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 100.0;

    return { totalDiagnoses, totalPatients, modelAccuracy, diseaseStats };
  }

  /**
   * Admin: pending reviews — scans where AI confidence < threshold
   */
  async getPendingReviews(threshold?: number) {
    const reviewThreshold = threshold ?? Number(process.env.LOW_CONFIDENCE_THRESHOLD ?? 60);

    const predictions = await this.prisma.prediction.findMany({
      where: { confidence: { lt: reviewThreshold } },
      orderBy: { createdAt: 'desc' },
      include: {
        scan: {
          include: {
            patient: { select: { fullName: true, id: true } },
            images: { take: 1 },
            diagnosis: { include: { predictedDisease: true, finalDisease: true } },
            feedback: { take: 1 },
          },
        },
        disease: true,
      },
    });

    return predictions
      .filter((p) => p.scan?.feedback?.length === 0)
      .map((p) => ({
        predictionId: p.id,
        scanId: p.scanId,
        confidence: p.confidence ?? 0,
        modelVersion: p.modelVersion,
        createdAt: p.createdAt,
        patientId: p.scan?.patient?.id,
        patientName: p.scan?.patient?.fullName,
        imageUrl: p.scan?.images?.[0]?.imageUrl ?? null,
        predictedDisease:
          p.diagnosticStatus === DiagnosticStatus.HEALTHY
            ? 'Healthy'
            : p.diagnosticStatus === DiagnosticStatus.UNKNOWN
              ? 'Unknown'
              : (p.disease?.name ?? 'Unknown'),
        diagnosisId: p.scan?.diagnosis?.id ?? null,
      }));
  }

  /** Admin: submit review decision for a scan */
  async submitReview(
    scanId: number,
    body: { isCorrect: boolean; actualDiseaseId?: number; actualStatus?: string; note?: string },
  ) {
    const diagnosis = await this.prisma.diagnosisResult.findUnique({ where: { scanId } });
    if (!diagnosis) throw new NotFoundException(`DiagnosisResult not found for scan #${scanId}`);

    return this.prisma.$transaction(async (tx) => {
       if (!body.isCorrect) {
          await tx.diagnosisResult.update({
            where: { scanId },
            data: {
              finalDiseaseId: body.actualDiseaseId ?? null,
              diagnosticStatus:
                (body.actualStatus as DiagnosticStatus) ??
                (body.actualDiseaseId ? DiagnosticStatus.DISEASE : diagnosis.diagnosticStatus),
            },
          });
        }

        const feedback = await tx.feedbackLog.create({
          data: {
            scanId,
            diagnosticStatus:
              (body.actualStatus as DiagnosticStatus) ?? diagnosis.diagnosticStatus,
            predictedDiseaseId: diagnosis.predictedDiseaseId,
            actualDiseaseId: body.isCorrect
              ? diagnosis.predictedDiseaseId
              : (body.actualDiseaseId ?? null),
            isCorrect: body.isCorrect,
            note: body.note ?? 'Admin review',
          },
        });

        return { message: 'Review submitted', feedbackId: feedback.id };
    });
  }

  /** Admin: get all diseases for review modal dropdown */
  async getAllDiseases() {
    return this.prisma.disease.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  /** Delete a single scan with POST-DB Cloudinary cleanup */
  async deleteScan(patientId: number, scanId: number) {
    const scan = await this.prisma.skinScan.findFirst({
      where: { id: scanId, patientId },
      include: { images: true },
    });

    if (!scan) throw new BadRequestException('Scan not found or access denied.');

    const imageUrls = scan.images.map((img) => img.imageUrl);

    // 1. Delete from DB first
    await this.prisma.$transaction([
      this.prisma.diagnosisResult.deleteMany({ where: { scanId } }),
      this.prisma.prediction.deleteMany({ where: { scanId } }),
      this.prisma.scanImage.deleteMany({ where: { scanId } }),
      this.prisma.feedbackLog.deleteMany({ where: { scanId } }),
      this.prisma.skinDiary.updateMany({ where: { scanId }, data: { scanId: null } }),
      this.prisma.skinScan.delete({ where: { id: scanId } }),
    ]);

    // 2. ONLY if DB deletion succeeded, clean up Cloudinary
    await this.deleteImagesFromCloudinary(imageUrls);

    return { success: true };
  }

  /** Delete all scans for a patient with POST-DB Cloudinary cleanup */
  async deleteAllScans(patientId: number) {
    const scans = await this.prisma.skinScan.findMany({
      where: { patientId },
      include: { images: true },
    });

    if (scans.length === 0) return { success: true, count: 0 };

    const scanIds = scans.map((s) => s.id);
    const allImageUrls = scans.flatMap((s) => s.images.map((img) => img.imageUrl));

    // 1. Delete from DB first
    await this.prisma.$transaction([
      this.prisma.diagnosisResult.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.prediction.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.scanImage.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.feedbackLog.deleteMany({ where: { scanId: { in: scanIds } } }),
      this.prisma.skinDiary.updateMany({ where: { scanId: { in: scanIds } }, data: { scanId: null } }),
      this.prisma.skinScan.deleteMany({ where: { id: { in: scanIds } } }),
    ]);

    // 2. Clean up Cloudinary
    await this.deleteImagesFromCloudinary(allImageUrls);

    return { success: true, count: scanIds.length };
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
          this.logger.error(`Failed to delete Cloudinary asset: ${err.message}`);
        }
      }),
    );
  }
}
