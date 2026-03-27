/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';

import { RequiresAuthAndOwnership } from './ownership.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard.js';
import { UserOwnershipGuard } from '../../auth/guards/ownership.guard.js';

class TestController {
  @RequiresAuthAndOwnership()
  handler() {
    /* dummy */
  }
}

describe('RequiresAuthAndOwnership', () => {
  it('registers JwtAuthGuard and UserOwnershipGuard once each', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TestController.prototype.handler
    ) as unknown[];

    expect(guards).toEqual([JwtAuthGuard, UserOwnershipGuard]);
  });
});
