/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UniversityController } from './university.controller.js';
import type { UniversityService } from './university.service.js';
import type { CreateUniversityDto } from './dto/create-university.dto.js';
import type { UpdateUniversityDto } from './dto/update-university.dto.js';

describe('UniversityController', () => {
  let controller: UniversityController;
  let service: UniversityService;

  const mockFindAll = vi.fn();
  const mockFindAllWithFaculties = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    service = {
      findAll: mockFindAll,
      findAllWithFaculties: mockFindAllWithFaculties,
      create: mockCreate,
      update: mockUpdate,
      remove: mockRemove,
    } as unknown as UniversityService;

    controller = new UniversityController(service);
  });

  describe('findAll', () => {
    it('should return universities without faculties', async () => {
      const mockData = [{ id: '1', name: 'Test Uni' }];
      mockFindAll.mockResolvedValue(mockData);

      const result = await controller.findAll();

      expect(mockFindAll).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('findAllWithFaculties', () => {
    it('should return universities with faculties', async () => {
      const mockData = [{ id: '1', name: 'Test Uni', faculties: [{ id: 'f1' }] }];
      mockFindAllWithFaculties.mockResolvedValue(mockData);

      const result = await controller.findAllWithFaculties();

      expect(mockFindAllWithFaculties).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateUniversityDto = { name: 'New Uni' } as any;
      const mockResult = { id: '1', ...dto };

      mockCreate.mockResolvedValue(mockResult);

      const result = await controller.create(dto);

      expect(mockCreate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateUniversityDto = { name: 'Updated Uni' } as any;
      const mockResult = { id: '1', ...dto };

      mockUpdate.mockResolvedValue(mockResult);

      const result = await controller.update('1', dto);

      expect(mockUpdate).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      mockRemove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(mockRemove).toHaveBeenCalledWith('1');
    });
  });
});
