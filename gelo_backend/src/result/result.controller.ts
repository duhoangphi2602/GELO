import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ResultService } from './result.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultController {
  constructor(private resultService: ResultService) {}

  @Get(':scanId')
  async getResult(@Param('scanId', ParseIntPipe) scanId: number) {
    return this.resultService.getDiagnosticResult(scanId);
  }

  @Post(':scanId/feedback')
  async submitFeedback(
    @Param('scanId', ParseIntPipe) scanId: number,
    @Body() body: { isCorrect: boolean; note?: string },
  ) {
    return this.resultService.submitFeedback(scanId, body);
  }
}
