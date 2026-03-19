/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { SuggestionService } from './suggestion.service.js';

describe('SuggestionService', () => {
  let service: SuggestionService;
  let prisma: any;
  let courseService: any;
  let facultyService: any;
  let universityService: any;
  let loggerMock: any;

  beforeEach(() => {
    prisma = {
      suggestedCourse: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      user: {
        findUniqueOrThrow: vi.fn(),
      },
      university: {
        findUnique: vi.fn(),
      },
      faculty: {
        findUnique: vi.fn(),
      },
    };
    courseService = {
      upsert: vi.fn(),
    };
    facultyService = {
      create: vi.fn(),
    };
    universityService = {
      create: vi.fn(),
    };
    const scopedLogger = {
      log: vi.fn(),
    };
    loggerMock = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
      scopedLogger,
    };
    service = new SuggestionService(
      prisma,
      courseService,
      facultyService,
      universityService,
      loggerMock
    );
  });

  describe('findAll', () => {
    it('should return all suggested courses', async () => {
      const suggestions = [{ id: 's1' }, { id: 's2' }];
      prisma.suggestedCourse.findMany.mockResolvedValue(suggestions);

      const result = await service.findAll();

      expect(result).toEqual(suggestions);
      expect(prisma.suggestedCourse.findMany).toHaveBeenCalled();
    });
  });

  describe('suggest', () => {
    it('should create a suggestion with user email', async () => {
      const dto = {
        courseName: 'Math',
        courseCode: 'BMECS101',
        facultyName: 'Science',
        facultyAbbrevName: 'SCI',
        uniName: 'Budapest University',
        uniAbbrevName: 'BME',
      };
      const userId = 'u1';
      const userEmail = 'test@example.com';

      prisma.user.findUniqueOrThrow.mockResolvedValue({ googleEmail: userEmail });
      prisma.suggestedCourse.create.mockResolvedValue({ id: 's1', ...dto, userEmail });

      const result = await service.suggest(userId, dto);

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: userId },
        select: { googleEmail: true },
      });
      expect(prisma.suggestedCourse.create).toHaveBeenCalledWith({
        data: { ...dto, userEmail },
      });
      expect(result).toEqual({ id: 's1', ...dto, userEmail });
    });
  });

  describe('accept', () => {
    it('should accept a suggestion and create university, faculty, and course if missing', async () => {
      const suggestion = {
        id: 's1',
        uniAbbrevName: 'BME',
        uniName: 'Budapest University',
        facultyName: 'Computer Science',
        facultyAbbrevName: 'CS',
        courseName: 'Databases',
        courseCode: 'BMECS101',
      };

      const createdUni = { id: 'u1' };
      const createdFaculty = { id: 'f1' };
      const createdCourse = { id: 'c1', name: 'Databases', code: 'BMECS101', facultyId: 'f1' };

      prisma.suggestedCourse.findUniqueOrThrow.mockResolvedValue(suggestion);
      prisma.university.findUnique.mockResolvedValue(null);
      universityService.create.mockResolvedValue(createdUni);
      prisma.faculty.findUnique.mockResolvedValue(null);
      facultyService.create.mockResolvedValue(createdFaculty);
      courseService.upsert.mockResolvedValue(createdCourse);
      prisma.suggestedCourse.delete.mockResolvedValue({});

      const result = await service.accept('s1');

      expect(prisma.suggestedCourse.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
      expect(prisma.university.findUnique).toHaveBeenCalledWith({
        where: { abbrevName: suggestion.uniAbbrevName },
      });
      expect(universityService.create).toHaveBeenCalledWith({
        name: suggestion.uniName,
        abbrevName: suggestion.uniAbbrevName,
      });
      expect(prisma.faculty.findUnique).toHaveBeenCalledWith({
        where: { name_universityId: { name: suggestion.facultyName, universityId: createdUni.id } },
      });
      expect(facultyService.create).toHaveBeenCalledWith({
        name: suggestion.facultyName,
        abbrevName: suggestion.facultyAbbrevName,
        universityId: createdUni.id,
      });
      expect(courseService.upsert).toHaveBeenCalledWith({
        name: suggestion.courseName,
        code: suggestion.courseCode,
        facultyId: createdFaculty.id,
      });
      expect(prisma.suggestedCourse.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
      expect(result).toEqual(createdCourse);
    });

    it('should reuse existing university and faculty if they exist', async () => {
      const suggestion = {
        id: 's2',
        uniAbbrevName: 'BME',
        uniName: 'Budapest University',
        facultyName: 'CS',
        facultyAbbrevName: 'CS',
        courseName: 'Algorithms',
        courseCode: 'BMECS102',
      };

      const existingUni = { id: 'u1' };
      const existingFaculty = { id: 'f1' };
      const createdCourse = { id: 'c2', name: 'Algorithms', code: 'BMECS102', facultyId: 'f1' };

      prisma.suggestedCourse.findUniqueOrThrow.mockResolvedValue(suggestion);
      prisma.university.findUnique.mockResolvedValue(existingUni);
      prisma.faculty.findUnique.mockResolvedValue(existingFaculty);
      courseService.upsert.mockResolvedValue(createdCourse);
      prisma.suggestedCourse.delete.mockResolvedValue({});

      const result = await service.accept('s2');

      expect(universityService.create).not.toHaveBeenCalled();
      expect(facultyService.create).not.toHaveBeenCalled();
      expect(courseService.upsert).toHaveBeenCalledWith({
        name: suggestion.courseName,
        code: suggestion.courseCode,
        facultyId: existingFaculty.id,
      });
      expect(result).toEqual(createdCourse);
    });
  });

  describe('update', () => {
    it('should update a suggested course', async () => {
      const updated = { id: 's1', courseName: 'Math Advanced' };
      prisma.suggestedCourse.update.mockResolvedValue(updated);

      const result = await service.update('s1', { courseName: 'Math Advanced' });

      expect(prisma.suggestedCourse.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { courseName: 'Math Advanced' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a suggested course', async () => {
      const deleted = { id: 's1' };
      prisma.suggestedCourse.delete.mockResolvedValue(deleted);

      const result = await service.delete('s1');

      expect(prisma.suggestedCourse.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
      expect(result).toEqual(deleted);
    });
  });

  describe('deleteOldSuggestions', () => {
    it('should delete old suggestions and log the deleted count', async () => {
      const fixedNow = new Date('2026-03-19T12:40:27.941Z');
      vi.useFakeTimers().setSystemTime(fixedNow);

      const deletedResult = { count: 5 };
      prisma.suggestedCourse.deleteMany.mockResolvedValue(deletedResult);

      const loggerSpy = vi.spyOn(loggerMock.scopedLogger, 'log');

      await service.deleteOldSuggestions();

      const cutoffDate = new Date(fixedNow);
      cutoffDate.setDate(cutoffDate.getDate() - 29);

      expect(prisma.suggestedCourse.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      const calledDate = prisma.suggestedCourse.deleteMany.mock.calls[0][0].where.createdAt.lt;
      expect(calledDate).toEqual(cutoffDate);

      expect(loggerSpy).toHaveBeenCalledWith(`Deleted ${deletedResult.count} old suggestions`);

      vi.useRealTimers();
    });
  });
});
