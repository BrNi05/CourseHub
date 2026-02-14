import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { Timestamp } from '../../../common/models/timestamp.model.js';
import { Course } from '../../course/entity/course.entity.js';

export class User extends Timestamp {
  @ApiProperty({
    example: 'uuid-of-user',
    description: 'Auto-generated ID of the user',
  })
  id!: string;

  @ApiProperty({ example: false, description: 'Whether the user has admin privileges' })
  isAdmin!: boolean;

  @ApiProperty({ example: '123456789012345678901', description: 'Google ID of the user' })
  googleId!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Google email of the user' })
  googleEmail!: string;

  @ApiProperty({
    type: () => [Course],
    description: 'Courses pinned by the user',
    required: false,
  })
  @Type(() => Course)
  pinnedCourses?: Course[];

  constructor(user: Partial<User>) {
    super(user);
    Object.assign(this, user);
  }
}
