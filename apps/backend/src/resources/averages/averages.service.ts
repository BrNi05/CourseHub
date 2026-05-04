import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';

import { ONE_MONTH_CACHE_TTL } from '../../common/cache/cache-ttl.constants.js';
import { Prisma } from '../../prisma/generated/client/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

import { AveragesCalculation } from './entity/average.entity.js';

@Injectable()
export class AveragesService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService
  ) {}

  async findMine(userId: string): Promise<AveragesCalculation> {
    return await this.findByUserId(userId);
  }

  async findByUserId(userId: string): Promise<AveragesCalculation> {
    const cacheKey = this.getCacheKey(userId);
    const cached = await this.cacheManager.get<AveragesCalculation>(cacheKey);

    if (cached) return cached;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        creditProfile: true,
      },
    });

    const profile = new AveragesCalculation({
      userId: user.id,
      data: this.toAverageProfileData(user.creditProfile),
    });

    await this.cacheManager.set(cacheKey, profile, ONE_MONTH_CACHE_TTL);

    return profile;
  }

  async saveMine(userId: string, payload: unknown): Promise<AveragesCalculation> {
    const data = this.validatePayload(payload);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { creditProfile: data },
      select: {
        id: true,
        creditProfile: true,
      },
    });

    const profile = new AveragesCalculation({
      userId: user.id,
      data: this.toAverageProfileData(user.creditProfile),
    });

    await this.cacheManager.set(this.getCacheKey(userId), profile, ONE_MONTH_CACHE_TTL);

    return profile;
  }

  async deleteMine(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { creditProfile: {} },
    });
    await this.clearCacheForUser(userId);
  }

  async deleteForUser(userId: string): Promise<void> {
    await this.deleteMine(userId);
  }

  async clearCacheForUser(userId: string): Promise<void> {
    await this.cacheManager.del(this.getCacheKey(userId));
  }

  private validatePayload(payload: unknown): Prisma.InputJsonObject {
    if (!this.isPlainObject(payload)) {
      throw new BadRequestException('A bemeneti objektum hibás, nem JSON.');
    }

    const byteLength = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    if (byteLength > 10_000) {
      throw new BadRequestException('A bemeneti objektum túl nagy.');
    }

    return payload as Prisma.InputJsonObject;
  }

  private toAverageProfileData(value: unknown): Record<string, unknown> {
    if (this.isPlainObject(value)) return value;
    return {};
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || Array.isArray(value) || typeof value !== 'object') return false;
    return Object.getPrototypeOf(value) === Object.prototype;
  }

  private getCacheKey(userId: string): string {
    return `averages_${userId}`;
  }
}
