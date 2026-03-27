import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ErrorResponse } from '../../common/responses/error.response.js';

import { AdminGuard } from '../../auth/guards/admin.guard.js';

import { RequiresAuth } from './auth.decorator.js';

export const ADMIN_KEY = 'isAdmin';

export function Admin() {
  return applyDecorators(
    SetMetadata(ADMIN_KEY, true),
    RequiresAuth(),
    UseGuards(AdminGuard),
    ApiBearerAuth('admin'),
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
