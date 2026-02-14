import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class Timestamp {
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Timestamp (ISOString) of the creation time',
  })
  @Transform(({ value }: { value: string }) => new Date(value))
  createdAt!: Date;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Timestamp (ISOString) of the last update time',
  })
  @Transform(({ value }: { value: string }) => new Date(value))
  updatedAt!: Date;

  constructor(timestamp: Partial<Timestamp>) {
    Object.assign(this, timestamp);
  }
}
