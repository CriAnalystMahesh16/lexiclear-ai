/**
 * LexiClear AI - Phase 2 Architectural & Boundary Test Suite
 *
 * Verifies the 10 foundational architectural gates:
 * 1. Type/model boundaries (Provenance separation)
 * 2. Zod validation for valid models
 * 3. Invalid risk levels rejection
 * 4. Invalid categories rejection
 * 5. Missing required finding evidence rejection
 * 6. Oversized document rejection (> 500,000 chars)
 * 7. Oversized excerpt rejection (> 2,000 chars)
 * 8. Invalid AI request rejection
 * 9. Unexpected property rejection (.strict() enforcement)
 * 10. Privacy-boundary payload validation (Zero unredacted PII)
 */

import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  DeterministicFindingSchema,
  DocumentInputSchema,
  FindingEvidenceSchema,
  GeminiMemoRequestSchema,
  RiskCategorySchema,
  RiskLevelSchema,
} from '../../src/schemas/domain.schemas';
import {
  AnalyzeRequestSchema,
  AskDocumentRequestSchema,
  GenerateBriefRequestSchema,
} from '../../src/schemas/api.schemas';
import { SECURITY_LIMITS } from '../../src/models/security.constants';
import {
  auditTextForPiiLeakage,
  constructPrivacyBoundedMemoRequest,
} from '../../src/utils/privacyBoundary';
import { DeterministicFinding } from '../../src/models/domain.models';

