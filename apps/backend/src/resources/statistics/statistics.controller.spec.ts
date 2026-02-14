/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { StatisticsController } from './statistics.controller.js';
import type { StatisticsService } from './statistics.service.js';
import type { PingsStatisticsResponseDto } from './dto/pings-response.dto.js';
import type { CoursesPinnedDto } from './dto/pins-response.dto.js';
import type { UniversityUsersDto } from './dto/users-reponse.dto.js';
import type { UniversityCoursesDto } from './dto/courses-reponse.dto.js';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let service: StatisticsService;

  beforeEach(() => {
    service = {
      getPingStatistics: vi.fn(),
      getPinStatistics: vi.fn(),
      getUserStatistics: vi.fn(),
      getCourseStatistics: vi.fn(),
    } as unknown as StatisticsService;

    controller = new StatisticsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('pings', () => {
    it('should return ping statistics from service', async () => {
      const mockResponse: PingsStatisticsResponseDto = {
        allInMonth: 200,
        allInWeek: 50,
        allInDay: 10,
        desktopShareMonthly: 50,
        mobileShareMonthly: 50,
        windowsShareMonthly: 20,
        macosShareMonthly: 15,
        linuxShareMonthly: 15,
        androidShareMonthly: 30,
        iosShareMonthly: 20,
        allPingsOnWeeks: [{ week: '2026.02.08 - 2026.02.14', count: 10 }],
      };

      (service.getPingStatistics as any).mockResolvedValue(mockResponse);

      const result = await controller.pings();
      expect(result).toBe(mockResponse);
      expect(service.getPingStatistics).toHaveBeenCalled();
    });
  });

  describe('pins', () => {
    it('should return pinned courses from service', async () => {
      const mockResponse: CoursesPinnedDto[] = [
        { name: 'Course A', universityAbbrev: 'BME', courseCode: 'A101', pinCount: 5 },
      ];
      (service.getPinStatistics as any).mockResolvedValue(mockResponse);

      const result = await controller.pins();
      expect(result).toBe(mockResponse);
      expect(service.getPinStatistics).toHaveBeenCalled();
    });
  });

  describe('users', () => {
    it('should return user statistics from service', async () => {
      const mockResponse: UniversityUsersDto[] = [
        {
          uniAbbrev: 'BME',
          allUsers: 10,
          faculties: [{ facultyName: 'Faculty 1', allUsersOfFacultyCourses: 10 }],
        },
      ];
      (service.getUserStatistics as any).mockResolvedValue(mockResponse);

      const result = await controller.users();
      expect(result).toBe(mockResponse);
      expect(service.getUserStatistics).toHaveBeenCalled();
    });
  });

  describe('courses', () => {
    it('should return course statistics from service', async () => {
      const mockResponse: UniversityCoursesDto[] = [
        {
          universityAbbrevName: 'BME',
          courseCount: 5,
          faculties: [{ facultyName: 'Faculty 1', courseCount: 5 }],
        },
      ];
      (service.getCourseStatistics as any).mockResolvedValue(mockResponse);

      const result = await controller.courses();
      expect(result).toBe(mockResponse);
      expect(service.getCourseStatistics).toHaveBeenCalled();
    });
  });
});
