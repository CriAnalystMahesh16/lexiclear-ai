/**
 * LexiClear AI - API Routes
 * Phase 2 Architectural Endpoints
 *
 * Implements typed Express routes with strict Zod validation middleware.
 * In Phase 2, this verifies the API contracts without calling external AI providers.
 */

import { Router, Request, Response } from 'express';
import { validateBody } from '../middleware/validate';
import {
  AnalyzeRequestSchema,
  AnalyzeRequest,
  AskDocumentRequestSchema,
  AskDocumentRequest,
  GenerateBriefRequestSchema,
  GenerateBriefRequest,
  AnalyzeSuccessResponse,
  AskDocumentSuccessResponse,
  GenerateBriefSuccessResponse,
} from '../schemas/api.schemas';

export const apiRouter = Router();

// POST /api/analyze
apiRouter.post(
  '/analyze',
  validateBody(AnalyzeRequestSchema),
  (req: Request<{}, {}, AnalyzeRequest>, res: Response<AnalyzeSuccessResponse>) => {
    const { documentId, domain, perspective } = req.body;

    // Phase 2 contract stub response verifying schema shape
    const responsePayload: AnalyzeSuccessResponse = {
      success: true,
      data: {
        provenance: 'DETERMINISTIC_ANALYSIS',
        docId: documentId,
        domain,
        perspective,
        overallRiskScore: 45,
        overallRiskTier: 'MODERATE',
        executiveSummary: 'Architectural analysis contract verification stub.',
        findings: [],
        obligations: [],
        missingProtections: ['Mutual indemnification clause', 'Reciprocal liability cap'],
        analyzedAt: new Date().toISOString(),
      },
      metadata: {
        processingTimeMs: 12,
        clausesScanned: 0,
        findingsCount: 0,
      },
    };

    res.json(responsePayload);
  }
);

// POST /api/ask-document
apiRouter.post(
  '/ask-document',
  validateBody(AskDocumentRequestSchema),
  (req: Request<{}, {}, AskDocumentRequest>, res: Response<AskDocumentSuccessResponse>) => {
    const { userQuery, relevantExcerpts } = req.body;

    const responsePayload: AskDocumentSuccessResponse = {
      success: true,
      data: {
        answer: `Architectural contract stub for query: "${userQuery}". Grounded strictly against ${relevantExcerpts.length} verified excerpt(s).`,
        referencedSections: relevantExcerpts.map((e) => e.sectionId),
        attorneyFollowUpQuestion: 'Does local state law limit the enforceability of this term?',
        riskImplication: 'Moderate asymmetric risk identified.',
      },
      metadata: {
        groundedSourcesCount: relevantExcerpts.length,
        evaluatedAt: new Date().toISOString(),
      },
    };

    res.json(responsePayload);
  }
);

// POST /api/generate-brief
apiRouter.post(
  '/generate-brief',
  validateBody(GenerateBriefRequestSchema),
  (req: Request<{}, {}, GenerateBriefRequest>, res: Response<GenerateBriefSuccessResponse>) => {
    const { documentId, documentTitle, memoRequest } = req.body;

    const responsePayload: GenerateBriefSuccessResponse = {
      success: true,
      data: {
        docketId: `docket-${documentId}`,
        documentTitle,
        domain: memoRequest.domain,
        perspective: memoRequest.targetPerspective,
        generatedDate: new Date().toISOString(),
        riskScore: 65,
        riskTier: memoRequest.overallRiskTier,
        executiveSummary: 'Synthesized attorney briefing contract stub.',
        keyConcerns: memoRequest.sanitizedFindings.map((f) => ({
          title: `Concern for ${f.category}`,
          category: f.category,
          level: f.riskLevel,
          exactQuote: f.sanitizedExcerpt,
          plainExplanation: f.whyItMatters,
          counterProposal: 'Negotiate mutual liability cap.',
          questionsForAttorney: ['What is the market standard cap for this transaction?'],
        })),
        missingStandardProtections: ['Mutual Indemnity'],
        statutoryNoticeDisclaimer: 'Informational Self-Help Resource: Not formal legal advice.',
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        docketVersion: '2.0.0',
      },
    };

    res.json(responsePayload);
  }
);
