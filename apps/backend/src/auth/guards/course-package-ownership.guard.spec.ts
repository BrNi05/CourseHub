/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../../logger/logger.service.js';

import { CoursePackageOwnershipGuard } from './course-package-ownership.guard.js';

describe('CoursePackageOwnershipGuard', () => {
  let guard: CoursePackageOwnershipGuard;
  let prisma: {
    coursePackage: {
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      coursePackage: {
        findUniqueOrThrow: vi.fn(),
      },
    };

    const logger = {
      forContext: () => ({
        warn: vi.fn(),
      }),
    } as unknown as LoggerService;

    guard = new CoursePackageOwnershipGuard(logger, prisma as any);
  });

  it('allows admins without ownership lookup', async () => {
    const context = createContext({
      params: { id: 'package-1' },
      user: { id: 'admin-1', googleEmail: 'admin@example.com', isAdmin: true },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.coursePackage.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('allows the owner of the course package', async () => {
    prisma.coursePackage.findUniqueOrThrow.mockResolvedValue({ ownerId: 'user-1' });

    const context = createContext({
      params: { id: 'package-1' },
      user: { id: 'user-1', googleEmail: 'user@example.com', isAdmin: false },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.coursePackage.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'package-1' },
      select: { ownerId: true },
    });
  });

  it('rejects authenticated users who do not own the course package', async () => {
    prisma.coursePackage.findUniqueOrThrow.mockResolvedValue({ ownerId: 'other-user' });

    const context = createContext({
      params: { id: 'package-1' },
      user: { id: 'user-1', googleEmail: 'user@example.com', isAdmin: false },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

function createContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
