import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { IsValidString } from './string.dto.js';

class TestStringDto {
  @IsValidString('value', 'Databases', 'Name of the course', 2, 8)
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
    expect(errors[0]?.constraints?.isString).toBe(
      'A(z) value mezőnek szöveges értéknek kell lennie.'
    );
  });

  it('rejects values that are shorter than the configured minimum length', async () => {
    const dto = new TestStringDto();
    dto.value = 'A';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isLength).toContain(
      'A(z) value hossza min. 2 és max. 8 karakter.'
    );
  });
});
