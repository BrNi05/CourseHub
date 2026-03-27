/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';

import { InternalOnly } from './internal.decorator.js';
import { InternalOnlyGuard } from '../../common/security/guards/internal-only.guard.js';

class TestController {
  @InternalOnly()
  handler() {
    /* dummy */
  }
}

describe('InternalOnly', () => {
  it('registers InternalOnlyGuard once', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TestController.prototype.handler
    ) as unknown[];

    expect(guards).toEqual([InternalOnlyGuard]);
  });
});
