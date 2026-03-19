import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CourseQueryDto } from './query-course.dto.js';

describe('CourseQueryDto', () => {
  it('accepts a valid universityId with omitted optional filters', async () => {
    const dto = new CourseQueryDto();
    dto.universityId = '550e8400-e29b-41d4-a716-446655440000';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts empty optional string filters because the DTO explicitly allows zero-length partial matches', async () => {
    const dto = new CourseQueryDto();
    dto.universityId = '550e8400-e29b-41d4-a716-446655440000';
    dto.courseName = '';
    dto.courseCode = '';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid university ids', async () => {
    const dto = new CourseQueryDto();
    dto.universityId = 'invalid-id';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isUuid).toContain('must be a valid UUID');
  });

  it('rejects course codes longer than the configured maximum', async () => {
    const dto = new CourseQueryDto();
    dto.universityId = '550e8400-e29b-41d4-a716-446655440000';
    dto.courseCode = 'ABCDEFGHIJKLMNOPQ';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isLength).toContain(
      'A(z) kurzus kód hossza min. 0 és max. 16 karakter.'
    );
  });
});
