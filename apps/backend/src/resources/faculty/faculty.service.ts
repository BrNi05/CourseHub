import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../../prisma/prisma.service.js';

import { Faculty } from './entity/faculty.entity.js';
import { CreateFacultyDto } from './dto/create-faculty.dto.js';
import { UpdateFacultyDto } from './dto/update-faculty.dto.js';
import { FacultyWithoutCoursesDto } from './dto/faculty-response-nocourse.dto.js';

@Injectable()
export class FacultyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async getAllByUniversity(universityId: string): Promise<FacultyWithoutCoursesDto[]> {
    return await this.prisma.faculty.findMany({
      where: { universityId },
      include: { courses: false },
      orderBy: { name: 'asc' },
    });
  }

  async getOne(id: string): Promise<FacultyWithoutCoursesDto> {
    return await this.prisma.faculty.findUniqueOrThrow({
      where: { id },
      include: { courses: false },
    });
  }

  async getOneWithCourses(id: string): Promise<Faculty> {
    return await this.prisma.faculty.findUniqueOrThrow({
      where: { id },
      include: { courses: true },
    });
  }

  async create(dto: CreateFacultyDto): Promise<FacultyWithoutCoursesDto> {
    const faculty = await this.prisma.faculty.create({ data: dto });

    await this.eventEmitter.emitAsync('faculty.created');

    return faculty;
  }

  async update(id: string, dto: UpdateFacultyDto): Promise<Faculty> {
    const faculty = await this.prisma.faculty.update({
      where: { id },
      data: dto,
      include: { courses: true },
    });

    await this.eventEmitter.emitAsync('faculty.updated');

    return faculty;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.faculty.delete({ where: { id } });

    await this.eventEmitter.emitAsync('faculty.deleted');
  }
}
