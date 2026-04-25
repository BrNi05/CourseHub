import { applyDecorators, UseGuards } from '@nestjs/common';

import { RequiresAuth } from './auth.decorator.js';

import { CoursePackageOwnershipGuard } from '../../auth/guards/course-package-ownership.guard.js';

export function RequiresCoursePackageOwnership() {
  return applyDecorators(RequiresAuth(), UseGuards(CoursePackageOwnershipGuard));
}
