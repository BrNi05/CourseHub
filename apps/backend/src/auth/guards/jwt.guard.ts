import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Basically AuthGuard('jwt'), but with logging
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext): any {
    if (err || !user) {
      //const clientIp = getClientIp(context);
      //this.logger.warn(`Auth cookie validation failed. IP: ${clientIp}`); would log on every failed attempt, which is too noisy
      throw new UnauthorizedException('Érvénytelen azonosított állapot!');
    }

    return user; // req.user is populated
  }
}
