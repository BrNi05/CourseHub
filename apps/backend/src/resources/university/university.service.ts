import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

import { University } from './entity/university.entity.js';
import { CreateUniversityDto } from './dto/create-university.dto.js';
import { UpdateUniversityDto } from './dto/update-university.dto.js';
import { UniversityWithoutFacultiesDto } from './dto/uni-reponse-nofaculty.dto.js';

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UniversityWithoutFacultiesDto[]> {
    return await this.prisma.university.findMany({
      include: { faculties: false },
      orderBy: { name: 'asc' },
    });
  }

  async findAllWithFaculties(): Promise<University[]> {
    return await this.prisma.university.findMany({
      include: { faculties: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUniversityDto): Promise<University> {
    return await this.prisma.university.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateUniversityDto): Promise<University> {
    return await this.prisma.university.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.university.delete({
      where: { id },
    });
  }
}
