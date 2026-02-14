import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { IJwtPayload } from './interfaces.js';

@Injectable()
export class AuthService {
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;

  constructor(jwtService: JwtService, configService: ConfigService) {
    this.jwtService = jwtService;
    this.configService = configService;
  }

  // Generate JWT token
  generateJwtToken(payload: IJwtPayload): string {
    const token = this.jwtService.sign(payload, {
      //expiresIn: '160d', // around a semester - conflicts with manually set exp in GoogleStrategy
      secret: this.configService.get<string>('JWT_SECRET'),
      algorithm: 'HS384',
    });

    return token;
  }
}
