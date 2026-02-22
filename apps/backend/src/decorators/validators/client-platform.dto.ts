import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ClientPlatform } from '../../prisma/generated/client/client.js';

export function IsClientPlatform() {
  return applyDecorators(
    ApiProperty({
      enum: ClientPlatform,
      description: 'Client platform',
      example: ClientPlatform.windows,
    }),
    IsEnum(ClientPlatform)
  );
}
