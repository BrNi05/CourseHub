import { Module } from '@nestjs/common';

import { UniversityModule } from './university/university.module.js';
import { FacultyModule } from './faculty/faculty.module.js';
import { CourseModule } from './course/course.module.js';
import { UserModule } from './user/user.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { SuggestionModule } from './suggestion/suggestion.module.js';
import { ClientModule } from './client/client.module.js';
import { LogsModule } from './logs/logs.module.js';

@Module({
  imports: [
    UniversityModule,
    FacultyModule,
    CourseModule,
    UserModule,
    SuggestionModule,
    ClientModule,
    StatisticsModule,
    LogsModule,
  ],
  controllers: [],
})
export class ResourcesModule {}
