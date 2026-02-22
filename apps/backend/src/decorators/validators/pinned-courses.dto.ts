import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export function IsPinnedCourses() {
  return applyDecorators(
    ApiPropertyOptional({
      type: 'array',
      items: { type: 'string' },
      description: 'Updated pinned courses IDs',
      example: ['uuid-of-course1', 'uuid-of-course2'],
    }),
    IsOptional()
  );
}
