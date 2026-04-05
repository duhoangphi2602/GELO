import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ScanModule } from './scan/scan.module';
import { AuthModule } from './auth/auth.module';
import { ResultModule } from './result/result.module';
import { DiaryModule } from './diary/diary.module';

@Module({
  imports: [PrismaModule, ScanModule, AuthModule, ResultModule, DiaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
