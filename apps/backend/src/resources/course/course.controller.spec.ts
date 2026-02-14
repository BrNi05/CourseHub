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
  let service: Partial<CourseService>;

  beforeEach(() => {
    service = {
      findById: vi.fn(),
      findByQuery: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    controller = new CourseController(service as CourseService);
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

      (service.findById as any).mockResolvedValue(course);

      const result = await controller.findOne('c1');
      expect(service.findById).toHaveBeenCalledWith('c1');
      expect(result).toEqual(course);
    });
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

      (service.findByQuery as any).mockResolvedValue(courses);

      const result = await controller.search(query);
      expect(service.findByQuery).toHaveBeenCalledWith(query);
      expect(result).toEqual(courses);
    });
  });

  describe('create', () => {
    it('should call service.create with DTO and return created course', async () => {
      const dto: CreateCourseDto = { name: 'Math', code: 'M101', facultyId: 'f1' };
      const course: Course = { ...dto, id: 'c1', createdAt: new Date(), updatedAt: new Date() };

      (service.create as any).mockResolvedValue(course);

      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(course);
    });

    it('should propagate service exceptions', async () => {
      const dto: CreateCourseDto = { name: 'Math', code: 'M101', facultyId: 'f1' };
      (service.create as any).mockRejectedValue(new ConflictException());

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

      (service.update as any).mockResolvedValue(course);

      const result = await controller.update('c1', dto);
      expect(service.update).toHaveBeenCalledWith('c1', dto);
      expect(result).toEqual(course);
    });

    it('should propagate service exceptions', async () => {
      const dto: UpdateCourseDto = { code: 'M102' };
      (service.update as any).mockRejectedValue(new ConflictException());

      await expect(controller.update('c1', dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('delete', () => {
    it('should call service.remove with ID', async () => {
      (service.remove as any).mockResolvedValue(undefined);

      await controller.delete('c1');
      expect(service.remove).toHaveBeenCalledWith('c1');
    });

    it('should propagate service exceptions', async () => {
      (service.remove as any).mockRejectedValue(new BadRequestException());
      await expect(controller.delete('c1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
