import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

/**
 * @CurrentUser() — Lấy user từ JWT token (đã verify).
 *
 * Usage trong controller:
 *   @Get('me')
 *   getProfile(@CurrentUser() user: { accountId: number; role: string; patientId: number }) {
 *     return user;
 *   }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Nếu truyền field cụ thể: @CurrentUser('patientId')
    if (data) {
      return user?.[data];
    }

    return user;
  },
);

/**
 * @Roles('admin') — Đánh dấu route chỉ cho phép role cụ thể.
 * 
 * Kết hợp với JwtAuthGuard để enforce.
 *
 * Usage:
 *   @Roles('admin')
 *   @UseGuards(JwtAuthGuard)
 *   @Get('admin/patients')
 *   getPatients() { ... }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
