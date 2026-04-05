import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiaryService {
  constructor(private prisma: PrismaService) {}

  async createDiaryEntry(patientId: number, scanId: number, conditionScore: number, note: string, entryDate?: string) {
    const diary = await this.prisma.skinDiary.create({
      data: {
        patientId,
        scanId, // Optional, can be null depending on DB constraints
        conditionScore,
        note,
        createdAt: entryDate ? new Date(entryDate) : undefined
      }
    });

    return {
      message: 'Diary entry created successfully',
      diaryId: diary.id
    };
  }

  async getPatientDiaries(patientId: number) {
    return await this.prisma.skinDiary.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { scan: true } // Return scan history alongside notes
    });
  }
}
