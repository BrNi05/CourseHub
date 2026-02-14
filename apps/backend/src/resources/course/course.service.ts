import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Course } from './entity/course.entity.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { CourseQueryDto } from './dto/query-course.dto.js';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Course> {
    return this.prisma.course.findUniqueOrThrow({ where: { id } });
  }

  async findByQuery(query: CourseQueryDto): Promise<Course[]> {
    const { universityId, courseName, courseCode } = query;

    return this.prisma.course.findMany({
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
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    await this.courseCodeStartsWithUniversityAbbrevNameHandler(dto.code, dto.facultyId);

    return this.prisma.course.create({
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
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const facultyId =
      dto.facultyId || (await this.prisma.course.findUniqueOrThrow({ where: { id } })).facultyId;

    const newCode =
      dto.code || (await this.prisma.course.findUniqueOrThrow({ where: { id } })).code;

    await this.courseCodeStartsWithUniversityAbbrevNameHandler(newCode, facultyId);

    const existingCourse = await this.prisma.course.findUniqueOrThrow({ where: { id } });

    return this.prisma.course.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        facultyId: dto.facultyId,
        coursePageUrl: this.normalizeUrl(dto.coursePageUrl) || existingCourse.coursePageUrl,
        courseTadUrl: this.normalizeUrl(dto.courseTadUrl) || existingCourse.courseTadUrl,
        courseMoodleUrl: this.normalizeUrl(dto.courseMoodleUrl) || existingCourse.courseMoodleUrl,
        courseTeamsUrl: this.normalizeUrl(dto.courseTeamsUrl) || existingCourse.courseTeamsUrl,
        courseExtraUrl: this.normalizeUrl(dto.courseExtraUrl) || existingCourse.courseExtraUrl,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.course.delete({ where: { id } });
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
}
