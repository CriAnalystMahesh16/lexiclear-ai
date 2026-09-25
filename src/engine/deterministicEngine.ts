/**
 * LexiClear AI - Deterministic Legal Analysis Engine
 * Phase 3 Unified Analysis Orchestrator
 *
 * The authoritative source of truth for:
 * - document structure & segmentation
 * - clause detection
 * - exact quotations (100% verified verbatim substrings)
 * - risk categories and risk severity
 * - obligations & normalized deadlines
 * - asymmetric provisions
 * - PII findings
 *
 * Operates 100% locally and deterministically with zero external API calls.
 */

import { parseLegalDocument, ParsedClause, ParsedSection } from './parser';
import { detectAndRedactPii, DetectedPiiEntity } from './piiDetector';
import { extractObligationsAndDeadlines, ExtractedDeadline, ExtractedObligation } from './obligationExtractor';
import { detectContractualAsymmetry, AsymmetryFinding } from './asymmetryDetector';
import { LEGAL_RULES_CATALOG } from './rules';
import { isVerbatimSubstring } from './quoteVerifier';
import { calculateDeterministicRiskScore, ScoreExplanation } from './riskScorer';
import { LegalDomain, RiskCategory, RiskLevel, UserPerspective } from '../models/domain.models';
import { SECURITY_LIMITS } from '../models/security.constants';

export interface VerifiedFinding {
  readonly id: string;
  readonly checkId: string;
  readonly clauseId: string;
  readonly category: RiskCategory;
  readonly level: RiskLevel;
  readonly riskLevel: RiskLevel;
  readonly title: string;
  readonly exactQuote: string;
  readonly plainEnglishSummary: string;
  readonly strategicRisk: string;
  readonly suggestedBalancedRevision: string;
  readonly attorneyQuestions: readonly string[];
  readonly whyItMatters: string;
  readonly suggestedQuestion: string;
  readonly sourceClauseId: string;
  readonly sourceSectionId: string;
  readonly provenance: 'DETERMINISTIC_ANALYSIS';
}

export interface ComprehensiveAnalysisResult {
  readonly provenance: 'DETERMINISTIC_ANALYSIS';
  readonly docId: string;
  readonly domain: LegalDomain;
  readonly perspective: UserPerspective;
  readonly documentMetadata: {
    readonly characterCount: number;
    readonly lineCount: number;
    readonly sectionCount: number;
    readonly clauseCount: number;
    readonly isPiiScrubbed: boolean;
    readonly analyzedAt: string;
  };
  readonly sections: readonly ParsedSection[];
  readonly clauses: readonly ParsedClause[];
  readonly findings: readonly VerifiedFinding[];
  readonly obligations: readonly ExtractedObligation[];
  readonly deadlines: readonly ExtractedDeadline[];
  readonly asymmetries: readonly AsymmetryFinding[];
  readonly piiFindings: {
    readonly entityCount: number;
    readonly entities: readonly DetectedPiiEntity[];
    readonly redactedText: string;
  };
  readonly riskSummary: ScoreExplanation;
  readonly overallRiskScore: number;
  readonly overallRiskTier: RiskLevel;
  readonly executiveSummary: string;
  readonly missingStandardProtections: readonly string[];
  readonly analyzedAt: string;
}

/**
 * Analyzes a legal document through the deterministic legal engine.
 */
