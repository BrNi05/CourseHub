import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';

// Basically AuthGuard('jwt'), but with logging
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger: ContextualLogger;

  constructor(logger: LoggerService) {
    super();
    this.logger = logger.forContext(JwtAuthGuard.name);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any, _info: any, context: ExecutionContext): any {
    if (err || !user) {
      const clientIp = getClientIp(context);
      this.logger.warn(`JWT validation failed. IP: ${clientIp}`);
      throw new UnauthorizedException('Invalid or missing JWT');
    }

    return user; // req.user is populated
  }
}
