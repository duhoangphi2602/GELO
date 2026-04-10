import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import * as dotenv from 'dotenv';
dotenv.config();

export interface JwtPayload {
  sub: number;       // account.id
  role: string;      // 'patient' | 'admin'
  patientId: number; // patient.id
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
    });
  }

  /**
   * Passport gọi hàm này sau khi verify token thành công.
   * Giá trị trả về sẽ được gắn vào request.user
   */
  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      accountId: payload.sub,
      role: payload.role,
      patientId: payload.patientId,
    };
  }
}
