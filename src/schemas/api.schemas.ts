/**
 * LexiClear AI - API Contract Schemas
 * Phase 2 Architectural Endpoints
 *
 * Defines request, response, validation error, and server error shapes
 * for future server-boundary endpoints:
 * - POST /api/analyze
 * - POST /api/ask-document
 * - POST /api/generate-brief
 */

import { z } from 'zod';
import {
  AnalysisResultSchema,
  GeminiMemoRequestSchema,
  LegalDomainSchema,
  RiskLevelSchema,
  UserPerspectiveSchema,
} from './domain.schemas';
import { SECURITY_LIMITS } from '../models/security.constants';

// Universal API Error Response
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum([
      'BAD_REQUEST',
      'VALIDATION_ERROR',
      'OVERSIZED_PAYLOAD',
      'PII_DETECTED_IN_PAYLOAD',
      'INTERNAL_SERVER_ERROR',
      'UNAUTHORIZED',
      'NOT_FOUND',
    ]),
    message: z.string(),
    details: z.array(z.string()).optional(),
    timestamp: z.string().datetime(),
  }).strict(),
}).strict();

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// 1. Endpoint: POST /api/analyze
export const AnalyzeRequestSchema = z.object({
  documentId: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  domain: LegalDomainSchema,
  perspective: UserPerspectiveSchema,
  /** Pre-sanitized text payload. Schema enforces maximum character size and non-empty */
  sanitizedText: z
    .string()
    .min(SECURITY_LIMITS.MIN_DOCUMENT_SIZE_CHARS)
    .max(
      SECURITY_LIMITS.MAX_DOCUMENT_SIZE_CHARS,
      `Payload text exceeds limit of ${SECURITY_LIMITS.MAX_DOCUMENT_SIZE_CHARS} characters`
    ),
  isPiiScrubbed: z.literal(true, {
    message: 'Outbound payloads must be explicitly certified as PII scrubbed',
  }),
}).strict();

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const AnalyzeSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AnalysisResultSchema,
  metadata: z.object({
    processingTimeMs: z.number().int().nonnegative(),
    clausesScanned: z.number().int().nonnegative(),
    findingsCount: z.number().int().nonnegative(),
  }).strict(),
}).strict();

export type AnalyzeSuccessResponse = z.infer<typeof AnalyzeSuccessResponseSchema>;

// 2. Endpoint: POST /api/ask-document
export const AskDocumentRequestSchema = z.object({
  documentId: z.string().min(1).max(100),
  perspective: UserPerspectiveSchema,
  userQuery: z
    .string()
    .min(3, 'Query must be at least 3 characters')
    .max(
      SECURITY_LIMITS.MAX_USER_QUERY_CHARS,
      `Query exceeds maximum length of ${SECURITY_LIMITS.MAX_USER_QUERY_CHARS} characters`
    ),
  relevantExcerpts: z
    .array(
      z.object({
        sectionId: z.string().min(1).max(100),
        sectionTitle: z.string().min(1).max(200),
        excerptText: z
          .string()
          .min(1)
          .max(
            SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS,
            `Excerpt exceeds ${SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS} character limit`
          ),
      }).strict()
    )
    .min(1, 'At least one verified document excerpt is required for grounded Q&A')
    .max(10, 'Cannot exceed 10 contextual excerpts per query'),
}).strict();

export type AskDocumentRequest = z.infer<typeof AskDocumentRequestSchema>;

export const AskDocumentSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    answer: z.string().min(1).max(5000),
    referencedSections: z.array(z.string()).max(10),
    attorneyFollowUpQuestion: z.string().max(1000).optional(),
    riskImplication: z.string().max(1000).optional(),
  }).strict(),
  metadata: z.object({
    groundedSourcesCount: z.number().int().nonnegative(),
    evaluatedAt: z.string().datetime(),
  }).strict(),
}).strict();

export type AskDocumentSuccessResponse = z.infer<typeof AskDocumentSuccessResponseSchema>;

// 3. Endpoint: POST /api/generate-brief
export const GenerateBriefRequestSchema = z.object({
  documentId: z.string().min(1).max(100),
  documentTitle: z.string().min(1).max(200),
  memoRequest: GeminiMemoRequestSchema,
}).strict();

export type GenerateBriefRequest = z.infer<typeof GenerateBriefRequestSchema>;

export const GenerateBriefSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    docketId: z.string().min(1).max(100),
    documentTitle: z.string().min(1).max(200),
    domain: LegalDomainSchema,
    perspective: UserPerspectiveSchema,
    generatedDate: z.string().datetime(),
    riskScore: z.number().int().min(0).max(100),
    riskTier: RiskLevelSchema,
    executiveSummary: z.string().min(1).max(10000),
    keyConcerns: z.array(
      z.object({
        title: z.string().min(1).max(200),
        category: z.string().min(1).max(100),
        level: RiskLevelSchema,
        exactQuote: z.string().min(1).max(SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS),
        plainExplanation: z.string().min(1).max(2000),
        counterProposal: z.string().min(1).max(2000),
        questionsForAttorney: z.array(z.string().min(1).max(1000)).max(10),
      }).strict()
    ).max(SECURITY_LIMITS.MAX_FINDINGS_PER_DOC),
    missingStandardProtections: z.array(z.string().min(1).max(500)).max(50),
    statutoryNoticeDisclaimer: z.string().min(10).max(2000),
  }).strict(),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    docketVersion: z.string().min(1).max(20),
  }).strict(),
}).strict();

export type GenerateBriefSuccessResponse = z.infer<typeof GenerateBriefSuccessResponseSchema>;
