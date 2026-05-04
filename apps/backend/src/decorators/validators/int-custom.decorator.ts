import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export function IntRange(
  fieldName: string,
  min: number,
  max: number,
  example: number,
  description: string,
  required = true
) {
  return applyDecorators(
    ...(required ? [] : [IsOptional()]),
    Type(() => Number),
    IsInt({ message: `A(z) ${fieldName} mezőnek egy számnak kell lennie.` }),
    Min(min, { message: `A(z) ${fieldName} legalább ${min} kell legyen.` }),
    Max(max, { message: `A(z) ${fieldName} legfeljebb ${max} lehet.` }),
    ApiProperty({
      example,
      description,
      required,
      minimum: min,
      maximum: max,
    })
  );
}
