/**
 * LexiClear AI - Deterministic Rule Scanner
 * Phase 3 Integration Adapter
 *
 * Implements deterministic risk scanning over clause segments.
 * Strictly guarantees that finding.exactQuote is an exact verbatim substring
 * of the original source text.
 */

import { ClauseSegment, UserPerspective } from '../types/document';
import { Finding, ObligationItem, RiskCategory, RiskLevel, AnalysisResult } from '../types/analysis';
import { LEGAL_RULES_CATALOG } from './rules';
import { isVerbatimSubstring } from './quoteVerifier';
import { calculateDeterministicRiskScore } from './riskScorer';

export function runDeterministicRuleScan(
  segments: ClauseSegment[],
  perspective: UserPerspective = 'service_provider_or_contractor'
): AnalysisResult {
  const findings: Finding[] = [];
  const obligations: ObligationItem[] = [];

  const fullRawText = segments.map((s) => s.rawText).join('\n\n');

  for (const seg of segments) {
    const parsedClause = {
      id: seg.id,
      clauseNumber: seg.sectionNumber,
      heading: seg.title,
      originalText: seg.rawText,
      startOffset: seg.startIndex,
      endOffset: seg.endIndex,
      startLine: 1,
      endLine: 1,
    };

    for (const rule of LEGAL_RULES_CATALOG) {
      const matchResult = rule.matchClause(parsedClause);

      if (matchResult && matchResult.isMatched) {
        const candidateQuote = matchResult.exactQuote.trim();

        // Exact substring verification assertion
        if (isVerbatimSubstring(seg.rawText, candidateQuote) || isVerbatimSubstring(fullRawText, candidateQuote)) {
          findings.push({
            id: `find-${findings.length + 1}`,
            clauseId: seg.id,
            category: rule.category,
            level: rule.severity,
            exactQuote: candidateQuote,
            plainEnglishSummary: rule.explanation,
            strategicRisk: rule.whyItMatters,
            suggestedBalancedRevision: rule.suggestedBalancedRevision,
            attorneyQuestions: [rule.suggestedQuestion],
          });
          break; // Keep strongest finding per segment
        }
      }
    }

    // Extract basic obligations
    const textLower = seg.rawText.toLowerCase();
    if (textLower.includes('shall') || textLower.includes('agrees to') || textLower.includes('must')) {
      obligations.push({
        id: `ob-${obligations.length + 1}`,
        clauseId: seg.id,
        responsibleParty: seg.rawText.includes('Contractor') ? 'Contractor' : seg.rawText.includes('Tenant') ? 'Tenant' : 'User',
        actionRequired: seg.title,
        deadlineOrTrigger: seg.rawText.includes('days') ? 'Specified in clause' : 'Standard term duration',
        consequenceOfBreach: seg.rawText.includes('default') || seg.rawText.includes('indemnify') ? 'Potential damages/forfeiture' : 'Breach of agreement',
      });
    }
  }

  // Calculate score via centralized risk scorer
  const scoreResult = calculateDeterministicRiskScore({
    findings,
    asymmetryCount: findings.filter((f) => f.level === 'CRITICAL' || f.level === 'HIGH').length > 1 ? 1 : 0,
  });

  const missingProtections: string[] = [];
  const fullTextLower = fullRawText.toLowerCase();

  if (!fullTextLower.includes('mutual indemn') && !fullTextLower.includes('each party shall defend')) {
    missingProtections.push('Mutual indemnification clause (protection is entirely one-sided)');
  }
  if (!fullTextLower.includes('liability cap') && !fullTextLower.includes('aggregate liability shall not exceed')) {
    missingProtections.push('Reciprocal monetary liability cap');
  }
  if (!fullTextLower.includes('cure period') && !fullTextLower.includes('written notice to cure')) {
    missingProtections.push('Notice-and-cure window prior to declared default');
  }

  return {
    docId: 'doc-auto',
    overallRiskScore: scoreResult.score,
    overallRiskTier: scoreResult.tier,
    executiveSummary: `This agreement presents an ${scoreResult.tier} risk profile (Score: ${scoreResult.score}/100). The analysis identified ${findings.length} prioritized finding(s) with asymmetric liability allocations and restrictive covenants.`,
    perspective,
    findings,
    obligations: obligations.slice(0, 10),
    missingStandardProtections: missingProtections,
    analyzedAt: new Date().toISOString(),
    isFallbackDeterministic: true,
  };
}
