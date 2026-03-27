/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';

import { RequiresAuth } from './auth.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard.js';

class TestController {
  @RequiresAuth()
  handler() {
    /* dummy */
  }
}

describe('RequiresAuth', () => {
  it('registers JwtAuthGuard once', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TestController.prototype.handler
    ) as unknown[];

    expect(guards).toEqual([JwtAuthGuard]);
  });
});
