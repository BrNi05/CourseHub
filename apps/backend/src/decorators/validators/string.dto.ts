import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, IsOptional } from 'class-validator';
import type { TransformFnParams, TransformOptions } from 'class-transformer';
import { Transform } from 'class-transformer';

export function IsValidString(
  target: string,
  example: string,
  description: string,
  minLength = 10,
  maxLength = 64,
  required = true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformFn?: (params: TransformFnParams) => any,
  transformOptions?: TransformOptions
) {
  return applyDecorators(
    ...(transformFn ? [Transform(transformFn, transformOptions)] : []),
    ...(required ? [] : [IsOptional()]),

    IsString({
      message: `A(z) ${target} mezőnek szöveges értéknek kell lennie.`,
    }),
    Length(minLength, maxLength, {
      message: `A(z) ${target} hossza min. ${minLength} és max. ${maxLength} karakter.`,
    }),

    required ? ApiProperty({ example, description }) : ApiPropertyOptional({ example, description })
  );
}
