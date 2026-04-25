/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FacultyService } from './faculty.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateFacultyDto } from './dto/create-faculty.dto.js';
import type { UpdateFacultyDto } from './dto/update-faculty.dto.js';

describe('FacultyService', () => {
  let service: FacultyService;
  let prisma: PrismaService;
  let eventEmitter: any;
  let cacheManager: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  const mockFindMany = vi.fn();
  const mockFindUniqueOrThrow = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEmitAsync = vi.fn();
  const mockCacheGet = vi.fn();
  const mockCacheSet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      faculty: {
        findMany: mockFindMany,
        findUniqueOrThrow: mockFindUniqueOrThrow,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
      },
    } as unknown as PrismaService;

    eventEmitter = { emitAsync: mockEmitAsync };
    cacheManager = {
      get: mockCacheGet,
      set: mockCacheSet,
    };

    service = new FacultyService(cacheManager as any, prisma, eventEmitter);
  });

  describe('getAllByUniversity', () => {
    it('should return faculties without courses for a university', async () => {
      const mockData = [{ id: 'f1', name: 'Faculty A', universityId: 'u1' }];
      mockCacheGet.mockResolvedValue(undefined);
      mockFindMany.mockResolvedValue(mockData);

      const result = await service.getAllByUniversity('u1');

      expect(mockCacheGet).toHaveBeenCalledWith('faculties_by_university_u1');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { universityId: 'u1' },
        include: { courses: false },
        orderBy: { name: 'asc' },
      });
      expect(mockCacheSet).toHaveBeenCalledWith('faculties_by_university_u1', mockData, 86400000);
      expect(result).toEqual(mockData);
    });

    it('should return empty array if no faculties exist', async () => {
      mockCacheGet.mockResolvedValue(undefined);
      mockFindMany.mockResolvedValue([]);

      const result = await service.getAllByUniversity('u2');

      expect(mockCacheSet).toHaveBeenCalledWith('faculties_by_university_u2', [], 86400000);
      expect(result).toEqual([]);
    });

    it('should return cached faculties without querying prisma', async () => {
      const cachedData = [{ id: 'f3', name: 'Faculty C', universityId: 'u3' }];
      mockCacheGet.mockResolvedValue(cachedData);

      const result = await service.getAllByUniversity('u3');

      expect(mockCacheGet).toHaveBeenCalledWith('faculties_by_university_u3');
      expect(mockFindMany).not.toHaveBeenCalled();
      expect(mockCacheSet).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });
  });

  describe('getOne', () => {
    it('should return a faculty without courses', async () => {
      const mockData = { id: 'f1', name: 'Faculty A', universityId: 'u1' };
      mockFindUniqueOrThrow.mockResolvedValue(mockData);

      const result = await service.getOne('f1');

      expect(mockFindUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'f1' },
        include: { courses: false },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('getOneWithCourses', () => {
    it('should return a faculty with courses', async () => {
      const mockData = { id: 'f1', name: 'Faculty A', courses: [{ id: 'c1' }] };
      mockFindUniqueOrThrow.mockResolvedValue(mockData);

      const result = await service.getOneWithCourses('f1');

      expect(mockFindUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'f1' },
        include: { courses: true },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('should create a new faculty', async () => {
      const dto: CreateFacultyDto = { name: 'Faculty B', universityId: 'u1' } as any;
      const mockResult = { id: 'f2', ...dto };

      mockCreate.mockResolvedValue(mockResult);

      const result = await service.create(dto);

      expect(mockCreate).toHaveBeenCalledWith({ data: dto });
      expect(mockEmitAsync).toHaveBeenCalledWith('faculty.created');
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update an existing faculty', async () => {
      const dto: UpdateFacultyDto = { name: 'Updated Faculty' } as any;
      const mockResult = { id: 'f1', ...dto, courses: [] };

      mockUpdate.mockResolvedValue(mockResult);

      const result = await service.update('f1', dto);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: dto,
        include: { courses: true },
      });
      expect(mockEmitAsync).toHaveBeenCalledWith('faculty.updated');
      expect(result).toEqual(mockResult);
    });

    it('should throw if faculty does not exist', async () => {
      mockUpdate.mockRejectedValue(new Error('Not found'));
      await expect(service.update('nonexistent', {} as any)).rejects.toThrow('Not found');
    });
  });

  describe('remove', () => {
    it('should delete a faculty by id and emit event', async () => {
      mockDelete.mockResolvedValue(undefined);

      await service.remove('f1');

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'f1' } });
      expect(mockEmitAsync).toHaveBeenCalledWith('faculty.deleted');
    });

    it('should propagate error if delete fails', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));
      await expect(service.remove('f1')).rejects.toThrow('Delete failed');
    });
  });
});
