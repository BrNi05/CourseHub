import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { Timestamp } from '../../../common/models/timestamp.model.js';
import { Faculty } from '../../faculty/entity/faculty.entity.js';

export class University extends Timestamp {
  @ApiProperty({
    example: 'uuid-of-university',
    description: 'Auto-generated ID of the university',
  })
  id!: string;

  @ApiProperty({
    example: 'Budapest University of Technology and Economics',
    description: 'Name of the university',
  })
  name!: string;

  @ApiProperty({
    example: 'BME',
    description: 'Abbreviated name of the university',
  })
  abbrevName!: string;

  @ApiProperty({
    type: () => [Faculty],
    description: 'Faculties belonging to the university',
    required: false,
  })
  @Type(() => Faculty)
  faculties?: Faculty[];

  constructor(university: Partial<University>) {
    super(university);
    Object.assign(this, university);
  }
}
