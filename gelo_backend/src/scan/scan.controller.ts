import {
  Controller, Post, Get, Param, UseGuards, Delete,
  UseInterceptors, UploadedFile, Body, BadRequestException, Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ScanService } from './scan.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser, Roles } from '../auth/auth.decorator';
import { cloudinaryStorage } from '../common/cloudinary.config';
import { UserRole } from '@prisma/client';


// ─── Multer config: Upload thẳng lên Cloudinary ─────────────────────────────
const multerOptions = {
  storage: cloudinaryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return cb(new BadRequestException('Only image files (jpg, png, webp) are allowed'), false);
    }
    cb(null, true);
  },
};

@Controller('scans')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  // ─── Patient: Upload image & AI analysis (single-phase, AI-only) ────────
  @Post('initiate')
  @Roles(UserRole.PATIENT)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('images', multerOptions))
  async initiateScan(
    @CurrentUser('patientId') patientId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!patientId) {
      throw new BadRequestException('Patient profile required.');
    }
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }
    const imageUrls = [file.path];
    return this.scanService.initiateScan(patientId, imageUrls);
  }

  // ─── Patient: Lịch sử scan ─────────────────────────────────────────────
  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard)
  async getPatientScans(
    @CurrentUser('patientId') tokenPatientId: number,
    @Param('patientId') patientId: string,
  ) {
    // Chỉ cho phép xem scan của chính mình
    const requestedId = parseInt(patientId, 10);
    if (tokenPatientId !== requestedId) {
      throw new BadRequestException('You can only view your own scan history.');
    }
    return this.scanService.getScansForPatient(requestedId);
  }

  // ─── Patient: Xoá toàn bộ lịch sử scan ──────────────────────────────────────
  @Delete('history/all')
  @UseGuards(JwtAuthGuard)
  async deleteAllScans(
    @CurrentUser('patientId') tokenPatientId: number,
  ) {
    if (!tokenPatientId) {
      throw new BadRequestException('Patient profile required.');
    }
    return this.scanService.deleteAllScans(tokenPatientId);
  }

  // ─── Patient: Xoá lịch sử scan ─────────────────────────────────────────────
  @Delete(':scanId')
  @UseGuards(JwtAuthGuard)
  async deleteScan(
    @CurrentUser('patientId') tokenPatientId: number,
    @Param('scanId') scanId: string,
  ) {
    return this.scanService.deleteScan(tokenPatientId, parseInt(scanId, 10));
  }

  // ─── Admin: Stats cho Dashboard ──────────────────────────────────────────
  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async getAdminStats() {
    return this.scanService.getAdminStats();
  }

  // ─── Admin: Scan cần review ─────────────────────────────────────────────
  @Get('admin/pending-reviews')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async getPendingReviews() {
    return this.scanService.getPendingReviews();
  }

  // ─── Admin: Reviewed data (Gold Standard) ────────────────────────────────
  @Get('admin/verified-data')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async getAdminVerifiedData() {
    return this.scanService.getAdminVerifiedData();
  }

  // ─── Admin: Export verified data as CSV ─────────────────────────────────
  @Get('admin/export-csv')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async exportCsv(@Res() res: Response) {
    const csv = await this.scanService.exportTrainingDataCsv();
    res.header('Content-Type', 'text/csv');
    res.attachment('gelo_training_data.csv');
    return res.send(csv);
  }

  // ─── Admin: Danh sách bệnh ─────────────────────────────────────────────
  @Get('admin/diseases')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async getDiseases() {
    return this.scanService.getAllDiseases();
  }

  // ─── Admin: Submit review ───────────────────────────────────────────────
  @Post('admin/review/:scanId')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async submitReview(
    @Param('scanId') scanId: string,
    @Body() body: { isCorrect: boolean; actualDiseaseId?: number; actualStatus?: string; note?: string },
  ) {
    if (body.isCorrect === false && !body.actualDiseaseId && !body.actualStatus) {
      throw new BadRequestException('Please provide the correct disease or status if the prediction is wrong.');
    }
    return this.scanService.submitReview(parseInt(scanId, 10), body);
  }
}
