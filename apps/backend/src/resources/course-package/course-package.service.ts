import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { LRUCache } from 'lru-cache';
import type { Prisma } from '../../prisma/generated/client/client.js';

import { PrismaService } from '../../prisma/prisma.service.js';
import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';

import { CreateCoursePackageDto } from './dto/create-course-package.dto.js';
import { UpdateCoursePackageDto } from './dto/update-course-package.dto.js';
import { SearchCoursePackageDto } from './dto/search-course-package.dto.js';

// Define the shape of the course package with relations included
const coursePackageInclude = {
  courses: true,
  faculty: true,
} satisfies Prisma.CoursePackageInclude;

// Course package with relations included
type CoursePackageWithRelations = Prisma.CoursePackageGetPayload<{
  include: typeof coursePackageInclude;
}>;

@Injectable()
export class CoursePackageService {
  private readonly logger: ContextualLogger;
  private readonly queryCache = new LRUCache<string, CoursePackageWithRelations[]>({
    max: 10000,
    ttl: 1000 * 60 * 60 * 24 * 7 * 2,
  });

  constructor(
    private readonly prisma: PrismaService,
    logger: LoggerService
  ) {
    this.logger = logger.forContext(CoursePackageService.name);
  }

  async create(ownerId: string, dto: CreateCoursePackageDto): Promise<CoursePackageWithRelations> {
    const coursePackage = await this.prisma.coursePackage.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        facultyId: dto.facultyId,
        ownerId,
        isPermanent: false,
        courses: {
          connect: dto.courseIds.map((courseId) => ({ id: courseId })),
        },
      },
      include: coursePackageInclude,
    });

    this.clearSearchQueryCache();

    return coursePackage;
  }

  async findMine(userId: string): Promise<CoursePackageWithRelations[]> {
    return await this.prisma.coursePackage.findMany({
      where: { ownerId: userId },
      include: coursePackageInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async search(query: SearchCoursePackageDto): Promise<CoursePackageWithRelations[]> {
    query.nameQuery = query.nameQuery?.toLowerCase();

    const cacheKey = this.buildQueryCacheKey(query);
    const cached = this.queryCache.get(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.coursePackage.findMany({
      where: {
        facultyId: query.facultyId,
        faculty: query.universityId ? { universityId: query.universityId } : undefined,
        name: query.nameQuery
          ? {
              contains: query.nameQuery,
              mode: 'insensitive',
            }
          : undefined,
      },
      include: coursePackageInclude,
      orderBy: { name: 'asc' },
      take: 30, // A good search should always return less than 30 results
    });

    this.queryCache.set(cacheKey, result);

    return result;
  }

  async findById(id: string): Promise<CoursePackageWithRelations> {
    return await this.prisma.coursePackage.findUniqueOrThrow({
      where: { id },
      include: coursePackageInclude,
    });
  }

  async update(id: string, dto: UpdateCoursePackageDto): Promise<CoursePackageWithRelations> {
    const coursePackage = await this.prisma.coursePackage.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        facultyId: dto.facultyId,
        courses: dto.courseIds
          ? {
              set: dto.courseIds.map((courseId) => ({ id: courseId })),
            }
          : undefined,
      },
      include: coursePackageInclude,
    });

    this.clearSearchQueryCache();

    return coursePackage;
  }

  async setPermanent(id: string, isPermanent: boolean): Promise<CoursePackageWithRelations> {
    const coursePackage = await this.prisma.coursePackage.update({
      where: { id },
      data: { isPermanent },
      include: coursePackageInclude,
    });

    this.clearSearchQueryCache();

    return coursePackage;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.coursePackage.delete({ where: { id } });
    this.clearSearchQueryCache();
  }

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.coursePackage.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });

    this.clearSearchQueryCache();
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async deleteInactiveNonPermanentPackages(): Promise<void> {
    const now = new Date();
    const oneYearAgo = new Date(
      Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())
    );

    const deleted = await this.prisma.coursePackage.deleteMany({
      where: {
        isPermanent: false,
        lastUsedAt: { lt: oneYearAgo },
      },
    });

    if (deleted.count > 0) this.clearSearchQueryCache();

    this.logger.log(`Deleted ${deleted.count} inactive non-permanent course packages.`);
  }

  @OnEvent('course.updated')
  @OnEvent('course.deleted')
  @OnEvent('university.deleted')
  @OnEvent('faculty.deleted')
  clearSearchQueryCache(): void {
    this.queryCache.clear();
  }

  private buildQueryCacheKey(query: SearchCoursePackageDto): string {
    return [
      `university:${query.universityId ?? ''}`,
      `faculty:${query.facultyId ?? ''}`,
      `name:${query.nameQuery ?? ''}`,
    ].join('|');
  }
}
