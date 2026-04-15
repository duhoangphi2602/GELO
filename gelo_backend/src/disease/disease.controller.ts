import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DiseaseService } from './disease.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/auth.decorator';
import { UserRole } from '@prisma/client';

@Controller('diseases')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Get()
  async findAll() {
    return this.diseaseService.findAll();
  }

  @Post()
  async create(@Body() createDto: any) {
    return this.diseaseService.create(createDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.diseaseService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.diseaseService.remove(+id);
  }

  @Get(':id/advices')
  async getAdvices(@Param('id') id: string) {
    return this.diseaseService.getAdvices(+id);
  }

  @Post(':id/advices')
  async updateAdvices(@Param('id') id: string, @Body() advices: { type: string; title?: string; content: string }[]) {
    return this.diseaseService.updateAdvices(+id, advices);
  }
}
