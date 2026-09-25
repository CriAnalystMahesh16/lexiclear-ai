/**
 * LexiClear AI - Zod Runtime Schemas
 * Phase 2 Architectural Validation
 *
 * Strict validation enforcing domain boundaries, size constraints,
 * and rejection of unexpected properties.
 */

import { z } from 'zod';
import {
  ALLOWED_LEGAL_DOMAINS,
  ALLOWED_LEGAL_TOPICS,
  ALLOWED_PII_TYPES,
  ALLOWED_RISK_CATEGORIES,
  ALLOWED_RISK_LEVELS,
  ALLOWED_USER_PERSPECTIVES,
  SECURITY_LIMITS,
} from '../models/security.constants';

// Primitive Enum Schemas
export const LegalDomainSchema = z.enum(ALLOWED_LEGAL_DOMAINS);
export const LegalTopicSchema = z.enum(ALLOWED_LEGAL_TOPICS);
export const RiskLevelSchema = z.enum(ALLOWED_RISK_LEVELS);
export const RiskCategorySchema = z.enum(ALLOWED_RISK_CATEGORIES);
export const PIITypeSchema = z.enum(ALLOWED_PII_TYPES);
export const UserPerspectiveSchema = z.enum(ALLOWED_USER_PERSPECTIVES);

// Finding Evidence Schema (Fact / Source Text)
export const FindingEvidenceSchema = z.object({
  provenance: z.literal('FACT_SOURCE_TEXT'),
  exactQuote: z
    .string()
    .min(1, 'Evidence quote cannot be empty')
    .max(
      SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS,
      `Excerpt exceeds maximum limit of ${SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS} characters`
    ),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().positive(),
  sectionReference: z.string().min(1).max(100),
  characterLength: z
    .number()
    .int()
    .positive()
    .max(
      SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS,
      `Character length exceeds excerpt ceiling of ${SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS}`
    ),
}).strict();

// Deterministic Finding Schema (Analysis Layer)
export const DeterministicFindingSchema = z.object({
  provenance: z.literal('DETERMINISTIC_ANALYSIS'),
  checkId: z.string().min(1).max(100),
  category: RiskCategorySchema,
  riskLevel: RiskLevelSchema,
  title: z.string().min(1).max(200),
  plainEnglishExplanation: z.string().min(1).max(2000),
  evidence: FindingEvidenceSchema,
  sourceClauseId: z.string().min(1).max(100),
  sourceSectionId: z.string().min(1).max(100),
  whyItMatters: z.string().min(1).max(2000),
  suggestedQuestion: z.string().min(1).max(1000),
  negotiationGuidance: z.string().max(2000).optional(),
  balancedAlternativeProposal: z.string().max(2000).optional(),
}).strict();

// Document Input Schema (Client Intake)
export const DocumentInputSchema = z.object({
  provenance: z.literal('FACT_SOURCE_TEXT'),
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  domain: LegalDomainSchema,
  perspective: UserPerspectiveSchema,
  rawText: z
    .string()
    .min(
      SECURITY_LIMITS.MIN_DOCUMENT_SIZE_CHARS,
      `Document must contain at least ${SECURITY_LIMITS.MIN_DOCUMENT_SIZE_CHARS} characters`
    )
    .max(
      SECURITY_LIMITS.MAX_DOCUMENT_SIZE_CHARS,
      `Document exceeds maximum length of ${SECURITY_LIMITS.MAX_DOCUMENT_SIZE_CHARS} characters`
    ),
  characterCount: z.number().int().positive().max(SECURITY_LIMITS.MAX_DOCUMENT_SIZE_CHARS),
  uploadedAt: z.string().datetime(),
}).strict();

// Obligation Schema
export const ObligationSchema = z.object({
  provenance: z.literal('DETERMINISTIC_ANALYSIS'),
  id: z.string().min(1).max(100),
  clauseId: z.string().min(1).max(100),
  responsibleParty: z.string().min(1).max(100),
  actionRequired: z.string().min(1).max(1000),
  deadlineTrigger: z.string().min(1).max(500),
  consequenceOfBreach: z.string().min(1).max(500),
  isConditionPrecedent: z.boolean(),
}).strict();

// Analysis Result Schema
export const AnalysisResultSchema = z.object({
  provenance: z.literal('DETERMINISTIC_ANALYSIS'),
  docId: z.string().min(1).max(100),
  domain: LegalDomainSchema,
  perspective: UserPerspectiveSchema,
  overallRiskScore: z.number().int().min(0).max(100),
  overallRiskTier: RiskLevelSchema,
  executiveSummary: z.string().min(1).max(5000),
  findings: z
    .array(DeterministicFindingSchema)
    .max(SECURITY_LIMITS.MAX_FINDINGS_PER_DOC, `Findings count exceeds ceiling of ${SECURITY_LIMITS.MAX_FINDINGS_PER_DOC}`),
  obligations: z
    .array(ObligationSchema)
    .max(SECURITY_LIMITS.MAX_OBLIGATIONS_PER_DOC),
  missingProtections: z.array(z.string().min(1).max(500)).max(50),
  analyzedAt: z.string().datetime(),
}).strict();

// AI Request Boundary Schema (Strict Zero-PII, Excerpt-Capped)
export const GeminiMemoRequestSchema = z.object({
  provenance: z.literal('AI_SYNTHESIS'),
  documentId: z.string().min(1).max(100),
  domain: LegalDomainSchema,
  targetPerspective: UserPerspectiveSchema,
  overallRiskTier: RiskLevelSchema,
  sanitizedFindings: z
    .array(
      z.object({
        checkId: z.string().min(1).max(100),
        category: RiskCategorySchema,
        riskLevel: RiskLevelSchema,
        sanitizedExcerpt: z
          .string()
          .min(1)
          .max(
            SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS,
            `Sanitized excerpt exceeds ceiling of ${SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS} characters`
          ),
        whyItMatters: z.string().min(1).max(2000),
      }).strict()
    )
    .min(1, 'At least one finding is required for memo synthesis')
    .max(SECURITY_LIMITS.MAX_FINDINGS_PER_DOC),
  focusQuestions: z.array(z.string().max(500)).max(20).optional(),
}).strict();

// AI Response Boundary Schema
export const GeminiMemoResponseSchema = z.object({
  provenance: z.literal('AI_SYNTHESIS'),
  documentId: z.string().min(1).max(100),
  executiveSummary: z.string().min(1).max(10000),
  plainEnglishBrief: z.string().min(1).max(10000),
  contextualRiskAnalysis: z.string().min(1).max(10000),
  counselQuestions: z.array(z.string().min(1).max(1000)).max(50),
  suggestedRedlineFraming: z.array(
    z.object({
      checkId: z.string().min(1).max(100),
      proposedLanguage: z.string().min(1).max(2000),
      strategicRationale: z.string().min(1).max(2000),
    }).strict()
  ).max(50),
  synthesizedAt: z.string().datetime(),
}).strict();
