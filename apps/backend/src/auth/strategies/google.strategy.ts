import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, type Profile } from 'passport-google-oauth20';
import { Request } from 'express';

import { AuthService } from '../auth.service.js';
import { OAuthStateStore } from '../oauth-state.store.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoggerService, ContextualLogger } from '../../logger/logger.service.js';
import {
  isProduction,
  AUTH_COOKIE_MAX_AGE_MS_DEV,
  AUTH_COOKIE_MAX_AGE_MS_PROD,
} from '../auth.constants.js';
import { getClientIp } from '../../common/security/ip.resolver.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly auditLogger: ContextualLogger;

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    logger: LoggerService,
    oauthStateStore: OAuthStateStore
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email'],
      store: oauthStateStore,
      passReqToCallback: true, // For IP logging
    });

    this.auditLogger = logger.forContext('GoogleLogin');
  }

  // Callback function, that passport calls
  async validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) {
    const { id: googleId, emails } = profile;
    const email = emails?.[0]?.value;

    if (!email)
      return done(new UnauthorizedException('Nem érkezett email cím a Google-tól!'), false);

    let user = await this.prisma.user.findUnique({ where: { googleId } });
    const adminEmails = this.configService.get<string>('ADMIN_EMAILS')?.split(',') ?? [];
    const isAdmin = adminEmails.includes(email);

    user ??= await this.prisma.user.create({
      data: { googleId, googleEmail: email, isAdmin },
    });

    if (user.isAdmin) {
      const isMfaSent = await this.authService.generateAndSendAdminMfaToken(
        user.googleEmail,
        user.id
      );

      if (!isMfaSent) {
        this.auditLogger.logAdminOperation(
          'Admin Login',
          false,
          getClientIp(req),
          `Admin ${email} login failed! MFA token could not be sent via Discord.`
        );

        return done(new UnauthorizedException('Discord Timeout: Could not send MFA token.'), false);
      }

      this.auditLogger.logAdminOperation(
        'Admin Login',
        true,
        getClientIp(req),
        `Admin ${email} logged in. Session and MFA will expire in 30 mins.`
      );
    }

    const jwt: string = this.authService.generateJwtToken({
      sub: user.id,
      email: user.googleEmail,
      exp: isProduction()
        ? Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE_MS_PROD / 1000 // in seconds since UNIX epoch (30 minutes)
        : Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE_MS_DEV / 1000, // in seconds since UNIX epoch (160 days)
      // jti is generated inside generateJwtToken, so it's not set here
    });

    // Return to controller callback endpoint
    return done(null, { accessToken: jwt });
  }
}
