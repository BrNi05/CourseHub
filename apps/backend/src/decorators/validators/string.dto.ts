import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export function IsValidString(
  example: string,
  description: string,
  minLength = 10,
  maxLength = 64,
  required = true
) {
  return applyDecorators(
    IsString(),
    Length(minLength, maxLength),
    ApiProperty({
      example,
      description,
      required,
    })
  );
}
