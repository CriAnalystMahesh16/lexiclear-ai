/**
 * LexiClear AI - Server API Security Middleware
 * Phase 4 Security Controls
 *
 * Implements:
 * 1. Rate limiting (in-memory token bucket per client)
 * 2. Security headers (No-Sniff, Frame-Options, etc.)
 * 3. POST-only and application/json enforcement
 * 4. Max payload size guard (413 handling)
 * 5. Safe error handling (zero stack trace leakage)
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '../schemas/api.schemas';
import { SECURITY_LIMITS } from '../../src/models/security.constants';

interface ClientRateRecord {
  count: number;
  resetTime: number;
}

interface HttpPayloadError {
  type?: string;
  status?: number;
  statusCode?: number;
  message?: string;
}

const clientRates = new Map<string, ClientRateRecord>();
const RATE_WINDOW_MS = SECURITY_LIMITS.RATE_LIMIT_WINDOW_MS ?? 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = SECURITY_LIMITS.MAX_REQUESTS_PER_WINDOW ?? 60;
const MAX_TRACKED_CLIENTS = SECURITY_LIMITS.MAX_TRACKED_CLIENTS ?? 5000;

/**
 * Periodically or capacity-triggered cleanup of expired rate limiter records to prevent unbounded memory growth.
 */
function pruneExpiredRateRecords(now: number): void {
  if (clientRates.size < MAX_TRACKED_CLIENTS) {
    return;
  }
  for (const [ip, record] of clientRates.entries()) {
    if (record.resetTime < now) {
      clientRates.delete(ip);
    }
  }
  // If still above capacity under flood, drop oldest entry
  while (clientRates.size >= MAX_TRACKED_CLIENTS) {
    const oldestKey = clientRates.keys().next().value;
    if (oldestKey) clientRates.delete(oldestKey);
    else break;
  }
}

/**
 * In-memory sliding rate limiter with bounded memory growth.
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();

  pruneExpiredRateRecords(now);

  let record = clientRates.get(ip);
  if (!record || record.resetTime < now) {
    record = { count: 1, resetTime: now + RATE_WINDOW_MS };
    clientRates.set(ip, record);
    return next();
  }

  record.count++;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Rate limit exceeded. Please wait a moment before sending additional synthesis requests.',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(429).json(errorResponse);
    return;
  }

  next();
}

/**
 * Resets the in-memory rate limiter (useful for test isolation).
 */
export function resetRateLimiter(): void {
  clientRates.clear();
}

/**
 * Applies security headers to all responses.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  next();
}

/**
 * Enforces JSON Content-Type and payload size limits for POST requests.
 */
export function enforceJsonAndSize(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'POST') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Content-Type must be application/json for POST endpoints.',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(415).json(errorResponse);
      return;
    }

    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > SECURITY_LIMITS.MAX_API_PAYLOAD_SIZE_BYTES) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'OVERSIZED_PAYLOAD',
          message: `Request payload exceeds maximum allowable size of ${SECURITY_LIMITS.MAX_API_PAYLOAD_SIZE_BYTES} bytes.`,
          timestamp: new Date().toISOString(),
        },
      };
      res.status(413).json(errorResponse);
      return;
    }
  }

  next();
}

/**
 * Global safe error handler - prevents stack trace leakage and properly formats errors.
 */
export function safeErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const payloadErr = (typeof err === 'object' && err !== null ? err : {}) as HttpPayloadError;
  const isOversized =
    payloadErr.type === 'entity.too.large' ||
    payloadErr.status === 413 ||
    payloadErr.statusCode === 413;

  const errorMessage = err instanceof Error ? err.message : 'An internal processing error occurred.';
  const isTimeout = errorMessage.toLowerCase().includes('timed out');
  const isPrivacyViolation = errorMessage.toLowerCase().includes('privacy boundary violation');

  let statusCode = 500;
  let errorCode: ApiErrorResponse['error']['code'] = 'INTERNAL_SERVER_ERROR';
  let clientMessage = 'Service temporarily unable to process the synthesis request.';

  if (isOversized) {
    statusCode = 413;
    errorCode = 'OVERSIZED_PAYLOAD';
    clientMessage = `Request payload exceeds maximum allowable size of ${SECURITY_LIMITS.MAX_API_PAYLOAD_SIZE_BYTES} bytes.`;
  } else if (isTimeout) {
    statusCode = 504;
    errorCode = 'BAD_REQUEST';
    clientMessage = 'The request took too long to complete. Please retry with a smaller excerpt.';
  } else if (isPrivacyViolation) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    clientMessage = errorMessage;
  }

  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: clientMessage,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(statusCode).json(errorResponse);
}
