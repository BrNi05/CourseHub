import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiNoContentResponse } from '@nestjs/swagger';

export function DeletedResponse(description = 'Deleted') {
  return applyDecorators(ApiNoContentResponse({ description }), HttpCode(HttpStatus.NO_CONTENT));
}
