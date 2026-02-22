import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export function CourseLink(message: string, example: string, description: string) {
  return applyDecorators(
    IsOptional(),
    IsUrl({}, { message }),
    ApiProperty({
      example,
      description,
      required: false,
    })
  );
}
