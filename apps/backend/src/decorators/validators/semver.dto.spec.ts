import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { SemverVersion } from './semver.dto.js';

class TestSemverDto {
  @SemverVersion()
  version!: string;
}

describe('SemverVersion', () => {
  it('accepts major.minor.patch versions', async () => {
    const dto = new TestSemverDto();
    dto.version = '1.2.3';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects versions that do not match the expected semver format', async () => {
    const dto = new TestSemverDto();
    dto.version = '1.2';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.matches).toBe(
      'version must be in format major.minor.patch (e.g. 1.0.0)'
    );
  });
});
