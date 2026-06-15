/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../../logger/logger.service.js';
import type { AuthService } from '../auth.service.js';

import { CoursePackageOwnershipGuard } from './course-package-ownership.guard.js';

describe('CoursePackageOwnershipGuard', () => {
  let guard: CoursePackageOwnershipGuard;
  let logAdminOperation: ReturnType<typeof vi.fn>;
  let logger: {
    logAdminOperation: ReturnType<typeof vi.fn>;
    forContext: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    coursePackage: {
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
    };
  };
  let verifyAdminMfaToken: ReturnType<typeof vi.fn>;
  let authService: {
    verifyAdminMfaToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      coursePackage: {
        findUniqueOrThrow: vi.fn(),
      },
    };

    logAdminOperation = vi.fn();
    logger = {
      logAdminOperation,
      forContext: vi.fn().mockReturnValue({
        warn: vi.fn(),
      }),
    };

    verifyAdminMfaToken = vi.fn().mockResolvedValue(true);
    authService = {
      verifyAdminMfaToken,
    };

    guard = new CoursePackageOwnershipGuard(
      logger as unknown as LoggerService,
      prisma as any,
      authService as unknown as AuthService
    );
  });

  it('allows admins without ownership lookup and logs the admin operation if MFA is valid', async () => {
    const context = createContext({
      params: { id: 'package-1' },
      headers: { 'cf-connecting-ip': '203.0.113.14', 'x-admin-api-mfa': 'valid-mfa' },
      user: { id: 'admin-1', googleEmail: 'admin@example.com', isAdmin: true },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAdminMfaToken).toHaveBeenCalledWith('admin-1', 'valid-mfa');
    expect(prisma.coursePackage.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(logAdminOperation).toHaveBeenCalledWith(
      'CoursePackageOwnershipGuard Admin Override',
      true,
      '203.0.113.14',
      'Admin admin@example.com accessed course package package-1.'
    );
  });

  it('rejects admin override if MFA token is invalid or missing', async () => {
    verifyAdminMfaToken.mockResolvedValue(false);

    const context = createContext({
      params: { id: 'package-1' },
      headers: { 'cf-connecting-ip': '203.0.113.15', 'x-admin-api-mfa': 'invalid-mfa' },
      user: { id: 'admin-1', googleEmail: 'admin@example.com', isAdmin: true },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(verifyAdminMfaToken).toHaveBeenCalledWith('admin-1', 'invalid-mfa');
    expect(logAdminOperation).toHaveBeenCalledWith(
      'CoursePackageOwnershipGuard Admin Override',
      false,
      '203.0.113.15',
      'Admin admin@example.com failed MFA verification accessing course package package-1.'
    );
  });

  it('allows the owner of the course package', async () => {
    prisma.coursePackage.findUniqueOrThrow.mockResolvedValue({ ownerId: 'user-1' });

    const context = createContext({
      params: { id: 'package-1' },
      headers: { 'cf-connecting-ip': '203.0.113.16' },
      user: { id: 'user-1', googleEmail: 'user@example.com', isAdmin: false },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAdminMfaToken).not.toHaveBeenCalled();
    expect(prisma.coursePackage.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'package-1' },
      select: { ownerId: true },
    });
  });

  it('rejects authenticated users who do not own the course package', async () => {
    prisma.coursePackage.findUniqueOrThrow.mockResolvedValue({ ownerId: 'other-user' });

    const context = createContext({
      params: { id: 'package-1' },
      headers: { 'cf-connecting-ip': '203.0.113.17' },
      user: { id: 'user-1', googleEmail: 'user@example.com', isAdmin: false },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(verifyAdminMfaToken).not.toHaveBeenCalled();
  });
});

function createContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
