import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import type { IAuthenticatedUser } from '../interfaces.js';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(logger: LoggerService) {
    this.logger = logger.forContext(UserOwnershipGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: IAuthenticatedUser }>();
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

    // Admins can access any resource
    if (user.isAdmin && !doNotAllowAdminOverride) {
      this.logger.debug(
        `Admin override granted for user ${user.id} (${user.googleEmail}) on user resource ${resourceUserId}`
      );
      return true;
    }

    this.logger.warn(
      `Access denied. Authenticated user ${user.id} is not owner nor admin for resource ${resourceUserId}`
    );

    throw new ForbiddenException('Hozzáférés megtagadva!');
  }
}
