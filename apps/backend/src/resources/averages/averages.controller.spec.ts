/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AveragesController } from './averages.controller.js';
import type { AveragesService } from './averages.service.js';
import type { AveragesCalculation } from './entity/average.entity.js';

describe('AveragesController', () => {
  let controller: AveragesController;
  let serviceMock: Partial<AveragesService>;

  const userId = 'user-1';
  const profile: AveragesCalculation = {
    userId,
    data: {
      semesters: [],
    },
  };

  beforeEach(() => {
    serviceMock = {
      findMine: vi.fn(),
      findByUserId: vi.fn(),
      saveMine: vi.fn(),
      deleteMine: vi.fn(),
      deleteForUser: vi.fn(),
      clearCacheForUser: vi.fn(),
    };

    controller = new AveragesController(serviceMock as AveragesService);
  });

  it('returns the authenticated users credit profile', async () => {
    (serviceMock.findMine as any).mockResolvedValue(profile);

    const result = await controller.findOwnCredits(userId);

    expect(serviceMock.findMine).toHaveBeenCalledWith(userId);
    expect(result).toEqual(profile);
  });

  it('returns a credit profile by user id for admins', async () => {
    (serviceMock.findByUserId as any).mockResolvedValue(profile);

    const result = await controller.findCreditsByUserId(userId);

    expect(serviceMock.findByUserId).toHaveBeenCalledWith(userId);
    expect(result).toEqual(profile);
  });

  it('updates the authenticated users credit profile from raw JSON', async () => {
    const payload = { semesters: [{ id: 'semester-2' }] };
    (serviceMock.saveMine as any).mockResolvedValue({ ...profile, data: payload });

    const result = await controller.updateOwnCredits(userId, payload);

    expect(serviceMock.saveMine).toHaveBeenCalledWith(userId, payload);
    expect(result.data).toEqual(payload);
  });

  it('deletes the authenticated users credit profile', async () => {
    (serviceMock.deleteMine as any).mockResolvedValue(undefined);

    await controller.deleteOwnCredits(userId);

    expect(serviceMock.deleteMine).toHaveBeenCalledWith(userId);
  });

  it('deletes a users credit profile for admins', async () => {
    (serviceMock.deleteForUser as any).mockResolvedValue(undefined);

    await controller.deleteCreditsByUserId(userId);

    expect(serviceMock.deleteForUser).toHaveBeenCalledWith(userId);
  });

  it('clears a users credit profile cache for admins', async () => {
    (serviceMock.clearCacheForUser as any).mockResolvedValue(undefined);

    await controller.deleteCreditsCacheByUserId(userId);

    expect(serviceMock.clearCacheForUser).toHaveBeenCalledWith(userId);
  });
});
