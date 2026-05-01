import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../common/services/base.service';

@Injectable()
export class DiaryService extends BaseService {
  constructor(private prisma: PrismaService) {
    super();
  }

  async createDiaryEntry(
    patientId: number,
    scanId: number | null,
    conditionScore: number,
    note: string,
    entryDate?: string,
  ) {
    if (!patientId) {
      console.error(
        '[DiaryService] Create failed: patientId is missing in token',
      );
      throw new BadRequestException(
        'Diary entries can only be created by patients with a valid profile.',
      );
    }

    let validScanId = scanId;
    if (scanId) {
      const scanExists = await this.prisma.skinScan.findFirst({
        where: { id: scanId },
      });
      if (!scanExists) {
        console.warn(
          `[DiaryService] Self-Healing: Scan ID ${scanId} not found in DB. Proceeding without connection.`,
        );
        validScanId = null;
      }
    }

    try {
      const diary = await this.prisma.skinDiary.create({
        data: {
          patient: { connect: { id: patientId } },
          scan: validScanId ? { connect: { id: validScanId } } : undefined,
          conditionScore,
          note,
          createdAt: entryDate ? new Date(entryDate) : undefined,
        },
      });

      return {
        message: 'Diary entry created successfully',
        diaryId: diary.id,
      };
    } catch (error) {
      console.error('[DiaryService] Prisma create failed:', error);
      throw error;
    }
  }

  async getPatientDiaries(patientId: number) {
    return await this.prisma.skinDiary.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { scan: true }, // Return scan history alongside notes
    });
  }

  async deleteDiaryEntry(diaryId: number, patientId: number) {
    const entry = await this.handleNotFound(
      this.prisma.skinDiary.findUnique({ where: { id: diaryId } }),
      'Diary entry not found.'
    );

    if (entry.patientId !== patientId) {
      throw new ForbiddenException(
        'You can only delete your own diary entries.',
      );
    }

    await this.prisma.skinDiary.delete({
      where: { id: diaryId },
    });

    return { message: 'Diary entry deleted successfully' };
  }

  async deleteAllDiaries(patientId: number) {
    const result = await this.prisma.skinDiary.deleteMany({
      where: { patientId },
    });

    return {
      message: 'All diary entries deleted successfully',
      count: result.count,
    };
  }
}
