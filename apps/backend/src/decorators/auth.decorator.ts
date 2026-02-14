import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { ErrorResponse } from '../common/responses/error.response.js';

export function RequiresAuth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('jwt'),
    ApiResponse({
      status: 401,
      description: 'Unauthorized: invalid or missing auth token',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden: verified auth token but insufficient permissions',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
        },
      },
    })
  );
}
