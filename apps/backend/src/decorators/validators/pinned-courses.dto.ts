import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export function IsPinnedCourses() {
  return applyDecorators(
    ApiPropertyOptional({
      type: 'array',
      items: { type: 'string' },
      description: 'Updated pinned courses IDs',
      example: ['uuid-of-course1', 'uuid-of-course2'],
    }),
    IsOptional(),
    IsArray({ message: 'pinnedCourses must be an array' }),
    ArrayUnique({ message: 'pinnedCourses must not contain duplicates' }),
    IsUUID('4', {
      each: true,
      message: 'each pinnedCourses entry must be a valid UUID',
    })
  );
}
