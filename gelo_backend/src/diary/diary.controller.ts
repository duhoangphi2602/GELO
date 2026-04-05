import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { DiaryService } from './diary.service';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  async createDiary(@Body() body: { patientId: number, scanId: number, conditionScore: number, note: string, entryDate: string }) {
    // API logic for tracking daily skin status
    return this.diaryService.createDiaryEntry(body.patientId, body.scanId, body.conditionScore, body.note, body.entryDate);
  }

  @Get(':patientId')
  async getDiaries(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.diaryService.getPatientDiaries(patientId);
  }
}
