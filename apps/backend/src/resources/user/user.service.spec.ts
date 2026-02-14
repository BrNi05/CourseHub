/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './user.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

describe('UserService', () => {
  let service: UserService;
  let prismaMock: Partial<PrismaService>;

  const mockUser = {
    id: 'user1',
    name: 'Alice',
    isAdmin: false,
    pinnedCourses: [{ id: 'course1' }],
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      } as any,
    } as any;

    service = new UserService(prismaMock as PrismaService);
  });

  describe('getAllUsers', () => {
    it('should return all users without pinned courses', async () => {
      (prismaMock.user!.findMany as any).mockResolvedValue([mockUser]);

      const result = await service.getAllUsers();

      expect(prismaMock.user!.findMany).toHaveBeenCalledWith({ include: { pinnedCourses: false } });
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id including pinned courses', async () => {
      (prismaMock.user!.findUniqueOrThrow as any).mockResolvedValue(mockUser);

      const result = await service.getUserById('user1');

      expect(prismaMock.user!.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: { pinnedCourses: true },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update a user with pinned courses', async () => {
      const updateDto = { isAdmin: true, pinnedCourses: ['course1', 'course2'] };
      const updatedUser = {
        ...mockUser,
        isAdmin: true,
        pinnedCourses: [{ id: 'course1' }, { id: 'course2' }],
      };

      (prismaMock.user!.update as any).mockResolvedValue(updatedUser);

      const result = await service.updateUser('user1', updateDto);

      expect(prismaMock.user!.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: {
          isAdmin: true,
          pinnedCourses: { set: [{ id: 'course1' }, { id: 'course2' }] },
        },
        include: { pinnedCourses: true },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update a user without changing pinned courses if not provided', async () => {
      const updateDto = { isAdmin: true };
      const updatedUser = { ...mockUser, isAdmin: true };

      (prismaMock.user!.update as any).mockResolvedValue(updatedUser);

      const result = await service.updateUser('user1', updateDto);

      expect(prismaMock.user!.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { isAdmin: true, pinnedCourses: undefined },
        include: { pinnedCourses: true },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user by id', async () => {
      (prismaMock.user!.delete as any).mockResolvedValue(undefined);

      await service.deleteUser('user1');

      expect(prismaMock.user!.delete).toHaveBeenCalledWith({ where: { id: 'user1' } });
    });
  });
});
