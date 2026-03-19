/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UniversityController } from './university.controller.js';
import type { UniversityService } from './university.service.js';
import type { CreateUniversityDto } from './dto/create-university.dto.js';
import type { UpdateUniversityDto } from './dto/update-university.dto.js';
import { HEADERS_METADATA } from '@nestjs/common/constants.js';

describe('UniversityController', () => {
  let controller: UniversityController;
  let serviceMock: Partial<UniversityService>;

  const mockFindAll = vi.fn();
  const mockFindOne = vi.fn();
  const mockFindAllWithFaculties = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    serviceMock = {
      findAll: mockFindAll,
      findOne: mockFindOne,
      findAllWithFaculties: mockFindAllWithFaculties,
      create: mockCreate,
      update: mockUpdate,
      remove: mockRemove,
      resetAllCache: vi.fn().mockResolvedValue(undefined),
    };

    controller = new UniversityController(serviceMock as UniversityService);
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

  it('findAll() sets a 1 day Cache-Control header', () => {
    const headers = Reflect.getMetadata(
      HEADERS_METADATA,
      UniversityController.prototype.findAll
    ) as Array<{
      name: string;
      value: string;
    }>;

    expect(headers).toContainEqual({
      name: 'Cache-Control',
      value: 'public, max-age=86400',
    });
  });

  describe('findOne', () => {
    it('should return one university without faculties', async () => {
      const mockData = { id: '1', name: 'Test Uni', abbrevName: 'TU' };
      mockFindOne.mockResolvedValue(mockData);

      const result = await controller.findOne('1');

      expect(mockFindOne).toHaveBeenCalledWith('1');
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

  describe('deleteAll-cache', () => {
    it('should call resetAllUniversityCache and return void', async () => {
      const result = await controller.deleteAll();

      expect(serviceMock.resetAllCache).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
