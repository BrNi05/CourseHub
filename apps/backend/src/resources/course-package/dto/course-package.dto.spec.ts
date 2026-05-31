import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateCoursePackageDto } from './create-course-package.dto.js';
import { SearchCoursePackageDto } from './search-course-package.dto.js';
import { SetCoursePackagePermanentDto } from './set-course-package-permanent.dto.js';
import { UpdateCoursePackageDto } from './update-course-package.dto.js';

const facultyId = '550e8400-e29b-41d4-a716-446655440000';
const courseId = '550e8400-e29b-41d4-a716-446655440001';

describe('CreateCoursePackageDto', () => {
  it('accepts a valid course package and trims string fields during transformation', async () => {
    const dto = plainToInstance(CreateCoursePackageDto, {
      name: '  BME VIK starter pack  ',
      description: '  First semester courses  ',
      facultyId,
      courseIds: [courseId],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('BME VIK starter pack');
    expect(dto.description).toBe('First semester courses');
  });

  it('rejects packages without courses', async () => {
    const dto = plainToInstance(CreateCoursePackageDto, {
      name: 'BME VIK starter pack',
      facultyId,
      courseIds: [],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('courseIds');
    expect(errors[0]?.constraints?.arrayNotEmpty).toBe(
      'Legalább egy kurzust fel kell venni a csomagba.'
    );
  });

  it('rejects duplicate course ids', async () => {
    const dto = plainToInstance(CreateCoursePackageDto, {
      name: 'BME VIK starter pack',
      facultyId,
      courseIds: [courseId, courseId],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('courseIds');
    expect(errors[0]?.constraints?.arrayUnique).toBe('A kurzusok nem lehetnek ismétlődőek.');
  });
});

describe('UpdateCoursePackageDto', () => {
  it('accepts partial updates', async () => {
    const dto = plainToInstance(UpdateCoursePackageDto, {
      name: 'Updated package',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('still rejects invalid fields when optional fields are provided', async () => {
    const dto = plainToInstance(UpdateCoursePackageDto, {
      facultyId: 'not-a-uuid',
      courseIds: ['also-not-a-uuid'],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(2);
    expect(errors.map((error) => error.property)).toEqual(['facultyId', 'courseIds']);
  });
});

describe('SearchCoursePackageDto', () => {
  it('normalizes blank name queries to undefined during transformation', async () => {
    const dto = plainToInstance(SearchCoursePackageDto, {
      facultyId,
      nameQuery: '   ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.nameQuery).toBeUndefined();
  });

  it('rejects invalid university filters', async () => {
    const dto = plainToInstance(SearchCoursePackageDto, {
      universityId: 'not-a-uuid',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('universityId');
    expect(errors[0]?.constraints?.isUuid).toBe('universityId must be a valid UUID');
  });
});

describe('SetCoursePackagePermanentDto', () => {
  it('accepts a boolean permanent flag', async () => {
    const dto = new SetCoursePackagePermanentDto();
    dto.isPermanent = false;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects non-boolean permanent flags', async () => {
    const dto = new SetCoursePackagePermanentDto();
    dto.isPermanent = 'false' as unknown as boolean;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isBoolean).toBe('isPermanent must be a boolean');
  });
});
