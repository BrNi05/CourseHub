import { Injectable, ExecutionContext, UnauthorizedException, HttpException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext): any {
    if (err || !user) {
      // If the strategy explicitly threw an HttpException (jti blocked), rethrow it
      if (err instanceof HttpException) throw err;

      // Generic fallback for missing cookies, malformed token, or naturally expired token
      throw new UnauthorizedException('Érvénytelen azonosított állapot!');
    }

    return user; // req.user is populated
  }
}
