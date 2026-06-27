import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole, Gender, OtpType } from '@prisma/client';
import { RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { OtpService } from './otp.service';

import { BaseService } from '../common/services/base.service';

@Injectable()
export class AuthService extends BaseService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private otpService: OtpService,
  ) {
    super();
  }

  // ─── BACKGROUND CRON JOBS ────────────────────────────────────────────────────
  /**
   * Runs every day at midnight to clean up:
   * 1. Unverified accounts older than 24 hours.
   * 2. Expired OTP codes.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCronCleanup() {
    this.logger.log(
      'Running daily cleanup of unverified accounts and expired OTPs...',
    );

    // 24 hours ago
    const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // 1. Delete expired OTPs
      const deletedOtps = await this.prisma.otpCode.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      // 2. Delete unverified accounts older than 24h
      const deletedAccounts = await this.prisma.account.deleteMany({
        where: {
          isVerified: false,
          createdAt: { lt: expirationTime },
        },
      });

      this.logger.log(
        `Cleanup complete: Removed ${deletedAccounts.count} unverified accounts and ${deletedOtps.count} expired OTPs.`,
      );
    } catch (error) {
      this.logger.error('Failed to run daily cleanup', error);
    }
  }

  async verifyOtp(email: string, code: string, type: OtpType) {
    // Let OtpService handle the core validation
    await this.otpService.verifyOtp(email, code, type);

    // Domain specific logic: If it's registration, verify the account
    if (type === 'REGISTER') {
      await this.prisma.account.update({
        where: { email },
        data: { isVerified: true },
      });
    }

    return { message: 'OTP verified successfully' };
  }

  async resendOtp(email: string, type: OtpType) {
    // Basic check if email exists
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account) {
      throw new BadRequestException('Account not found.');
    }
    if (type === 'REGISTER' && account.isVerified) {
      throw new BadRequestException('Account is already verified.');
    }

    await this.otpService.generateAndSendOtp(email, type);
    return { message: 'OTP resent successfully' };
  }

  // ─── REGISTER ─────────────────────────────────────────────────────────────────
  async register(registerDto: RegisterDto) {
    const { username, email, password, fullName, age, gender } = registerDto;
    const emailToUse = this.normalize(email, true);
    const usernameToUse = this.normalize(username);

    const existingByEmail = await this.prisma.account.findUnique({
      where: { email: emailToUse },
      include: { patient: true },
    });

    if (existingByEmail && existingByEmail.isVerified) {
      throw new BadRequestException('This email is already registered.');
    }

    const existingByUsername = await this.prisma.account.findUnique({
      where: { username: usernameToUse },
    });

    if (existingByUsername && existingByUsername.id !== existingByEmail?.id) {
      throw new BadRequestException('This username is already taken.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let account;

    if (existingByEmail && !existingByEmail.isVerified) {
      // Overwrite the existing unverified account
      account = await this.prisma.account.update({
        where: { id: existingByEmail.id },
        data: {
          username: usernameToUse,
          passwordHash: hashedPassword,
          patient: {
            update: {
              fullName: fullName?.trim() || usernameToUse,
              age: age ?? 25,
              gender: gender || Gender.UNKNOWN,
            },
          },
        },
        include: { patient: true },
      });
    } else {
      // Create new account
      account = await this.prisma.account.create({
        data: {
          username: usernameToUse,
          email: emailToUse,
          passwordHash: hashedPassword,
          isVerified: false,
          role: UserRole.PATIENT,
          patient: {
            create: {
              fullName: fullName?.trim() || usernameToUse,
              age: age ?? 25,
              gender: gender || Gender.UNKNOWN,
            },
          },
        },
        include: { patient: true },
      });
    }

    // Attempt to send OTP
    try {
      await this.otpService.generateAndSendOtp(account.email, 'REGISTER');
    } catch (error) {
      this.logger.error('Registration OTP failed to send', error);
      throw new BadRequestException(
        'Account created, but failed to send verification email. Please check server email configuration.',
      );
    }

    return {
      message: 'Registration successful. Please verify your email.',
      accountId: account.id,
      patientId: account.patient?.id,
      email: account.email,
    };
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  async login(identifier: string, password: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        OR: [
          { email: this.normalize(identifier, true) },
          { username: this.normalize(identifier) },
        ],
      },
      include: { patient: true },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      account.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!account.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const payload = {
      sub: account.id,
      role: account.role,
      patientId: account.patient?.id,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      accessToken,
      patientId: account.patient?.id,
      role: account.role,
      fullName: account.patient?.fullName || account.username,
    };
  }

  // ─── FORGOT PASSWORD ────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const emailLower = email.trim().toLowerCase();
    const account = await this.prisma.account.findUnique({
      where: { email: emailLower },
    });
    if (!account) {
      // Don't leak whether the account exists
      return { message: 'If the email exists, an OTP has been sent.' };
    }

    await this.otpService.generateAndSendOtp(emailLower, 'FORGOT_PASSWORD');
    return { message: 'If the email exists, an OTP has been sent.' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const emailLower = email.trim().toLowerCase();

    // Will throw if invalid
    await this.verifyOtp(emailLower, code, 'FORGOT_PASSWORD');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.account.update({
      where: { email: emailLower },
      data: { passwordHash: hashedPassword },
    });

    // Invalidate all remaining OTPs
    await this.otpService.invalidateAllOtps(emailLower, 'FORGOT_PASSWORD');

    return { message: 'Password reset successfully.' };
  }

  // ─── CHANGE PASSWORD (LOGGED IN) ────────────────────────────────────────────
  async changePasswordRequest(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new UnauthorizedException();

    await this.otpService.generateAndSendOtp(account.email, 'CHANGE_PASSWORD');
    return { message: 'OTP sent to your email.' };
  }

  async changePasswordVerify(
    accountId: number,
    code: string,
    newPassword: string,
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new UnauthorizedException();

    // Verify OTP
    await this.verifyOtp(account.email, code, 'CHANGE_PASSWORD');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.account.update({
      where: { id: accountId },
      data: { passwordHash: hashedPassword },
    });

    // Invalidate all remaining OTPs
    await this.otpService.invalidateAllOtps(account.email, 'CHANGE_PASSWORD');

    return { message: 'Password changed successfully.' };
  }

  // ─── GET PROFILE ─────────────────────────────────────────────────────────────
  async getProfile(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { patient: true },
    });
    if (!account) throw new UnauthorizedException('Account not found');

    const { passwordHash, ...safeAccount } = account;
    return safeAccount;
  }

  // ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
  async updateProfile(accountId: number, updateProfileDto: UpdateProfileDto) {
    const { username, fullName, email, password, age, gender } =
      updateProfileDto;

    const updateAccountData: any = {};
    if (email) {
      const existing = await this.prisma.account.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          NOT: { id: accountId },
        },
      });
      if (existing) throw new BadRequestException('Email already in use');
      updateAccountData.email = email.trim().toLowerCase();
    }

    if (username) {
      const existing = await this.prisma.account.findFirst({
        where: {
          username: username.trim(),
          NOT: { id: accountId },
        },
      });
      if (existing) throw new BadRequestException('Username already in use');
      updateAccountData.username = username.trim();
    }

    if (password) {
      updateAccountData.passwordHash = await bcrypt.hash(password, 10);
    }

    const patientData: any = {};
    if (fullName) patientData.fullName = fullName.trim();
    if (age !== undefined) patientData.age = age;
    if (gender) patientData.gender = gender;

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...updateAccountData,
        patient:
          Object.keys(patientData).length > 0
            ? {
                upsert: {
                  create: {
                    fullName: fullName?.trim() || 'User',
                    age: age || 25,
                    gender: gender || Gender.UNKNOWN,
                  },
                  update: patientData,
                },
              }
            : undefined,
      },
    });

    return this.getProfile(accountId);
  }
}
