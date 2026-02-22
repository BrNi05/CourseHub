import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { IsPinnedCourses } from '../../../decorators/validators/pinned-courses.dto.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: true, description: 'Updated admin status' })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsPinnedCourses()
  pinnedCourses?: string[]; // course IDs
}
