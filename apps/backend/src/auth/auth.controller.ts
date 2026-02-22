import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { DatabaseOperation } from '../decorators/responses/database-operation.decorator.js';
import { Throttable } from '../common/throttling/throttler.decorator.js';
import { GoogleCallbackDto } from './dto/google-callback.dto.js';

@Controller('auth')
// eslint-disable-next-line internal/no-serializer
export class AuthController {
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
      'Returns JWT access token containing sub (uuid), email, and exp fields. Valid for roughly around a semester.',
  })
  @ApiOkResponse({
    type: GoogleCallbackDto,
    description: 'Success',
  })
  @ApiUnauthorizedResponse({ description: 'Google authentication failed' })
  @DatabaseOperation()
  googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): GoogleCallbackDto {
    res.contentType('application/json');
    return req.user as GoogleCallbackDto;
  }
}
