import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { UpdatePinnedCoursesDto } from './update-pinned.dto.js';
import { UpdateUserDto } from './update-user.dto.js';

describe('UpdateUserDto', () => {
  it('accepts admin updates without pinned course changes', async () => {
    const dto = new UpdateUserDto();
    dto.isAdmin = true;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects non-boolean admin values', async () => {
    const dto = new UpdateUserDto();
    dto.isAdmin = 'true' as unknown as boolean;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('isAdmin');
    expect(errors[0]?.constraints?.isBoolean).toContain('boolean');
  });

  it('rejects invalid pinned course ids on admin updates', async () => {
    const dto = new UpdateUserDto();
    dto.pinnedCourses = ['not-a-uuid'];

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('pinnedCourses');
    expect(errors[0]?.constraints?.isUuid).toBe('each pinnedCourses entry must be a valid UUID');
  });
});

describe('UpdatePinnedCoursesDto', () => {
  it('accepts a valid pinned course list', async () => {
    const dto = new UpdatePinnedCoursesDto();
    dto.pinnedCourses = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ];

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects duplicate pinned course ids', async () => {
    const dto = new UpdatePinnedCoursesDto();
    dto.pinnedCourses = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440000',
    ];

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.arrayUnique).toBe('pinnedCourses must not contain duplicates');
  });
});
