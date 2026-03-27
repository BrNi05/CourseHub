import { Injectable } from '@nestjs/common';

import { PingsStatisticsResponseDto, WeeklyPingDto } from './dto/pings-response.dto.js';
import { CoursesPinnedDto } from './dto/pins-response.dto.js';
import { UniversityUsersDto, FacultyUsersDto } from './dto/users-reponse.dto.js';
import { UniversityCoursesDto, FacultyCoursesDto } from './dto/courses-reponse.dto.js';
import type {
  CoursePinCountRow,
  FacultyCourseCountRow,
  FacultyUserCountRow,
  UniversityCourseCountRow,
  UniversityUserCountRow,
} from './statistics.types.js';

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
    const rows = await this.prisma.$queryRaw<CoursePinCountRow[]>`
      SELECT
        c."name" AS "name",
        u."abbrevName" AS "universityAbbrev",
        c."code" AS "courseCode",
        COUNT(upc."B")::int AS "pinCount"
      FROM "Course" c
      INNER JOIN "Faculty" f ON f."id" = c."facultyId"
      INNER JOIN "University" u ON u."id" = f."universityId"
      LEFT JOIN "_UserPinnedCourses" upc ON upc."A" = c."id"
      GROUP BY c."id", c."name", u."abbrevName", c."code"
      ORDER BY "pinCount" DESC, c."name" ASC, c."code" ASC
    `;

    return rows.map((row) => ({
      name: row.name,
      universityAbbrev: row.universityAbbrev,
      courseCode: row.courseCode,
      pinCount: Number(row.pinCount),
    }));
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
    const [facultyRows, universityRows] = await Promise.all([
      this.prisma.$queryRaw<FacultyCourseCountRow[]>`
        SELECT
          u."id" AS "universityId",
          u."abbrevName" AS "universityAbbrevName",
          f."id" AS "facultyId",
          f."name" AS "facultyName",
          COUNT(c."id")::int AS "courseCount"
        FROM "University" u
        LEFT JOIN "Faculty" f ON f."universityId" = u."id"
        LEFT JOIN "Course" c ON c."facultyId" = f."id"
        GROUP BY u."id", u."abbrevName", f."id", f."name"
        ORDER BY u."abbrevName" ASC, "courseCount" DESC, f."name" ASC
      `,
      this.prisma.$queryRaw<UniversityCourseCountRow[]>`
        SELECT
          u."id" AS "universityId",
          u."abbrevName" AS "universityAbbrevName",
          COUNT(c."id")::int AS "courseCount"
        FROM "University" u
        LEFT JOIN "Faculty" f ON f."universityId" = u."id"
        LEFT JOIN "Course" c ON c."facultyId" = f."id"
        GROUP BY u."id", u."abbrevName"
        ORDER BY "courseCount" DESC, u."abbrevName" ASC
      `,
    ]);

    const facultiesByUniversityId = new Map<string, FacultyCoursesDto[]>();

    for (const row of facultyRows) {
      if (!row.facultyId || !row.facultyName) continue;

      const faculties = facultiesByUniversityId.get(row.universityId) ?? [];
      faculties.push({
        facultyName: row.facultyName,
        courseCount: Number(row.courseCount),
      });
      facultiesByUniversityId.set(row.universityId, faculties);
    }

    return universityRows.map((row) => ({
      universityAbbrevName: row.universityAbbrevName,
      courseCount: Number(row.courseCount),
      faculties: facultiesByUniversityId.get(row.universityId) ?? [],
    }));
  }
}
