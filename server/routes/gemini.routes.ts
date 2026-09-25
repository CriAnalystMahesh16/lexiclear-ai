/**
 * LexiClear AI - Gemini AI Routes
 * Phase 4 Responsible AI Endpoints
 *
 * Implements:
 * 1. POST-only enforcement across all /api/ai endpoints
 * 2. POST /api/ai/explain-finding
 * 3. POST /api/ai/balanced-alternative
 * 4. POST /api/ai/attorney-brief
 * 5. POST /api/ai/ask-document
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate';
import {
  ExplainFindingRequestSchema,
  BalancedAlternativeRequestSchema,
  AttorneyBriefRequestSchema,
  DocumentQARequestSchema,
} from '../../src/schemas/gemini.schemas';
import { geminiSynthesisService } from '../services/geminiSynthesisService';
import { ApiErrorResponse } from '../schemas/api.schemas';

export const geminiRouter = Router();

// Strict POST-only enforcement across all /api/ai endpoints
geminiRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: `Method ${req.method} is not allowed on ${req.baseUrl}${req.path}. Only POST requests are permitted.`,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(405).json(errorResponse);
    return;
  }
  next();
});

// 1. Plain-English Finding Explanation
geminiRouter.post(
  '/explain-finding',
  validateBody(ExplainFindingRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await geminiSynthesisService.synthesizeFindingExplanation(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Balanced Negotiation Alternative
geminiRouter.post(
  '/balanced-alternative',
  validateBody(BalancedAlternativeRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await geminiSynthesisService.generateBalancedAlternative(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 3. Attorney Consultation Brief
geminiRouter.post(
  '/attorney-brief',
  validateBody(AttorneyBriefRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await geminiSynthesisService.generateAttorneyConsultationBrief(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 4. Document-Bounded Grounded Q&A
geminiRouter.post(
  '/ask-document',
  validateBody(DocumentQARequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await geminiSynthesisService.answerDocumentQuestion(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);
