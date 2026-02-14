import { Module, DynamicModule } from '@nestjs/common';
import { LoggerService } from './logger.service.js';

@Module({})
export class LoggerModule {
  static forRoot(context: string): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: LoggerService,
          useFactory: () => new LoggerService(context),
        },
      ],
      exports: [LoggerService],
    };
  }
}
