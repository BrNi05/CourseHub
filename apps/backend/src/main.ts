import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';

import { AppModule } from './app.module.js';

// Security
import helmet from 'helmet';
import hpp from 'hpp';
import { json, urlencoded } from 'express';

import { setupSwagger } from './swagger/swagger.js';

try {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Async error handling
  process.on('unhandledRejection', (error: Error) => {
    const logger = new Logger('ASYNC ERROR');
    logger.error(error?.message);
  });

  process.on('uncaughtException', (error: Error) => {
    const logger = new Logger('UNCAUGHT EXCEPTION');
    logger.error(error?.stack || error?.message);

    process.exit(1); // Docker will restart the backend container
  });

  // Environment variables
  const configService = app.get(ConfigService);
  const origin = configService.get<string>('CORS_ORIGIN');

  app.setGlobalPrefix('api');

  // Protection agains DoS attacks (via resource exhaustion)
  app.use(json({ limit: '4kb' }));
  app.use(urlencoded({ extended: true, limit: '4kb' }));

  // CORS
  app.enableCors({
    origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // HTTPS(S) headers configuration
  app.use(hpp());
  app.use(
    helmet({
      noSniff: true, // Don't guess the MIME type
      dnsPrefetchControl: { allow: false },
      hidePoweredBy: true, // Hide the fact, that the backend is powered by NestJS (Express)
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }, // Tell the browser to force use HTTPS (cached for 1 year)
    })
  );

  // Trust proxy (last one)
  // Mostly redundant with Cloudflare Tunnels
  app.set('trust proxy', 1);

  // Redirect non-API requests to the GitHub repo
  // Static assets are served from /assets, those are allowed
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/assets')) {
      return res.redirect('https://github.com/BrNi05/CourseHub');
    }
    next();
  });

  // Class serialization
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Generate API docs
  setupSwagger(app);

  await app.listen(3000); // Docker will forward traffic to the designated port
} catch (err: unknown) {
  const logger = new Logger('BOOTSTRAP');
  logger.error(String(err));
  process.exit(1);
}
