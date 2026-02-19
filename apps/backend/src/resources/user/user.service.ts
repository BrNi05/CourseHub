import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { OnEvent } from '@nestjs/event-emitter';

import { PrismaService } from '../../prisma/prisma.service.js';
import { LoggerService } from '../../logger/logger.service.js';

import { User } from './entity/user.entity.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseWithoutPinnedDto } from './dto/user-response-nopinned.dto.js';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UserService {
  private readonly getAllCacheKey = 'all_users_admin_nopinned';
  private getUserCacheKey(id: string) {
    return `user_${id}`;
  }

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {}

  async getAllUsers(): Promise<UserResponseWithoutPinnedDto[]> {
    // Cache without pinned courses
    const cached = await this.cacheManager.get<UserResponseWithoutPinnedDto[]>(this.getAllCacheKey);
    if (cached) return cached;

    const users = await this.prisma.user.findMany({ include: { pinnedCourses: false } });
    await this.cacheManager.set(this.getAllCacheKey, users, 0);

    return users;
  }

  async getUserById(id: string): Promise<User> {
    const cached = await this.cacheManager.get<User>(this.getUserCacheKey(id));
    if (cached) return cached;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { pinnedCourses: true },
    });

    await this.cacheManager.set(this.getUserCacheKey(id), user, 0);

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    await this.invalidateAllUsersCache(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isAdmin: dto.isAdmin,
        pinnedCourses: dto.pinnedCourses
          ? { set: dto.pinnedCourses.map((courseId) => ({ id: courseId })) }
          : undefined,
      },
      include: { pinnedCourses: true },
    });

    await this.cacheManager.set(this.getUserCacheKey(id), updatedUser, 0);

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await this.invalidateAllUsersCache(id); // GDPR compliance: remove from cache before deletion

    await this.prisma.user.delete({ where: { id } });
  }

  // Invalidates user specific and global users cache
  async invalidateAllUsersCache(id: string): Promise<void> {
    await this.cacheManager.del(this.getAllCacheKey);
    await this.cacheManager.del(this.getUserCacheKey(id));
  }

  // Invalidate global and all user specific cache
  async resetAllUsersCache() {
    await this.cacheManager.del(this.getAllCacheKey);

    const users = await this.prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await this.cacheManager.del(this.getUserCacheKey(user.id));
    }
  }

  // Also invalidate when pinned courses might change
  @OnEvent('university.deleted')
  @OnEvent('faculty.deleted')
  @OnEvent('course.updated')
  @OnEvent('course.deleted')
  async handleUniversityChange() {
    await this.cacheManager.del(this.getAllCacheKey);
    this.logger.log('Invalidated all users cache due to university/faculty/course change.');

    // Load all user IDs from DB and check if their pinned courses are different from the cached version
    const users = await this.prisma.user.findMany({ include: { pinnedCourses: true } });
    for (const user of users) {
      const cached = await this.cacheManager.get<User>(this.getUserCacheKey(user.id));

      if (cached?.pinnedCourses && user.pinnedCourses) {
        const cachedCourseIds = new Set(cached.pinnedCourses.map((c) => c.id));
        const currentCourseIds = new Set(user.pinnedCourses.map((c) => c.id));

        if (
          cachedCourseIds.size !== currentCourseIds.size ||
          [...cachedCourseIds].some((id) => !currentCourseIds.has(id))
        ) {
          await this.cacheManager.del(this.getUserCacheKey(user.id));
        }
      }
    }
  }

  // Remove users who haven't updated their profile in the last year (inactive users)
  @Cron('0 5 * * *')
  async removeInactiveUsers(): Promise<void> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const inactiveUsers = await this.prisma.user.findMany({
      where: { updatedAt: { lt: oneYearAgo } },
      select: { id: true },
    });

    // Users who pinged the server but haven't updated their profile in the last year should be considered active
    const activeUserIds = await this.prisma.clientPing
      .findMany({
        where: { createdAt: { gte: oneYearAgo } },
        distinct: ['userId'],
        select: { userId: true },
      })
      .then((pings) => new Set(pings.map((ping) => ping.userId)));

    for (const user of inactiveUsers) {
      if (activeUserIds.has(user.id)) {
        continue;
      }
      await this.deleteUser(user.id);
      this.logger.log(`Deleted inactive user with ID: ${user.id}`);
    }
  }
}
