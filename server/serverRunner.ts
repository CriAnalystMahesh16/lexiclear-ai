/**
 * LexiClear AI - Server Runner
 * Phase 4 Full-Stack Server
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createExpressApp } from './app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runServer() {
  const app = createExpressApp();

  // In AI Studio container, nginx listens on 8080 and proxies to 3000.
  // Standard port must be 3000 unless explicitly specified via APP_PORT or a non-8080 PORT.
  const PORT = parseInt(
    process.env.APP_PORT || (process.env.PORT && process.env.PORT !== '8080' ? process.env.PORT : '3000'),
    10
  );
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: dynamically mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static build assets
    const distPath = path.resolve(__dirname, '..', 'dist');
    const indexPath = path.resolve(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      // Do not intercept /api requests
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LexiClear AI server listening on http://0.0.0.0:${PORT}`);
  });
}
