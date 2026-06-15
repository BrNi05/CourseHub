/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { IJwtPayload } from './interfaces.js';
import { AUTH_COOKIE_NAME, buildAuthCookieOptions } from './auth.constants.js';
import type { Response } from 'express';

describe('AuthService', () => {
  let service: AuthService;

  let mockJwtService: Partial<JwtService>;
  let mockConfigService: Partial<ConfigService>;
  let mockCacheManager: Partial<Cache>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockReturnValue('fake-secret'),
    };

    mockCacheManager = {
      set: vi.fn(),
      get: vi.fn(),
    };

    service = new AuthService(
      mockJwtService as JwtService,
      mockConfigService as ConfigService,
      mockCacheManager as Cache
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateJwtToken', () => {
    it('should call jwtService.sign with payload and secret', () => {
      const payload: IJwtPayload = { sub: '123', email: 'test@example.com', exp: 99999 };
      (mockJwtService.sign as any).mockReturnValue('signed-token');

      const token = service.generateJwtToken(payload);

      expect(token).toBe('signed-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'fake-secret',
        algorithm: 'HS384',
        jwtid: expect.any(String),
      });
    });
  });

  describe('blacklistToken', () => {
    it('should not attempt to cache if decode returns null', async () => {
      (mockJwtService.decode as any).mockReturnValue(null);
      await service.blacklistToken('invalid-token');
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should not attempt to cache if token lacks jti or exp', async () => {
      (mockJwtService.decode as any).mockReturnValue({ sub: '123' });
      await service.blacklistToken('token-no-jti');
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should not cache if the token is already naturally expired', async () => {
      const pastSeconds = Math.floor(Date.now() / 1000) - 1000;
      (mockJwtService.decode as any).mockReturnValue({ jti: 'id-1', exp: pastSeconds });

      await service.blacklistToken('expired-token');
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should cache the jti with correct ttl in milliseconds if valid', async () => {
      const futureSeconds = Math.floor(Date.now() / 1000) + 10;
      (mockJwtService.decode as any).mockReturnValue({ jti: 'id-2', exp: futureSeconds });

      await service.blacklistToken('valid-token');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'jwt:blacklist:id-2',
        true,
        expect.any(Number)
      );
    });
  });

  describe('setAuthCookie', () => {
    it('should write the auth cookie with the expected options', () => {
      const response = {
        cookie: vi.fn(),
      } as unknown as Response;

      service.setAuthCookie(response, 'jwt-token', false);

      expect(response.cookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        'jwt-token',
        buildAuthCookieOptions(false)
      );
    });
  });

  describe('clearAuthCookie', () => {
    it('should clear the auth cookie with the expected options', () => {
      const response = {
        clearCookie: vi.fn(),
      } as unknown as Response;

      service.clearAuthCookie(response, false);

      expect(response.clearCookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        buildAuthCookieOptions(false)
      );
    });
  });
});
