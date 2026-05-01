import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class AiIntegrationService {
  private readonly logger = new Logger(AiIntegrationService.name);
  private readonly aiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.apiKey = process.env.INTERNAL_API_KEY || '';
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 30000,
  ): Promise<T> {
    const url = `${this.aiUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Api-Key': this.apiKey,
      ...(options.headers || {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(
          `AI Service returned ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      this.logger.error(
        `AI Service request to ${endpoint} failed: ${error.message}`,
      );
      throw new ServiceUnavailableException(
        error.message?.includes('AI Service')
          ? error.message
          : 'Could not connect to AI Service',
      );
    }
  }
}
