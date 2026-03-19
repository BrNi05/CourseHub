import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(logger: LoggerService) {
    this.logger = logger.forContext(AdminGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // req.user is populated by the JWT strategy
    const user = request.user as { id: string; googleEmail: string; isAdmin: boolean };

    // undefined user or not admin
    if (!user?.isAdmin) {
      const clientIp = getClientIp(context);
      this.logger.warn(
        `Unauthorized admin access attempt. User: ${user?.googleEmail}, IP: ${clientIp}`
      );
      throw new UnauthorizedException('Admin privileges required');
    }

    return true;
  }
}
