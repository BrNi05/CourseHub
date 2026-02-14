import { Module } from '@nestjs/common';

import { UniversityModule } from './university/university.module.js';
import { FacultyModule } from './faculty/faculty.module.js';
import { CourseModule } from './course/course.module.js';
import { UserModule } from './user/user.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { ClientModule } from './client/client.module.js';

@Module({
  imports: [
    UniversityModule,
    FacultyModule,
    CourseModule,
    UserModule,
    ClientModule,
    StatisticsModule,
  ],
  controllers: [],
})
export class ResourcesModule {}
