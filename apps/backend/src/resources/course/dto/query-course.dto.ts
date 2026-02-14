import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CourseQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by course name (partial, case-insensitive)',
    example: 'Datab',
  })
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional({
    description: 'Filter by course code (partial, case-insensitive)',
    example: 'BMEVI',
  })
  @IsOptional()
  @IsString()
  courseCode?: string;

  @ApiPropertyOptional({
    description: 'University ID to filter courses by',
    example: 'uuid-of-university',
  })
  @IsUUID()
  // mandatory
  universityId!: string;
}
