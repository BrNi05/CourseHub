import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { PrismaService } from '../../prisma/prisma.service.js';

import { University } from './entity/university.entity.js';
import { CreateUniversityDto } from './dto/create-university.dto.js';
import { UpdateUniversityDto } from './dto/update-university.dto.js';
import { UniversityWithoutFacultiesDto } from './dto/uni-reponse-nofaculty.dto.js';

@Injectable()
export class UniversityService {
  private readonly getAllCacheKey = 'all_universities_nofaculties';

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async findAll(): Promise<UniversityWithoutFacultiesDto[]> {
    const cached = await this.cacheManager.get<UniversityWithoutFacultiesDto[]>(
      this.getAllCacheKey
    );
    if (cached) return cached;

    const universities = await this.prisma.university.findMany({
      include: { faculties: false },
      orderBy: { name: 'asc' },
    });

    await this.cacheManager.set(this.getAllCacheKey, universities);

    return universities;
  }

  async findOne(id: string): Promise<UniversityWithoutFacultiesDto> {
    return await this.prisma.university.findUniqueOrThrow({
      where: { id },
      include: { faculties: false },
    });
  }

  async findAllWithFaculties(): Promise<University[]> {
    return await this.prisma.university.findMany({
      include: { faculties: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUniversityDto): Promise<University> {
    await this.resetAllCache();

    return await this.prisma.university.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateUniversityDto): Promise<University> {
    await this.resetAllCache();

    return await this.prisma.university.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.resetAllCache();

    await this.prisma.university.delete({
      where: { id },
    });

    await this.eventEmitter.emitAsync('university.deleted');
  }

  @OnEvent('faculty.created')
  @OnEvent('faculty.updated')
  @OnEvent('faculty.deleted')
  async resetAllCache() {
    await this.cacheManager.del(this.getAllCacheKey);
  }
}
