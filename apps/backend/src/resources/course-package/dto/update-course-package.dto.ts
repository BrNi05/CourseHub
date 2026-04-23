import { PartialType } from '@nestjs/swagger';

import { CreateCoursePackageDto } from './create-course-package.dto.js';

export class UpdateCoursePackageDto extends PartialType(CreateCoursePackageDto) {}
