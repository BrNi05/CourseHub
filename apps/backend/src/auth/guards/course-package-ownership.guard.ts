import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { RequestWithAuthenticatedUserAndIdParam } from '../interfaces.js';
import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CoursePackageOwnershipGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(
    logger: LoggerService,
    private readonly prisma: PrismaService
  ) {
    this.logger = logger.forContext(CoursePackageOwnershipGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUserAndIdParam>();
    const packageId = request.params?.id;
    const user = request.user;

    if (!packageId) throw new ForbiddenException('Hiányzó kurzus csomag azonosító!');

    if (!user?.id) {
      this.logger.warn(`Missing authenticated user on request for course package ${packageId}`);
      throw new ForbiddenException('Invalid authenticated state.');
    }

    if (user.isAdmin) return true;

    const coursePackage = await this.prisma.coursePackage.findUniqueOrThrow({
      where: { id: packageId },
      select: { ownerId: true },
    });

    if (coursePackage.ownerId === user.id) return true;

    throw new ForbiddenException('Csak a saját kurzus csomagjaidhoz férhetsz hozzá!');
  }
}
