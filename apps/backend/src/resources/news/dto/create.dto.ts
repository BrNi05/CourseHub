import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({
    example: ['News 1', 'News 2'],
    description: 'The names of the news to create',
    required: true,
    type: String,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  news!: string[];
}
