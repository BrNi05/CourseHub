import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export function IsUUIDCustom(
  message: string,
  example: string,
  description: string,
  required = true
) {
  return applyDecorators(
    ...(required ? [] : [IsOptional()]),
    IsUUID('4', { message }),
    ApiProperty({
      example,
      description,
      required,
    })
  );
}
