/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';

import { IsUUIDCustom } from '../../../decorators/validators/uuid-custom.decorator.js';
import { IsValidString } from '../../../decorators/validators/string.dto.js';

export class CreateCoursePackageDto {
  @IsValidString(
    'csomag nevének',
    'BME VIK Mernokfino 1. felev',
    'Display name of the course package',
    6,
    64,
    true,
    ({ value }) => (typeof value === 'string' ? value.trim() : value)
  )
  name!: string;

  @IsValidString(
    'leírás',
    'My go-to setup for the first semester.',
    'Optional description of the package',
    0,
    256,
    false,
    ({ value }) => (typeof value === 'string' ? value.trim() : value)
  )
  description?: string;

  @IsUUIDCustom(
    'facultyId must be a valid UUID',
    'uuid-of-faculty',
    'Faculty that owns the package'
  )
  facultyId!: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'uuid' },
    example: ['uuid-of-course-1', 'uuid-of-course-2'],
    description: 'Courses included in the package',
  })
  @IsArray({ message: 'courseIds must be an array' })
  @ArrayNotEmpty({ message: 'Legalább egy kurzust fel kell venni a csomagba.' })
  @ArrayUnique({ message: 'A kurzusok nem lehetnek ismétlődőek.' })
  @IsUUID('4', { each: true, message: 'each courseIds entry must be a valid UUID' })
  courseIds!: string[];
}
