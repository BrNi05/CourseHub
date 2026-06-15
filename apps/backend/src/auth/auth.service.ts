import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import type { Response } from 'express';
import { randomUUID, randomBytes, timingSafeEqual } from 'node:crypto';

import {
  buildAuthCookieOptions,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_MS_PROD,
  AUTH_COOKIE_MAX_AGE_MS_DEV,
  isProduction,
} from './auth.constants.js';
import { IJwtPayload } from './interfaces.js';
import { ContextualLogger, LoggerService } from '../logger/logger.service.js';

@Injectable()
export class AuthService {
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;
  private readonly logger: ContextualLogger;

  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    loggerService: LoggerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {
    this.jwtService = jwtService;
    this.configService = configService;
    this.logger = loggerService.forContext(AuthService.name);
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

  async generateAndSendAdminMfaToken(email: string, userId: string): Promise<boolean> {
    const token = randomBytes(32).toString('hex');
    const ttlMs = isProduction() ? AUTH_COOKIE_MAX_AGE_MS_PROD : AUTH_COOKIE_MAX_AGE_MS_DEV;

    await this.cacheManager.set(`mfa:user:${userId}`, token, ttlMs);

    const payload = {
      embeds: [
        {
          title: 'Admin MFA Token Generated',
          color: 0x007bff,
          fields: [
            { name: 'Admin', value: email, inline: true },
            { name: 'Token', value: `\`${token}\``, inline: false },
            { name: 'Expires', value: new Date(Date.now() + ttlMs).toISOString(), inline: true },
          ],
          footer: { text: 'Header: X-Admin-Api-Mfa.' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const webhookUrl = this.configService.get<string>('ADMIN_MFA_WEBHOOK_DISCORD_URL')!;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        this.logger.error(`Discord API returned status: ${response.status} ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'TimeoutError')
      ) {
        this.logger.error('Discord webhook fetch timed out during admin login.');
      } else {
        this.logger.error(
          'Failed to send MFA token to Discord webhook',
          error instanceof Error ? error.stack : String(error)
        );
      }
      return false;
    }
  }

  async verifyAdminMfaToken(userId: string, providedToken?: string | string[]): Promise<boolean> {
    if (!providedToken || typeof providedToken !== 'string') return false;

    if (providedToken.length !== 64) return false; // Prevent DoS by Buffer Allocation attacks

    const expectedToken = await this.cacheManager.get<string>(`mfa:user:${userId}`);
    if (!expectedToken) return false;

    const expectedBuffer = Buffer.from(expectedToken);
    const providedBuffer = Buffer.from(providedToken);

    if (expectedBuffer.length !== providedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, providedBuffer);
  }
}
