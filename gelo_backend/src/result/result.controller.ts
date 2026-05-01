import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ResultService } from './result.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import { UserRole } from '@prisma/client';

@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultController {
  constructor(private resultService: ResultService) {}

  @Get(':scanId')
  async getResult(
    @Param('scanId', ParseIntPipe) scanId: number,
    @CurrentUser() user: { patientId: number; role: UserRole },
  ) {
    return this.resultService.getDiagnosticResult(
      scanId,
      user.patientId,
      user.role,
    );
  }

  @Post(':scanId/feedback')
  async submitFeedback(
    @Param('scanId', ParseIntPipe) scanId: number,
    @Body() body: { isCorrect: boolean; note?: string },
    @CurrentUser() user: { patientId: number; role: UserRole },
  ) {
    return this.resultService.submitFeedback(scanId, body, user.patientId);
  }
}
