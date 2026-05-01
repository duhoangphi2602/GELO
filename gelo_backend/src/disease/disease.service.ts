import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { BaseService } from '../common/services/base.service';

@Injectable()
export class DiseaseService extends BaseService {
  constructor(private prisma: PrismaService) {
    super();
  }

  async findAll() {
    return this.prisma.disease.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.disease.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
      },
    });
  }

  async update(id: number, data: any) {
    await this.handleNotFound(
      this.prisma.disease.findUnique({ where: { id } }),
      `Disease with ID ${id} not found`,
    );

    return this.prisma.disease.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
      },
    });
  }

  async remove(id: number) {
    await this.handleNotFound(
      this.prisma.disease.findUnique({ where: { id } }),
      `Disease with ID ${id} not found`,
    );

    return this.prisma.disease.delete({
      where: { id },
    });
  }

  async getAdvices(diseaseId: number) {
    return this.prisma.diseaseAdvice.findMany({
      where: { diseaseId },
    });
  }

  async updateAdvices(
    diseaseId: number,
    advices: { type: string; title?: string; content: string }[],
  ) {
    // Xóa tất cả lời khuyên cũ và lưu lại bộ mới
    return this.prisma.$transaction(async (tx) => {
      await tx.diseaseAdvice.deleteMany({ where: { diseaseId } });
      return await tx.diseaseAdvice.createMany({
        data: advices.map((a) => ({
          diseaseId,
          adviceType: a.type,
          title: a.title,
          content: a.content,
        })),
      });
    });
  }
}
