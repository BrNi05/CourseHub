import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';
import type { RequestWithAuthenticatedUserAndIdParam } from '../interfaces.js';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(private readonly auditLogger: LoggerService) {
    this.logger = auditLogger.forContext(UserOwnershipGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUserAndIdParam>();
    const resourceUserId = request.params.id; // GET /users/:id
    const user = request.user;

    if (!user?.id) {
      this.logger.warn(`Missing authenticated user on request for resource ${resourceUserId}`);
      throw new ForbiddenException('Érvénytelen azonosított állapot!');
    }

    // Owner access
    if (user.id === resourceUserId) return true;

    // If AuthAndOwnership() decorator is used not just for security but data input as well
    const doNotAllowAdminOverride =
      context.getHandler().name === 'ping' || context.getHandler().name === 'errorReport';

    // Log if admin override access is granted
    if (user.isAdmin && !doNotAllowAdminOverride) {
      this.auditLogger.logAdminOperation(
        'UserOwnershipGuard Admin Override',
        true,
        getClientIp(context),
        `Admin ${user.googleEmail} accessed user resource ${resourceUserId}.`
      );
      return true;
    }

    // Log if admin override access is denied
    if (user.isAdmin) {
      this.auditLogger.logAdminOperation(
        'UserOwnershipGuard Admin Override',
        false,
        getClientIp(context),
        `Admin ${user.googleEmail} was denied access for user resource ${resourceUserId}.`
      );
    }

    this.logger.warn(
      `Access denied. Authenticated user ${user.id} is not owner nor admin for resource ${resourceUserId}`
    );

    throw new ForbiddenException('Hozzáférés megtagadva!');
  }
}
