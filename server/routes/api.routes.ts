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
  ApiErrorResponse,
} from '../schemas/api.schemas';
import { analyzeDocumentDeterministically } from '../../src/engine/deterministicEngine';
import { auditTextForPiiLeakage } from '../../src/utils/privacyBoundary';
import { auditForPromptInjection } from '../services/promptSanitizer';
import { SECURITY_LIMITS } from '../../src/models/security.constants';

export const apiRouter = Router();

// Strict POST-only enforcement across all operational /api endpoints
apiRouter.use((req: Request, res: Response, next) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: `Method ${req.method} is not allowed on ${req.baseUrl}${req.path}. Only POST requests are permitted.`,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  next();
});

// POST /api/analyze
apiRouter.post(
  '/analyze',
  validateBody(AnalyzeRequestSchema),
  (req: Request<{}, {}, AnalyzeRequest>, res: Response<AnalyzeSuccessResponse | ApiErrorResponse>) => {
    const startTime = Date.now();
    const { documentId, domain, perspective, sanitizedText } = req.body;

    // Run real deterministic legal analysis engine
    const analysis = analyzeDocumentDeterministically({
      sourceText: sanitizedText,
      documentId,
      domain,
      perspective,
    });

    // Map findings to DeterministicFinding schema shape
    const formattedFindings = analysis.findings.slice(0, SECURITY_LIMITS.MAX_FINDINGS_PER_DOC).map((f) => {
      const quote = f.exactQuote.length > SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS
        ? f.exactQuote.slice(0, SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS)
        : f.exactQuote;

      return {
        provenance: 'DETERMINISTIC_ANALYSIS' as const,
        checkId: f.checkId,
        category: f.category,
        riskLevel: f.riskLevel,
        title: f.title,
        plainEnglishExplanation: f.plainEnglishSummary,
        evidence: {
          provenance: 'FACT_SOURCE_TEXT' as const,
          exactQuote: quote,
          startOffset: 0,
          endOffset: quote.length,
          sectionReference: f.sourceSectionId || 'General',
          characterLength: quote.length,
        },
        sourceClauseId: f.sourceClauseId,
        sourceSectionId: f.sourceSectionId,
        whyItMatters: f.whyItMatters,
        suggestedQuestion: f.suggestedQuestion,
        negotiationGuidance: f.suggestedBalancedRevision,
        balancedAlternativeProposal: f.suggestedBalancedRevision,
      };
    });

    // Map obligations to ObligationSchema shape
    const formattedObligations = analysis.obligations.slice(0, SECURITY_LIMITS.MAX_OBLIGATIONS_PER_DOC).map((o) => ({
      provenance: 'DETERMINISTIC_ANALYSIS' as const,
      id: o.id,
      clauseId: o.clauseId,
      responsibleParty: o.responsibleParty || 'Party',
      actionRequired: o.actionRequired.slice(0, 1000),
      deadlineTrigger: (o.deadlineOrTrigger || 'Standard performance window').slice(0, 500),
      consequenceOfBreach: (o.consequenceOfBreach || 'Contractual default or claim for damages.').slice(0, 500),
      isConditionPrecedent: Boolean(o.isConditionPrecedent),
    }));

    const responsePayload: AnalyzeSuccessResponse = {
      success: true,
      data: {
        provenance: 'DETERMINISTIC_ANALYSIS',
        docId: documentId,
        domain,
        perspective,
        overallRiskScore: analysis.overallRiskScore,
        overallRiskTier: analysis.overallRiskTier,
        executiveSummary: analysis.executiveSummary.slice(0, 5000),
        findings: formattedFindings,
        obligations: formattedObligations,
        missingProtections: [...analysis.missingStandardProtections],
        analyzedAt: new Date().toISOString(),
      },
      metadata: {
        processingTimeMs: Math.max(1, Date.now() - startTime),
        clausesScanned: analysis.clauses.length,
        findingsCount: formattedFindings.length,
      },
    };

    res.json(responsePayload);
  }
);

// POST /api/ask-document
apiRouter.post(
  '/ask-document',
  validateBody(AskDocumentRequestSchema),
  (req: Request<{}, {}, AskDocumentRequest>, res: Response<AskDocumentSuccessResponse | ApiErrorResponse>) => {
    const { userQuery, relevantExcerpts } = req.body;

    // 1. Strict outbound privacy boundary: check for raw PII in user query
    const piiAudit = auditTextForPiiLeakage(userQuery);
    if (!piiAudit.isSafe) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PII_DETECTED_IN_PAYLOAD',
          message: `Privacy boundary violation: ${piiAudit.violations.join('; ')}`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // 2. Strict prompt security boundary: check for prompt injection in user query
    const injectionCheck = auditForPromptInjection(userQuery);
    if (injectionCheck.isFlagged) {
      res.json({
        success: true,
        data: {
          answer: 'This inquiry cannot be processed because it contains prohibited instructions or requests unauthorized legal counsel. LexiClear AI answers questions grounded strictly in supplied contract text.',
          referencedSections: [],
          attorneyFollowUpQuestion: 'Would you like to review the specific clauses identified in the analysis docket?',
          riskImplication: 'Prompt security boundary triggered.',
        },
        metadata: {
          groundedSourcesCount: 0,
          evaluatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    // 3. Deterministic Grounded Evaluation: Match inquiry keywords against provided excerpts
    const stopWords = new Set(['what', 'when', 'where', 'which', 'who', 'why', 'how', 'is', 'are', 'the', 'this', 'that', 'does', 'do', 'can', 'in', 'on', 'of', 'for', 'to', 'a', 'an', 'and', 'or', 'if']);
    const queryTokens = userQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const matchingExcerpts = relevantExcerpts.filter((e) => {
      const excerptLower = e.excerptText.toLowerCase();
      return queryTokens.some((token) => excerptLower.includes(token));
    });

    if (matchingExcerpts.length === 0) {
      res.json({
        success: true,
        data: {
          answer: 'The verified document excerpts provided do not contain terms addressing this inquiry. LexiClear AI adheres to strict document grounding and does not extrapolate beyond supplied contract text.',
          referencedSections: [],
          attorneyFollowUpQuestion: 'Consider requesting the counterparty provide explicit contract language addressing this subject.',
          riskImplication: 'Silence or omission in contract text regarding this topic.',
        },
        metadata: {
          groundedSourcesCount: 0,
          evaluatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    // Synthesize grounded deterministic findings from matching excerpts
    const referencedSections = matchingExcerpts.map((e) => e.sectionId).slice(0, 10);
    const excerptSummaries = matchingExcerpts
      .slice(0, 3)
      .map((e) => `Section ${e.sectionId} ("${e.sectionTitle}") states: "${e.excerptText.slice(0, 180)}..."`)
      .join(' ');

    const answer = `Based strictly on verified contract text, the relevant provision(s) address this inquiry as follows: ${excerptSummaries}`;

    res.json({
      success: true,
      data: {
        answer: answer.slice(0, 5000),
        referencedSections,
        attorneyFollowUpQuestion: 'Can legal counsel verify whether the counterparties obligations in these sections meet local statutory standards?',
        riskImplication: 'Relevant contractual language found. Review the highlighted sections for asymmetric terms.',
      },
      metadata: {
        groundedSourcesCount: matchingExcerpts.length,
        evaluatedAt: new Date().toISOString(),
      },
    });
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
