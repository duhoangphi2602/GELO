import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './auth.decorator';

/**
 * JwtAuthGuard — Bảo vệ route bằng JWT token.
 *
 * Sử dụng:
 *   @UseGuards(JwtAuthGuard)        → yêu cầu đăng nhập
 *   @Roles('admin')                 → yêu cầu role admin
 *   @UseGuards(JwtAuthGuard)        → kết hợp cả hai
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Kiểm tra JWT token hợp lệ (Passport xử lý)
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    // 2. Kiểm tra role nếu có decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có @Roles() → chỉ cần đăng nhập là đủ
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Kiểm tra user có role phù hợp không
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const hasRole = requiredRoles.some(
      (role) => role.toUpperCase() === user.role.toUpperCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
