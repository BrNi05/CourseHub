import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { LoggerService, ContextualLogger } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';
import type { RequestWithAuthenticatedUser } from '../interfaces.js';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly auditLogger: ContextualLogger;

  constructor(loggerService: LoggerService) {
    this.auditLogger = loggerService.forContext(AdminGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUser>();

    const method = request.method || '???';
    const path = request.originalUrl || request.url || '???';
    const targetEndpoint = `${method} ${path}`;

    // undefined user or not admin
    // request.user is populated by the JwtStrategy.validate() method
    if (!request.user?.isAdmin) {
      this.auditLogger.logAdminOperation(
        'AdminGuard (canActivate)',
        false,
        getClientIp(context),
        `User ${request.user?.googleEmail} attempted admin access to ${targetEndpoint}.`
      );
      throw new UnauthorizedException('Hozzáférés megtagadva! Admin jogosultság szükséges!');
    }

    this.auditLogger.logAdminOperation(
      'AdminGuard (canActivate)',
      true,
      getClientIp(context),
      `Admin ${request.user.googleEmail} accessed an admin-protected route at ${targetEndpoint}.`
    );

    return true;
  }
}
