import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

import { CoursePackageController } from './course-package.controller.js';
import { CoursePackageOwnershipGuard } from '../../auth/guards/course-package-ownership.guard.js';
import { CoursePackageService } from './course-package.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CoursePackageController],
  providers: [CoursePackageService, CoursePackageOwnershipGuard],
  exports: [CoursePackageService],
})
export class CoursePackageModule {}
