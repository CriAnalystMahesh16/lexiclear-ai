/**
 * LexiClear AI - Server Request Validation Middleware
 * Phase 2 Architectural Gate
 *
 * Enforces Zod .strict() schema evaluation on all incoming Express requests.
 * Rejects unexpected properties, oversized payloads, and schema deviations.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiErrorResponse } from '../schemas/api.schemas';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const details = err.issues.map((e) => `${e.path.join('.') || 'body'}: ${e.message}`);
        
        const isOversized = details.some((d) => d.toLowerCase().includes('exceeds'));
        const errorCode = isOversized ? 'OVERSIZED_PAYLOAD' : 'VALIDATION_ERROR';

        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: errorCode,
            message: 'Incoming request failed architectural schema validation.',
            details,
            timestamp: new Date().toISOString(),
          },
        };

        res.status(400).json(errorResponse);
        return;
      }

      const unexpectedErrorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Unable to parse request body.',
          timestamp: new Date().toISOString(),
        },
      };

      res.status(400).json(unexpectedErrorResponse);
    }
  };
}
