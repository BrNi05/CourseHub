/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Cache } from 'cache-manager';
import { UserService } from './user.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { LoggerService } from '../../logger/logger.service.js';

describe('UserService', () => {
  let service: UserService;
  let prismaMock: any;
  let cacheMock: any;
  let loggerMock: any;

  const mockUser = {
    id: 'user1',
    name: 'Alice',
    isAdmin: false,
    pinnedCourses: [{ id: 'course1' }],
  };

  beforeEach(() => {
    cacheMock = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    const scopedLogger = {
      log: vi.fn(),
    };

    loggerMock = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
      scopedLogger,
    };

    prismaMock = {
      user: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      clientPing: {
        findMany: vi.fn(),
      },
    };

    service = new UserService(
      cacheMock as unknown as Cache,
      prismaMock as unknown as PrismaService,
      loggerMock as unknown as LoggerService
    );
  });

  describe('getAllUsers', () => {
    it('should return cached users if available (Cache Hit)', async () => {
      cacheMock.get.mockResolvedValue([mockUser]);

      const result = await service.getAllUsers();

      expect(result).toEqual([mockUser]);
      expect(cacheMock.get).toHaveBeenCalledWith('all_users_admin_nopinned');
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache result if cache is empty (Cache Miss)', async () => {
      cacheMock.get.mockResolvedValue(null);
      prismaMock.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.getAllUsers();

      expect(result).toEqual([mockUser]);
      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(cacheMock.set).toHaveBeenCalledWith('all_users_admin_nopinned', [mockUser], 0);
    });
  });

  describe('getUserById', () => {
    it('should return cached user if available (Cache Hit)', async () => {
      cacheMock.get.mockResolvedValue(mockUser);

      const result = await service.getUserById('user1');

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache result if cache is empty (Cache Miss)', async () => {
      cacheMock.get.mockResolvedValue(null);
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await service.getUserById('user1');

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: { pinnedCourses: true },
      });
      expect(cacheMock.set).toHaveBeenCalledWith('user_user1', mockUser, 0);
    });
  });

  describe('updateUser', () => {
    it('should update user and invalidate cache', async () => {
      const updateDto = { isAdmin: true, pinnedCourses: ['course1'] };
      const updatedUser = { ...mockUser, isAdmin: true };

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user1', updateDto);

      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: {
          isAdmin: true,
          pinnedCourses: { set: [{ id: 'course1' }] },
        },
        include: { pinnedCourses: true },
      });
      expect(cacheMock.del).toHaveBeenCalledWith('all_users_admin_nopinned');
      expect(cacheMock.del).toHaveBeenCalledWith('user_user1');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and invalidate cache', async () => {
      prismaMock.user.delete.mockResolvedValue(undefined);

      await service.deleteUser('user1');

      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'user1' } });
      expect(cacheMock.del).toHaveBeenCalledWith('all_users_admin_nopinned');
      expect(cacheMock.del).toHaveBeenCalledWith('user_user1');
    });
  });

  describe('resetAllUsersCache', () => {
    it('should invalidate all users cache and all user specific caches', async () => {
      const dbUsers = [{ id: 'user1' }, { id: 'user2' }];
      prismaMock.user.findMany.mockResolvedValue(dbUsers);

      await service.resetAllUsersCache();

      expect(cacheMock.del).toHaveBeenCalledWith('all_users_admin_nopinned');
      expect(cacheMock.del).toHaveBeenCalledWith('user_user1');
      expect(cacheMock.del).toHaveBeenCalledWith('user_user2');
    });
  });

  describe('handleUniversityChange', () => {
    it('should invalidate all users cache', async () => {
      const dbUsers = [
        { id: 'user1', pinnedCourses: [{ id: 'course1' }] },
        { id: 'user2', pinnedCourses: [{ id: 'course2' }] },
      ];
      prismaMock.user.findMany.mockResolvedValue(dbUsers);

      cacheMock.get.mockImplementation((key: string) => {
        if (key === 'user_user1') return Promise.resolve({ pinnedCourses: [{ id: 'course1' }] });
        if (key === 'user_user2') return Promise.resolve({ pinnedCourses: [{ id: 'courseX' }] });
        return Promise.resolve(null);
      });

      await service.handleUniversityChange();

      expect(cacheMock.del).toHaveBeenCalledWith('all_users_admin_nopinned');
      expect(cacheMock.del).toHaveBeenCalledWith('user_user2');
      expect(cacheMock.del).not.toHaveBeenCalledWith('user_user1');

      expect(loggerMock.scopedLogger.log).toHaveBeenCalledWith(
        'Invalidated all users cache due to university/faculty/course change.'
      );
    });
  });

  describe('removeInactiveUsers', () => {
    it('should remove inactive users who did not ping in the last year', async () => {
      const fixedNow = new Date('2025-02-19T12:00:00.000Z');
      vi.useFakeTimers().setSystemTime(fixedNow);

      const oneYearAgo = new Date(fixedNow);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      prismaMock.user.findMany.mockResolvedValue([
        { id: 'user1' },
        { id: 'user2' },
        { id: 'user3' },
      ]);

      prismaMock.clientPing.findMany.mockResolvedValue([{ userId: 'user3' }]);

      const deleteSpy = vi.spyOn(service, 'deleteUser').mockResolvedValue(undefined);

      await service.removeInactiveUsers();

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { updatedAt: { lt: oneYearAgo } },
        select: { id: true },
      });

      expect(prismaMock.clientPing.findMany).toHaveBeenCalledWith({
        where: { createdAt: { gte: oneYearAgo } },
        distinct: ['userId'],
        select: { userId: true },
      });

      expect(deleteSpy).toHaveBeenCalledTimes(2);
      expect(deleteSpy).toHaveBeenCalledWith('user1');
      expect(deleteSpy).toHaveBeenCalledWith('user2');
      expect(deleteSpy).not.toHaveBeenCalledWith('user3');
    });
  });
});
