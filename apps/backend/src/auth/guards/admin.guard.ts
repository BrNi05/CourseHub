import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoggerService, ContextualLogger } from '../../logger/logger.service.js';
import { getClientIp } from '../../common/security/ip.resolver.js';
import type { RequestWithAuthenticatedUser } from '../interfaces.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly auditLogger: ContextualLogger;

  constructor(
    loggerService: LoggerService,
    private readonly prisma: PrismaService
  ) {
    this.auditLogger = loggerService.forContext(AdminGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUser>();

    const method = request.method || '???';
    const path = request.originalUrl || request.url || '???';
    const targetEndpoint = `${method} ${path}`;
    const clientIp = getClientIp(context);

    // undefined user or not admin
    // request.user is populated by the JwtStrategy.validate() method
    if (!request.user?.id || !request.user?.isAdmin || !request.user?.googleEmail) {
      this.auditLogger.logAdminOperation(
        'AdminGuard (canActivate)',
        false,
        clientIp,
        `User ${request.user?.googleEmail} attempted admin access to ${targetEndpoint}.`
      );
      throw new UnauthorizedException('Hozzáférés megtagadva! Admin jogosultság szükséges!');
    }

    // Second line of defense: stale or spoofed JWTs
    try {
      const dbUser = await this.prisma.user.findUniqueOrThrow({
        where: { id: request.user.id },
        select: { isAdmin: true, googleEmail: true },
      });

      if (!dbUser.isAdmin || dbUser.googleEmail !== request.user.googleEmail) {
        this.auditLogger.logAdminOperation(
          'AdminGuard (canActivate)',
          false,
          clientIp,
          `User ${request.user.googleEmail} attempted admin access to ${targetEndpoint}, but DB verification failed.`
        );
        throw new UnauthorizedException('Hozzáférés megtagadva! Admin jogosultság szükséges!');
      }
    } catch {
      this.auditLogger.logAdminOperation(
        'AdminGuard (canActivate)',
        false,
        clientIp,
        `User ${request.user.googleEmail} attempted admin access to ${targetEndpoint}, but user record no longer exists in DB.`
      );
      throw new UnauthorizedException('Hozzáférés megtagadva! Felhasználó nem található!');
    }

    this.auditLogger.logAdminOperation(
      'AdminGuard (canActivate)',
      true,
      clientIp,
      `Admin ${request.user.googleEmail} accessed an admin-protected route at ${targetEndpoint}.`
    );

    return true;
  }
}
