import { Module } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { DiagnosticEngineService } from './diagnostic-engine.service';

@Module({
  controllers: [ScanController],
  providers: [ScanService, DiagnosticEngineService],
})
export class ScanModule {}
