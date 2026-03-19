import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { IsValidString } from './string.dto.js';

class TestStringDto {
  @IsValidString('Databases', 'Name of the course', 2, 8)
  value!: string;
}

describe('IsValidString', () => {
  it('accepts a string within the configured bounds', async () => {
    const dto = new TestStringDto();
    dto.value = 'Course';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects non-string values', async () => {
    const dto = new TestStringDto();
    dto.value = 42 as unknown as string;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isString).toBe('value must be a string');
  });

  it('rejects values that are shorter than the configured minimum length', async () => {
    const dto = new TestStringDto();
    dto.value = 'A';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isLength).toContain(
      'value must be longer than or equal to 2 characters'
    );
  });
});
