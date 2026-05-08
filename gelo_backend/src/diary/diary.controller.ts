import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DiaryService } from './diary.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser, Roles } from '../auth/auth.decorator';
import { UserRole } from '@prisma/client';

@Controller('diary')
@UseGuards(JwtAuthGuard)
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  @Roles(UserRole.PATIENT)
  async createDiaryEntry(
    @CurrentUser('patientId') patientId: number,
    @Body()
    body: {
      scanId?: number;
      conditionScore: number;
      symptoms: string[];
      note: string;
      entryDate?: string;
    },
  ) {
    return this.diaryService.createDiaryEntry(
      patientId,
      body.scanId || null,
      body.conditionScore,
      body.symptoms,
      body.note,
      body.entryDate,
    );
  }

  @Get(':patientId')
  async getDiaries(
    @CurrentUser('patientId') tokenPatientId: number,
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    // Chỉ cho phép xem diary của chính mình
    if (tokenPatientId !== patientId) {
      throw new ForbiddenException('You can only view your own diary history.');
    }
    return this.diaryService.getPatientDiaries(patientId);
  }

  @Delete('batch/all')
  @Roles(UserRole.PATIENT)
  async deleteAllDiaries(@CurrentUser('patientId') patientId: number) {
    return this.diaryService.deleteAllDiaries(patientId);
  }

  @Delete(':id')
  @Roles(UserRole.PATIENT)
  async deleteDiary(
    @CurrentUser('patientId') patientId: number,
    @Param('id', ParseIntPipe) diaryId: number,
  ) {
    return this.diaryService.deleteDiaryEntry(diaryId, patientId);
  }
}
