import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

import { Timestamp } from '../../../common/models/timestamp.model.js';
import { Course } from '../../course/entity/course.entity.js';
import { Faculty } from '../../faculty/entity/faculty.entity.js';

export class CoursePackage extends Timestamp {
  @ApiProperty({
    example: 'uuid-of-course-package',
    description: 'Auto-generated ID of the course package',
  })
  id!: string;

  @ApiProperty({
    example: 'BME VIK Mérnökinfo 1. félév',
    description: 'Display name of the course package',
  })
  name!: string;

  @ApiProperty({
    example: 'Minden kötelező 1. féléves tárgy',
    description: 'Description of the package',
  })
  description!: string;

  @ApiProperty({
    example: 'uuid-of-owner-user',
    description: 'Owner ID of the package',
  })
  ownerId!: string;

  // Redundant but the schema stores the facultyId, so display it in the API as well
  @ApiProperty({
    example: 'uuid-of-faculty',
    description: 'Faculty ID of the package',
  })
  facultyId!: string;

  @ApiProperty({
    example: false,
    description: 'Whether the package is permanent and should be excluded from cleanup flows',
  })
  isPermanent!: boolean;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Timestamp of the last usage of the package',
  })
  @Transform(({ value }: { value: Date | string }) =>
    value instanceof Date ? value : new Date(value)
  )
  lastUsedAt!: Date;

  @ApiProperty({
    type: () => Faculty,
    description: 'Faculty that owns the package',
    required: false,
  })
  @Type(() => Faculty)
  faculty?: Faculty;

  @ApiProperty({
    type: () => [Course],
    description: 'Courses included in the package',
    required: false,
  })
  @Type(() => Course)
  courses?: Course[];

  constructor(coursePackage: Partial<CoursePackage>) {
    super(coursePackage);
    Object.assign(this, coursePackage);
  }
}
