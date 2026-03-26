import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../prisma/prisma.service.js';
import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';

import { User } from './entity/user.entity.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseWithoutPinnedDto } from './dto/user-response-nopinned.dto.js';

@Injectable()
export class UserService {
  private readonly getAllCacheKey = 'all_users_admin_nopinned';
  private getUserCacheKey(id: string) {
    return `user_${id}`;
  }

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
    logger: LoggerService
  ) {
    this.logger = logger.forContext(UserService.name);
  }

  private readonly logger: ContextualLogger;

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

  // Scoped invalidation based on course changes to avoid unnecessary cache invalidation for unaffected users
  @OnEvent('course.updated')
  @OnEvent('course.deleted')
  async handleCourseChange(payload?: { courseId?: string }) {
    await this.cacheManager.del(this.getAllCacheKey);
    const courseId = payload?.courseId;
    if (!courseId) {
      this.logger.log('Invalidated all users cache due to course change without a course ID.');
      return;
    }

    const affectedUsers = await this.prisma.user.findMany({
      where: {
        pinnedCourses: {
          some: { id: courseId },
        },
      },
      select: { id: true },
    });

    for (const user of affectedUsers) {
      await this.cacheManager.del(this.getUserCacheKey(user.id));
    }

    this.logger.log(
      `Invalidated ${affectedUsers.length} user cache entries due to course change for course ${courseId}.`
    );
  }

  // Mass invalidation of cache as such deletions affect many users
  @OnEvent('university.deleted')
  @OnEvent('faculty.deleted')
  async handleUniversityOrFacultyDeletion() {
    await this.resetAllUsersCache();
    this.logger.log('Reset all users cache due to university/faculty deletion.');
  }

  // Remove users who haven't updated their profile in the last year (inactive users)
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
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
