import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RuleService {
  constructor(private prisma: PrismaService) {}

  async getAllRules() {
    // Fetch all questions and their associated rules
    return this.prisma.diagnosticQuestion.findMany({
      include: {
        rules: {
          include: {
            disease: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async getActiveQuestions() {
    // Fetch only active questions for patients
    return (this.prisma.diagnosticQuestion as any).findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async createRule(data: { question: string; diseaseCategory: string; expectedAnswer: string; weight: number; isEmergency?: boolean }) {
    // 1. Find the disease by name (since the user selects from existing diseases)
    let disease = await this.prisma.disease.findFirst({
      where: { name: data.diseaseCategory },
    });

    // Fallback if not found (shouldn't happen with the new frontend logic)
    if (!disease) {
      disease = await this.prisma.disease.create({
        data: { name: data.diseaseCategory },
      });
    }

    // 2. Create the question with emergency flag
    const question = await (this.prisma.diagnosticQuestion as any).create({
      data: {
        questionText: data.question,
        isActive: true,
        isEmergency: data.isEmergency ?? false,
      },
    });

    // 3. Create the rule link
    return (this.prisma.diseaseRule as any).create({
      data: {
        diseaseId: disease.id,
        questionId: question.id,
        expectedAnswer: data.expectedAnswer === 'Yes',
        weight: data.weight,
        isActive: true,
      },
    });
  }

  async updateRule(id: number, data: any) {
    // Patching logic
    const updateData: any = {};
    if (data.active !== undefined) updateData.isActive = data.active;
    if (data.question !== undefined) updateData.questionText = data.question;
    if (data.isEmergency !== undefined) updateData.isEmergency = data.isEmergency;

    if (Object.keys(updateData).length > 0) {
      await (this.prisma.diagnosticQuestion as any).update({
        where: { id },
        data: updateData,
      });

      // If toggling active status, also update associated disease rules
      if (data.active !== undefined) {
        await (this.prisma.diseaseRule as any).updateMany({
          where: { questionId: id },
          data: { isActive: data.active },
        });
      }
    }
    
    return { success: true };
  }

  async deleteRule(id: number) {
    // First delete associated rules
    await this.prisma.diseaseRule.deleteMany({
      where: { questionId: id },
    });
    
    // Then delete the question
    return this.prisma.diagnosticQuestion.delete({
      where: { id },
    });
  }
}
