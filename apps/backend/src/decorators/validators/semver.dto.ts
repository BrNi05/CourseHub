import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export function SemverVersion() {
  return applyDecorators(
    ApiProperty({
      description: 'Client version',
      example: '1.0.0',
    }),
    IsString(),
    Matches(/^\d+\.\d+\.\d+$/, {
      message: 'A verzió formátuma: major.minor.patch (pl. 1.0.0)',
    })
  );
}