describe('Phase 2 Architectural & Model Boundaries', () => {

  // 1. Type/Model Boundaries
  it('1. should enforce strict provenance boundaries across Fact, Analysis, and AI tiers', () => {
    const validEvidence = {
      provenance: 'FACT_SOURCE_TEXT' as const,
      exactQuote: 'Client reserves the right to terminate immediately.',
      startOffset: 120,
      endOffset: 172,
      sectionReference: 'Section 4',
      characterLength: 52,
    };

    // Valid Fact evidence parsed successfully
    const parsedEvidence = FindingEvidenceSchema.parse(validEvidence);
    expect(parsedEvidence.provenance).toBe('FACT_SOURCE_TEXT');

    // Attempting to pass analysis provenance to evidence schema must fail
    expect(() =>
      FindingEvidenceSchema.parse({
        ...validEvidence,
        provenance: 'DETERMINISTIC_ANALYSIS',
      })
    ).toThrow(ZodError);
  });

  // 2. Zod Validation (Happy Path)
  it('2. should validate conformant DocumentInput and DeterministicFinding payloads', () => {
    const validDocInput = {
      provenance: 'FACT_SOURCE_TEXT' as const,
      id: 'doc-001',
      title: 'Consulting Services Agreement',
      domain: 'commercial_contracts' as const,
      perspective: 'service_provider_or_contractor' as const,
      rawText: 'This Agreement is between Client and Contractor for services.',
      characterCount: 61,
      uploadedAt: new Date().toISOString(),
    };

    const parsedDoc = DocumentInputSchema.parse(validDocInput);
    expect(parsedDoc.id).toBe('doc-001');

    const validFinding = {
      provenance: 'DETERMINISTIC_ANALYSIS' as const,
      checkId: 'CHK_INDEMNITY_01',
      category: 'unilateral_indemnification' as const,
      riskLevel: 'CRITICAL' as const,
      title: 'Uncapped One-Sided Indemnification',
      plainEnglishExplanation: 'Contractor pays all client legal costs without cap.',
      evidence: {
        provenance: 'FACT_SOURCE_TEXT' as const,
        exactQuote: 'Contractor shall indemnify Client against all claims without limitation.',
        startOffset: 200,
        endOffset: 272,
        sectionReference: 'Section 3',
        characterLength: 72,
      },
      sourceClauseId: 'clause-3',
      sourceSectionId: 'sec-3',
      whyItMatters: 'Exposes personal assets to unbounded third-party exposure.',
      suggestedQuestion: 'Can we insert a reciprocal liability cap equal to 12 months fees?',
      negotiationGuidance: 'Propose mutual gross-negligence standard.',
    };

    const parsedFinding = DeterministicFindingSchema.parse(validFinding);
    expect(parsedFinding.checkId).toBe('CHK_INDEMNITY_01');
  });

  // 3. Invalid Risk Levels
  it('3. should reject non-conforming or unknown risk levels', () => {
    const invalidLevels = ['EXTREME', 'SEVERE', 'URGENT', 'INFORMATIONAL', ''];

    for (const level of invalidLevels) {
      expect(() => RiskLevelSchema.parse(level)).toThrow(ZodError);
    }
  });

  // 4. Invalid Categories
  it('4. should reject unrecognized risk categories', () => {
    const invalidCategories = ['tax_evasion', 'environmental_hazards', 'unauthorized_clause', ''];

    for (const cat of invalidCategories) {
      expect(() => RiskCategorySchema.parse(cat)).toThrow(ZodError);
    }
  });

  // 5. Missing Required Finding Evidence
  it('5. should reject findings lacking exact factual quote evidence', () => {
    const findingMissingEvidence = {
      provenance: 'DETERMINISTIC_ANALYSIS' as const,
      checkId: 'CHK_IP_01',
      category: 'ip_ownership_overreach' as const,
      riskLevel: 'HIGH' as const,
      title: 'Broad IP Assignment',
      plainEnglishExplanation: 'Transfers pre-existing code.',
      // Evidence omitted
      sourceClauseId: 'clause-2',
      sourceSectionId: 'sec-2',
      whyItMatters: 'Loss of background tools.',
      suggestedQuestion: 'Can we schedule background technology?',
    };

    expect(() => DeterministicFindingSchema.parse(findingMissingEvidence)).toThrow(ZodError);
  });

  // 6. Oversized Document Rejection
  it('6. should reject documents exceeding maximum allowable size threshold', () => {
    const oversizedLength = SECURITY_LIMITS.MAX_DOCUMENT_SIZE_CHARS + 10;
    const oversizedText = 'A'.repeat(oversizedLength);

    const oversizedDoc = {
      provenance: 'FACT_SOURCE_TEXT' as const,
      id: 'doc-huge',
      title: 'Huge Document',
      domain: 'general_business' as const,
      perspective: 'neutral_observer' as const,
      rawText: oversizedText,
      characterCount: oversizedLength,
      uploadedAt: new Date().toISOString(),
    };

    expect(() => DocumentInputSchema.parse(oversizedDoc)).toThrow(ZodError);
  });

  // 7. Oversized Excerpt Rejection
  it('7. should reject clause excerpts exceeding the maximum privacy excerpt ceiling', () => {
    const oversizedQuote = 'Z'.repeat(SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS + 10);

    const oversizedEvidence = {
      provenance: 'FACT_SOURCE_TEXT' as const,
      exactQuote: oversizedQuote,
      startOffset: 10,
      endOffset: oversizedQuote.length + 10,
      sectionReference: 'Section 1',
      characterLength: oversizedQuote.length,
    };

    expect(() => FindingEvidenceSchema.parse(oversizedEvidence)).toThrow(ZodError);
  });

  // 8. Invalid AI Request Rejection
  it('8. should reject invalid AI synthesis memo requests lacking findings or perspective', () => {
    const invalidAiRequest = {
      provenance: 'AI_SYNTHESIS' as const,
      documentId: 'doc-002',
      domain: 'commercial_contracts' as const,
      targetPerspective: 'service_provider_or_contractor' as const,
      overallRiskTier: 'HIGH' as const,
      sanitizedFindings: [], // Empty findings must be rejected
    };

    expect(() => GeminiMemoRequestSchema.parse(invalidAiRequest)).toThrow(ZodError);
  });

  // 9. Unexpected Property Rejection (.strict() enforcement)
  it('9. should reject unexpected or injected properties on strict schemas', () => {
    const payloadWithInjectedProperty = {
      documentId: 'doc-123',
      title: 'Contract',
      domain: 'commercial_contracts' as const,
      perspective: 'tenant' as const,
      sanitizedText: 'Valid contract text that fulfills minimum character requirements.',
      isPiiScrubbed: true as const,
      // INJECTED PROPERTY
      injectedTelemetryWorkerId: 'WORKER_0xFA991',
    };

    expect(() => AnalyzeRequestSchema.parse(payloadWithInjectedProperty)).toThrow(ZodError);
  });

  // 10. Privacy Boundary Payload Validation
  it('10. should block unredacted PII from outbound AI payloads', () => {
    // 10a. SSN detection audit
    const textWithSsn = 'Contractor Jane Doe, SSN 123-45-6789, agrees to terms.';
    const auditSsn = auditTextForPiiLeakage(textWithSsn);
    expect(auditSsn.isSafe).toBe(false);
    expect(auditSsn.violations.some((v) => v.includes('SSN'))).toBe(true);

    // 10b. Email detection audit
    const textWithEmail = 'Notice shall be sent to counsel@apexcorp.com immediately.';
    const auditEmail = auditTextForPiiLeakage(textWithEmail);
    expect(auditEmail.isSafe).toBe(false);
    expect(auditEmail.violations.some((v) => v.includes('email'))).toBe(true);

    // 10c. Safe redacted text audit
    const safeRedactedText = 'Contractor Jane Doe, [ID_SSN_1], agrees to payment terms [AMOUNT_1].';
    const auditSafe = auditTextForPiiLeakage(safeRedactedText);
    expect(auditSafe.isSafe).toBe(true);
    expect(auditSafe.violations.length).toBe(0);

    // 10d. constructPrivacyBoundedMemoRequest throws on unredacted finding quote
    const unsafeFinding: DeterministicFinding = {
      provenance: 'DETERMINISTIC_ANALYSIS',
      checkId: 'CHK_UNSAFE_01',
      category: 'payment_and_withholding_traps',
      riskLevel: 'HIGH',
      title: 'Payment Trap',
      plainEnglishExplanation: 'Withholding fees',
      evidence: {
        provenance: 'FACT_SOURCE_TEXT',
        exactQuote: 'Payments sent to ceo.personal@startup.com shall be subject to hold.',
        startOffset: 50,
        endOffset: 110,
        sectionReference: 'Clause 4',
        characterLength: 60,
      },
      sourceClauseId: 'cl-4',
      sourceSectionId: 'sec-4',
      whyItMatters: 'Personal exposure',
      suggestedQuestion: 'How to pay?',
    };

    expect(() =>
      constructPrivacyBoundedMemoRequest({
        documentId: 'doc-unsafe',
        domain: 'commercial_contracts',
        perspective: 'service_provider_or_contractor',
        overallRiskTier: 'HIGH',
        findings: [unsafeFinding],
      })
    ).toThrow(/Privacy boundary violation/);
  });
});
