import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

import { ClientPlatform } from '../../../prisma/generated/client/client.js';

export class ErrorReportDto {
  @ApiProperty({
    description: 'Client version',
    example: '1.0.0',
  })
  @IsString()
  version!: string;

  @ApiProperty({
    enum: ClientPlatform,
    description: 'Client platform',
    example: ClientPlatform.windows,
  })
  @IsEnum(ClientPlatform)
  platform!: ClientPlatform;

  @ApiProperty({
    description: 'Route where the error occurred',
    example: '/courses/:id',
  })
  @IsString()
  route!: string;

  @ApiProperty({
    description: 'Action the user was performing when the error occurred',
    example: 'Loading course details',
  })
  @IsString()
  userAction!: string;

  @ApiProperty({
    description: 'Stack trace of the error',
    example: 'Error: Something went wrong at Object.<anonymous> (/app/src/main.ts:10:15)',
  })
  @IsString()
  trace!: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Something went wrong',
  })
  @IsString()
  message!: string;
}

// User ID is saved from :id param
// Timestamp is generated on receive
