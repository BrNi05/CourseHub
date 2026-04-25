/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CoursePackageService } from './course-package.service.js';
import type { LoggerService } from '../../logger/logger.service.js';

describe('CoursePackageService', () => {
  let service: CoursePackageService;
  let prisma: any;
  let loggerService: Pick<LoggerService, 'forContext'>;
  let contextualLogger: { log: ReturnType<typeof vi.fn> };

  const ownerUserId = 'user-1';

  beforeEach(() => {
    prisma = {
      coursePackage: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    contextualLogger = {
      log: vi.fn(),
    };

    loggerService = {
      forContext: vi
        .fn()
        .mockReturnValue(contextualLogger) as unknown as LoggerService['forContext'],
    };

    service = new CoursePackageService(prisma, loggerService as LoggerService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a package for the authenticated owner, connects courses, and clears query cache', async () => {
    const dto = {
      name: 'My Package',
      description: 'Helpful selection',
      facultyId: 'faculty-1',
      courseIds: ['course-1', 'course-2'],
    };
    const createdPackage = { id: 'package-1', ...dto, ownerId: ownerUserId };
    const clearSpy = vi.spyOn(service, 'clearSearchQueryCache');

    prisma.coursePackage.create.mockResolvedValue(createdPackage);

    const result = await service.create(ownerUserId, dto);

    expect(prisma.coursePackage.create).toHaveBeenCalledWith({
      data: {
        name: dto.name,
        description: dto.description,
        facultyId: dto.facultyId,
        ownerId: ownerUserId,
        isPermanent: false,
        courses: {
          connect: [{ id: 'course-1' }, { id: 'course-2' }],
        },
      },
      include: { courses: true, faculty: true },
    });
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(createdPackage);
  });

  it('returns packages owned by a user with relations included', async () => {
    prisma.coursePackage.findMany.mockResolvedValue([{ id: 'package-1' }]);

    const result = await service.findMine(ownerUserId);

    expect(prisma.coursePackage.findMany).toHaveBeenCalledWith({
      where: { ownerId: ownerUserId },
      include: { courses: true, faculty: true },
      orderBy: { updatedAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'package-1' }]);
  });

  it('combines search filters when searching packages', async () => {
    prisma.coursePackage.findMany.mockResolvedValue([{ id: 'package-1' }]);

    const result = await service.search({
      universityId: 'university-1',
      facultyId: 'faculty-1',
      nameQuery: 'spring',
    });

    expect(prisma.coursePackage.findMany).toHaveBeenCalledWith({
      where: {
        facultyId: 'faculty-1',
        faculty: { universityId: 'university-1' },
        name: {
          contains: 'spring',
          mode: 'insensitive',
        },
      },
      include: { courses: true, faculty: true },
      orderBy: { name: 'asc' },
      take: 30,
    });
    expect(result).toEqual([{ id: 'package-1' }]);
  });

  it('returns cached search results for equivalent queries', async () => {
    const packages = [{ id: 'package-1', name: 'Spring Pack' }];

    prisma.coursePackage.findMany.mockResolvedValue(packages);

    const firstResult = await service.search({
      universityId: 'university-1',
      facultyId: 'faculty-1',
      nameQuery: 'Spring',
    });
    const secondResult = await service.search({
      facultyId: 'faculty-1',
      nameQuery: 'spring',
      universityId: 'university-1',
    });

    expect(prisma.coursePackage.findMany).toHaveBeenCalledTimes(1);
    expect(secondResult).toBe(firstResult);
  });

  it('returns a package by id with relations included', async () => {
    prisma.coursePackage.findUniqueOrThrow.mockResolvedValue({ id: 'package-1' });

    const result = await service.findById('package-1');

    expect(prisma.coursePackage.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'package-1' },
      include: { courses: true, faculty: true },
    });
    expect(result).toEqual({ id: 'package-1' });
  });

  it('allows owners to update their packages, replace course connections, and clear query cache', async () => {
    const clearSpy = vi.spyOn(service, 'clearSearchQueryCache');

    prisma.coursePackage.update.mockResolvedValue({ id: 'package-1', name: 'Updated Package' });

    const result = await service.update('package-1', {
      name: 'Updated Package',
      courseIds: ['course-3', 'course-4'],
    });

    expect(prisma.coursePackage.update).toHaveBeenCalledWith({
      where: { id: 'package-1' },
      data: {
        name: 'Updated Package',
        description: undefined,
        facultyId: undefined,
        courses: {
          set: [{ id: 'course-3' }, { id: 'course-4' }],
        },
      },
      include: { courses: true, faculty: true },
    });
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'package-1', name: 'Updated Package' });
  });

  it('updates the permanent flag through the dedicated admin path and clears query cache', async () => {
    const clearSpy = vi.spyOn(service, 'clearSearchQueryCache');

    prisma.coursePackage.update.mockResolvedValue({ id: 'package-1', isPermanent: true });

    const result = await service.setPermanent('package-1', true);

    expect(prisma.coursePackage.update).toHaveBeenCalledWith({
      where: { id: 'package-1' },
      data: { isPermanent: true },
      include: { courses: true, faculty: true },
    });
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'package-1', isPermanent: true });
  });

  it('deletes a package by id and clears query cache', async () => {
    const clearSpy = vi.spyOn(service, 'clearSearchQueryCache');

    prisma.coursePackage.delete.mockResolvedValue(undefined);

    await service.remove('package-1');

    expect(prisma.coursePackage.delete).toHaveBeenCalledWith({
      where: { id: 'package-1' },
    });
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('marks a package as used by updating lastUsedAt and clears query cache', async () => {
    const clearSpy = vi.spyOn(service, 'clearSearchQueryCache');

    prisma.coursePackage.update.mockResolvedValue({ id: 'package-1' });

    await service.markAsUsed('package-1');

    expect(prisma.coursePackage.update).toHaveBeenCalledTimes(1);
    expect(prisma.coursePackage.update.mock.calls[0][0].where).toEqual({ id: 'package-1' });
    expect(prisma.coursePackage.update.mock.calls[0][0].data.lastUsedAt).toBeInstanceOf(Date);
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('clears the in-memory query cache when requested directly', async () => {
    prisma.coursePackage.findMany.mockResolvedValue([{ id: 'package-1' }]);

    await service.search({ facultyId: 'faculty-1', nameQuery: 'spring' });
    service.clearSearchQueryCache();
    await service.search({ facultyId: 'faculty-1', nameQuery: 'spring' });

    expect(prisma.coursePackage.findMany).toHaveBeenCalledTimes(2);
  });

  it('deletes inactive non-permanent packages and clears search cache when anything was deleted', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

    const clearSpy = vi.spyOn(service, 'clearSearchQueryCache');
    prisma.coursePackage.deleteMany.mockResolvedValue({ count: 2 });

    await service.deleteInactiveNonPermanentPackages();

    expect(prisma.coursePackage.deleteMany).toHaveBeenCalledWith({
      where: {
        isPermanent: false,
        lastUsedAt: { lt: new Date('2025-04-23T00:00:00.000Z') },
      },
    });
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(contextualLogger.log).toHaveBeenCalledWith(
      'Deleted 2 inactive non-permanent course packages.'
    );
  });

  it('keeps search cache intact when inactive cleanup deletes nothing', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

    const clearSpy = vi.spyOn(service, 'clearSearchQueryCache');
    prisma.coursePackage.deleteMany.mockResolvedValue({ count: 0 });

    await service.deleteInactiveNonPermanentPackages();

    expect(clearSpy).not.toHaveBeenCalled();
    expect(contextualLogger.log).toHaveBeenCalledWith(
      'Deleted 0 inactive non-permanent course packages.'
    );
  });
});
