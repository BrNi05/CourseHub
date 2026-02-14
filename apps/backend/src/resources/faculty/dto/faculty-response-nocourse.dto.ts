import { ApiProperty } from '@nestjs/swagger';

import { Timestamp } from '../../../common/models/timestamp.model.js';

export class FacultyWithoutCoursesDto extends Timestamp {
  @ApiProperty({
    example: 'uuid-of-faculty',
    description: 'Auto-generated ID of the faculty',
  })
  id!: string;

  @ApiProperty({ example: 'Faculty of Electrical Engineering', description: 'Name of the faculty' })
  name!: string;

  @ApiProperty({
    example: 'FEEI',
    description: 'Abbreviated name of the faculty, unique within the university',
  })
  abbrevName!: string;

  @ApiProperty({
    example: 'uuid-of-parent-university',
    description: 'ID of the parent university',
  })
  universityId!: string;

  constructor(partial: Partial<FacultyWithoutCoursesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
