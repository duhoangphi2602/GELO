import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OtpType } from '@prisma/client';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async invalidateAllOtps(email: string, type?: OtpType) {
    await this.prisma.otpCode.updateMany({
      where: { email, used: false, ...(type && { type }) },
      data: { used: true },
    });
    return { success: true };
  }

  private async checkRateLimit(email: string, type: OtpType) {
    const lastOtp = await this.prisma.otpCode.findFirst({
      where: { email, type },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const now = new Date();
      const diffInSeconds =
        (now.getTime() - lastOtp.createdAt.getTime()) / 1000;
      if (diffInSeconds < 60) {
        throw new BadRequestException(
          'Please wait before requesting a new code.',
        );
      }
    }
  }

  async generateAndSendOtp(email: string, type: OtpType) {
    await this.checkRateLimit(email, type);
    await this.invalidateAllOtps(email, type);

    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration

    await this.prisma.otpCode.create({
      data: { email, code, type, expiresAt },
    });

    await this.mailService.sendOtp(email, code, type);
  }

  async verifyOtp(email: string, code: string, type: OtpType) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { email, type, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    if (new Date() > otp.expiresAt) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (otp.attempts >= 5) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
      });
      throw new BadRequestException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    if (otp.code !== code) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      });
      throw new BadRequestException('Invalid OTP.');
    }

    // Mark as used
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    return { success: true };
  }
}
