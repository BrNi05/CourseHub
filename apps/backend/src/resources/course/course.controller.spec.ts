/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { CourseController } from './course.controller.js';
import type { CourseService } from './course.service.js';
import { ConflictException, BadRequestException } from '@nestjs/common';
import type { CreateCourseDto } from './dto/create-course.dto.js';
import type { UpdateCourseDto } from './dto/update-course.dto.js';
import type { CourseQueryDto } from './dto/query-course.dto.js';
import type { Course } from './entity/course.entity.js';

describe('CourseController', () => {
  let controller: CourseController;
  let serviceMock: Partial<CourseService>;

  beforeEach(() => {
    serviceMock = {
      findById: vi.fn(),
      findByQuery: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      clearSearchQueryCache: vi.fn(),
    };

    controller = new CourseController(serviceMock as CourseService);
  });

  describe('search', () => {
    it('should call service.findByQuery with the query DTO and return courses', async () => {
      const query: CourseQueryDto = { universityId: 'u1', courseName: 'Math', courseCode: 'M101' };
      const courses: Course[] = [
        {
          id: 'c1',
          name: 'Math',
          code: 'M101',
          facultyId: 'f1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (serviceMock.findByQuery as any).mockResolvedValue(courses);

      const result = await controller.search(query);
      expect(serviceMock.findByQuery).toHaveBeenCalledWith(query);
      expect(result).toEqual(courses);
    });
  });

  describe('findOne', () => {
    it('should call service.findById with the ID and return the course', async () => {
      const course: Course = {
        id: 'c1',
        name: 'Math',
        code: 'M101',
        facultyId: 'f1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (serviceMock.findById as any).mockResolvedValue(course);

      const result = await controller.findOne('c1');
      expect(serviceMock.findById).toHaveBeenCalledWith('c1');
      expect(result).toEqual(course);
    });
  });

  describe('create', () => {
    it('should call service.create with DTO and return created course', async () => {
      const dto: CreateCourseDto = { name: 'Math', code: 'M101', facultyId: 'f1' };
      const course: Course = { ...dto, id: 'c1', createdAt: new Date(), updatedAt: new Date() };

      (serviceMock.create as any).mockResolvedValue(course);

      const result = await controller.create(dto);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(course);
    });

    it('should propagate service exceptions', async () => {
      const dto: CreateCourseDto = { name: 'Math', code: 'M101', facultyId: 'f1' };
      (serviceMock.create as any).mockRejectedValue(new ConflictException());

      await expect(controller.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('should call service.update with ID and DTO and return updated course', async () => {
      const dto: UpdateCourseDto = { code: 'M102' };
      const course: Course = {
        id: 'c1',
        name: 'Math',
        code: 'M102',
        facultyId: 'f1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (serviceMock.update as any).mockResolvedValue(course);

      const result = await controller.update('c1', dto);
      expect(serviceMock.update).toHaveBeenCalledWith('c1', dto);
      expect(result).toEqual(course);
    });

    it('should propagate service exceptions', async () => {
      const dto: UpdateCourseDto = { code: 'M102' };
      (serviceMock.update as any).mockRejectedValue(new ConflictException());

      await expect(controller.update('c1', dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('delete', () => {
    it('should call serviceMock.remove with ID', async () => {
      (serviceMock.remove as any).mockResolvedValue(undefined);

      await controller.delete('c1');
      expect(serviceMock.remove).toHaveBeenCalledWith('c1');
    });

    it('should propagate service exceptions', async () => {
      (serviceMock.remove as any).mockRejectedValue(new BadRequestException());
      await expect(controller.delete('c1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteAll-cache', () => {
    it('should call clearSearchQueryCache and return void', () => {
      const result = controller.deleteAll();

      expect(serviceMock.clearSearchQueryCache).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
