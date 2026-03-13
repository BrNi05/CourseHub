import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';

import { AppModule } from './app.module.js';
import { setupUi } from './ui/ui.js';

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

  // Security policies
  const swaggerHelmet = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  });

  const mainHelmet = helmet({
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'no-referrer' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"], // 'https:'
        imgSrc: ["'self'"], // 'https:', 'data:'
        fontSrc: ["'self'"], // 'https:', 'data:'
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  });

  // Choose helmet config based on route
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/docs')) return swaggerHelmet(req, res, next);
    return mainHelmet(req, res, next);
  });

  // Trust proxy (last one)
  // Mostly redundant with Cloudflare Tunnels
  app.set('trust proxy', 1);

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
  if (process.env.NODE_ENV != 'production') setupSwagger(app);

  // Serve SPA frontend
  setupUi(app);

  await app.listen(3000); // Docker will forward traffic to the designated port
} catch (err: unknown) {
  const logger = new Logger('BOOTSTRAP');
  logger.error(String(err));
  process.exit(1);
}
