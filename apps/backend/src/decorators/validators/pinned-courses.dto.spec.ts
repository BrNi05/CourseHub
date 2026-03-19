import { describe, expect, it } from 'vitest';
import { validate } from 'class-validator';

import { IsPinnedCourses } from './pinned-courses.dto.js';

class TestPinnedCoursesDto {
  @IsPinnedCourses()
  pinnedCourses?: string[];
}

describe('IsPinnedCourses', () => {
  it('accepts undefined', async () => {
    const dto = new TestPinnedCoursesDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts an array of UUID v4 values', async () => {
    const dto = new TestPinnedCoursesDto();
    dto.pinnedCourses = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ];

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects non-array values', async () => {
    const dto = new TestPinnedCoursesDto();
    dto.pinnedCourses = 'not-an-array' as unknown as string[];

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isArray).toBe('pinnedCourses must be an array');
  });

  it('rejects invalid UUID entries', async () => {
    const dto = new TestPinnedCoursesDto();
    dto.pinnedCourses = ['not-a-uuid'];

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isUuid).toBe('each pinnedCourses entry must be a valid UUID');
  });

  it('rejects duplicates', async () => {
    const dto = new TestPinnedCoursesDto();
    dto.pinnedCourses = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440000',
    ];

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.arrayUnique).toBe('pinnedCourses must not contain duplicates');
  });
});
