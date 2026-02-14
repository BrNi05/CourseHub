import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: true, description: 'Updated admin status' })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Updated pinned courses IDs',
    example: ['uuid-of-course1', 'uuid-of-course2'],
  })
  @IsOptional()
  pinnedCourses?: string[]; // course IDs
}
