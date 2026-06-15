import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';
import type { RequestWithAuthenticatedUserAndIdParam } from '../interfaces.js';
import { AuthService } from '../auth.service.js';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(
    private readonly auditLogger: LoggerService,
    private readonly authService: AuthService
  ) {
    this.logger = auditLogger.forContext(UserOwnershipGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUserAndIdParam>();
    const resourceUserId = request.params.id; // GET /users/:id
    const user = request.user;
    const ipAddr = getClientIp(context);

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
      const isMfaValid = await this.authService.verifyAdminMfaToken(
        user.id,
        request.headers['x-admin-api-mfa'] as string
      );

      if (!isMfaValid) {
        this.auditLogger.logAdminOperation(
          'UserOwnershipGuard Admin Override',
          false,
          ipAddr,
          `Admin ${user.googleEmail} failed MFA verification during override for user resource ${resourceUserId}.`
        );

        throw new ForbiddenException('Érvénytelen vagy hiányzó másodlagos azonosító (MFA)!');
      }

      this.auditLogger.logAdminOperation(
        'UserOwnershipGuard Admin Override',
        true,
        ipAddr,
        `Admin ${user.googleEmail} accessed user resource ${resourceUserId}.`
      );
      return true;
    }

    // Log if admin override access is denied
    if (user.isAdmin) {
      this.auditLogger.logAdminOperation(
        'UserOwnershipGuard Admin Override',
        false,
        ipAddr,
        `Admin ${user.googleEmail} was denied access for user resource ${resourceUserId}.`
      );
    } else {
      this.logger.warn(
        `User ${user.id} attempted to access resource ${resourceUserId}. Context: HTTP ${request.method} ${request.url}. IP: ${ipAddr}`
      );
    }

    throw new ForbiddenException('Hozzáférés megtagadva!');
  }
}
