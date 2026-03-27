/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatisticsService } from './statistics.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { ClientPlatform } from '../../prisma/generated/client/client.js';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      clientPing: {
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      $queryRaw: vi.fn(),
      course: {
        findMany: vi.fn(),
      },
      university: {
        findMany: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new StatisticsService(prisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPingStatistics', () => {
    it('returns statistics with percentages and weekly data', async () => {
      (prisma.clientPing.count as any).mockResolvedValueOnce(10);
      (prisma.clientPing.count as any).mockResolvedValueOnce(50);
      (prisma.clientPing.count as any).mockResolvedValueOnce(200);

      (prisma.clientPing.groupBy as any).mockResolvedValue([
        { platform: ClientPlatform.windows, _count: { platform: 50 } },
        { platform: ClientPlatform.linux, _count: { platform: 20 } },
        { platform: ClientPlatform.macos, _count: { platform: 30 } },
        { platform: ClientPlatform.android, _count: { platform: 60 } },
        { platform: ClientPlatform.ios, _count: { platform: 40 } },
      ]);

      (prisma.$queryRaw as any).mockResolvedValue([
        { week: 0, count: BigInt(10) },
        { week: 1, count: BigInt(20) },
      ]);

      const result = await service.getPingStatistics();

      expect(result.allInDay).toBe(10);
      expect(result.allInWeek).toBe(50);
      expect(result.allInMonth).toBe(200);

      expect(result.desktopShareMonthly).toBeCloseTo(((50 + 20 + 30) / 200) * 100, 2);
      expect(result.mobileShareMonthly).toBeCloseTo(((60 + 40) / 200) * 100, 2);

      expect(result.allPingsOnWeeks.length).toBe(52);
      expect(result.allPingsOnWeeks[0].count).toBe(10);
      expect(result.allPingsOnWeeks[1].count).toBe(20);
    });
  });

  describe('getPinStatistics', () => {
    it('returns courses sorted by pin count', async () => {
      (prisma.course.findMany as any).mockResolvedValue([
        {
          name: 'Course A',
          code: 'A101',
          _count: { pinnedBy: 5 },
          faculty: { university: { abbrevName: 'BME' } },
        },
        {
          name: 'Course B',
          code: 'B101',
          _count: { pinnedBy: 10 },
          faculty: { university: { abbrevName: 'ELTE' } },
        },
      ]);

      const result = await service.getPinStatistics();
      expect(result[0].name).toBe('Course B');
      expect(result[1].name).toBe('Course A');
      expect(result[0].pinCount).toBe(10);
    });
  });

  describe('getUserStatistics', () => {
    it('returns unique user counts per faculty and university', async () => {
      (prisma.$queryRaw as any)
        .mockResolvedValueOnce([
          {
            universityId: 'uni-1',
            uniAbbrev: 'BME',
            facultyId: 'fac-1',
            facultyName: 'Faculty 1',
            userCount: 3,
          },
          {
            universityId: 'uni-2',
            uniAbbrev: 'ELTE',
            facultyId: 'fac-2',
            facultyName: 'Faculty 2',
            userCount: 0,
          },
        ])
        .mockResolvedValueOnce([
          {
            universityId: 'uni-1',
            uniAbbrev: 'BME',
            userCount: 3,
          },
          {
            universityId: 'uni-2',
            uniAbbrev: 'ELTE',
            userCount: 0,
          },
        ]);

      const result = await service.getUserStatistics();
      expect(result[0].uniAbbrev).toBe('BME');
      expect(result[0].allUsers).toBe(3);
      expect(result[0].faculties[0].allUsersOfFacultyCourses).toBe(3);
      expect(result[1]).toEqual({
        uniAbbrev: 'ELTE',
        allUsers: 0,
        faculties: [
          {
            facultyName: 'Faculty 2',
            allUsersOfFacultyCourses: 0,
          },
        ],
      });
    });

    it('returns empty faculties for universities without faculties', async () => {
      (prisma.$queryRaw as any)
        .mockResolvedValueOnce([
          {
            universityId: 'uni-1',
            uniAbbrev: 'BME',
            facultyId: null,
            facultyName: null,
            userCount: 0,
          },
        ])
        .mockResolvedValueOnce([
          {
            universityId: 'uni-1',
            uniAbbrev: 'BME',
            userCount: 0,
          },
        ]);

      const result = await service.getUserStatistics();
      expect(result).toEqual([
        {
          uniAbbrev: 'BME',
          allUsers: 0,
          faculties: [],
        },
      ]);
    });
  });

  describe('getCourseStatistics', () => {
    it('returns course counts aggregated per faculty and university', async () => {
      (prisma.university.findMany as any).mockResolvedValue([
        {
          abbrevName: 'BME',
          faculties: [
            { name: 'Faculty 1', _count: { courses: 2 } },
            { name: 'Faculty 2', _count: { courses: 3 } },
          ],
        },
      ]);

      const result = await service.getCourseStatistics();
      expect(result[0].universityAbbrevName).toBe('BME');
      expect(result[0].courseCount).toBe(5);
      expect(result[0].faculties[0].courseCount).toBe(2);
    });
  });
});
