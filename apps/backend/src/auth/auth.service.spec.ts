/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import type { IJwtPayload } from './interfaces.js';
import { AUTH_COOKIE_NAME, buildAuthCookieOptions } from './auth.constants.js';
import type { Response } from 'express';

describe('AuthService', () => {
  let service: AuthService;

  let mockJwtService: Partial<JwtService>;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockReturnValue('fake-secret'),
    };

    service = new AuthService(mockJwtService as JwtService, mockConfigService as ConfigService);
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
      });
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
