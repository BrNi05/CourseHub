import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { PrismaService } from '../../prisma/prisma.service.js';
import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';
import type { IJwtPayload } from '../interfaces.js';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  private readonly logger: ContextualLogger;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    logger: LoggerService
  ) {
    this.logger = logger.forContext(UserOwnershipGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const resourceUserId = request.params.id;

    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      this.logger.warn(`Missing or invalid Authorization header for resource ${resourceUserId}`);
      throw new ForbiddenException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify<IJwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        algorithms: ['HS384'],
      });

      // Owner access
      if (payload.sub === resourceUserId) {
        this.logger.debug(`Owner access granted for user ${payload.sub}`);
        request.user = payload;
        return true;
      }

      // Admins can access any resource
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { isAdmin: true },
      });

      // If AuthAndOwnership() decorator is used not just for security but data input as well
      const doNotAllowAdminOverride =
        context.getHandler().name === 'ping' || context.getHandler().name === 'errorReport';

      // User does not exist anymore
      if (!user) throw new ForbiddenException('User not found');

      if (user.isAdmin && !doNotAllowAdminOverride) {
        this.logger.debug(
          `Admin override granted for user ${payload.sub} (${payload.email}) on user resource ${resourceUserId}`
        );
        request.user = payload;
        return true;
      }

      this.logger.warn(
        `Access denied. JWT sub ${payload.sub} is not owner nor admin for resource ${resourceUserId}`
      );

      throw new ForbiddenException('Access denied');
    } catch (err) {
      if (err instanceof ForbiddenException) throw err; // Avoid double logging ForbiddenException

      this.logger.warn(
        `JWT validation failed for resource ${resourceUserId}: ${(err as Error).message}`
      );

      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
