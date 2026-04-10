import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';

@Controller('diary')
@UseGuards(JwtAuthGuard)
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  async createDiary(
    @CurrentUser('patientId') patientId: number,
    @Body() body: { scanId: number; conditionScore: number; note: string; entryDate: string },
  ) {
    // patientId lấy từ JWT token, không từ body
    return this.diaryService.createDiaryEntry(patientId, body.scanId, body.conditionScore, body.note, body.entryDate);
  }

  @Get(':patientId')
  async getDiaries(
    @CurrentUser('patientId') tokenPatientId: number,
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    // Chỉ cho phép xem diary của chính mình
    if (tokenPatientId !== patientId) {
      return { message: 'You can only view your own diary.' };
    }
    return this.diaryService.getPatientDiaries(patientId);
  }
}
