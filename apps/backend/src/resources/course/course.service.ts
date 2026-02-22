import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { LRUCache } from 'lru-cache';

import { PrismaService } from '../../prisma/prisma.service.js';

import { Course } from './entity/course.entity.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { CourseQueryDto } from './dto/query-course.dto.js';

@Injectable()
export class CourseService {
  private readonly queryCache = new LRUCache<string, Course[]>({
    max: 10000, // max 10000 queries in cache
    ttl: 1000 * 60 * 60 * 24 * 5, // 5 days
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
    await this.cacheManager.set(cacheKey, course, 0);

    return course;
  }

  // In memory cache
  async findByQuery(query: CourseQueryDto): Promise<Course[]> {
    query.courseCode = query.courseCode?.toLowerCase();
    query.courseName = query.courseName?.toLowerCase();

    const cacheKey = JSON.stringify(query);

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
    });

    this.queryCache.set(cacheKey, result);

    return result;
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    await this.courseCodeStartsWithUniversityAbbrevNameHandler(dto.code, dto.facultyId);

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        code: dto.code,
        facultyId: dto.facultyId,
        coursePageUrl: this.normalizeUrl(dto.coursePageUrl),
        courseTadUrl: this.normalizeUrl(dto.courseTadUrl),
        courseMoodleUrl: this.normalizeUrl(dto.courseMoodleUrl),
        courseTeamsUrl: this.normalizeUrl(dto.courseTeamsUrl),
        courseExtraUrl: this.normalizeUrl(dto.courseExtraUrl),
      },
    });

    await this.cacheManager.set(`course_${course.id}`, course, 0);

    return course;
  }

  async upsert(dto: CreateCourseDto): Promise<Course> {
    await this.courseCodeStartsWithUniversityAbbrevNameHandler(dto.code, dto.facultyId);

    const course = await this.prisma.course.upsert({
      where: { code: dto.code },
      create: dto,
      update: dto,
    });

    await this.cacheManager.set(`course_${course.id}`, course, 0);
    this.clearSearchQueryCache();
    await this.eventEmitter.emitAsync('course.updated');

    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    await this.cacheManager.del(`course_${id}`);
    this.clearSearchQueryCache();

    const existingCourse = await this.prisma.course.findUniqueOrThrow({ where: { id } });

    const facultyId = existingCourse.facultyId;
    const newCode = dto.code || existingCourse.code;

    await this.courseCodeStartsWithUniversityAbbrevNameHandler(newCode, facultyId);

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        facultyId,
        coursePageUrl: this.normalizeUrl(dto.coursePageUrl) || existingCourse.coursePageUrl,
        courseTadUrl: this.normalizeUrl(dto.courseTadUrl) || existingCourse.courseTadUrl,
        courseMoodleUrl: this.normalizeUrl(dto.courseMoodleUrl) || existingCourse.courseMoodleUrl,
        courseTeamsUrl: this.normalizeUrl(dto.courseTeamsUrl) || existingCourse.courseTeamsUrl,
        courseExtraUrl: this.normalizeUrl(dto.courseExtraUrl) || existingCourse.courseExtraUrl,
      },
    });

    await this.cacheManager.set(`course_${id}`, updatedCourse, 0);

    await this.eventEmitter.emitAsync('course.updated');

    return updatedCourse;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.course.delete({ where: { id } }); // No GDPR compliance is needed here
    await this.cacheManager.del(`course_${id}`);
    this.clearSearchQueryCache();
    await this.eventEmitter.emitAsync('course.deleted');
  }

  // Map emptry string or undefined to empty string ('') for Prisma
  private normalizeUrl(url?: string): string {
    if (!url || url.trim() === '') return '';
    return url;
  }

  // Checks if course code starts with faculties parent university abbrev name (case-sensitive)
  private async courseCodeStartsWithUniversityAbbrevNameHandler(
    courseCode: string,
    facultyId: string
  ): Promise<void> {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { university: true },
    });

    if (!faculty || !courseCode.startsWith(faculty.university.abbrevName)) {
      throw new BadRequestException(
        `Course code (${courseCode}) must start with the university abbreviation: ${faculty!.university.abbrevName}`
      );
    }
  }

  // Clears the in-memory cache
  @OnEvent('university.deleted')
  @OnEvent('faculty.deleted')
  clearSearchQueryCache() {
    this.queryCache.clear();
  }
}
