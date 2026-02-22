import { ApiProperty } from '@nestjs/swagger';
import { IsString, Max } from 'class-validator';

import { ClientPlatform } from '../../../prisma/generated/client/client.js';
import { SemverVersion } from '../../../decorators/validators/semver.dto.js';
import { IsClientPlatform } from '../../../decorators/validators/client-platform.dto.js';

export class ErrorReportDto {
  @SemverVersion()
  version!: string;

  @IsClientPlatform()
  platform!: ClientPlatform;

  @ApiProperty({
    description: 'Route where the error occurred',
    example: '/courses/:id',
  })
  @IsString()
  @Max(128)
  route!: string;

  @ApiProperty({
    description: 'Action the user was performing when the error occurred',
    example: 'Loading course details',
  })
  @IsString()
  @Max(128)
  userAction!: string;

  @ApiProperty({
    description: 'Stack trace of the error',
    example: 'Error: Something went wrong at Object.<anonymous> (/app/src/main.ts:10:15)',
  })
  @IsString()
  @Max(1024)
  trace!: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Something went wrong',
  })
  @IsString()
  @Max(128)
  message!: string;
}

// User ID is saved from :id param
// Timestamp is generated on receive
