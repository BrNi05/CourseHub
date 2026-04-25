import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';
import type { RequestWithAuthenticatedUser } from '../interfaces.js';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(logger: LoggerService) {
    this.logger = logger.forContext(AdminGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUser>();

    // undefined user or not admin
    // request.user is populated by the JwtStrategy.validate() method
    if (!request.user?.isAdmin) {
      const clientIp = getClientIp(context);
      this.logger.warn(
        `Unauthorized admin access attempt. User: ${request.user?.googleEmail}, IP: ${clientIp}`
      );
      throw new UnauthorizedException('Hozzáférés megtagadva! Admin jogosultság szükséges!');
    }

    return true;
  }
}
