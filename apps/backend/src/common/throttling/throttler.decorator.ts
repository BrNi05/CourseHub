import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ErrorResponse } from '../responses/error.response.js';

export function Throttable(ttlSeconds: number, limit: number) {
  const throttleDecorator = Throttle({ default: { limit, ttl: ttlSeconds } });
  const apiExtra = ApiExtraModels(ErrorResponse);
  const apiResponse = ApiResponse({
    status: 429,
    description: 'Too many requests',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponse) },
      },
    },
  });

  return applyDecorators(throttleDecorator, apiExtra, apiResponse);
}
