import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';

import { buildAuthCookieOptions, AUTH_COOKIE_NAME } from './auth.constants.js';
import { IJwtPayload } from './interfaces.js';

@Injectable()
export class AuthService {
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;

  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {
    this.jwtService = jwtService;
    this.configService = configService;
  }

  // Generate JWT token
  generateJwtToken(payload: IJwtPayload): string {
    const token = this.jwtService.sign(payload, {
      //expiresIn: '...', // would conflicts with manually set exp in GoogleStrategy
      secret: this.configService.get<string>('JWT_SECRET'),
      algorithm: 'HS384',
      jwtid: randomUUID(),
    });

    return token;
  }

  async blacklistToken(token: string): Promise<void> {
    const decoded = this.jwtService.decode(token) as IJwtPayload;

    if (!decoded?.jti || !decoded?.exp) return;

    const currentSeconds = Math.floor(Date.now() / 1000);
    const ttlSeconds = decoded.exp - currentSeconds; // Time until the token would naturally expire

    if (ttlSeconds > 0) {
      const redisKey = `jwt:blacklist:${decoded.jti}`;
      await this.cacheManager.set(redisKey, true, ttlSeconds * 1000);
    }
  }

  setAuthCookie(response: Response, token: string, isSecure: boolean): void {
    response.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions(isSecure));
  }

  clearAuthCookie(response: Response, isSecure: boolean): void {
    response.clearCookie(AUTH_COOKIE_NAME, buildAuthCookieOptions(isSecure));
  }
}
