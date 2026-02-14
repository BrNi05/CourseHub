import { ApiProperty } from '@nestjs/swagger';

import { Timestamp } from '../../../common/models/timestamp.model.js';

export class UserResponseWithoutPinnedDto extends Timestamp {
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

  constructor(user: Partial<UserResponseWithoutPinnedDto>) {
    super(user);
    Object.assign(this, user);
  }
}
