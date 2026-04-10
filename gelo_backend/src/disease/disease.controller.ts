import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DiseaseService } from './disease.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/auth.decorator';

@Controller('diseases')
@UseGuards(JwtAuthGuard)
@Roles('admin')
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
}
