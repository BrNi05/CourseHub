import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdatePinnedCoursesDto {
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Updated pinned courses IDs',
    example: ['uuid-of-course1', 'uuid-of-course2'],
  })
  @IsOptional()
  pinnedCourses?: string[]; // course IDs
}
