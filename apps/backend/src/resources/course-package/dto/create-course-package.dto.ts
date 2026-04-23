import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCoursePackageDto {
  @ApiProperty({
    example: 'Spring semester core subjects',
    description: 'Display name of the course package',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  @MaxLength(128, { message: 'name must be at most 128 characters long' })
  name!: string;

  @ApiPropertyOptional({
    example: 'My go-to setup for the first semester.',
    description: 'Optional description of the package',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(1000, { message: 'description must be at most 1000 characters long' })
  description?: string;

  @ApiProperty({
    example: 'uuid-of-faculty',
    description: 'Faculty that owns the package',
  })
  @IsUUID('4', { message: 'facultyId must be a valid UUID' })
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
