import {
  Controller, Post, Get, Param, UseGuards, Delete,
  UseInterceptors, UploadedFiles, Body, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ScanService } from './scan.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser, Roles } from '../auth/auth.decorator';
import { cloudinaryStorage } from '../common/cloudinary.config';
import { UserRole } from '@prisma/client';
import { CompleteScanDto } from './dto/scan.dto';

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
  constructor(private readonly scanService: ScanService) { }

  // ─── Patient Phase 1: Upload ảnh & AI phân tích sơ bộ ────────────────────
  @Post('initiate')
  @Roles(UserRole.PATIENT)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 3, multerOptions))
  async initiateScan(
    @CurrentUser('patientId') patientId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!patientId) {
      throw new BadRequestException('Patient profile required.');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required.');
    }

    const imageUrls = files.map((f: any) => f.path);
    return this.scanService.initiateScan(patientId, imageUrls);
  }

  // ─── Patient Phase 2: Gửi câu trả lời & Chốt kết quả ──────────────────────
  @Post('complete/:scanId')
  @Roles(UserRole.PATIENT)
  @UseGuards(JwtAuthGuard)
  async completeScan(
    @CurrentUser('patientId') patientId: number,
    @Param('scanId') scanId: string,
    @Body() completeScanDto: CompleteScanDto,
  ) {
    return this.scanService.completeScan(
      parseInt(scanId, 10),
      completeScanDto.answers,
      patientId
    );
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

  // ─── Patient: Xoá lịch sử scan ─────────────────────────────────────────────
  @Delete(':scanId')
  @UseGuards(JwtAuthGuard)
  async deleteScan(
    @CurrentUser('patientId') tokenPatientId: number,
    @Param('scanId') scanId: string,
  ) {
    return this.scanService.deleteScan(tokenPatientId, parseInt(scanId, 10));
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

  // ─── Admin: Stats cho Dashboard ──────────────────────────────────────────
  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async getAdminStats() {
    return this.scanService.getAdminStats();
  }

  // ─── Admin: Danh sách bệnh nhân ────────────────────────────────────────
  @Get('admin/patients')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async getAdminPatients() {
    return this.scanService.getAdminPatients();
  }

  // ─── Admin: Scan cần review ─────────────────────────────────────────────
  @Get('admin/pending-reviews')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  async getPendingReviews() {
    return this.scanService.getPendingReviews();
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
    @Body() body: { isCorrect: boolean; actualDiseaseId?: number; note?: string },
  ) {
    return this.scanService.submitReview(parseInt(scanId, 10), body);
  }
}
