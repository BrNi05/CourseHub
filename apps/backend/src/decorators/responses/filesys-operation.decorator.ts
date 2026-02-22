import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ErrorResponse } from '../../common/responses/error.response.js';

export function FileSystemOperation() {
  return applyDecorators(
    ApiExtraModels(ErrorResponse),
    ApiResponse({
      status: 500,
      description: 'File system operation failed',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
        },
      },
    })
  );
}
