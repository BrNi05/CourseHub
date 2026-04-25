/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';

import { JwtAuthGuard } from '../../auth/guards/jwt.guard.js';

import { CoursePackageOwnershipGuard } from '../../auth/guards/course-package-ownership.guard.js';
import { RequiresCoursePackageOwnership } from './requires-course-package-ownership.decorator.js';

class TestController {
  @RequiresCoursePackageOwnership()
  handler() {
    /* dummy */
  }
}

describe('RequiresCoursePackageOwnership', () => {
  it('registers JwtAuthGuard and CoursePackageOwnershipGuard once each', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TestController.prototype.handler
    ) as unknown[];

    expect(guards).toEqual([JwtAuthGuard, CoursePackageOwnershipGuard]);
  });
});
