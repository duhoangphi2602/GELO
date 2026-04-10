import {
  Controller, Post, Get, Param, UseGuards, Delete,
  UseInterceptors, UploadedFiles, Body, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ScanService } from './scan.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser, Roles } from '../auth/auth.decorator';
import { cloudinaryStorage } from '../common/cloudinary.config';

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

  // ─── Patient: Upload ảnh + phân tích ────────────────────────────────────
  @Post('analyze')
  @Roles('patient')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 3, multerOptions))
  async analyzeSkin(
    @CurrentUser('patientId') patientId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('answers') answersRaw: string,
  ) {
    if (!patientId) {
      throw new BadRequestException('Patient profile required. If you are an admin, please use a patient account for scanning.');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required. Send as multipart/form-data with field name "images".');
    }

    // Parse answers JSON string từ FormData
    let answers: any[] = [];
    if (answersRaw) {
      try {
        answers = JSON.parse(answersRaw);
      } catch {
        throw new BadRequestException('Invalid answers format. Must be a JSON array.');
      }
    }

    // Cloudinary trả về URL qua req.file.path (secure_url)
    const imageUrls = files.map((f: any) => f.path);
    return this.scanService.processScan(patientId, imageUrls, answers);
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

  // ─── Admin: Stats cho Dashboard ──────────────────────────────────────────
  @Get('admin/stats')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async getAdminStats() {
    return this.scanService.getAdminStats();
  }

  // ─── Admin: Danh sách bệnh nhân ────────────────────────────────────────
  @Get('admin/patients')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async getAdminPatients() {
    return this.scanService.getAdminPatients();
  }

  // ─── Admin: Scan cần review ─────────────────────────────────────────────
  @Get('admin/pending-reviews')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async getPendingReviews() {
    return this.scanService.getPendingReviews();
  }

  // ─── Admin: Danh sách bệnh ─────────────────────────────────────────────
  @Get('admin/diseases')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async getDiseases() {
    return this.scanService.getAllDiseases();
  }

  // ─── Admin: Submit review ───────────────────────────────────────────────
  @Post('admin/review/:scanId')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async submitReview(
    @Param('scanId') scanId: string,
    @Body() body: { isCorrect: boolean; actualDiseaseId?: number; note?: string },
  ) {
    return this.scanService.submitReview(parseInt(scanId, 10), body);
  }
}
