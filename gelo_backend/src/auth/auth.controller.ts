import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    // Nhận `identifier` (email hoặc username) và `password` từ frontend
    return this.authService.login(body.identifier, body.password);
  }

  @Post('seed')
  async seed() {
    return this.authService.seedDb();
  }
}
