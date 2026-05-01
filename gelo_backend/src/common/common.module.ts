import { Global, Module } from '@nestjs/common';
import { AiIntegrationService } from './services/ai-integration.service';

@Global()
@Module({
  providers: [AiIntegrationService],
  exports: [AiIntegrationService],
})
export class CommonModule {}