export function analyzeDocumentDeterministically(params: {
  sourceText: string;
  documentId?: string;
  domain?: LegalDomain;
  perspective?: UserPerspective;
}): ComprehensiveAnalysisResult {
  const {
    sourceText,
    documentId = 'doc-active',
    domain = 'commercial_contracts',
    perspective = 'service_provider_or_contractor',
  } = params;

  // 1. Guard against oversized inputs
  if (sourceText.length > SECURITY_LIMITS.MAX_DOCUMENT_SIZE_CHARS) {
    throw new Error(
      `Document size (${sourceText.length} characters) exceeds the maximum security ceiling of ${SECURITY_LIMITS.MAX_DOCUMENT_SIZE_CHARS} characters.`
    );
  }

  // 2. Deterministic PII Detection
  const piiResult = detectAndRedactPii(sourceText);

  // 3. Document Parsing & Structure Extraction
  const parsedDoc = parseLegalDocument(sourceText);

  // 4. Extract Obligations & Deadlines
  const { obligations, deadlines } = extractObligationsAndDeadlines(parsedDoc.clauses);

  // 5. Detect Contractual Asymmetry
  const asymmetries = detectContractualAsymmetry(parsedDoc.clauses, deadlines);

  // 6. Run Modular Legal Rules & Exact Evidence Verification
  const candidateFindings: VerifiedFinding[] = [];
  let findingCounter = 0;

  for (const clause of parsedDoc.clauses) {
    for (const rule of LEGAL_RULES_CATALOG) {
      const matchResult = rule.matchClause(clause);

      if (matchResult && matchResult.isMatched) {
        // Strict assertion: Quote MUST be an exact substring of the original source document
        const verifiedQuote = matchResult.exactQuote.trim();
        const quoteIsValid = isVerbatimSubstring(sourceText, verifiedQuote);

        if (quoteIsValid) {
          findingCounter++;
          candidateFindings.push({
            id: `finding-${findingCounter}`,
            checkId: rule.checkId,
            clauseId: clause.id,
            category: rule.category,
            level: rule.severity,
            riskLevel: rule.severity,
            title: rule.title,
            exactQuote: verifiedQuote,
            plainEnglishSummary: rule.explanation,
            strategicRisk: rule.whyItMatters,
            suggestedBalancedRevision: rule.suggestedBalancedRevision,
            attorneyQuestions: [rule.suggestedQuestion],
            whyItMatters: rule.whyItMatters,
            suggestedQuestion: rule.suggestedQuestion,
            sourceClauseId: clause.id,
            sourceSectionId: clause.parentSectionId || clause.id,
            provenance: 'DETERMINISTIC_ANALYSIS',
          });
        }
      }
    }
  }

  // Deduplicate findings by rule checkId + clauseId
  const uniqueFindings: VerifiedFinding[] = [];
  const seenKeys = new Set<string>();

  for (const f of candidateFindings) {
    const key = `${f.checkId}-${f.clauseId}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueFindings.push(f);
    }
  }

  // 7. Calculate Deterministic Risk Score
  const riskSummary = calculateDeterministicRiskScore({
    findings: uniqueFindings,
    asymmetryCount: asymmetries.length,
  });

  // 8. Synthesize Missing Reciprocal Protections
  const missingProtections: string[] = [];
  const hasIndemnityFinding = uniqueFindings.some((f) => f.category === 'unilateral_indemnification');
  const hasIpFinding = uniqueFindings.some((f) => f.category === 'ip_ownership_overreach');
  const hasCurePeriod = deadlines.some((d) => d.type === 'CURE_PERIOD');

  if (hasIndemnityFinding) {
    missingProtections.push('Reciprocal counterparty indemnification');
    missingProtections.push('Mutual liability ceiling tied to contract consideration');
  }
  if (hasIpFinding) {
    missingProtections.push('Express reservation of pre-existing Background Technology');
  }
  if (!hasCurePeriod) {
    missingProtections.push('Mandatory 14-day written cure window prior to breach termination');
  }
  if (missingProtections.length === 0) {
    missingProtections.push('Mutual attorney fee allocation provision');
  }

  // 9. Synthesize Executive Synthesis Statement
  const executiveSummary = uniqueFindings.length > 0
    ? `Document scan identified ${uniqueFindings.length} risk finding(s) with ${riskSummary.breakdown.criticalCount} critical flag(s) and ${asymmetries.length} potential contractual asymmetry issue(s). Primary exposure relates to ${uniqueFindings[0].category.replace(/_/g, ' ')}. Recommend review against reciprocal market standards.`
    : 'No critical asymmetric traps detected in parsed provisions. Standard commercial terms identified.';

  const analyzedAt = new Date().toISOString();

  return {
    provenance: 'DETERMINISTIC_ANALYSIS',
    docId: documentId,
    domain,
    perspective,
    documentMetadata: {
      characterCount: parsedDoc.characterCount,
      lineCount: parsedDoc.lineCount,
      sectionCount: parsedDoc.sections.length,
      clauseCount: parsedDoc.clauses.length,
      isPiiScrubbed: piiResult.entities.length > 0,
      analyzedAt,
    },
    sections: parsedDoc.sections,
    clauses: parsedDoc.clauses,
    findings: uniqueFindings,
    obligations,
    deadlines,
    asymmetries,
    piiFindings: {
      entityCount: piiResult.entities.length,
      entities: piiResult.entities,
      redactedText: piiResult.redactedText,
    },
    riskSummary,
    overallRiskScore: riskSummary.score,
    overallRiskTier: riskSummary.tier,
    executiveSummary,
    missingStandardProtections: missingProtections,
    analyzedAt,
  };
}
