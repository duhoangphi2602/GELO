import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RuleService } from './rule.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/auth.decorator';

@Controller('rules')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  // Admin: danh sách rules đầy đủ
  @Get()
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const questions: any = await this.ruleService.getAllRules();
    return questions.map((q: any) => {
      const rule = q.rules[0];
      return {
        id: q.id,
        question: q.questionText,
        expectedAnswer: rule ? (rule.expectedAnswer ? 'Yes' : 'No') : 'Yes',
        weight: rule ? rule.weight : 0,
        diseaseCategory: rule?.disease?.name || 'Unknown',
        active: q.isActive,
      };
    });
  }

  // Patient: chỉ lấy câu hỏi active (cho survey scan)
  @Get('active')
  @UseGuards(JwtAuthGuard)
  async findActive() {
    return this.ruleService.getActiveQuestions();
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async create(@Body() createRuleDto: any) {
    return this.ruleService.createRule(createRuleDto);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.ruleService.updateRule(+id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.ruleService.deleteRule(+id);
  }
}
