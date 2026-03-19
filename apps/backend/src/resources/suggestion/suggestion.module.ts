import { Module } from '@nestjs/common';
import { SuggestionService } from './suggestion.service.js';
import { SuggestionController } from './suggestion.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { UniversityModule } from '../university/university.module.js';
import { FacultyModule } from '../faculty/faculty.module.js';
import { CourseModule } from '../course/course.module.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [PrismaModule, UniversityModule, FacultyModule, CourseModule, AuthModule],
  controllers: [SuggestionController],
  providers: [SuggestionService],
  exports: [SuggestionService],
})
export class SuggestionModule {}
