import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ScanModule } from './scan/scan.module';
import { AuthModule } from './auth/auth.module';
import { ResultModule } from './result/result.module';
import { DiaryModule } from './diary/diary.module';
import { RuleModule } from './rule/rule.module';
import { DiseaseModule } from './disease/disease.module';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, 
    ScanModule, 
    AuthModule, 
    ResultModule, 
    DiaryModule, 
    RuleModule, 
    DiseaseModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
