import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetFacultiesQueryDto {
  @ApiProperty({
    description: 'UUID of the university to list faculties for',
    example: 'uuid-of-university',
  })
  @IsUUID('4', { message: 'universityId must be a valid UUID' })
  universityId!: string;
}
