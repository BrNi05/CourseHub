/// <reference types="node" />
// ts vsc does not recognise the proper tsconfig

import { writeFile } from 'node:fs/promises';

function setOpenApiGenerationEnv() {
  process.env['OPENAPI_GENERATION'] = 'true';

  const defaults: Record<string, string> = {
    CORS_ORIGIN: 'https://example.com',
    NODE_ENV: 'production',
    ADMIN_EMAILS: 'admin@example.com',
    JWT_SECRET: 'a'.repeat(96),
    DATABASE_URL: 'postgresql://coursehub:coursehub@127.0.0.1:5432/coursehub',
    SHADOW_DATABASE_URL: 'postgresql://coursehub:coursehub@127.0.0.1:5432/coursehub_shadow',
    GOOGLE_CLIENT_ID: 'openapi-generator-client-id',
    GOOGLE_CLIENT_SECRET: 'openapi-generator-client-secret',
    GOOGLE_CALLBACK_URL: 'https://example.com/auth/google/callback',
    REDIS_HOST: '127.0.0.1',
    REDIS_PASSWORD: 'openapi-generator-redis-password',
    REDIS_PORT: '6379',
  };

  for (const [key, value] of Object.entries(defaults)) {
    process.env[key] ??= value;
  }
}

async function genSwaggerSpec() {
  setOpenApiGenerationEnv();

  const [{ NestFactory }, { AppModule }, { setupSwagger }] = await Promise.all([
    import('@nestjs/core'),
    import('./build/app.module.js'),
    import('./build/swagger/swagger.js'),
  ]);

  const app = await NestFactory.create(AppModule, { logger: false });

  const document = setupSwagger(app);

  const outputUrl = new URL('../../openapi.json', import.meta.url); // repo root

  await writeFile(outputUrl, JSON.stringify(document, null, 2));

  await app.close();
}

await genSwaggerSpec();
