import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiseaseService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.disease.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.disease.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.disease.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.disease.delete({
      where: { id },
    });
  }

  async getAdvices(diseaseId: number) {
    return this.prisma.diseaseAdvice.findMany({
      where: { diseaseId },
    });
  }

  async updateAdvices(diseaseId: number, advices: { type: string; title?: string; content: string }[]) {
    // Xóa tất cả lời khuyên cũ và lưu lại bộ mới
    return this.prisma.$transaction(async (tx) => {
      await tx.diseaseAdvice.deleteMany({ where: { diseaseId } });
      return await tx.diseaseAdvice.createMany({
        data: advices.map(a => ({
          diseaseId,
          adviceType: a.type,
          title: a.title,
          content: a.content,
        }))
      });
    });
  }
}
