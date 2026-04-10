import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ─── REGISTER ─────────────────────────────────────────────────────────────────
  async register(body: any) {
    const { username, email, password, fullName, age, gender } = body;

    // --- Server-side validation ---
    if (!username || username.trim().length < 3) {
      throw new BadRequestException('Username must be at least 3 characters.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email format.');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }
    const parsedAge = age ? parseInt(age, 10) : null;
    if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
      throw new BadRequestException('Age must be between 1 and 120.');
    }

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
        role: 'patient', // Mặc định luôn là patient. Admin tạo qua seed.
        patient: {
          create: {
            fullName: fullName?.trim() || username.trim(),
            age: parsedAge ?? 25,
            gender: gender || 'unknown',
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
    if (!identifier || !password) {
      throw new BadRequestException('Email/username and password are required.');
    }

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

  // ─── SEED DB FOR TEST ────────────────────────────────────────────────────────
  async seedDb() {
    // Admin
    const adminHash = await bcrypt.hash('password123', 10);
    await this.prisma.account.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@healthai.com',
        passwordHash: adminHash,
        role: 'admin',
      },
    });

    // Patient
    const patientHash = await bcrypt.hash('patient123', 10);
    await this.prisma.account.upsert({
      where: { username: 'patient' },
      update: {},
      create: {
        username: 'patient',
        email: 'patient@healthai.com',
        passwordHash: patientHash,
        role: 'patient',
        patient: {
          create: {
            fullName: 'Demo Patient',
            age: 30,
            gender: 'Other',
          }
        }
      },
    });

    // Disease
    try {
      await this.prisma.disease.create({
        data: {
          id: 1,
          name: 'Atopic Dermatitis',
          description: 'A chronic condition that makes your skin red and itchy.',
          visualPattern: 'Red, dry, itchy patches',
          status: 'active',
        }
      });
    } catch(e) { } // Ignore if already seeded

    return { message: 'Seed Complete' };
  }
}
