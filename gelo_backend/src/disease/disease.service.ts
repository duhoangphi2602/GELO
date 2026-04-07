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
    return (this.prisma.disease as any).create({
      data: {
        name: data.name,
        description: data.description,
        visualPattern: data.patterns, // Mapping frontend 'patterns' to 'visualPattern'
        hasBlister: data.hasBlister,
        hasScaling: data.hasScaling,
        status: 'active',
      },
    });
  }

  async update(id: number, data: any) {
    return (this.prisma.disease as any).update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        visualPattern: data.patterns,
        hasBlister: data.hasBlister,
        hasScaling: data.hasScaling,
        status: data.status,
      },
    });
  }

  async remove(id: number) {
    // Check for related records (rules, advices, etc.)
    // For now, we perform a simple delete or ideally a soft delete
    return this.prisma.disease.delete({
      where: { id },
    });
  }
}
