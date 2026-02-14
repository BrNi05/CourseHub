import { ApiProperty } from '@nestjs/swagger';

export class GoogleCallbackDto {
  @ApiProperty({
    description: 'JWT access token containing sub (uuid), email, and exp fields',
    example: 'header.payload.signature',
  })
  accessToken!: string;
}
