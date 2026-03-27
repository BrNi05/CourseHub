/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';

import { Admin } from './admin.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard.js';
import { AdminGuard } from '../../auth/guards/admin.guard.js';

class TestController {
  @Admin()
  handler() {
    /* dummy */
  }
}

describe('Admin', () => {
  it('registers JWT auth and admin guard without duplicating JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TestController.prototype.handler
    ) as unknown[];

    expect(guards).toEqual([JwtAuthGuard, AdminGuard]);
  });
});
