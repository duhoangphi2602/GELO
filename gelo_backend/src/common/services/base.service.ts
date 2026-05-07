import { NotFoundException, BadRequestException } from '@nestjs/common';

export abstract class BaseService {
  /**
   * Helper to check if a record exists and throw a standard NotFoundException if not.
   */
  protected async handleNotFound<T>(
    query: Promise<T | null>,
    message: string = 'Resource not found',
  ): Promise<T> {
    const result = await query;
    if (!result) {
      throw new NotFoundException(message);
    }
    return result;
  }

  /**
   * Normalize input strings (trim and lowercase for emails, trim for others)
   */
  protected normalize(value: string | undefined, lowercase = false): string {
    if (!value) return '';
    const trimmed = value.trim();
    return lowercase ? trimmed.toLowerCase() : trimmed;
  }

  /**
   * Helper to handle pagination standard format
   */
  protected getPaginationParams(page?: number, limit?: number) {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(Number(limit) || 10, 100));

    return {
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    };
  }
}
