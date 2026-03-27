import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuthenticatedUser, IJwtPayload } from '../interfaces.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
      ignoreExpiration: false,
      algorithms: ['HS384'],
    });
  }

  // Assigned to req.user on successful Jwt auth
  async validate(payload: IJwtPayload): Promise<IAuthenticatedUser> {
    // If a user is deleted but their JWT is still valid, this will throw acting as a gateway
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });

    return {
      id: user.id,
      googleEmail: user.googleEmail,
      isAdmin: user.isAdmin,
    };
  }
}
