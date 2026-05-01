import { Controller, Post, Body, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { CurrentUser } from './auth.decorator';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordVerifyDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.identifier, loginDto.password);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.code, dto.type);
  }

  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email, dto.type);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password-request')
  async changePasswordRequest(@CurrentUser('accountId') accountId: number) {
    return this.authService.changePasswordRequest(accountId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password-verify')
  async changePasswordVerify(
    @CurrentUser('accountId') accountId: number,
    @Body() dto: ChangePasswordVerifyDto,
  ) {
    return this.authService.changePasswordVerify(
      accountId,
      dto.code,
      dto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser('accountId') accountId: number) {
    return this.authService.getProfile(accountId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser('accountId') accountId: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(accountId, updateProfileDto);
  }
}
