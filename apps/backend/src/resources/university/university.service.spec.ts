/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UniversityService } from './university.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateUniversityDto } from './dto/create-university.dto.js';
import type { UpdateUniversityDto } from './dto/update-university.dto.js';

describe('UniversityService', () => {
  let service: UniversityService;
  let prisma: PrismaService;

  const mockFindMany = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      university: {
        findMany: mockFindMany,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
      },
    } as unknown as PrismaService;

    service = new UniversityService(prisma);
  });

  describe('findAll', () => {
    it('should return universities without faculties', async () => {
      const mockData = [{ id: '1', name: 'Test Uni' }];
      mockFindMany.mockResolvedValue(mockData);

      const result = await service.findAll();

      expect(mockFindMany).toHaveBeenCalledWith({
        include: { faculties: false },
        orderBy: { name: 'asc' },
      });

      expect(result).toEqual(mockData);
    });
  });

  describe('findAllWithFaculties', () => {
    it('should return universities with faculties', async () => {
      const mockData = [{ id: '1', name: 'Test Uni', faculties: [{ id: 'f1' }] }];
      mockFindMany.mockResolvedValue(mockData);

      const result = await service.findAllWithFaculties();

      expect(mockFindMany).toHaveBeenCalledWith({
        include: { faculties: true },
        orderBy: { name: 'asc' },
      });

      expect(result).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('should create a university', async () => {
      const dto: CreateUniversityDto = { name: 'New Uni' } as any;
      const mockResult = { id: '1', ...dto };

      mockCreate.mockResolvedValue(mockResult);

      const result = await service.create(dto);

      expect(mockCreate).toHaveBeenCalledWith({
        data: dto,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update a university', async () => {
      const dto: UpdateUniversityDto = { name: 'Updated Uni' } as any;
      const mockResult = { id: '1', ...dto };

      mockUpdate.mockResolvedValue(mockResult);

      const result = await service.update('1', dto);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should delete a university', async () => {
      mockDelete.mockResolvedValue(undefined);

      await service.remove('1');

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
