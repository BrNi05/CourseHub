/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CourseService } from './course.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

describe('CourseService', () => {
  let service: CourseService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      course: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      faculty: {
        findUnique: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new CourseService(prisma);
  });

  describe('findById', () => {
    it('should return a course by ID', async () => {
      const course = { id: 'c1', name: 'Math', code: 'M101', facultyId: 'f1' };
      (prisma.course.findUniqueOrThrow as any).mockResolvedValue(course);

      const result = await service.findById('c1');
      expect(prisma.course.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'c1' } });
      expect(result).toEqual(course);
    });
  });

  describe('create', () => {
    it('should create a course if code starts with university abbrev', async () => {
      const dto = { name: 'Databases', code: 'BMECS101', facultyId: 'f1' };
      const faculty = { id: 'f1', university: { abbrevName: 'BME' } };

      (prisma.faculty.findUnique as any).mockResolvedValue(faculty);
      (prisma.course.create as any).mockResolvedValue({ ...dto, id: 'c1' });

      const result = await service.create(dto);
      expect(result).toEqual({ ...dto, id: 'c1' });

      expect(prisma.course.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          code: dto.code,
          facultyId: dto.facultyId,
          coursePageUrl: '',
          courseTadUrl: '',
          courseMoodleUrl: '',
          courseTeamsUrl: '',
          courseExtraUrl: '',
        },
      });
    });

    it('should throw if course code does not start with university abbrev', async () => {
      const dto = { name: 'Databases', code: 'CS101', facultyId: 'f1' };
      const faculty = { id: 'f1', university: { abbrevName: 'BME' } };

      (prisma.faculty.findUnique as any).mockResolvedValue(faculty);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update course and preserve existing URLs if not provided', async () => {
      const dto = {
        name: 'Advanced DB',
        code: 'BMECS102',
        coursePageUrl: undefined,
      };
      const existingCourse = {
        id: 'c1',
        facultyId: 'f1',
        code: 'BMECS101',
        coursePageUrl: 'https://oldpage.com',
        courseTadUrl: 'https://oldtad.com',
        courseMoodleUrl: 'https://oldmoodle.com',
        courseTeamsUrl: 'https://oldteams.com',
        courseExtraUrl: 'https://oldextra.com',
      };
      const faculty = { id: 'f1', university: { abbrevName: 'BME' } };

      (prisma.course.findUniqueOrThrow as any).mockResolvedValue(existingCourse);
      (prisma.faculty.findUnique as any).mockResolvedValue(faculty);
      (prisma.course.update as any).mockResolvedValue({ ...existingCourse, ...dto });

      const result = await service.update('c1', dto);

      expect(result).toEqual({ ...existingCourse, ...dto });

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: {
          name: dto.name,
          code: dto.code,
          facultyId: undefined,
          coursePageUrl: existingCourse.coursePageUrl,
          courseTadUrl: existingCourse.courseTadUrl,
          courseMoodleUrl: existingCourse.courseMoodleUrl,
          courseTeamsUrl: existingCourse.courseTeamsUrl,
          courseExtraUrl: existingCourse.courseExtraUrl,
        },
      });
    });

    it('should throw if updated code does not start with university abbrev', async () => {
      const dto = { code: 'CS102' };
      const existingCourse = { id: 'c1', facultyId: 'f1', code: 'BMECS101' };
      const faculty = { id: 'f1', university: { abbrevName: 'BME' } };

      (prisma.course.findUniqueOrThrow as any).mockResolvedValue(existingCourse);
      (prisma.faculty.findUnique as any).mockResolvedValue(faculty);

      await expect(service.update('c1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a course', async () => {
      (prisma.course.delete as any).mockResolvedValue({});
      await service.remove('c1');
      expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });

  describe('findByQuery', () => {
    it('should return courses matching query', async () => {
      const courses = [
        { id: 'c1', name: 'Math', code: 'BMEMATH101' },
        { id: 'c2', name: 'Physics', code: 'BMEPHY101' },
      ];
      (prisma.course.findMany as any).mockResolvedValue(courses);

      const result = await service.findByQuery({
        universityId: 'u1',
        courseName: 'Math',
        courseCode: undefined,
      });

      expect(result).toEqual(courses);
      expect(prisma.course.findMany).toHaveBeenCalled();
    });
  });
});
