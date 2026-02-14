import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserController } from './user.controller.js';
import type { UserService } from './user.service.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { UpdatePinnedCoursesDto } from './dto/update-pinned.dto.js';

describe('UserController', () => {
  let controller: UserController;
  let serviceMock: Partial<UserService>;

  const mockUser = {
    id: 'user1',
    name: 'Alice',
    isAdmin: false,
    pinnedCourses: [{ id: 'course1' }],
  };

  const mockUsers = [
    { id: 'user1', name: 'Alice', isAdmin: false },
    { id: 'user2', name: 'Bob', isAdmin: true },
  ];

  beforeEach(() => {
    serviceMock = {
      getAllUsers: vi.fn().mockResolvedValue(mockUsers),
      getUserById: vi.fn().mockResolvedValue(mockUser),
      updateUser: vi.fn().mockResolvedValue(mockUser),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    };

    controller = new UserController(serviceMock as UserService);
  });

  describe('readAll', () => {
    it('should return all users without pinned courses', async () => {
      const result = await controller.readAll();

      expect(serviceMock.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('readOne', () => {
    it('should return a single user by id', async () => {
      const result = await controller.readOne('user1');

      expect(serviceMock.getUserById).toHaveBeenCalledWith('user1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updatePinnedCourses', () => {
    it('should update pinned courses of a user', async () => {
      const dto: UpdatePinnedCoursesDto = { pinnedCourses: ['course1', 'course2'] };
      const result = await controller.updatePinnedCourses('user1', dto);

      expect(serviceMock.updateUser).toHaveBeenCalledWith('user1', dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user (admin operation)', async () => {
      const dto: UpdateUserDto = { isAdmin: true, pinnedCourses: ['course1'] };
      const result = await controller.update('user1', dto);

      expect(serviceMock.updateUser).toHaveBeenCalledWith('user1', dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('should delete a user by id', async () => {
      await controller.delete('user1');

      expect(serviceMock.deleteUser).toHaveBeenCalledWith('user1');
    });
  });
});
