import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { RequestWithAuthenticatedUserAndIdParam } from '../interfaces.js';
import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CoursePackageOwnershipGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(
    private readonly auditLogger: LoggerService,
    private readonly prisma: PrismaService
  ) {
    this.logger = auditLogger.forContext(CoursePackageOwnershipGuard.name);
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

    // Log if admin override access is granted
    if (user.isAdmin) {
      this.auditLogger.logAdminOperation(
        'CoursePackageOwnershipGuard Admin Override',
        true,
        getClientIp(context),
        `Admin ${user.googleEmail} accessed course package ${packageId}.`
      );
      return true;
    }

    const coursePackage = await this.prisma.coursePackage.findUniqueOrThrow({
      where: { id: packageId },
      select: { ownerId: true },
    });

    if (coursePackage.ownerId === user.id) return true;

    throw new ForbiddenException('Csak a saját kurzus csomagjaidhoz férhetsz hozzá!');
  }
}
