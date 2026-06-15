import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { RequestWithAuthenticatedUserAndIdParam } from '../interfaces.js';
import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from '../auth.service.js';

@Injectable()
export class CoursePackageOwnershipGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(
    private readonly auditLogger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {
    this.logger = auditLogger.forContext(CoursePackageOwnershipGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUserAndIdParam>();
    const packageId = request.params?.id;
    const user = request.user;
    const ipAddr = getClientIp(context);

    if (!packageId) throw new ForbiddenException('Hiányzó kurzus csomag azonosító!');

    if (!user?.id) {
      this.logger.warn(`Missing authenticated user on request for course package ${packageId}`);
      throw new ForbiddenException('Invalid authenticated state.');
    }

    // Log if admin override access is granted
    if (user.isAdmin) {
      const isMfaValid = await this.authService.verifyAdminMfaToken(
        user.id,
        request.headers['x-admin-api-mfa'] as string
      );

      if (!isMfaValid) {
        this.auditLogger.logAdminOperation(
          'CoursePackageOwnershipGuard Admin Override',
          false,
          ipAddr,
          `Admin ${user.googleEmail} failed MFA verification accessing course package ${packageId}.`
        );

        throw new ForbiddenException('Érvénytelen vagy hiányzó másodlagos azonosító (MFA)!');
      }

      this.auditLogger.logAdminOperation(
        'CoursePackageOwnershipGuard Admin Override',
        true,
        ipAddr,
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
