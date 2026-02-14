import { ApiProperty } from '@nestjs/swagger';
import { Timestamp } from '../../../common/models/timestamp.model.js';

export class UniversityWithoutFacultiesDto extends Timestamp {
  @ApiProperty({ example: 'uuid-of-university' })
  id!: string;

  @ApiProperty({ example: 'Budapest University of Technology and Economics' })
  name!: string;

  @ApiProperty({ example: 'BME' })
  abbrevName!: string;

  constructor(partial: Partial<UniversityWithoutFacultiesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
