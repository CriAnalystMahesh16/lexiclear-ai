/**
 * LexiClear AI - Server Express Application Setup
 * Phase 4 Full-Stack Boundary
 */

import express from 'express';
import { apiRouter } from './routes/api.routes';
import { geminiRouter } from './routes/gemini.routes';
import {
  securityHeaders,
  rateLimiter,
  enforceJsonAndSize,
  safeErrorHandler,
} from './middleware/security';
import { SECURITY_LIMITS } from '../src/models/security.constants';

export function createExpressApp() {
  const app = express();

  // 1. Core Security Middlewares
  app.use(securityHeaders);
  app.use(express.json({ limit: SECURITY_LIMITS.MAX_API_PAYLOAD_SIZE_BYTES }));
  app.use(enforceJsonAndSize);
  app.use(rateLimiter);

  // 2. Health check route
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'LexiClear AI API',
      timestamp: new Date().toISOString(),
    });
  });

  // 3. API Routers
  app.use('/api', apiRouter);
  app.use('/api/ai', geminiRouter);

  // 4. Safe Error Handler (Must be registered last)
  app.use(safeErrorHandler);

  return app;
}

export const app = createExpressApp();
