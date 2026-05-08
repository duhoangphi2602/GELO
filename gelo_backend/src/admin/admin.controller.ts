import { Controller, Get, Put, Post, Delete, Param, Body, Query, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { AdminDashboardService } from './admin.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/auth.decorator';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

@Controller('admin')
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminDashboardService) {}

  @Get('stats')
  async getAdminStats() {
    return this.adminService.getAdminStats();
  }

  @Get('pending-reviews')
  async getPendingReviews() {
    return this.adminService.getPendingReviews();
  }

  @Get('verified-data')
  async getAdminVerifiedData(
    @Query('search') search?: string,
    @Query('diseaseId') diseaseId?: string,
  ) {
    return this.adminService.getAdminVerifiedData(
      search,
      diseaseId ? parseInt(diseaseId, 10) : undefined,
    );
  }

  @Get('export-csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.adminService.exportTrainingDataCsv();
    res.header('Content-Type', 'text/csv');
    res.attachment('gelo_training_data.csv');
    return res.send(csv);
  }

  @Get('diseases')
  async getDiseases() {
    return this.adminService.getAllDiseases();
  }

  @Post('review/:scanId')
  async submitReview(
    @Param('scanId') scanId: string,
    @Body() body: { isCorrect: boolean; actualDiseaseId?: number; actualStatus?: string; note?: string; imageQuality?: string },
  ) {
    if (body.isCorrect === false && !body.actualDiseaseId && !body.actualStatus) {
      throw new BadRequestException('Please provide the correct disease or status if the prediction is wrong.');
    }
    return this.adminService.submitReview(parseInt(scanId, 10), body);
  }

  @Get('ai-settings')
  async getAiSettings() {
    return this.adminService.getAiSettings();
  }

  @Get('models')
  async getAvailableModels() {
    return this.adminService.getAvailableModels();
  }

  @Get('patients')
  async getPatients() {
    return this.adminService.getPatients();
  }

  @Put('ai-settings')
  async updateAiSettings(
    @Body() body: { version?: string; inference_threshold?: number; enabled_disease_codes?: string[] }
  ) {
    return this.adminService.updateAiSettings(body);
  }

  @Delete('scan/:scanId')
  async deleteScan(@Param('scanId') scanId: string) {
    return this.adminService.deleteScan(parseInt(scanId, 10));
  }

  @Post('scans/bulk-delete')
  async bulkDeleteScans(@Body() body: { scanIds: number[] }) {
    return this.adminService.bulkDeleteScans(body.scanIds);
  }
}
