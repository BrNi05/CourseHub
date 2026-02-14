/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FacultyController } from './faculty.controller.js';
import type { FacultyService } from './faculty.service.js';
import type { CreateFacultyDto } from './dto/create-faculty.dto.js';
import type { UpdateFacultyDto } from './dto/update-faculty.dto.js';
import type { GetFacultiesQueryDto } from './dto/get-faculty.dto.js';

describe('FacultyController', () => {
  let controller: FacultyController;
  let service: FacultyService;

  const mockGetAllByUniversity = vi.fn();
  const mockGetOne = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    service = {
      getAllByUniversity: mockGetAllByUniversity,
      getOne: mockGetOne,
      create: mockCreate,
      update: mockUpdate,
      remove: mockRemove,
    } as unknown as FacultyService;

    controller = new FacultyController(service);
  });

  describe('getAll', () => {
    it('should return faculties without courses for a university', async () => {
      const query: GetFacultiesQueryDto = { universityId: 'u1' } as any;
      const mockData = [{ id: 'f1', name: 'Faculty A', universityId: 'u1' }];
      mockGetAllByUniversity.mockResolvedValue(mockData);

      const result = await controller.getAll(query);

      expect(mockGetAllByUniversity).toHaveBeenCalledWith('u1');
      expect(result).toEqual(mockData);
    });
  });

  describe('getOne', () => {
    it('should return a faculty with courses', async () => {
      const mockData = { id: 'f1', name: 'Faculty A', courses: [{ id: 'c1' }] };
      mockGetOne.mockResolvedValue(mockData);

      const result = await controller.getOne('f1');

      expect(mockGetOne).toHaveBeenCalledWith('f1');
      expect(result).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateFacultyDto = { name: 'Faculty B', universityId: 'u1' } as any;
      const mockResult = { id: 'f2', ...dto };
      mockCreate.mockResolvedValue(mockResult);

      const result = await controller.create(dto);

      expect(mockCreate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateFacultyDto = { name: 'Updated Faculty' } as any;
      const mockResult = { id: 'f1', ...dto, courses: [] };
      mockUpdate.mockResolvedValue(mockResult);

      const result = await controller.update('f1', dto);

      expect(mockUpdate).toHaveBeenCalledWith('f1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      mockRemove.mockResolvedValue(undefined);

      await controller.remove('f1');

      expect(mockRemove).toHaveBeenCalledWith('f1');
    });
  });
});
