import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole, Gender } from '@prisma/client';
import { RegisterDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  // ─── REGISTER ─────────────────────────────────────────────────────────────────
  async register(registerDto: RegisterDto) {
    const { username, email, password, fullName, age, gender } = registerDto;

    // --- Kiểm tra duplicate ---
    const existingByEmail = await this.prisma.account.findFirst({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingByEmail) {
      throw new BadRequestException('This email is already registered.');
    }

    const existingByUsername = await this.prisma.account.findFirst({
      where: { username: username.trim() },
    });
    if (existingByUsername) {
      throw new BadRequestException('This username is already taken.');
    }

    // --- Hash password với bcrypt (salt rounds = 10) ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Tạo Account & Patient ---
    const account = await this.prisma.account.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashedPassword,
        role: UserRole.PATIENT, // Mặc định luôn là PATIENT
        patient: {
          create: {
            fullName: fullName?.trim() || username.trim(),
            age: age ?? 25,
            gender: gender || Gender.UNKNOWN,
          },
        },
      },
      include: { patient: true },
    });

    return {
      message: 'Registration successful',
      accountId: account.id,
      patientId: account.patient?.id,
    };
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  async login(identifier: string, password: string) {
    // Tìm account bằng email HOẶC username
    const account = await this.prisma.account.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { username: identifier.trim() },
        ],
      },
      include: { patient: true },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // So sánh password bằng bcrypt
    const isPasswordValid = await bcrypt.compare(password, account.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Tạo JWT token
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
    const { fullName, email, password, age, gender } = updateProfileDto;

    // 1. Cập nhật Account (Email & Password)
    const updateAccountData: any = {};
    if (email) {
      const existing = await this.prisma.account.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          NOT: { id: accountId }
        }
      });
      if (existing) throw new BadRequestException('Email already in use');
      updateAccountData.email = email.trim().toLowerCase();
    }

    if (password) {
      updateAccountData.passwordHash = await bcrypt.hash(password, 10);
    }

    // 2. Cập nhật hoặc Tạo mới Patient (Full Name, Age, Gender)
    const patientData: any = {};
    if (fullName) patientData.fullName = fullName.trim();
    if (age !== undefined) patientData.age = age;
    if (gender) patientData.gender = gender;

    // Thực hiện Update Account & Upsert Patient
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...updateAccountData,
        patient: Object.keys(patientData).length > 0 ? {
          upsert: {
            create: {
              fullName: fullName?.trim() || 'User',
              age: age || 25,
              gender: gender || Gender.UNKNOWN,
            },
            update: patientData
          }
        } : undefined
      }
    });

    return this.getProfile(accountId);
  }
}
