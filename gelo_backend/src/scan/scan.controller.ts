import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ScanService } from './scan.service';

@Controller('scans')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post('analyze')
  async analyzeSkin(@Body() body: { patientId: number; imageUrl: string; answers: any[] }) {
    // Gọi sang service để xử lý nghiệp vụ
    return this.scanService.processScan(body.patientId, body.imageUrl, body.answers);
  }

  @Get('patient/:patientId')
  async getPatientScans(@Param('patientId') patientId: string) {
    return this.scanService.getScansForPatient(parseInt(patientId, 10));
  }
}
