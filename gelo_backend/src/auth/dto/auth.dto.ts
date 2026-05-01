import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 25, required: false })
  @IsInt()
  @Min(1)
  @Max(120)
  @IsOptional()
  age?: number;

  @ApiProperty({ enum: Gender, example: Gender.MALE, required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}

export class LoginDto {
  @ApiProperty({ example: 'johndoe', description: 'Can be username or email' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  username?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsInt()
  @Min(1)
  @Max(120)
  @IsOptional()
  age?: number;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(['REGISTER', 'FORGOT_PASSWORD', 'CHANGE_PASSWORD'])
  @IsNotEmpty()
  type: 'REGISTER' | 'FORGOT_PASSWORD' | 'CHANGE_PASSWORD';
}

export class ResendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(['REGISTER', 'FORGOT_PASSWORD', 'CHANGE_PASSWORD'])
  @IsNotEmpty()
  type: 'REGISTER' | 'FORGOT_PASSWORD' | 'CHANGE_PASSWORD';
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordVerifyDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
