import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { AUTH_COOKIE_SECURITY_NAME } from '../../auth/auth.constants.js';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard.js';
import { ErrorResponse } from '../../common/responses/error.response.js';

export function RequiresAuth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiCookieAuth(AUTH_COOKIE_SECURITY_NAME),
    ApiResponse({
      status: 401,
      description: 'Unauthorized: invalid or missing auth cookie',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden: verified auth cookie but insufficient permissions',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
        },
      },
    })
  );
}
