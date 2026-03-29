import { ApiProperty } from '@nestjs/swagger';
export class AuthSessionDto {
  @ApiProperty({
    example: 'uuid-of-user',
    description: 'Authenticated user ID',
  })
  id!: string;
}
