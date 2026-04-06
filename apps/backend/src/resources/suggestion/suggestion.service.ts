import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../prisma/prisma.service.js';
import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';

import { Course } from '../course/entity/course.entity.js';
import { SuggestedCourse } from './entity/suggestion.entity.js';
import { CreateSuggestionDto } from './dto/create-suggestion.dto.js';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto.js';

import { CourseService } from '../course/course.service.js';
import { FacultyService } from '../faculty/faculty.service.js';
import { UniversityService } from '../university/university.service.js';

@Injectable()
export class SuggestionService {
  private readonly logger: ContextualLogger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly courseService: CourseService,
    private readonly facultyService: FacultyService,
    private readonly universityService: UniversityService,
    logger: LoggerService
  ) {
    this.logger = logger.forContext(SuggestionService.name);
  }

  async findAll(): Promise<SuggestedCourse[]> {
    return await this.prisma.suggestedCourse.findMany();
  }

  // For metrics, not used in the API
  async count(): Promise<number> {
    return await this.prisma.suggestedCourse.count();
  }

  async suggest(
    userId: string,
    createSuggestionDto: CreateSuggestionDto
  ): Promise<SuggestedCourse> {
    const userEmail = await this.prisma.user
      .findUniqueOrThrow({
        where: { id: userId },
        select: { googleEmail: true },
      })
      .then((user) => user.googleEmail);

    return await this.prisma.suggestedCourse.create({
      data: {
        userEmail: userEmail,
        ...createSuggestionDto,
      },
    });
  }

  // No transation client used, as no serious inconsistent state can occur on failure
  async accept(id: string): Promise<Course> {
    const suggestion = await this.prisma.suggestedCourse.findUniqueOrThrow({
      where: { id },
    });

    // Find or create the parent university
    let uniId: string;

    const university = await this.prisma.university.findUnique({
      where: { abbrevName: suggestion.uniAbbrevName },
    });
    uniId = university ? university.id : '';

    if (!university) {
      const createdUni = await this.universityService.create({
        name: suggestion.uniName,
        abbrevName: suggestion.uniAbbrevName,
      });

      uniId = createdUni.id;
    }

    // Find or create the parent faculty
    let facultyId: string;

    const faculty = await this.prisma.faculty.findUnique({
      where: {
        name_universityId: {
          name: suggestion.facultyName,
          universityId: uniId,
        },
      },
    });
    facultyId = faculty ? faculty.id : '';

    if (!faculty) {
      const createdFaculty = await this.facultyService.create({
        name: suggestion.facultyName,
        abbrevName: suggestion.facultyAbbrevName,
        universityId: uniId,
      });

      facultyId = createdFaculty.id;
    }

    // Create the course or update it
    const course = await this.courseService.upsert({
      name: suggestion.courseName,
      code: suggestion.courseCode,
      facultyId,
      coursePageUrl: suggestion.coursePageUrl,
      courseTadUrl: suggestion.courseTadUrl,
      courseMoodleUrl: suggestion.courseMoodleUrl,
      courseSubmissionUrl: suggestion.courseSubmissionUrl,
      courseTeamsUrl: suggestion.courseTeamsUrl,
      courseExtraUrl: suggestion.courseExtraUrl,
    });

    // Delete the suggestion
    await this.prisma.suggestedCourse.delete({ where: { id } });

    return course;
  }

  async update(id: string, updateSuggestionDto: UpdateSuggestionDto): Promise<SuggestedCourse> {
    return await this.prisma.suggestedCourse.update({
      where: { id },
      data: updateSuggestionDto,
    });
  }

  async delete(id: string): Promise<SuggestedCourse> {
    return await this.prisma.suggestedCourse.delete({ where: { id } });
  }

  // Cron to delete suggestions older than 29 days, runs every day at 7 AM
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async deleteOldSuggestions(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const deleted = await this.prisma.suggestedCourse.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Deleted ${deleted.count} old suggestions`);
  }
}
