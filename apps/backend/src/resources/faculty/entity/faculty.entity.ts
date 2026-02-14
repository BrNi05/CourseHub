import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { Timestamp } from '../../../common/models/timestamp.model.js';
import { Course } from '../../course/entity/course.entity.js';

export class Faculty extends Timestamp {
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

  @ApiProperty({ type: () => [Course], description: 'Courses in this faculty', required: false })
  @Type(() => Course)
  courses?: Course[];

  constructor(faculty: Partial<Faculty>) {
    super(faculty);
    Object.assign(this, faculty);
  }
}
