import { Injectable, Logger, BadRequestException, ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cloudinary } from '../common/cloudinary.config';
import { DiagnosticStatus, FeedbackRole } from '@prisma/client';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(private prisma: PrismaService) { }


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
        code?: string;
        diagnosticStatus: string;
        confidence: number;
        name?: string;
        model_version?: string;
      } = await aiResponse.json();

      // Normalize confidence (0–100)
      const aiConfidence = Math.min(100, Math.max(0, Math.round((result.confidence || 0) * 100)));
      const modelVer = result.model_version || 'v1.0.0';
      const diagnosticStatus = (result.diagnosticStatus as DiagnosticStatus) ?? DiagnosticStatus.UNKNOWN;

      let trueDiseaseId: number | null = null;
      if (result.code && result.code !== 'UNKNOWN') {
        const dbDisease = await this.prisma.disease.findUnique({
          where: { code: result.code }
        });
        if (dbDisease) {
          trueDiseaseId = dbDisease.id;
        } else {
          this.logger.warn(`AI predicted code '${result.code}' but it was not found in DB!`);
        }
      }

      const aiDiseaseId = trueDiseaseId ?? ((result.disease_id && result.disease_id !== 0) ? result.disease_id : null);
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
      await this.prisma.skinScan.delete({ where: { id: scanId } }).catch(() => { });
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
        p.skinScans[0]?.diagnosis?.diagnosticStatus === DiagnosticStatus.UNKNOWN
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

    // 1. Scans with no admin review
    const pendingScans = await this.prisma.skinScan.findMany({
      where: {
        feedback: { none: { role: FeedbackRole.ADMIN } },
      },
      include: {
        patient: { select: { fullName: true, id: true } },
        images: { take: 1 },
        diagnosis: { include: { predictedDisease: true } },
        feedback: {
          where: { role: FeedbackRole.USER },
          take: 1,
        },
      },
    });

    // 2. Scans with user feedback saying incorrect AND no admin review
    const userReportedScans = await this.prisma.skinScan.findMany({
      where: {
        feedback: {
          some: { role: FeedbackRole.USER, isCorrect: false },
          none: { role: FeedbackRole.ADMIN },
        },
      },
      include: {
        patient: { select: { fullName: true, id: true } },
        images: { take: 1 },
        diagnosis: { include: { predictedDisease: true } },
        feedback: {
          where: { role: FeedbackRole.USER },
          take: 1,
        },
      },
    });

    // Merge and deduplicate
    const allPendingMap = new Map();
    [...pendingScans, ...userReportedScans].forEach(s => {
      allPendingMap.set(s.id, s);
    });

    const allPending = Array.from(allPendingMap.values());

    return allPending.map((scan) => {
      const userFeedback = scan.feedback?.[0];
      const isUserReported = userFeedback?.role === FeedbackRole.USER && userFeedback?.isCorrect === false;

      return {
        scanId: scan.id,
        patientId: scan.patient?.id,
        patientName: scan.patient?.fullName,
        imageUrl: scan.images?.[0]?.imageUrl ?? null,
        confidence: scan.diagnosis?.aiConfidence ?? 0,
        predictedDisease:
          scan.diagnosis?.diagnosticStatus === DiagnosticStatus.UNKNOWN
            ? 'Unknown'
            : (scan.diagnosis?.predictedDisease?.name ?? 'Unknown'),
        reason: isUserReported ? "User Reported Error" : "Low Confidence",
        userNote: userFeedback?.note,
        createdAt: scan.createdAt,
        isDeleted: scan.isDeleted,
      };
    });
  }

  /** Admin: get all cases reviewed by admin (Gold Standard) */
  async getAdminVerifiedData(search?: string, diseaseId?: number) {
    const where: any = { role: FeedbackRole.ADMIN };

    if (diseaseId) {
      where.actualDiseaseId = diseaseId;
    }

    if (search) {
      const searchCriteria: any[] = [
        { scan: { patient: { fullName: { contains: search, mode: 'insensitive' } } } },
        { actualDisease: { name: { contains: search, mode: 'insensitive' } } },
        { predictedDisease: { name: { contains: search, mode: 'insensitive' } } },
      ];

      if (!isNaN(parseInt(search, 10))) {
        searchCriteria.push({ scanId: parseInt(search, 10) });
      }

      where.AND = [
        { OR: searchCriteria }
      ];
    }

    const logs = await this.prisma.feedbackLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        scan: {
          include: {
            images: { take: 1 },
            patient: { select: { fullName: true } },
            diagnosis: true,
          },
        },
        actualDisease: true,
        predictedDisease: true,
      },
    });

    return logs.map(log => ({
      feedbackId: log.id,
      scanId: log.scanId,
      patientName: log.scan?.patient?.fullName,
      imageUrl: log.scan?.images[0]?.imageUrl,
      predictedDisease: log.predictedDisease?.name || "Unknown",
      actualDisease: log.actualDisease?.name || "Unknown",
      isCorrect: log.isCorrect,
      confidence: log.scan?.diagnosis?.aiConfidence,
      reviewedAt: log.createdAt,
      note: log.note
    }));
  }

  /** Admin: export training data as CSV string */
  async exportTrainingDataCsv() {
    const logs = await this.prisma.feedbackLog.findMany({
      where: { role: FeedbackRole.ADMIN },
      include: {
        scan: { include: { images: { take: 1 } } },
        actualDisease: true
      }
    });

    let csv = "scan_id,image_url,label_id,label_name,is_correct,reviewed_at\n";
    logs.forEach(log => {
      const imageUrl = log.scan?.images[0]?.imageUrl || "";
      const labelId = log.actualDiseaseId || 0;
      const labelName = log.actualDisease?.name || "Unknown";
      csv += `${log.scanId},"${imageUrl}",${labelId},"${labelName}",${log.isCorrect},"${log.createdAt.toISOString()}"\n`;
    });
    return csv;
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
          role: FeedbackRole.ADMIN,
        },
      });

      return { message: 'Review submitted', feedbackId: feedback.id };
    });
  }

  /** Admin: get all diseases for review modal dropdown */
  async getAllDiseases() {
    const diseases = await this.prisma.disease.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
    this.logger.log(`Admin requested diseases. Found ${diseases.length} records. Codes: ${diseases.map(d => d.code).join(', ')}`);
    return diseases;
  }

  /** Patient: get list of diseases currently enabled in AI Engine */
  async getSupportedDiseases() {
    try {
      const config = await this.getAiSettings();
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

  /** Admin: get all patients */
  async getPatients() {
    return this.prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { skinScans: true } },
      },
    });
  }

  /** Admin: get current AI settings */
  async getAiSettings() {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const apiKey = process.env.INTERNAL_API_KEY || '';

    try {
      const response = await fetch(`${aiUrl}/ai/config`, {
        headers: { 'X-Internal-Api-Key': apiKey }
      });
      if (!response.ok) throw new Error('Failed to fetch AI config');
      return await response.json();
    } catch (err) {
      this.logger.error(`Failed to get AI settings: ${err.message}`);
      throw new ServiceUnavailableException('Could not connect to AI Service');
    }
  }

  private normalizeDiseaseName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /** Admin: get available model packages from AI Service */
  async getAvailableModels() {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const apiKey = process.env.INTERNAL_API_KEY || '';

    try {
      const response = await fetch(`${aiUrl}/ai/models`, {
        headers: { 'X-Internal-Api-Key': apiKey }
      });
      const models = await response.json();

      // Auto-Sync diseases from models into Database
      for (const model of models) {
        if (model.supported_labels && Array.isArray(model.supported_labels)) {
          for (const label of model.supported_labels) {
            if (label.status === 'DISEASE' && label.code) {
              const normalizedName = label.name ? this.normalizeDiseaseName(label.name) : 'Unknown Disease';
              try {
                await this.prisma.disease.upsert({
                  where: { code: label.code },
                  update: { name: normalizedName }, // Update name in case Admin didn't change it, or just leave it
                  create: {
                    code: label.code,
                    name: normalizedName,
                    description: `Auto-imported from AI model ${model.version}`
                  }
                });
              } catch (e) {
                this.logger.error(`Failed to auto-sync disease ${label.code}: ${e.message}`);
              }
            }
          }
        }
      }

      return models;
    } catch (err) {
      this.logger.error(`Failed to get available models: ${err.message}`);
      throw new ServiceUnavailableException('Could not connect to AI Service');
    }
  }

  /** Admin: update AI Settings & hot-reload */
  async updateAiSettings(body: { version?: string; inference_threshold?: number; enabled_disease_codes?: string[] }) {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const apiKey = process.env.INTERNAL_API_KEY || '';

    try {
      const response = await fetch(`${aiUrl}/ai/config/reload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': apiKey,
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`Failed to reload AI config: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      this.logger.error(`Failed to update AI settings: ${err.message}`);
      throw new ServiceUnavailableException('Failed to update AI Service settings');
    }
  }

  /** Soft Delete: Marks scan as deleted for patient but keeps data for Admin dataset */
  async deleteScan(patientId: number, scanId: number) {
    const scan = await this.prisma.skinScan.findFirst({
      where: { id: scanId, patientId, isDeleted: false },
    });

    if (!scan) throw new BadRequestException('Scan not found or access denied.');

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
          this.logger.error(`Failed to delete Cloudinary asset: ${err.message}`);
        }
      }),
    );
  }
}
