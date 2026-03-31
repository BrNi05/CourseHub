import { type INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AUTH_COOKIE_NAME, AUTH_COOKIE_SECURITY_NAME } from '../auth/auth.constants.js';

export function setupSwagger(app: INestApplication<unknown>): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CourseHub API')
    .setDescription('CourseHub API Documentation')
    .addCookieAuth(
      AUTH_COOKIE_NAME,
      {
        type: 'apiKey',
        in: 'cookie',
      },
      AUTH_COOKIE_SECURITY_NAME
    )
    .build();

  const swaggerFactory = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('/api/docs', app, swaggerFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      showRequestDuration: true,
      deepLinking: true,
    },
    customSiteTitle: 'CourseHub API Docs',
    customCssUrl: '/swagger/custom.css',
    customJs: ['/swagger/custom.js'],
  });

  return swaggerFactory;
}
