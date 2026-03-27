import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { LRUCache } from 'lru-cache';

import { ONE_MONTH_CACHE_TTL } from '../../common/cache/cache-ttl.constants.js';
import { PrismaService } from '../../prisma/prisma.service.js';

import { Course } from './entity/course.entity.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { CourseQueryDto } from './dto/query-course.dto.js';

@Injectable()
export class CourseService {
  private readonly queryCache = new LRUCache<string, Course[]>({
    max: 10000, // max 10000 queries in cache
    ttl: 1000 * 60 * 60 * 24 * 7 * 2, // 2 weeks
  });

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async findById(id: string): Promise<Course> {
    const cacheKey = `course_${id}`;

    const cached = await this.cacheManager.get<Course>(cacheKey);
    if (cached) {
      return cached;
    }

    const course = await this.prisma.course.findUniqueOrThrow({ where: { id } });
    await this.cacheManager.set(cacheKey, course, ONE_MONTH_CACHE_TTL);

    return course;
  }

  // In memory cache
  async findByQuery(query: CourseQueryDto): Promise<Course[]> {
    query.courseCode = query.courseCode?.toLowerCase();
    query.courseName = query.courseName?.toLowerCase();

    const cacheKey = this.buildQueryCacheKey(query);

    const cached = this.queryCache.get(cacheKey);
    if (cached) return cached;

    const { universityId, courseName, courseCode } = query;

    const result = await this.prisma.course.findMany({
      where: {
        faculty: {
          universityId, // ensures course belongs to a faculty of this university
        },
        AND: [
          courseName ? { name: { contains: courseName, mode: 'insensitive' } } : {},
          courseCode ? { code: { contains: courseCode, mode: 'insensitive' } } : {},
        ],
      },
      orderBy: { name: 'asc' },
      take: 30, // a good search should never return more then 30 results
    });

    this.queryCache.set(cacheKey, result);

    return result;
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    const normalizedCode = await this.normalizeCourseCode(dto.code, dto.facultyId);

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        code: normalizedCode,
        facultyId: dto.facultyId,
        coursePageUrl: this.normalizeUrl(dto.coursePageUrl),
        courseTadUrl: this.normalizeUrl(dto.courseTadUrl),
        courseMoodleUrl: this.normalizeUrl(dto.courseMoodleUrl),
        courseSubmissionUrl: this.normalizeUrl(dto.courseSubmissionUrl),
        courseTeamsUrl: this.normalizeUrl(dto.courseTeamsUrl),
        courseExtraUrl: this.normalizeUrl(dto.courseExtraUrl),
      },
    });

    await this.cacheManager.set(`course_${course.id}`, course, ONE_MONTH_CACHE_TTL);
    this.clearSearchQueryCache();

    return course;
  }

  async upsert(dto: CreateCourseDto): Promise<Course> {
    const normalizedCode = await this.normalizeCourseCode(dto.code, dto.facultyId);
    const normalizedDto = { ...dto, code: normalizedCode };

    const course = await this.prisma.course.upsert({
      where: { code: normalizedCode },
      create: normalizedDto,
      update: normalizedDto,
    });

    await this.cacheManager.set(`course_${course.id}`, course, ONE_MONTH_CACHE_TTL);
    this.clearSearchQueryCache();
    await this.eventEmitter.emitAsync('course.updated', { courseId: course.id });

    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    await this.cacheManager.del(`course_${id}`);
    this.clearSearchQueryCache();

    const existingCourse = await this.prisma.course.findUniqueOrThrow({ where: { id } });

    const facultyId = existingCourse.facultyId;
    const newCode = dto.code || existingCourse.code;

    const normalizedCode = await this.normalizeCourseCode(newCode, facultyId);

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code ? normalizedCode : undefined,
        facultyId,
        coursePageUrl: this.normalizeUrl(dto.coursePageUrl) || existingCourse.coursePageUrl,
        courseTadUrl: this.normalizeUrl(dto.courseTadUrl) || existingCourse.courseTadUrl,
        courseMoodleUrl: this.normalizeUrl(dto.courseMoodleUrl) || existingCourse.courseMoodleUrl,
        courseSubmissionUrl:
          this.normalizeUrl(dto.courseSubmissionUrl) || existingCourse.courseSubmissionUrl,
        courseTeamsUrl: this.normalizeUrl(dto.courseTeamsUrl) || existingCourse.courseTeamsUrl,
        courseExtraUrl: this.normalizeUrl(dto.courseExtraUrl) || existingCourse.courseExtraUrl,
      },
    });

    await this.cacheManager.set(`course_${id}`, updatedCourse, ONE_MONTH_CACHE_TTL);

    await this.eventEmitter.emitAsync('course.updated', { courseId: updatedCourse.id });

    return updatedCourse;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.course.delete({ where: { id } }); // No GDPR compliance is needed here
    await this.cacheManager.del(`course_${id}`);
    this.clearSearchQueryCache();
    await this.eventEmitter.emitAsync('course.deleted', { courseId: id });
  }

  // Map emptry string or undefined to empty string ('') for Prisma
  private normalizeUrl(url?: string): string {
    if (!url || url.trim() === '') return '';
    return url;
  }

  // Ensures course code starts with the parent university abbreviation
  private async normalizeCourseCode(courseCode: string, facultyId: string): Promise<string> {
    const normalizedCourseCode = courseCode.trim();
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { university: true },
    });

    if (!faculty) throw new BadRequestException(`Faculty (${facultyId}) does not exist`);

    if (normalizedCourseCode.startsWith(faculty.university.abbrevName)) return normalizedCourseCode;

    return `${faculty.university.abbrevName}${normalizedCourseCode}`;
  }

  // Clears the in-memory cache
  @OnEvent('university.deleted')
  @OnEvent('faculty.deleted')
  clearSearchQueryCache() {
    this.queryCache.clear();
  }

  private buildQueryCacheKey(query: CourseQueryDto): string {
    return [
      `university:${query.universityId}`,
      `name:${query.courseName ?? ''}`,
      `code:${query.courseCode ?? ''}`,
    ].join('|');
  }
}
