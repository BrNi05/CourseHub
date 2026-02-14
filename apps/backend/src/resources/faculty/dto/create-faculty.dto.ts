import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFacultyDto {
  @ApiProperty({ example: 'Faculty of Engineering', description: 'Name of the faculty' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 'FEEI',
    description: 'Abbreviated name of the faculty, unique within the university',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  abbrevName!: string;

  @ApiProperty({ example: 'uuid-of-parent-university', description: 'ID of the parent university' })
  @IsString()
  @IsNotEmpty()
  universityId!: string;
}
