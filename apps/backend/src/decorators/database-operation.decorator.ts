import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ErrorResponse } from '../common/responses/error.response.js';

export function DatabaseOperation() {
  // Based on the Prisma exception filter
  const prismaErrorResponses = [
    { status: 400, description: 'Bad request (Prisma or database errors)' },
    { status: 404, description: 'Record or table not found' },
    { status: 409, description: 'Conflict (Unique constraint failed)' },
    { status: 500, description: 'Internal server error (DB connection issues)' },
    { status: 504, description: 'Database timeout' },
  ];

  const apiResponses = prismaErrorResponses.map((res) =>
    ApiResponse({
      status: res.status,
      description: res.description,
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
        },
      },
    })
  );

  return applyDecorators(ApiExtraModels(ErrorResponse), ...apiResponses);
}
