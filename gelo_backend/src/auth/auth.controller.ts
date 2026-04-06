import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    // Gọi từ giao diện Registration lúc user bấm Đăng ký
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    // Gọi từ giao diện Registration lúc user bấm Đăng nhập
    return this.authService.login(body.email, body.password);
  }
}
