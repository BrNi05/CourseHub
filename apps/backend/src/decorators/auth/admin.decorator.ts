import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { AUTH_COOKIE_SECURITY_NAME } from '../../auth/auth.constants.js';
import { ErrorResponse } from '../../common/responses/error.response.js';

import { AdminGuard } from '../../auth/guards/admin.guard.js';

import { RequiresAuth } from './auth.decorator.js';

export const ADMIN_KEY = 'isAdmin';

export function Admin() {
  return applyDecorators(
    SetMetadata(ADMIN_KEY, true),
    RequiresAuth(),
    UseGuards(AdminGuard),
    ApiCookieAuth(AUTH_COOKIE_SECURITY_NAME),
    ApiResponse({
      status: 401,
      description: 'Not an admin',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
        },
      },
    })
  );
}
