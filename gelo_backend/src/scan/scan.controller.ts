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

  @Get('admin/patients')
  async getAdminPatients() {
    return this.scanService.getAdminPatients();
  }

  @Get('admin/pending-reviews')
  async getPendingReviews() {
    return this.scanService.getPendingReviews();
  }

  @Get('admin/diseases')
  async getDiseases() {
    return this.scanService.getAllDiseases();
  }

  @Post('admin/review/:scanId')
  async submitReview(
    @Param('scanId') scanId: string,
    @Body() body: { isCorrect: boolean; actualDiseaseId?: number; note?: string }
  ) {
    return this.scanService.submitReview(parseInt(scanId, 10), body);
  }
}
