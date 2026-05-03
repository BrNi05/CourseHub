import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { IntRange } from './int-custom.decorator.js';

class TestDto {
  @IntRange('kreditek', 0, 60, 5, 'Kredit érték')
  credits!: number;
}

class OptionalTestDto {
  @IntRange('kreditek', 0, 60, 5, 'Kredit érték', false)
  credits?: number;
}

describe('IntRange', () => {
  it('accepts valid integer within range', async () => {
    const dto = new TestDto();
    dto.credits = 30;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects non-integer values', async () => {
    const dto = new TestDto();
    dto.credits = 3.14;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isInt).toBe('A(z) kreditek mezőnek egy számnak kell lennie.');
  });

  it('rejects values below minimum', async () => {
    const dto = new TestDto();
    dto.credits = -1;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.min).toBe('A(z) kreditek legalább 0 kell legyen.');
  });

  it('rejects values above maximum', async () => {
    const dto = new TestDto();
    dto.credits = 100;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.max).toBe('A(z) kreditek legfeljebb 60 lehet.');
  });

  it('rejects missing value when required', async () => {
    const dto = new TestDto();

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts undefined when not required', async () => {
    const dto = new OptionalTestDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
