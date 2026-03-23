import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ErrorResponse } from '../../common/responses/error.response.js';
import { InternalOnlyGuard } from '../../common/security/guards/internal-only.guard.js';

export function InternalOnly() {
  return applyDecorators(
    UseGuards(InternalOnlyGuard),
    ApiExtraModels(ErrorResponse),
    ApiResponse({
      status: 403,
      description: 'Forbidden: endpoint is only accessible from configured internal networks',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
        },
      },
    })
  );
}
