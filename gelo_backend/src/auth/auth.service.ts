import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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

    // --- Kiểm tra username/email đã tồn tại chưa (riêng từng cái để báo lỗi chính xác) ---
    const existingByEmail = await this.prisma.account.findFirst({
      where: { email },
    });
    if (existingByEmail) {
      throw new BadRequestException('This email is already registered. Please use a different email.');
    }

    const existingByUsername = await this.prisma.account.findFirst({
      where: { username },
    });
    if (existingByUsername) {
      throw new BadRequestException('This username is already taken. Please choose another one.');
    }

    // --- Tạo Account & Patient cùng lúc nhờ Prisma Nested Writes ---
    const account = await this.prisma.account.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: password, // TODO: Replace with bcrypt.hash(password, 10) in production
        role: email.trim().toLowerCase().includes('admin') ? 'admin' : 'patient',
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

  /**
   * Login bằng email HOẶC username.
   * Frontend gửi field `identifier` (có thể là email hoặc username) và `password`.
   *
   * Cách hoạt động:
   * - Prisma tìm account với OR: [{ email: identifier }, { username: identifier }]
   * - Nếu tìm thấy và password khớp → trả về thông tin user
   * - Nếu không → throw 401
   */
  async login(identifier: string, password: string) {
    if (!identifier || !password) {
      throw new BadRequestException('Identifier and password are required.');
    }

    const account = await this.prisma.account.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { username: identifier.trim() },
        ],
      },
      include: { patient: true },
    });

    if (!account || account.passwordHash !== password) {
      throw new BadRequestException('Invalid credentials. Please check your email/username and password.');
    }

    return {
      message: 'Login successful',
      patientId: account.patient?.id,
      role: account.role,
      fullName: account.patient?.fullName || account.username,
    };
  }
}
