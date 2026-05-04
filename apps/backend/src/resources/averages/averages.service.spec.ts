/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ONE_MONTH_CACHE_TTL } from '../../common/cache/cache-ttl.constants.js';

import { AveragesService } from './averages.service.js';

describe('AveragesService', () => {
  let service: AveragesService;
  let prisma: any;
  let cacheManager: any;

  const user = {
    id: 'user-1',
    creditProfile: {
      semesters: [{ id: 'semester-1' }],
    },
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
      },
    };

    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    service = new AveragesService(cacheManager, prisma);
  });

  it('returns the saved credit profile from DB and caches it', async () => {
    cacheManager.get.mockResolvedValue(null);
    prisma.user.findUniqueOrThrow.mockResolvedValue(user);

    const result = await service.findMine(user.id);

    expect(cacheManager.get).toHaveBeenCalledWith('averages_user-1');
    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: user.id },
      select: {
        id: true,
        creditProfile: true,
      },
    });
    expect(cacheManager.set).toHaveBeenCalledWith('averages_user-1', result, ONE_MONTH_CACHE_TTL);
    expect(result).toEqual({
      userId: user.id,
      data: user.creditProfile,
    });
  });

  it('returns a cached credit profile without querying DB', async () => {
    const cached = {
      userId: user.id,
      data: user.creditProfile,
    };
    cacheManager.get.mockResolvedValue(cached);

    const result = await service.findByUserId(user.id);

    expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(result).toEqual(cached);
  });

  it('saves raw JSON to the users creditProfile field and refreshes cache', async () => {
    const payload = {
      semesters: [
        {
          id: 'semester-1',
          courses: [{ name: 'Databases', code: 'BMEVITMAB04', credits: 5 }],
        },
      ],
    };

    prisma.user.update.mockResolvedValue({ ...user, creditProfile: payload });

    const result = await service.saveMine(user.id, payload);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { creditProfile: payload },
      select: {
        id: true,
        creditProfile: true,
      },
    });
    expect(cacheManager.set).toHaveBeenCalledWith('averages_user-1', result, ONE_MONTH_CACHE_TTL);
    expect(result.data).toEqual(payload);
  });

  it('rejects non-object credit profile payloads', async () => {
    await expect(service.saveMine(user.id, [])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.saveMine(user.id, null)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.saveMine(user.id, 'invalid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clears the users credit profile JSON and cache', async () => {
    prisma.user.update.mockResolvedValue({ ...user, creditProfile: {} });

    await service.deleteMine(user.id);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { creditProfile: {} },
    });
    expect(cacheManager.del).toHaveBeenCalledWith('averages_user-1');
  });

  it('clears a specific user cache entry', async () => {
    await service.clearCacheForUser(user.id);

    expect(cacheManager.del).toHaveBeenCalledWith('averages_user-1');
  });
});
