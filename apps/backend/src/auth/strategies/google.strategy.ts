import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

import { AuthService } from '../auth.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email'],
    });
  }

  // Callback function, that passport calls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validate(_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback) {
    const { id: googleId, emails } = profile;
    const email = emails?.[0]?.value;

    if (!email)
      return done(new UnauthorizedException('Nem érkezett email cím a Google-tól!'), false);

    let user = await this.prisma.user.findUnique({ where: { googleId } });
    const adminEmails = this.configService.get<string>('ADMIN_EMAILS')?.split(',') ?? [];
    const isAdmin = adminEmails.includes(email as string);

    user ??= await this.prisma.user.create({
      data: { googleId, googleEmail: email, isAdmin },
    });

    const jwt: string = this.authService.generateJwtToken({
      sub: user.id,
      email: user.googleEmail,
      exp: Math.floor(Date.now() / 1000) + 160 * 24 * 60 * 60, // in seconds since UNIX epoch
    });

    // Return to controller callback endpoint
    return done(null, { accessToken: jwt });
  }
}
