import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { ClientPlatform } from '../../prisma/generated/client/client.js';
import { IsClientPlatform } from './client-platform.dto.js';

class TestClientPlatformDto {
  @IsClientPlatform()
  platform!: ClientPlatform;
}

describe('IsClientPlatform', () => {
  it('accepts supported client platform values', async () => {
    const dto = new TestClientPlatformDto();
    dto.platform = ClientPlatform.windows;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects unsupported platform values', async () => {
    const dto = new TestClientPlatformDto();
    dto.platform = 'web' as ClientPlatform;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isEnum).toContain(
      'platform must be one of the following values'
    );
  });
});
