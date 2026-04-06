import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(body: any) {
    const { username, email, password, fullName, age, gender } = body;
    // 1. Kiểm tra username/email đã tồn tại chưa
    const existing = await this.prisma.account.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existing) throw new BadRequestException('Email or Username already exists');

    // 2. Tạo Account & Patient cùng lúc nhờ Prisma Nested Writes
    const account = await this.prisma.account.create({
      data: {
        username,
        email,
        passwordHash: password, // Để đơn giản cho Frontend test, tạm lưu chữ thường (Thực tế phải dùng Bcrypt)
        role: email.includes('admin') ? 'admin' : 'patient',
        patient: {
          create: {
            fullName: fullName || username,
            age: age ? parseInt(age) : 25,
            gender: gender || 'unknown'
          } 
        }
      },
      include: { patient: true }
    });

    return {
      message: 'Registration successful',
      accountId: account.id,
      patientId: account.patient?.id
    };
  }

  async login(email: string, passwordHash: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: { patient: true }
    });
    if (!account || account.passwordHash !== passwordHash) {
      throw new BadRequestException('Invalid credentials');
    }
    return {
      message: 'Login successful',
      patientId: account.patient?.id,
      role: account.role,
      fullName: account.patient?.fullName || account.username // Return fullName to save in Frontend
    };
  }
}
