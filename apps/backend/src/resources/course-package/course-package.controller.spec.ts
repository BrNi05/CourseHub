/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CoursePackageController } from './course-package.controller.js';
import type { CoursePackageService } from './course-package.service.js';
import type { CreateCoursePackageDto } from './dto/create-course-package.dto.js';
import type { SearchCoursePackageDto } from './dto/search-course-package.dto.js';
import type { SetCoursePackagePermanentDto } from './dto/set-course-package-permanent.dto.js';
import type { UpdateCoursePackageDto } from './dto/update-course-package.dto.js';
import type { CoursePackage } from './entity/course-package.entity.js';

describe('CoursePackageController', () => {
  let controller: CoursePackageController;
  let serviceMock: Partial<CoursePackageService>;
  const userId = 'user-1';

  const coursePackage: CoursePackage = {
    id: 'package-1',
    name: 'My Package',
    description: '',
    ownerId: userId,
    facultyId: 'faculty-1',
    isPermanent: false,
    lastUsedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    courses: [],
  };

  beforeEach(() => {
    serviceMock = {
      create: vi.fn(),
      findMine: vi.fn(),
      search: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      setPermanent: vi.fn(),
      clearSearchQueryCache: vi.fn(),
      remove: vi.fn(),
      markAsUsed: vi.fn(),
    };

    controller = new CoursePackageController(serviceMock as CoursePackageService);
  });

  it('creates a package for the authenticated user', async () => {
    const dto: CreateCoursePackageDto = {
      name: 'My Package',
      facultyId: 'faculty-1',
      courseIds: ['course-1'],
    };

    (serviceMock.create as any).mockResolvedValue(coursePackage);

    const result = await controller.create(userId, dto);

    expect(serviceMock.create).toHaveBeenCalledWith(userId, dto);
    expect(result).toEqual(coursePackage);
  });

  it('returns the authenticated user packages', async () => {
    (serviceMock.findMine as any).mockResolvedValue([coursePackage]);

    const result = await controller.findMine(userId);

    expect(serviceMock.findMine).toHaveBeenCalledWith(userId);
    expect(result).toEqual([coursePackage]);
  });

  it('searches packages with the query DTO', async () => {
    const query: SearchCoursePackageDto = { facultyId: 'faculty-1', nameQuery: 'package' };

    (serviceMock.search as any).mockResolvedValue([coursePackage]);

    const result = await controller.search(query);

    expect(serviceMock.search).toHaveBeenCalledWith(query);
    expect(result).toEqual([coursePackage]);
  });

  it('returns a single package by id', async () => {
    (serviceMock.findById as any).mockResolvedValue(coursePackage);

    const result = await controller.findOne(coursePackage.id);

    expect(serviceMock.findById).toHaveBeenCalledWith(coursePackage.id);
    expect(result).toEqual(coursePackage);
  });

  it('updates a package with authenticated user context', async () => {
    const dto: UpdateCoursePackageDto = { name: 'Updated Package' };
    const updatedCoursePackage = { ...coursePackage, name: 'Updated Package' };

    (serviceMock.update as any).mockResolvedValue(updatedCoursePackage);

    const result = await controller.update(coursePackage.id, dto);

    expect(serviceMock.update).toHaveBeenCalledWith(coursePackage.id, dto);
    expect(result).toEqual(updatedCoursePackage);
  });

  it('updates the permanent flag through the admin endpoint', async () => {
    const dto: SetCoursePackagePermanentDto = { isPermanent: true };
    const updatedCoursePackage = { ...coursePackage, isPermanent: true };

    (serviceMock.setPermanent as any).mockResolvedValue(updatedCoursePackage);

    const result = await controller.setPermanent(coursePackage.id, dto);

    expect(serviceMock.setPermanent).toHaveBeenCalledWith(coursePackage.id, true);
    expect(result).toEqual(updatedCoursePackage);
  });

  it('clears all course package search cache entries', () => {
    const result = controller.deleteAllCache();

    expect(serviceMock.clearSearchQueryCache).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('deletes a package by id', async () => {
    (serviceMock.remove as any).mockResolvedValue(undefined);

    await controller.remove(coursePackage.id);

    expect(serviceMock.remove).toHaveBeenCalledWith(coursePackage.id);
  });

  it('marks a package as used', async () => {
    (serviceMock.markAsUsed as any).mockResolvedValue(undefined);

    const result = await controller.markAsUsed(coursePackage.id);

    expect(serviceMock.markAsUsed).toHaveBeenCalledWith(coursePackage.id);
    expect(result).toBeUndefined();
  });
});
