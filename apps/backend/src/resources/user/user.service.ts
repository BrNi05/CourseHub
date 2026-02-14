import { Injectable } from '@nestjs/common';

import { User } from './entity/user.entity.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseWithoutPinnedDto } from './dto/user-response-nopinned.dto.js';

import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(): Promise<UserResponseWithoutPinnedDto[]> {
    return this.prisma.user.findMany({ include: { pinnedCourses: false } });
  }

  async getUserById(id: string): Promise<User> {
    return await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { pinnedCourses: true },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        isAdmin: dto.isAdmin,
        pinnedCourses: dto.pinnedCourses
          ? { set: dto.pinnedCourses.map((courseId) => ({ id: courseId })) }
          : undefined,
      },
      include: { pinnedCourses: true },
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
