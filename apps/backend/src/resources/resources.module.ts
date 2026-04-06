import { Module } from '@nestjs/common';

import { UniversityModule } from './university/university.module.js';
import { FacultyModule } from './faculty/faculty.module.js';
import { CourseModule } from './course/course.module.js';
import { UserModule } from './user/user.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { SuggestionModule } from './suggestion/suggestion.module.js';
import { ClientModule } from './client/client.module.js';
import { LogsModule } from './logs/logs.module.js';
import { NewsModule } from './news/news.module.js';
import { DatabaseBackupModule } from './database-backup/database-backup.module.js';

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
    NewsModule,
    DatabaseBackupModule,
  ],
  exports: [SuggestionModule, ClientModule], // Consumed by AppModule (AppService) for metrics
  controllers: [],
})
export class ResourcesModule {}
