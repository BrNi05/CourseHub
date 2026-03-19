import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export function IsValidString(
  target: string,
  example: string,
  description: string,
  minLength = 10,
  maxLength = 64,
  required = true
) {
  return applyDecorators(
    IsString({ message: `A(z) ${target} mezőnek szöveges értéknek kell lennie.` }),
    Length(minLength, maxLength, {
      message: `A(z) ${target} hossza min. $constraint1 és max. $constraint2 karakter.`,
    }),
    ApiProperty({
      example,
      description,
      required,
    })
  );
}
