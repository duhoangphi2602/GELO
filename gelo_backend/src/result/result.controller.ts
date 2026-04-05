import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ResultService } from './result.service';

@Controller('results')
export class ResultController {
  constructor(private resultService: ResultService) {}

  @Get(':scanId')
  async getResult(@Param('scanId', ParseIntPipe) scanId: number) {
    // Được gọi khi màn hình Result mount
    return this.resultService.getDiagnosticResult(scanId);
  }
}
