import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosticStatus, FeedbackRole } from '@prisma/client';
import { AiIntegrationService } from '../common/services/ai-integration.service';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiIntegrationService,
  ) {}

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
      const correctCount = d.feedbackPredicted.filter(
        (f) => f.isCorrect,
      ).length;
      const accuracy =
        totalReviews > 0 ? (correctCount / totalReviews) * 100 : 100.0;
      return {
        diseaseId: d.id,
        name: d.name,
        totalReviews,
        correctCount,
        accuracy,
      };
    });

    const totalReviews = diseaseStats.reduce(
      (sum, d) => sum + d.totalReviews,
      0,
    );
    const totalCorrect = diseaseStats.reduce(
      (sum, d) => sum + d.correctCount,
      0,
    );
    const modelAccuracy =
      totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 100.0;

    return { totalDiagnoses, totalPatients, modelAccuracy, diseaseStats };
  }

  async getPendingReviews(threshold?: number) {
    const reviewThreshold =
      threshold ?? Number(process.env.LOW_CONFIDENCE_THRESHOLD ?? 60);

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

    const allPendingMap = new Map();
    [...pendingScans, ...userReportedScans].forEach((s) => {
      allPendingMap.set(s.id, s);
    });

    const allPending = Array.from(allPendingMap.values());

    return allPending.map((scan) => {
      const userFeedback = scan.feedback?.[0];
      const isUserReported =
        userFeedback?.role === FeedbackRole.USER &&
        userFeedback?.isCorrect === false;

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
        reason: isUserReported ? 'User Reported Error' : 'Low Confidence',
        userNote: userFeedback?.note,
        createdAt: scan.createdAt,
        isDeleted: scan.isDeleted,
      };
    });
  }

  async getAdminVerifiedData(search?: string, diseaseId?: number) {
    const where: any = { role: FeedbackRole.ADMIN };

    if (diseaseId) {
      where.actualDiseaseId = diseaseId;
    }

    if (search) {
      const searchCriteria: any[] = [
        {
          scan: {
            patient: { fullName: { contains: search, mode: 'insensitive' } },
          },
        },
        { actualDisease: { name: { contains: search, mode: 'insensitive' } } },
        {
          predictedDisease: { name: { contains: search, mode: 'insensitive' } },
        },
      ];

      if (!isNaN(parseInt(search, 10))) {
        searchCriteria.push({ scanId: parseInt(search, 10) });
      }

      where.AND = [{ OR: searchCriteria }];
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

    return logs.map((log) => ({
      feedbackId: log.id,
      scanId: log.scanId,
      patientName: log.scan?.patient?.fullName,
      imageUrl: log.scan?.images[0]?.imageUrl,
      predictedDisease: log.predictedDisease?.name || 'Unknown',
      actualDisease: log.actualDisease?.name || 'Unknown',
      isCorrect: log.isCorrect,
      confidence: log.scan?.diagnosis?.aiConfidence,
      reviewedAt: log.createdAt,
      note: log.note,
    }));
  }

  async exportTrainingDataCsv() {
    const logs = await this.prisma.feedbackLog.findMany({
      where: { role: FeedbackRole.ADMIN },
      include: {
        scan: { include: { images: { take: 1 } } },
        actualDisease: true,
      },
    });

    let csv = 'scan_id,image_url,label_id,label_name,is_correct,reviewed_at\n';
    logs.forEach((log) => {
      const imageUrl = log.scan?.images[0]?.imageUrl || '';
      const labelId = log.actualDiseaseId || 0;
      const labelName = log.actualDisease?.name || 'Unknown';
      csv += `${log.scanId},"${imageUrl}",${labelId},"${labelName}",${log.isCorrect},"${log.createdAt.toISOString()}"\n`;
    });
    return csv;
  }

  async submitReview(
    scanId: number,
    body: {
      isCorrect: boolean;
      actualDiseaseId?: number;
      actualStatus?: string;
      note?: string;
    },
  ) {
    const diagnosis = await this.prisma.diagnosisResult.findUnique({
      where: { scanId },
    });
    if (!diagnosis)
      throw new NotFoundException(
        `DiagnosisResult not found for scan #${scanId}`,
      );

    return this.prisma.$transaction(async (tx) => {
      if (!body.isCorrect) {
        await tx.diagnosisResult.update({
          where: { scanId },
          data: {
            finalDiseaseId: body.actualDiseaseId ?? null,
            diagnosticStatus:
              (body.actualStatus as DiagnosticStatus) ??
              (body.actualDiseaseId
                ? DiagnosticStatus.DISEASE
                : diagnosis.diagnosticStatus),
          },
        });
      }

      const feedback = await tx.feedbackLog.create({
        data: {
          scanId,
          diagnosticStatus:
            (body.actualStatus as DiagnosticStatus) ??
            diagnosis.diagnosticStatus,
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

  async getAllDiseases() {
    const diseases = await this.prisma.disease.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
    this.logger.log(
      `Admin requested diseases. Found ${diseases.length} records. Codes: ${diseases.map((d) => d.code).join(', ')}`,
    );
    return diseases;
  }

  async getPatients() {
    return this.prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { skinScans: true } },
      },
    });
  }

  async getAiSettings() {
    return this.aiService.request('/ai/config');
  }

  private normalizeDiseaseName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async getAvailableModels() {
    try {
      const models: any[] = await this.aiService.request('/ai/models');

      for (const model of models) {
        if (model.supported_labels && Array.isArray(model.supported_labels)) {
          for (const label of model.supported_labels) {
            if (label.status === 'DISEASE' && label.code) {
              const normalizedName = label.name
                ? this.normalizeDiseaseName(label.name)
                : 'Unknown Disease';
              try {
                await this.prisma.disease.upsert({
                  where: { code: label.code },
                  update: { name: normalizedName },
                  create: {
                    code: label.code,
                    name: normalizedName,
                    description: `Auto-imported from AI model ${model.version}`,
                  },
                });
              } catch (e) {
                this.logger.error(
                  `Failed to auto-sync disease ${label.code}: ${e.message}`,
                );
              }
            }
          }
        }
      }

      return models;
    } catch (err) {
      this.logger.error(`Failed to get available models: ${err.message}`);
      throw new Error('Could not connect to AI Service');
    }
  }

  async updateAiSettings(body: {
    version?: string;
    inference_threshold?: number;
    enabled_disease_codes?: string[];
  }) {
    return this.aiService.request('/ai/config/reload', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}
