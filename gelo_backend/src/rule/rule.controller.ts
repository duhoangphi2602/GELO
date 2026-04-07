import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RuleService } from './rule.service';

@Controller('rules')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Get()
  async findAll() {
    // Basic mapping for RuleEngine UI structure
    const questions: any = await this.ruleService.getAllRules();
    return questions.map((q: any) => {
      const rule = q.rules[0]; // Take the first associated rule for simplified UI
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

  @Get('active')
  async findActive() {
    return this.ruleService.getActiveQuestions();
  }

  @Post()
  async create(@Body() createRuleDto: any) {
    return this.ruleService.createRule(createRuleDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.ruleService.updateRule(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ruleService.deleteRule(+id);
  }
}
