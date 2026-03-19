import { IsOptional } from 'class-validator';
import { IsUUIDCustom } from '../../../decorators/validators/uuid-custom.decorator.js';
import { IsValidString } from '../../../decorators/validators/string.dto.js';

export class CourseQueryDto {
  @IsOptional()
  @IsValidString(
    'kurzus név',
    'Datab',
    'Filter by course name (partial, case-insensitive)',
    0,
    64,
    false
  )
  courseName?: string;

  @IsOptional()
  @IsValidString(
    'kurzus kód',
    'BMEVI',
    'Filter by course code (partial, case-insensitive)',
    0,
    16,
    false
  )
  courseCode?: string;

  @IsUUIDCustom(
    'universityId must be a valid UUID',
    'uuid-of-university',
    'University ID to filter courses by'
  )
  universityId!: string; // mandatory
}
