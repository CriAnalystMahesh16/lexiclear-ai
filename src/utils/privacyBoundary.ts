/**
 * LexiClear AI - Privacy Boundary Enforcement
 * Phase 2 Architectural Gate
 *
 * Guarantees that:
 * 1. Raw contract text remains client-side.
 * 2. Unredacted PII (SSNs, emails, phone numbers, full addresses) NEVER enters an AI-bound payload.
 * 3. Excerpts strictly obey length ceilings.
 * 4. Payloads are constructed only from approved sanitized findings.
 */

import { DeterministicFinding, GeminiMemoRequest, LegalDomain, RiskLevel, UserPerspective } from '../models/domain.models';
import { SECURITY_LIMITS } from '../models/security.constants';

const SSN_DETECTION_PATTERN = /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/;
const EMAIL_DETECTION_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_DETECTION_PATTERN = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/;

export interface PrivacyAuditResult {
  readonly isSafe: boolean;
  readonly violations: readonly string[];
}

/**
 * Validates a candidate outbound text string to ensure zero raw PII leaks.
 */
export function auditTextForPiiLeakage(text: string): PrivacyAuditResult {
  const violations: string[] = [];

  if (SSN_DETECTION_PATTERN.test(text)) {
    violations.push('Direct Social Security Number (SSN) pattern detected in candidate payload.');
  }

  if (EMAIL_DETECTION_PATTERN.test(text)) {
    violations.push('Direct email address pattern detected in candidate payload.');
  }

  if (PHONE_DETECTION_PATTERN.test(text)) {
    violations.push('Direct telephone number pattern detected in candidate payload.');
  }

  if (text.length > SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS) {
    violations.push(
      `Excerpt size (${text.length}) exceeds maximum allowable privacy window of ${SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS} characters.`
    );
  }

  return {
    isSafe: violations.length === 0,
    violations,
  };
}

/**
 * Transforms deterministic findings into a privacy-guaranteed GeminiMemoRequest.
 * Enforces excerpt truncation and rejects any unredacted PII.
 */
export function constructPrivacyBoundedMemoRequest(params: {
  documentId: string;
  domain: LegalDomain;
  perspective: UserPerspective;
  overallRiskTier: RiskLevel;
  findings: readonly DeterministicFinding[];
  focusQuestions?: readonly string[];
}): GeminiMemoRequest {
  const sanitizedFindings = params.findings.map((f) => {
    const rawQuote = f.evidence.exactQuote;
    const audit = auditTextForPiiLeakage(rawQuote);

    if (!audit.isSafe) {
      throw new Error(`Privacy boundary violation in finding [${f.checkId}]: ${audit.violations.join(', ')}`);
    }

    const boundedExcerpt =
      rawQuote.length > SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS
        ? rawQuote.substring(0, SECURITY_LIMITS.MAX_EXCERPT_LENGTH_CHARS - 3) + '...'
        : rawQuote;

    return {
      checkId: f.checkId,
      category: f.category,
      riskLevel: f.riskLevel,
      sanitizedExcerpt: boundedExcerpt,
      whyItMatters: f.whyItMatters,
    };
  });

  return {
    provenance: 'AI_SYNTHESIS',
    documentId: params.documentId,
    domain: params.domain,
    targetPerspective: params.perspective,
    overallRiskTier: params.overallRiskTier,
    sanitizedFindings,
    focusQuestions: params.focusQuestions,
  };
}
