import { NotFoundException } from '@nestjs/common';

export abstract class BaseService {
  /**
   * Helper to check if a record exists and throw a standard NotFoundException if not.
   * Usage: const user = await this.handleNotFound(this.prisma.user.findUnique({ where: { id } }), 'User not found');
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
   * Helper to handle pagination standard format
   */
  protected getPaginationParams(page?: number, limit?: number) {
    const parsedPage = Math.max(1, page || 1);
    const parsedLimit = Math.max(1, Math.min(limit || 10, 100)); // Max 100 per page

    return {
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    };
  }
}
