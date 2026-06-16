import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { DatabaseOperation } from '../decorators/responses/database-operation.decorator.js';
import { Throttable } from '../common/throttling/throttler.decorator.js';
import { RequiresAuth } from '../decorators/auth/auth.decorator.js';
import { AuthUserId } from '../decorators/auth/user-id.decorator.js';
import { GoogleCallbackDto } from './dto/google-callback.dto.js';
import { AuthSessionDto } from './dto/auth-session.dto.js';
import { AuthService } from './auth.service.js';

import { AUTH_COOKIE_NAME } from './auth.constants.js';
import {
  ONE_MINUTE_THROTTLE_TTL,
  AUTH_ME_THROTTLE_LIMIT,
  GOOGLE_LOGINOUT_THROTTLE_LIMIT,
} from '../common/throttling/throttling.constants.js';

@Controller('auth')
// eslint-disable-next-line internal/no-serializer
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'LOGIN', description: 'Redirects to Google for authentication' })
  @ApiOkResponse({ description: 'Success' })
  @Throttable(ONE_MINUTE_THROTTLE_TTL, GOOGLE_LOGINOUT_THROTTLE_LIMIT)
  async googleLogin(): Promise<void> {
    /* AuthGuard('google') triggers Passport, that handles the Google OAuth flow */
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'LOGIN',
    description:
      'Completes Google login, sets the authentication cookie, then redirects to the frontend root route.',
  })
  @ApiOkResponse({
    description: 'Redirected',
  })
  @ApiUnauthorizedResponse({ description: 'Google authentication failed' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, GOOGLE_LOGINOUT_THROTTLE_LIMIT)
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const { accessToken } = req.user as GoogleCallbackDto;
    const frontendUrl = this.configService.get<string>('CORS_ORIGIN')!.trim();
    const isSecure = this.configService.get<string>('NODE_ENV') === 'production';

    const redirectUrl = new URL(frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`);
    redirectUrl.searchParams.set('login', 'success');

    this.authService.setAuthCookie(res, accessToken, isSecure);
    res.redirect(302, redirectUrl.toString());
  }

  @Get('me')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Returns the authenticated user derived from the auth cookie.',
  })
  @ApiOkResponse({ description: 'Authenticated user session', type: AuthSessionDto })
  @Header('Cache-Control', 'private, no-store')
  @Throttable(ONE_MINUTE_THROTTLE_TTL, AUTH_ME_THROTTLE_LIMIT)
  async me(@AuthUserId() userId: string): Promise<AuthSessionDto> {
    return await Promise.resolve({ id: userId });
  }

  @Post('logout')
  @RequiresAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'LOGOUT',
    description: 'Blacklists the JWT and clears the authentication cookie.',
  })
  @ApiNoContentResponse({ description: 'Logged out' })
  @Throttable(ONE_MINUTE_THROTTLE_TTL, GOOGLE_LOGINOUT_THROTTLE_LIMIT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    // Blacklist the JWT
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (typeof token === 'string') await this.authService.blacklistToken(token);

    // Clear the auth cookie
    const isSecure = this.configService.get<string>('NODE_ENV') === 'production';
    this.authService.clearAuthCookie(res, isSecure);
  }
}
