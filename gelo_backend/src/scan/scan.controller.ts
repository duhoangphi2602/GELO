import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  UseGuards,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Res,
  Query,
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
      return cb(
        new BadRequestException(
          'Only image files (jpg, png, webp) are allowed',
        ),
        false,
      );
    }
    cb(null, true);
  },
};

@Controller('scans')
export class ScanController {
  constructor(
    private readonly scanService: ScanService
  ) {}

  // ─── Patient: Upload image & AI analysis (single-phase, AI-only) ────────
  @Post('initiate')
  @Roles(UserRole.PATIENT)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('images', multerOptions))
  async initiateScan(
    @CurrentUser('patientId') patientId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { imageQuality?: string },
  ) {
    if (!patientId) {
      throw new BadRequestException('Patient profile required.');
    }
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }
    const imageUrls = [file.path];
    const imageQuality = body.imageQuality || 'CLEAR';
    return this.scanService.initiateScan(patientId, imageUrls, imageQuality);
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

  @Get('supported-diseases')
  @UseGuards(JwtAuthGuard)
  async getSupportedDiseases() {
    return this.scanService.getSupportedDiseases();
  }

  // ─── Patient: Xoá toàn bộ lịch sử scan ──────────────────────────────────────
  @Delete('history/all')
  @UseGuards(JwtAuthGuard)
  async deleteAllScans(@CurrentUser('patientId') tokenPatientId: number) {
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
}
