import { NestFactory } from '@nestjs/core';
import type { OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from './build/app.module.js';
import { setupSwagger } from './src/swagger/swagger.ts';
import { writeFile } from 'node:fs/promises';

async function genSwaggerSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const document: OpenAPIObject = setupSwagger(app);

  const outputUrl = new URL('../../openapi.json', import.meta.url); // repo root

  await writeFile(outputUrl, JSON.stringify(document, null, 2));

  await app.close();
}

await genSwaggerSpec();
