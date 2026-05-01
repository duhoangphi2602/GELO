import { Module } from '@nestjs/common';
import { AdminDashboardService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  providers: [AdminDashboardService],
})
export class AdminModule {}
