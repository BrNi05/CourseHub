import type { NestExpressApplication } from '@nestjs/platform-express';
import express, { type NextFunction, type Request, type Response } from 'express';
import { extname, join } from 'node:path';

export function setupUi(app: NestExpressApplication): void {
  const frontendRoot = join(process.cwd(), 'build', 'public', 'frontend');

  // Serve frontend static files
  app.use(
    express.static(frontendRoot, {
      index: false,
      maxAge: '365d',
    })
  );

  // SPA fallback for browser navigation
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Ignore non-GET requests
    if (req.method !== 'GET') return next();

    // Ignore API and Swagger routes
    if (req.path.startsWith('/api') || req.path.startsWith('/swagger')) return next();

    // Ignore real file requests
    if (extname(req.path)) return next();

    const accept = req.headers.accept ?? '';
    if (!(accept.includes('text/html') || accept.includes('*/*'))) return next();

    return res.sendFile(join(frontendRoot, 'index.html'), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  });
}
