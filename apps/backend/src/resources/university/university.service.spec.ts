/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UniversityService } from './university.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateUniversityDto } from './dto/create-university.dto.js';
import type { UpdateUniversityDto } from './dto/update-university.dto.js';

describe('UniversityService', () => {
  let service: UniversityService;
  let prisma: any;
  let cacheManager: any;
  let eventEmitter: any;

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      university: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaService;

    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    eventEmitter = {
      emitAsync: vi.fn(),
    };

    service = new UniversityService(cacheManager, prisma, eventEmitter);
  });

  describe('findAll', () => {
    it('should return universities from cache if available', async () => {
      const cached = [{ id: '1', name: 'Cached Uni' }];
      cacheManager.get.mockResolvedValue(cached);

      const result = await service.findAll();

      expect(cacheManager.get).toHaveBeenCalledWith('all_universities_nofaculties');
      expect(prisma.university.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('should query DB and cache result if not cached', async () => {
      const dbData = [{ id: '1', name: 'DB Uni' }];
      cacheManager.get.mockResolvedValue(null);
      prisma.university.findMany.mockResolvedValue(dbData);

      const result = await service.findAll();

      expect(prisma.university.findMany).toHaveBeenCalledWith({
        include: { faculties: false },
        orderBy: { name: 'asc' },
      });

      expect(cacheManager.set).toHaveBeenCalledWith('all_universities_nofaculties', dbData);
      expect(result).toEqual(dbData);
    });
  });

  describe('findAllWithFaculties', () => {
    it('should return universities from cache if available', async () => {
      const cached = [{ id: '1', name: 'Cached Uni', faculties: [] }];
      cacheManager.get.mockResolvedValue(cached);

      const result = await service.findAllWithFaculties();

      expect(cacheManager.get).toHaveBeenCalledWith('all_universities_withfaculties');
      expect(prisma.university.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('should query DB and cache result if not cached', async () => {
      const dbData = [{ id: '1', name: 'DB Uni', faculties: [] }];
      cacheManager.get.mockResolvedValue(null);
      prisma.university.findMany.mockResolvedValue(dbData);

      const result = await service.findAllWithFaculties();

      expect(prisma.university.findMany).toHaveBeenCalledWith({
        include: { faculties: true },
        orderBy: { name: 'asc' },
      });

      expect(cacheManager.set).toHaveBeenCalledWith('all_universities_withfaculties', dbData);
      expect(result).toEqual(dbData);
    });
  });

  describe('create', () => {
    it('should clear caches and create a university', async () => {
      const dto: CreateUniversityDto = { name: 'New Uni' } as any;
      const created = { id: '1', ...dto };

      cacheManager.del.mockResolvedValue(undefined);
      prisma.university.create.mockResolvedValue(created);

      const result = await service.create(dto);

      // Cache cleared
      expect(cacheManager.del).toHaveBeenCalledWith('all_universities_nofaculties');
      expect(cacheManager.del).toHaveBeenCalledWith('all_universities_withfaculties');

      expect(prisma.university.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should clear caches and update a university', async () => {
      const dto: UpdateUniversityDto = { name: 'Updated Uni' } as any;
      const updated = { id: '1', ...dto };

      cacheManager.del.mockResolvedValue(undefined);
      prisma.university.update.mockResolvedValue(updated);

      const result = await service.update('1', dto);

      expect(cacheManager.del).toHaveBeenCalledWith('all_universities_nofaculties');
      expect(cacheManager.del).toHaveBeenCalledWith('all_universities_withfaculties');

      expect(prisma.university.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });

      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should clear caches, delete university, and emit event', async () => {
      cacheManager.del.mockResolvedValue(undefined);
      prisma.university.delete.mockResolvedValue(undefined);
      eventEmitter.emitAsync.mockResolvedValue(undefined);

      await service.remove('1');

      expect(cacheManager.del).toHaveBeenCalledWith('all_universities_nofaculties');
      expect(cacheManager.del).toHaveBeenCalledWith('all_universities_withfaculties');

      expect(prisma.university.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith('university.deleted');
    });
  });

  describe('resetAllCache', () => {
    it('should delete both caches', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      await service.resetAllCache();

      expect(cacheManager.del).toHaveBeenCalledWith('all_universities_nofaculties');
      expect(cacheManager.del).toHaveBeenCalledWith('all_universities_withfaculties');
    });
  });
});
