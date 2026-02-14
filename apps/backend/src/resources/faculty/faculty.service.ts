import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

import { Faculty } from './entity/faculty.entity.js';
import { CreateFacultyDto } from './dto/create-faculty.dto.js';
import { UpdateFacultyDto } from './dto/update-faculty.dto.js';
import { FacultyWithoutCoursesDto } from './dto/faculty-response-nocourse.dto.js';

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllByUniversity(universityId: string): Promise<FacultyWithoutCoursesDto[]> {
    return await this.prisma.faculty.findMany({
      where: { universityId },
      include: { courses: false },
      orderBy: { name: 'asc' },
    });
  }

  async getOne(id: string): Promise<Faculty> {
    return await this.prisma.faculty.findUniqueOrThrow({
      where: { id },
      include: { courses: true },
    });
  }

  async create(dto: CreateFacultyDto): Promise<FacultyWithoutCoursesDto> {
    return await this.prisma.faculty.create({ data: dto });
  }

  async update(id: string, dto: UpdateFacultyDto): Promise<Faculty> {
    return await this.prisma.faculty.update({
      where: { id },
      data: dto,
      include: { courses: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.faculty.delete({ where: { id } });
  }
}
