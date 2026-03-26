/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, beforeEach, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CourseService } from './course.service.js';

describe('CourseService', () => {
  let service: CourseService;
  let prisma: any;
  let cacheManager: any;
  let eventEmitter: any;

  beforeEach(() => {
    prisma = {
      course: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn(),
      },
      faculty: {
        findUnique: vi.fn(),
      },
    };

    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    eventEmitter = {
      emitAsync: vi.fn(),
    };

    service = new CourseService(cacheManager, prisma, eventEmitter);
  });

  describe('findById', () => {
    it('should return course from DB and cache it if not cached', async () => {
      const course = { id: 'c1', name: 'Math', code: 'M101' };

      cacheManager.get.mockResolvedValue(null);
      prisma.course.findUniqueOrThrow.mockResolvedValue(course);

      const result = await service.findById('c1');

      expect(cacheManager.get).toHaveBeenCalledWith('course_c1');

      expect(prisma.course.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });

      expect(cacheManager.set).toHaveBeenCalledWith('course_c1', course, 0);
      expect(result).toEqual(course);
    });

    it('should return cached course if exists', async () => {
      const course = { id: 'c1', name: 'Math' };

      cacheManager.get.mockResolvedValue(course);

      const result = await service.findById('c1');

      expect(prisma.course.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(result).toEqual(course);
    });
  });

  describe('create', () => {
    it('should create course if code starts with university abbrev', async () => {
      const dto = {
        name: 'Databases',
        code: 'BMECS101',
        facultyId: 'f1',
      };

      const faculty = {
        id: 'f1',
        university: { abbrevName: 'BME' },
      };

      const createdCourse = { ...dto, id: 'c1' };

      prisma.faculty.findUnique.mockResolvedValue(faculty);
      prisma.course.create.mockResolvedValue(createdCourse);

      const result = await service.create(dto);

      expect(prisma.faculty.findUnique).toHaveBeenCalledWith({
        where: { id: dto.facultyId },
        include: { university: true },
      });

      expect(prisma.course.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          code: dto.code,
          facultyId: dto.facultyId,
          coursePageUrl: '',
          courseTadUrl: '',
          courseMoodleUrl: '',
          courseSubmissionUrl: '',
          courseTeamsUrl: '',
          courseExtraUrl: '',
        },
      });

      expect(cacheManager.set).toHaveBeenCalledWith('course_c1', createdCourse, 0);

      expect(result).toEqual(createdCourse);
    });

    it('should prepend university abbrev if course code does not start with it', async () => {
      const dto = {
        name: 'Databases',
        code: 'CS101',
        facultyId: 'f1',
      };

      const createdCourse = {
        id: 'c1',
        ...dto,
        code: 'BMECS101',
      };

      prisma.faculty.findUnique.mockResolvedValue({
        id: 'f1',
        university: { abbrevName: 'BME' },
      });
      prisma.course.create.mockResolvedValue(createdCourse);

      const result = await service.create(dto);

      expect(prisma.course.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          code: 'BMECS101',
          facultyId: dto.facultyId,
          coursePageUrl: '',
          courseTadUrl: '',
          courseMoodleUrl: '',
          courseSubmissionUrl: '',
          courseTeamsUrl: '',
          courseExtraUrl: '',
        },
      });

      expect(result).toEqual(createdCourse);
    });

    it('should throw if faculty does not exist', async () => {
      const dto = {
        name: 'Databases',
        code: 'CS101',
        facultyId: 'missing-faculty',
      };

      prisma.faculty.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('upsert', () => {
    it('should create a new course if it does not exist', async () => {
      const dto = {
        name: 'Databases',
        code: 'BMECS101',
        facultyId: 'f1',
      };

      const createdCourse = {
        ...dto,
        id: 'c1',
        coursePageUrl: '',
        courseTadUrl: '',
        courseMoodleUrl: '',
        courseSubmissionUrl: '',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      };

      prisma.faculty.findUnique.mockResolvedValue({
        id: 'f1',
        university: { abbrevName: 'BME' },
      });

      prisma.course.upsert.mockResolvedValue(createdCourse);

      const result = await service.upsert(dto);

      expect(prisma.course.upsert).toHaveBeenCalledWith({
        where: { code: dto.code },
        create: dto,
        update: dto,
      });

      expect(cacheManager.set).toHaveBeenCalledWith(`course_${createdCourse.id}`, createdCourse, 0);
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith('course.updated');
      expect(result).toEqual(createdCourse);
    });

    it('should update the course if it already exists', async () => {
      const dto = {
        name: 'Databases Updated',
        code: 'BMECS101',
        facultyId: 'f1',
      };

      const updatedCourse = {
        ...dto,
        id: 'c1',
        coursePageUrl: '',
        courseTadUrl: '',
        courseMoodleUrl: '',
        courseSubmissionUrl: '',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      };

      prisma.faculty.findUnique.mockResolvedValue({
        id: 'f1',
        university: { abbrevName: 'BME' },
      });

      prisma.course.upsert.mockResolvedValue(updatedCourse);

      const result = await service.upsert(dto);

      expect(prisma.course.upsert).toHaveBeenCalledWith({
        where: { code: dto.code },
        create: dto,
        update: dto,
      });

      expect(cacheManager.set).toHaveBeenCalledWith(`course_${updatedCourse.id}`, updatedCourse, 0);
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith('course.updated');
      expect(result).toEqual(updatedCourse);
    });

    it('should prepend university abbrev during upsert if missing', async () => {
      const dto = {
        name: 'Databases',
        code: 'CS101',
        facultyId: 'f1',
      };

      const normalizedDto = {
        ...dto,
        code: 'BMECS101',
      };

      const createdCourse = {
        ...normalizedDto,
        id: 'c1',
        coursePageUrl: '',
        courseTadUrl: '',
        courseMoodleUrl: '',
        courseSubmissionUrl: '',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      };

      prisma.faculty.findUnique.mockResolvedValue({
        id: 'f1',
        university: { abbrevName: 'BME' },
      });

      prisma.course.upsert.mockResolvedValue(createdCourse);

      const result = await service.upsert(dto);

      expect(prisma.course.upsert).toHaveBeenCalledWith({
        where: { code: 'BMECS101' },
        create: normalizedDto,
        update: normalizedDto,
      });

      expect(result).toEqual(createdCourse);
    });
  });

  describe('update', () => {
    it('should update course and preserve existing URLs if not provided', async () => {
      const dto = {
        name: 'Advanced DB',
        code: 'BMECS102',
      };

      const existingCourse = {
        id: 'c1',
        facultyId: 'f1',
        code: 'BMECS101',
        coursePageUrl: 'https://oldpage.com',
        courseTadUrl: 'https://oldtad.com',
        courseMoodleUrl: 'https://oldmoodle.com',
        courseSubmissionUrl: 'https://oldsubmission.com',
        courseTeamsUrl: 'https://oldteams.com',
        courseExtraUrl: 'https://oldextra.com',
      };

      prisma.course.findUniqueOrThrow.mockResolvedValue(existingCourse);

      prisma.faculty.findUnique.mockResolvedValue({
        id: 'f1',
        university: { abbrevName: 'BME' },
      });

      prisma.course.update.mockResolvedValue({
        ...existingCourse,
        ...dto,
      });

      const result = await service.update('c1', dto);

      expect(cacheManager.del).toHaveBeenCalledWith('course_c1');

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: {
          name: dto.name,
          code: dto.code,
          facultyId: existingCourse.facultyId,
          coursePageUrl: existingCourse.coursePageUrl,
          courseTadUrl: existingCourse.courseTadUrl,
          courseMoodleUrl: existingCourse.courseMoodleUrl,
          courseSubmissionUrl: existingCourse.courseSubmissionUrl,
          courseTeamsUrl: existingCourse.courseTeamsUrl,
          courseExtraUrl: existingCourse.courseExtraUrl,
        },
      });

      expect(cacheManager.set).toHaveBeenCalledWith('course_c1', { ...existingCourse, ...dto }, 0);
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith('course.updated');
      expect(result).toEqual({ ...existingCourse, ...dto });
    });

    it('should prepend university abbrev if updated code does not start with it', async () => {
      const dto = { code: 'CS102' };
      const updatedCourse = {
        id: 'c1',
        facultyId: 'f1',
        code: 'BMECS102',
      };

      prisma.course.findUniqueOrThrow.mockResolvedValue({
        id: 'c1',
        facultyId: 'f1',
        code: 'BMECS101',
      });

      prisma.faculty.findUnique.mockResolvedValue({
        id: 'f1',
        university: { abbrevName: 'BME' },
      });
      prisma.course.update.mockResolvedValue(updatedCourse);

      const result = await service.update('c1', dto);

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: {
          name: undefined,
          code: 'BMECS102',
          facultyId: 'f1',
          coursePageUrl: undefined,
          courseTadUrl: undefined,
          courseMoodleUrl: undefined,
          courseSubmissionUrl: undefined,
          courseTeamsUrl: undefined,
          courseExtraUrl: undefined,
        },
      });

      expect(result).toEqual(updatedCourse);
    });
  });

  describe('remove', () => {
    it('should delete course, clear cache and emit event', async () => {
      prisma.course.delete.mockResolvedValue({});

      await service.remove('c1');

      expect(prisma.course.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });

      expect(cacheManager.del).toHaveBeenCalledWith('course_c1');

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith('course.deleted');
    });
  });

  describe('findByQuery', () => {
    const query = {
      universityId: 'u1',
      courseName: 'Math',
      courseCode: undefined,
    };

    it('should query DB and cache result on first call and return cached on second call', async () => {
      const courses = [{ id: 'c1', name: 'Math', code: 'BMEMATH101' }];

      prisma.course.findMany.mockResolvedValue(courses);

      const firstResult = await service.findByQuery(query);
      expect(prisma.course.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: {
          faculty: {
            universityId: 'u1',
          },
          AND: [{ name: { contains: 'math', mode: 'insensitive' } }, {}],
        },
        orderBy: { name: 'asc' },
        take: 30,
      });
      expect(firstResult).toEqual(courses);

      const secondResult = await service.findByQuery(query);
      expect(prisma.course.findMany).toHaveBeenCalledTimes(1);
      expect(secondResult).toBe(firstResult);
    });
  });
});
