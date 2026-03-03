import { type INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication<unknown>): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CourseHub API')
    .setDescription('CourseHub API Documentation')
    // Indicate to Swagger that certain endpoints require JWT auth
    // This will also be reflected in the SDK: Bearer header / access token will be expected for each function
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt' // used by both @RequiresAuth() and @Admin()
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
