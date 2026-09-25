/**
 * LexiClear AI - Core Domain Models
 * Phase 2 Architectural Type System
 *
 * Enforces strict distinction between:
 * - FACT / SOURCE TEXT (provenance: 'FACT_SOURCE_TEXT')
 * - DETERMINISTIC ANALYSIS (provenance: 'DETERMINISTIC_ANALYSIS')
 * - GENERATIVE AI SYNTHESIS (provenance: 'AI_SYNTHESIS')
 */

import {
  ALLOWED_LEGAL_DOMAINS,
  ALLOWED_LEGAL_TOPICS,
  ALLOWED_PII_TYPES,
  ALLOWED_RISK_CATEGORIES,
  ALLOWED_RISK_LEVELS,
  ALLOWED_USER_PERSPECTIVES,
} from './security.constants';

// 1. LegalDomain
export type LegalDomain = typeof ALLOWED_LEGAL_DOMAINS[number];

// 2. LegalTopic
export type LegalTopic = typeof ALLOWED_LEGAL_TOPICS[number];

// 6. PIIType
export type PIIType = typeof ALLOWED_PII_TYPES[number];

// 8. RiskCategory
export type RiskCategory = typeof ALLOWED_RISK_CATEGORIES[number];

// 9. RiskLevel
export type RiskLevel = typeof ALLOWED_RISK_LEVELS[number];

// User Perspective Lens
export type UserPerspective = typeof ALLOWED_USER_PERSPECTIVES[number];

// Provenance Tier Discriminated Union
export type DataProvenanceTier = 
  | 'FACT_SOURCE_TEXT'
  | 'DETERMINISTIC_ANALYSIS'
  | 'AI_SYNTHESIS';

// 7. Redaction (Client-side localized PII redaction token)
export interface Redaction {
  readonly id: string;
  readonly piiType: PIIType;
  readonly token: string;
  readonly placeholder: string;
  readonly originalLength: number;
  readonly startOffset: number;
  readonly endOffset: number;
}

// 3. DocumentInput (Client-side raw ingested document prior to processing)
export interface DocumentInput {
  readonly provenance: 'FACT_SOURCE_TEXT';
  readonly id: string;
  readonly title: string;
  readonly domain: LegalDomain;
  readonly perspective: UserPerspective;
  readonly rawText: string;
  readonly characterCount: number;
  readonly uploadedAt: string;
}

// 4. DocumentSection (Segmented contract paragraph/article)
export interface DocumentSection {
  readonly provenance: 'FACT_SOURCE_TEXT';
  readonly id: string;
  readonly sectionNumber: string;
  readonly title: string;
  readonly rawText: string;
  readonly redactedText: string;
  readonly orderIndex: number;
  readonly startOffset: number;
  readonly endOffset: number;
}

// 5. Clause (Individual covenant or contractual clause extracted from section)
export interface Clause {
  readonly provenance: 'FACT_SOURCE_TEXT';
  readonly id: string;
  readonly sectionId: string;
  readonly clauseNumber: string;
  readonly title: string;
  readonly rawText: string;
  readonly redactedText: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly topic: LegalTopic;
  readonly isFlagged: boolean;
}

// 11. FindingEvidence (Exact quotation anchored with zero hallucination guarantee)
export interface FindingEvidence {
  readonly provenance: 'FACT_SOURCE_TEXT';
  readonly exactQuote: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly sectionReference: string;
  readonly characterLength: number;
}

// 10. DeterministicFinding (Rule-based legal risk detection with provenance separation)
export interface DeterministicFinding {
  readonly provenance: 'DETERMINISTIC_ANALYSIS';
  readonly checkId: string;
  readonly category: RiskCategory;
  readonly riskLevel: RiskLevel;
  readonly title: string;
  readonly plainEnglishExplanation: string;
  readonly evidence: FindingEvidence;
  readonly sourceClauseId: string;
  readonly sourceSectionId: string;
  readonly whyItMatters: string;
  readonly suggestedQuestion: string;
  readonly negotiationGuidance?: string;
  readonly balancedAlternativeProposal?: string;
}

// 12. Obligation (Contractual obligation extracted deterministically)
export interface Obligation {
  readonly provenance: 'DETERMINISTIC_ANALYSIS';
  readonly id: string;
  readonly clauseId: string;
  readonly responsibleParty: string;
  readonly actionRequired: string;
  readonly deadlineTrigger: string;
  readonly consequenceOfBreach: string;
  readonly isConditionPrecedent: boolean;
}

