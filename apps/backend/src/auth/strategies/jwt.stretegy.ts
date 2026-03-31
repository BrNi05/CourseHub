import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';

import { IAuthenticatedUser, IJwtPayload } from '../interfaces.js';
import { AUTH_COOKIE_NAME } from '../auth.constants.js';
import { PrismaService } from '../../prisma/prisma.service.js';

function extractJwtFromCookie(request: Request | undefined): string | null {
  const token = request?.cookies?.[AUTH_COOKIE_NAME];
  return typeof token === 'string' ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService
  ) {
    super({
      jwtFromRequest: extractJwtFromCookie,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
      algorithms: ['HS384'],
    });
  }

  // Assigned to req.user on successful Jwt auth
  async validate(payload: IJwtPayload): Promise<IAuthenticatedUser> {
    // If a user is deleted but their JWT is still valid, this will throw acting as a gateway
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });

    return {
      id: user.id,
      googleEmail: user.googleEmail,
      isAdmin: user.isAdmin,
    };
  }
}
