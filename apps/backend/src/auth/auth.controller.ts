import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { DatabaseOperation } from '../decorators/responses/database-operation.decorator.js';
import { Throttable } from '../common/throttling/throttler.decorator.js';
import { GoogleCallbackDto } from './dto/google-callback.dto.js';

@Controller('auth')
// eslint-disable-next-line internal/no-serializer
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('google')
  @Throttable(60, 10)
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'LOGIN', description: 'Redirects to Google for authentication' })
  @ApiOkResponse({ description: 'Success' })
  async googleLogin(): Promise<void> {
    /* AuthGuard('google') triggers Passport, that handles the Google OAuth flow */
  }

  @Get('google/callback')
  @Throttable(60, 10)
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'LOGIN',
    description:
      'Completes Google login, then redirects to the frontend root route with the JWT in the URL fragment.',
  })
  @ApiOkResponse({
    description: 'Redirected',
  })
  @ApiUnauthorizedResponse({ description: 'Google authentication failed' })
  @DatabaseOperation()
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const { accessToken } = req.user as GoogleCallbackDto;
    const frontendUrl = this.configService.get<string>('CORS_ORIGIN')!.trim();

    const redirectUrl = new URL(frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`);
    redirectUrl.hash = new URLSearchParams({ token: accessToken }).toString();
    res.redirect(302, redirectUrl.toString());
  }
}