// 13. Deadline (Time-bound contractual milestone or notice window)
export interface Deadline {
  readonly provenance: 'DETERMINISTIC_ANALYSIS';
  readonly id: string;
  readonly obligationId: string;
  readonly clauseId: string;
  readonly description: string;
  readonly durationDays: number | null;
  readonly isBusinessDays: boolean;
  readonly triggerEvent: string;
  readonly isHardDeadline: boolean;
}

// 14. NegotiationQuestion (Structured questions directed to counsel or counterparty)
export interface NegotiationQuestion {
  readonly id: string;
  readonly findingId: string;
  readonly targetAudience: 'ATTORNEY' | 'COUNTERPARTY';
  readonly questionText: string;
  readonly strategicRationale: string;
}

// 15. NegotiationSuggestion (Market-standard balanced alternative posture)
export interface NegotiationSuggestion {
  readonly id: string;
  readonly findingId: string;
  readonly category: RiskCategory;
  readonly currentPosition: string;
  readonly proposedPosition: string;
  readonly fallbackPosition: string;
  readonly marketStandardRationale: string;
}

// 16. DocumentComparison (Side-by-side comparative redline)
export interface DocumentComparison {
  readonly provenance: 'DETERMINISTIC_ANALYSIS';
  readonly id: string;
  readonly clauseId: string;
  readonly originalClauseText: string;
  readonly proposedRedlineText: string;
  readonly changesSummary: string;
  readonly balancedTermsRationale: string;
}

// 17. AnalysisResult (Complete deterministic audit dossier)
export interface AnalysisResult {
  readonly provenance: 'DETERMINISTIC_ANALYSIS';
  readonly docId: string;
  readonly domain: LegalDomain;
  readonly perspective: UserPerspective;
  readonly overallRiskScore: number;
  readonly overallRiskTier: RiskLevel;
  readonly executiveSummary: string;
  readonly findings: readonly DeterministicFinding[];
  readonly obligations: readonly Obligation[];
  readonly missingProtections: readonly string[];
  readonly analyzedAt: string;
}

// 18. GeminiMemoRequest (Privacy-bounded outbound request payload: NO raw PII, NO full raw text)
export interface GeminiMemoRequest {
  readonly provenance: 'AI_SYNTHESIS';
  readonly documentId: string;
  readonly domain: LegalDomain;
  readonly targetPerspective: UserPerspective;
  readonly overallRiskTier: RiskLevel;
  readonly sanitizedFindings: readonly {
    readonly checkId: string;
    readonly category: RiskCategory;
    readonly riskLevel: RiskLevel;
    readonly sanitizedExcerpt: string;
    readonly whyItMatters: string;
  }[];
  readonly focusQuestions?: readonly string[];
}

// 19. GeminiMemoResponse (Synthesized executive output returned by AI boundary)
export interface GeminiMemoResponse {
  readonly provenance: 'AI_SYNTHESIS';
  readonly documentId: string;
  readonly executiveSummary: string;
  readonly plainEnglishBrief: string;
  readonly contextualRiskAnalysis: string;
  readonly counselQuestions: readonly string[];
  readonly suggestedRedlineFraming: readonly {
    readonly checkId: string;
    readonly proposedLanguage: string;
    readonly strategicRationale: string;
  }[];
  readonly synthesizedAt: string;
}

// 20. ClauseRationale (Strategic rationale detailing asymmetry and market standards)
export interface ClauseRationale {
  readonly clauseId: string;
  readonly category: RiskCategory;
  readonly counterpartyIncentive: string;
  readonly clientRiskExposure: string;
  readonly marketStandardComparison: string;
}

// 21. NegotiationEmail (Collaborative or firm redline cover communication)
export interface NegotiationEmail {
  readonly subject: string;
  readonly recipient: string;
  readonly openingSalutation: string;
  readonly proposedRevisions: readonly {
    readonly clauseReference: string;
    readonly summary: string;
    readonly compromiseProposal: string;
  }[];
  readonly closingRemarks: string;
  readonly tone: 'COLLABORATIVE' | 'FIRM' | 'FORMAL';
}

// 22. AttorneyConsultationBrief (Comprehensive attorney briefing dossier)
export interface AttorneyConsultationBrief {
  readonly docketId: string;
  readonly documentTitle: string;
  readonly domain: LegalDomain;
  readonly perspective: UserPerspective;
  readonly generatedDate: string;
  readonly riskScore: number;
  readonly riskTier: RiskLevel;
  readonly executiveSummary: string;
  readonly keyConcerns: readonly {
    readonly title: string;
    readonly category: RiskCategory;
    readonly level: RiskLevel;
    readonly exactQuote: string;
    readonly plainExplanation: string;
    readonly counterProposal: string;
    readonly questionsForAttorney: readonly string[];
  }[];
  readonly missingStandardProtections: readonly string[];
  readonly statutoryNoticeDisclaimer: string;
}
