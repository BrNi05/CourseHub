import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export function IsUUIDCustom(message: string, example: string, description: string) {
  return applyDecorators(
    IsUUID('4', {
      message: `${message} must be a valid UUID`,
    }),
    ApiProperty({
      example,
      description,
    })
  );
}
