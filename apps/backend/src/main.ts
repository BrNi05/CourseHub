import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';

import { AppModule } from './app.module.js';
import { setupUi } from './ui/ui.js';

// Security
import helmet from 'helmet';
import hpp from 'hpp';
import { json, urlencoded } from 'express';

import { setupSwagger } from './swagger/swagger.js';

const logger = new Logger('BOOTSTRAP');

try {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableShutdownHooks(['SIGINT', 'SIGTERM']); // onModuleDestroy will be called

  // Async error handling
  process.on('unhandledRejection', (error: Error) => {
    const logger = new Logger('ASYNC ERROR');
    logger.error(error?.message);
  });

  // Do not remain in an inconsistent state after an uncaught exception
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

  // Generate a unique nonce for Cloudflare script injection
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = randomBytes(16).toString('base64');
    next();
  });

  // Helper function to build CSP header string
  const stringifyCspDirectives = (directives: Record<string, string[]>): string =>
    Object.entries(directives)
      .map(([directive, sources]) =>
        sources.length > 0 ? `${directive} ${sources.join(' ')}` : directive
      )
      .join('; ');

  // Build CSP header based on route
  const buildCspHeader = (nonce: string, isSwaggerRoute: boolean): string => {
    return stringifyCspDirectives({
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'font-src': ["'self'"],
      'form-action': ["'self'"],
      'frame-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'img-src': isSwaggerRoute ? ["'self'", 'data:'] : ["'self'"],
      'manifest-src': ["'self'"],
      'media-src': ["'none'"],
      'object-src': ["'none'"],
      // 'require-trusted-types-for': ["'script'"], // Cloudflare JS injection would be blocked
      'script-src': ["'self'", `'nonce-${nonce}'`],
      'script-src-attr': ["'none'"],
      'style-src': isSwaggerRoute ? ["'self'", "'unsafe-inline'"] : ["'self'"],
      'trusted-types': ['vue', 'dompurify', 'default'], // Cloudflare and Swagger UI
      'worker-src': ["'none'"],
      'connect-src': ["'self'"],
      'upgrade-insecure-requests': [],
    });
  };

  // Permissions-Policy header config
  const permissionsPolicyHeader = [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'bluetooth=()',
    'camera=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'fullscreen=()',
    'gamepad=()',
    'geolocation=()',
    'gyroscope=()',
    'hid=()',
    'identity-credentials-get=()',
    'idle-detection=()',
    'local-fonts=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'otp-credentials=()',
    'payment=()',
    'picture-in-picture=(self)', // Cloudflare JS challenge
    'publickey-credentials-create=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'serial=()',
    'speaker-selection=()',
    'storage-access=()',
    'usb=()',
    'web-share=()',
    'window-management=()',
    'xr-spatial-tracking=()',
  ].join(', ');

  // Security policies
  const swaggerHelmet = helmet({
    contentSecurityPolicy: false, // use custom CSP builder
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
    contentSecurityPolicy: false, // use custom CSP builder
    originAgentCluster: true, // isolate browsing context to prevent side-channel attacks
  });

  // Choose helmet config based on route
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isSwaggerRoute = req.path.startsWith('/api/docs');
    const nonce = String(res.locals.cspNonce); // always defined

    res.setHeader('Content-Security-Policy', buildCspHeader(nonce, isSwaggerRoute));
    res.setHeader('Permissions-Policy', permissionsPolicyHeader);

    if (isSwaggerRoute) return swaggerHelmet(req, res, next);
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
  // The public site does not have API docs generated
  if (process.env.NODE_ENV != 'production') setupSwagger(app);

  // Serve SPA frontend
  setupUi(app);

  await app.listen(3000); // Docker will forward traffic to the designated port
  logger.log('Backend is started and listening on port 3000.');
} catch (err: unknown) {
  logger.error(String(err));
  process.exit(1);
}
