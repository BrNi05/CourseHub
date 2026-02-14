import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';

import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module.js';
import { ResourcesModule } from './resources/resources.module.js';
import { LoggerModule } from './logger/logger.module.js'; // globally available

import { ThrottleGuard } from './common/throttling/throttler.guard.js';
import { GlobalExceptionsFilter } from './filters/exception.filter.js';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter.js';

@Module({
  imports: [
    PrismaModule,
    LoggerModule.forRoot('AppService'),
    ResourcesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        CORS_ORIGIN: Joi.string().uri().required(),
        NODE_ENV: Joi.string().valid('development', 'production').default('production'),
        ADMIN_EMAILS: Joi.string()
          .required()
          .custom((value: string, helpers) => {
            const emails = value.split(',').map((e: string) => e.trim());
            const invalid = emails.filter((e: string) => Joi.string().email().validate(e).error);
            if (invalid.length > 0) return helpers.error('any.invalid', { value: invalid });
            return value;
          }, 'Comma-separated admin emails validation'),
        JWT_SECRET: Joi.string().min(96).max(96).required(),
        DATABASE_URL: Joi.string()
          .pattern(/^postgresql:\/\/[^:@]+:[^:@]+@[^:/]+(:\d+)?\/\w+$/)
          .required()
          .messages({
            'string.pattern.base':
              'DATABASE_URL must be in the format postgresql://username:password@host:port/db_name',
          }),
        SHADOW_DATABASE_URL: Joi.string()
          .pattern(/^postgresql:\/\/[^:@]+:[^:@]+@[^:/]+(:\d+)?\/\w+$/)
          .required()
          .messages({
            'string.pattern.base':
              'SHADOW_DATABASE_URL must be in the format postgresql://username:password@host:port/db_name',
          }),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
      }),
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: seconds(60),
        limit: 500,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottleGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}
