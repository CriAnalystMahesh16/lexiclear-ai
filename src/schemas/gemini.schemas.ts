/**
 * LexiClear AI - Gemini Integration Schemas
 * Phase 4 Responsible AI Contracts
 *
 * Strict Zod schemas enforcing input and output validation for:
 * 1. Plain-English Finding Explanation
 * 2. Balanced Negotiation Alternative
 * 3. Attorney Consultation Brief
 * 4. Document-Bounded Q&A
 */

import { z } from 'zod';
import {
  LegalDomainSchema,
  RiskCategorySchema,
  RiskLevelSchema,
  UserPerspectiveSchema,
} from './domain.schemas';
import { SECURITY_LIMITS } from '../models/security.constants';

// Universal AI Disclaimers
export const AI_DISCLAIMERS = {
  EXPLANATION: 'AI-generated explanation based on the verified document evidence.',
  NEGOTIATION: 'Suggested negotiation starting point — not legal advice.',
  ATTORNEY_BRIEF: 'Prepared to help organize questions for review by a qualified legal professional.',
  DOCUMENT_QA: 'AI-assisted informational response grounded strictly in verified document text. Not legal advice.',
  INSUFFICIENT_INFO: 'This document does not contain sufficient information to answer this question. Consider consulting a qualified legal professional.',
} as const;

// =========================================================================
// FEATURE #1: PLAIN-ENGLISH EXPLANATION
// =========================================================================

export const ExplainFindingRequestSchema = z.object({
  findingId: z.string().min(1).max(100),
  perspective: UserPerspectiveSchema,
  category: RiskCategorySchema,
  severity: RiskLevelSchema,
  exactExcerpt: z
    .string()
    .min(1)
    .max(
      SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS,
      `Excerpt exceeds ${SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS} character limit`
    ),
  deterministicExplanation: z.string().min(1).max(2000),
  obligationMetadata: z.string().max(1000).optional(),
}).strict();

export type ExplainFindingRequest = z.infer<typeof ExplainFindingRequestSchema>;

export const ExplainFindingResponseSchema = z.object({
  plainExplanation: z.string().min(1).max(3000),
  keyConcern: z.string().min(1).max(2000),
  questionToAsk: z.string().min(1).max(1000),
  disclaimer: z.string().min(1).max(500),
}).strict();

export type ExplainFindingResponse = z.infer<typeof ExplainFindingResponseSchema>;

// =========================================================================
// FEATURE #2: BALANCED NEGOTIATION ALTERNATIVE
// =========================================================================

export const BalancedAlternativeRequestSchema = z.object({
  findingId: z.string().min(1).max(100),
  exactClause: z
    .string()
    .min(1)
    .max(
      SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS,
      `Clause excerpt exceeds ${SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS} character limit`
    ),
  perspective: UserPerspectiveSchema,
  category: RiskCategorySchema,
  deterministicSummary: z.string().min(1).max(2000),
}).strict();

export type BalancedAlternativeRequest = z.infer<typeof BalancedAlternativeRequestSchema>;

export const BalancedAlternativeResponseSchema = z.object({
  proposedLanguage: z.string().min(1).max(3000),
  rationale: z.string().min(1).max(2000),
  negotiationGoal: z.string().min(1).max(1000),
  disclaimer: z.string().min(1).max(500),
}).strict();

export type BalancedAlternativeResponse = z.infer<typeof BalancedAlternativeResponseSchema>;

// =========================================================================
// FEATURE #3: ATTORNEY CONSULTATION BRIEF
// =========================================================================

export const AttorneyBriefRequestSchema = z.object({
  documentTitle: z.string().min(1).max(200),
  domain: LegalDomainSchema,
  perspective: UserPerspectiveSchema,
  riskScore: z.number().int().min(0).max(100),
  riskTier: RiskLevelSchema,
  sanitizedFindings: z
    .array(
      z.object({
        checkId: z.string().min(1).max(100),
        category: RiskCategorySchema,
        riskLevel: RiskLevelSchema,
        sanitizedExcerpt: z.string().min(1).max(SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS),
        plainSummary: z.string().min(1).max(2000),
        whyItMatters: z.string().min(1).max(2000),
      }).strict()
    )
    .min(1, 'At least one finding is required for brief synthesis')
    .max(SECURITY_LIMITS.MAX_FINDINGS_PER_DOC),
  missingProtections: z.array(z.string().min(1).max(500)).max(50).optional(),
}).strict();

export type AttorneyBriefRequest = z.infer<typeof AttorneyBriefRequestSchema>;

export const AttorneyBriefResponseSchema = z.object({
  executiveSummary: z.string().min(1).max(5000),
  topConcerns: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        category: z.string().min(1).max(100),
        severity: RiskLevelSchema,
        evidenceSnippet: z.string().min(1).max(SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS),
        strategicImplication: z.string().min(1).max(2000),
      }).strict()
    )
    .max(30),
  questionsForCounsel: z.array(z.string().min(1).max(1000)).max(25),
  redlinePriorities: z
    .array(
      z.object({
        issue: z.string().min(1).max(300),
        recommendedAction: z.string().min(1).max(1000),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      }).strict()
    )
    .max(30),
  disclaimer: z.string().min(1).max(500),
}).strict();

export type AttorneyBriefResponse = z.infer<typeof AttorneyBriefResponseSchema>;

// =========================================================================
// FEATURE #4: DOCUMENT-BOUNDED Q&A
// =========================================================================

export const DocumentQARequestSchema = z.object({
  documentId: z.string().min(1).max(100),
  perspective: UserPerspectiveSchema,
  userQuery: z
    .string()
    .min(3, 'Query must be at least 3 characters')
    .max(SECURITY_LIMITS.MAX_USER_QUERY_CHARS, `Query exceeds ${SECURITY_LIMITS.MAX_USER_QUERY_CHARS} characters`),
  verifiedExcerpts: z
    .array(
      z.object({
        sectionId: z.string().min(1).max(100),
        sectionTitle: z.string().min(1).max(200),
        excerptText: z.string().min(1).max(SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS),
      }).strict()
    )
    .min(1, 'At least one verified excerpt is required for grounded Q&A')
    .max(10),
}).strict();

export type DocumentQARequest = z.infer<typeof DocumentQARequestSchema>;

export const DocumentQAResponseSchema = z.object({
  answer: z.string().min(1).max(4000),
  referencedSections: z.array(z.string().min(1).max(100)).max(10),
  isGrounded: z.boolean(),
  disclaimer: z.string().min(1).max(500),
}).strict();

export type DocumentQAResponse = z.infer<typeof DocumentQAResponseSchema>;
