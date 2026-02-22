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
      message: 'version must be in format major.minor.patch (e.g. 1.0.0)',
    })
  );
}
