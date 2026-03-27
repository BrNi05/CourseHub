import { Injectable } from '@nestjs/common';

import { PingsStatisticsResponseDto, WeeklyPingDto } from './dto/pings-response.dto.js';
import { CoursesPinnedDto } from './dto/pins-response.dto.js';
import { UniversityUsersDto, FacultyUsersDto } from './dto/users-reponse.dto.js';
import { UniversityCoursesDto, FacultyCoursesDto } from './dto/courses-reponse.dto.js';
import type { FacultyUserCountRow, UniversityUserCountRow } from './statistics.types.js';

import { PrismaService } from '../../prisma/prisma.service.js';
import { ClientPlatform } from '../../prisma/generated/client/client.js';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  // Get number of pings in the last day, week, month, platform distribution in the last month, and weekly distribution for the last year
  async getPingStatistics(): Promise<PingsStatisticsResponseDto> {
    // Date calc: start of today, start of current week (Monday), start of current month
    const now = new Date();

    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const day = startOfDay.getUTCDay();
    const diffToMonday = (day + 6) % 7; // makes Monday=0, Tuesday=1, ..., Sunday=6
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setUTCDate(startOfDay.getUTCDate() - diffToMonday);

    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // Total counts
    const [allInDay, allInWeek, allInMonth] = await Promise.all([
      this.prisma.clientPing.count({
        where: { date: { gte: startOfDay } },
      }),
      this.prisma.clientPing.count({
        where: { date: { gte: startOfWeek } },
      }),
      this.prisma.clientPing.count({
        where: { date: { gte: startOfMonth } },
      }),
    ]);

    // Monthly platform distribution
    const monthlyPlatformCounts = await this.prisma.clientPing.groupBy({
      by: ['platform'],
      where: { date: { gte: startOfMonth } },
      _count: { platform: true },
    });

    const platformCounts: Record<ClientPlatform, number> = {
      windows: 0,
      linux: 0,
      macos: 0,
      android: 0,
      ios: 0,
    };

    for (const row of monthlyPlatformCounts) {
      platformCounts[row.platform] = row._count.platform;
    }

    const totalMonthly = Object.values(platformCounts).reduce((sum, val) => sum + val, 0);

    const percent = (value: number) =>
      totalMonthly === 0 ? 0 : Number(((value / totalMonthly) * 100).toFixed(2));

    const desktop = platformCounts.windows + platformCounts.linux + platformCounts.macos;

    const mobile = platformCounts.android + platformCounts.ios;

    // Weekly distribution for the last 52 weeks (1 year)
    const weeklyRaw = await this.prisma.$queryRaw<{ week: number; count: bigint }[]>`
    SELECT
      FLOOR(
        EXTRACT(EPOCH FROM (DATE_TRUNC('week', NOW()) - DATE_TRUNC('week', "date")))
        / 604800
      ) AS week,
      COUNT(*) AS count
    FROM "ClientPing"
    WHERE "date" >= NOW() - INTERVAL '52 weeks'
    GROUP BY week
    ORDER BY week;
  `;

    const weekMap = new Map<number, number>();

    for (const row of weeklyRaw) {
      weekMap.set(Number(row.week), Number(row.count));
    }

    const allPingsOnWeeks: WeeklyPingDto[] = [];

    const format = (d: Date) =>
      `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(
        d.getUTCDate()
      ).padStart(2, '0')}`;

    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setUTCDate(startOfWeek.getUTCDate() - i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

      allPingsOnWeeks.push({
        week: `${format(weekStart)} - ${format(weekEnd)}`,
        count: weekMap.get(i) ?? 0,
      });
    }

    return {
      allInMonth,
      allInWeek,
      allInDay,

      desktopShareMonthly: percent(desktop),
      mobileShareMonthly: percent(mobile),

      windowsShareMonthly: percent(platformCounts.windows),
      macosShareMonthly: percent(platformCounts.macos),
      linuxShareMonthly: percent(platformCounts.linux),
      androidShareMonthly: percent(platformCounts.android),
      iosShareMonthly: percent(platformCounts.ios),

      allPingsOnWeeks,
    };
  }

  // Get how many users have pinned each course, and sort by the most pinned courses
  async getPinStatistics(): Promise<CoursesPinnedDto[]> {
    const courses = await this.prisma.course.findMany({
      select: {
        name: true,
        code: true,
        _count: {
          select: {
            pinnedBy: true,
          },
        },
        faculty: {
          select: {
            university: {
              select: {
                abbrevName: true,
              },
            },
          },
        },
      },
    });

    const result: CoursesPinnedDto[] = courses.map((course) => ({
      name: course.name,
      universityAbbrev: course.faculty.university.abbrevName,
      courseCode: course.code,
      pinCount: course._count.pinnedBy,
    }));

    result.sort((a, b) => b.pinCount - a.pinCount); // Sort descending by pinCount

    return result;
  }

  // How many unique users have pinned courses in each faculty and university
  async getUserStatistics(): Promise<UniversityUsersDto[]> {
    const [facultyRows, universityRows] = await Promise.all([
      this.prisma.$queryRaw<FacultyUserCountRow[]>`
        SELECT
          u."id" AS "universityId",
          u."abbrevName" AS "uniAbbrev",
          f."id" AS "facultyId",
          f."name" AS "facultyName",
          COUNT(DISTINCT upc."B")::int AS "userCount"
        FROM "University" u
        LEFT JOIN "Faculty" f ON f."universityId" = u."id"
        LEFT JOIN "Course" c ON c."facultyId" = f."id"
        LEFT JOIN "_UserPinnedCourses" upc ON upc."A" = c."id"
        GROUP BY u."id", u."abbrevName", f."id", f."name"
      `,
      this.prisma.$queryRaw<UniversityUserCountRow[]>`
        SELECT
          u."id" AS "universityId",
          u."abbrevName" AS "uniAbbrev",
          COUNT(DISTINCT upc."B")::int AS "userCount"
        FROM "University" u
        LEFT JOIN "Faculty" f ON f."universityId" = u."id"
        LEFT JOIN "Course" c ON c."facultyId" = f."id"
        LEFT JOIN "_UserPinnedCourses" upc ON upc."A" = c."id"
        GROUP BY u."id", u."abbrevName"
      `,
    ]);

    const facultiesByUniversityId = new Map<string, FacultyUsersDto[]>();

    for (const row of facultyRows) {
      if (!row.facultyId || !row.facultyName) continue;

      const faculties = facultiesByUniversityId.get(row.universityId) ?? [];
      faculties.push({
        facultyName: row.facultyName,
        allUsersOfFacultyCourses: Number(row.userCount),
      });
      facultiesByUniversityId.set(row.universityId, faculties);
    }

    const universitiesDto: UniversityUsersDto[] = universityRows.map((row) => {
      const faculties = facultiesByUniversityId.get(row.universityId) ?? [];

      faculties.sort((a, b) => b.allUsersOfFacultyCourses - a.allUsersOfFacultyCourses); // Sort faculties descending

      return {
        uniAbbrev: row.uniAbbrev,
        allUsers: Number(row.userCount),
        faculties,
      };
    });

    universitiesDto.sort((a, b) => b.allUsers - a.allUsers); // Sort universities descending

    return universitiesDto;
  }

  // How many courses are there in each faculty and university
  async getCourseStatistics(): Promise<UniversityCoursesDto[]> {
    const universities = await this.prisma.university.findMany({
      select: {
        abbrevName: true,
        faculties: {
          select: {
            name: true,
            _count: {
              select: {
                courses: true, // number of courses in this faculty
              },
            },
          },
        },
      },
    });

    // Map to DTO format
    const universitiesDto: UniversityCoursesDto[] = universities.map((university) => {
      const faculties: FacultyCoursesDto[] = university.faculties.map((faculty) => ({
        facultyName: faculty.name,
        courseCount: faculty._count.courses,
      }));

      // Sum of all courses in this university
      const courseCount = faculties.reduce((sum, f) => sum + f.courseCount, 0);

      return {
        universityAbbrevName: university.abbrevName,
        courseCount,
        faculties,
      };
    });

    universitiesDto.sort((a, b) => b.courseCount - a.courseCount); // Sort universities by total course count descending

    return universitiesDto;
  }
}
