import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUniversityDto {
  @ApiProperty({
    example: 'Budapest University of Technology and Economics',
    description: 'Name of the university',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 'BME',
    description: 'Abbreviated name of the university',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  abbrevName!: string;
}
