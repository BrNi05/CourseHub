import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { IsUUIDCustom } from './uuid-custom.decorator.js';

class TestUuidDto {
  @IsUUIDCustom('id', 'uuid-value', 'Resource id')
  id!: string;
}

describe('IsUUIDCustom', () => {
  it('accepts UUID v4 values', async () => {
    const dto = new TestUuidDto();
    dto.id = '550e8400-e29b-41d4-a716-446655440000';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid UUID values', async () => {
    const dto = new TestUuidDto();
    dto.id = 'not-a-uuid';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isUuid).toBe('id');
  });
});
