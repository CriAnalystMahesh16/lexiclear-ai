import { ClauseSegment, UserPerspective } from '../types/document';
import { Finding, RiskLevel } from '../types/analysis';
import { segmentDocument } from './segmenter';
import { runDeterministicRuleScan } from './ruleScanner';
import { verifyAndFilterFindings } from './quoteVerifier';

export interface ClauseDiffItem {
  id: string;
  status: 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';
  title: string;
  originalSectionNumber?: string;
  revisedSectionNumber?: string;
  originalText?: string;
  revisedText?: string;
  originalFindings: Finding[];
  revisedFindings: Finding[];
  riskImpact: 'IMPROVED' | 'WORSENED' | 'NEUTRAL';
  summaryOfChange: string;
}

export interface ContractDiffResult {
  originalScore: number;
  revisedScore: number;
  scoreDelta: number; // revised - original (negative = risk reduced / improved)
  originalTier: RiskLevel;
  revisedTier: RiskLevel;
  addedCount: number;
  removedCount: number;
  changedCount: number;
  unchangedCount: number;
  resolvedRisks: Finding[];
  newRisks: Finding[];
  clauses: ClauseDiffItem[];
}

/**
 * Computes token-level Jaccard similarity between two strings.
 */
function computeTextSimilarity(str1: string, str2: string): number {
  const tokens1 = new Set(str1.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
  const tokens2 = new Set(str2.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));

  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++;
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 1.0 : intersection / union;
}

/**
 * Deterministically compares two contract revisions side-by-side.
 * Operates purely locally and deterministically with zero LLM/API calls.
 */
export function diffContractRevisions(
  originalText: string,
  revisedText: string,
  perspective: UserPerspective = 'service_provider_or_contractor'
): ContractDiffResult {
  // 1. Structural segmentation for both documents
  const origSegments: ClauseSegment[] = segmentDocument(originalText, originalText);
  const revSegments: ClauseSegment[] = segmentDocument(revisedText, revisedText);

  // 2. Deterministic rule scan on both
  const origRawAnalysis = runDeterministicRuleScan(origSegments, perspective);
  const origFindings = verifyAndFilterFindings(origRawAnalysis.findings, origSegments);

  const revRawAnalysis = runDeterministicRuleScan(revSegments, perspective);
  const revFindings = verifyAndFilterFindings(revRawAnalysis.findings, revSegments);

  // 3. Match clauses deterministically
  const matchedOrigIndices = new Set<number>();
  const matchedRevIndices = new Set<number>();

  const diffItems: ClauseDiffItem[] = [];

  // Match revision clauses against original clauses
  for (let r = 0; r < revSegments.length; r++) {
    const revClause = revSegments[r];
    let bestMatchIdx = -1;
    let bestSimilarity = -1;

    for (let o = 0; o < origSegments.length; o++) {
      if (matchedOrigIndices.has(o)) continue;
      const origClause = origSegments[o];

      // Exact title match gets high priority
      const titleMatch = origClause.title.toLowerCase() === revClause.title.toLowerCase();
      const secNumMatch = origClause.sectionNumber === revClause.sectionNumber && origClause.sectionNumber !== `${o + 1}`;

      const similarity = computeTextSimilarity(origClause.rawText, revClause.rawText);
      const score = (titleMatch ? 0.35 : 0) + (secNumMatch ? 0.25 : 0) + (similarity * 0.5);

      if (score > bestSimilarity && (similarity > 0.2 || titleMatch || secNumMatch)) {
        bestSimilarity = score;
        bestMatchIdx = o;
      }
    }

    const rFindings = revFindings.filter((f) => f.clauseId === revClause.id);

    if (bestMatchIdx !== -1 && bestSimilarity >= 0.3) {
      matchedOrigIndices.add(bestMatchIdx);
      matchedRevIndices.add(r);

      const origClause = origSegments[bestMatchIdx];
      const oFindings = origFindings.filter((f) => f.clauseId === origClause.id);

      const isIdentical = origClause.rawText.trim() === revClause.rawText.trim();

      // Determine risk impact
      const origMaxSeverity = getHighestSeverity(oFindings);
      const revMaxSeverity = getHighestSeverity(rFindings);
      let riskImpact: 'IMPROVED' | 'WORSENED' | 'NEUTRAL' = 'NEUTRAL';

      if (revMaxSeverity < origMaxSeverity) {
        riskImpact = 'IMPROVED';
      } else if (revMaxSeverity > origMaxSeverity) {
        riskImpact = 'WORSENED';
      }

      diffItems.push({
        id: `diff-${diffItems.length + 1}`,
        status: isIdentical ? 'UNCHANGED' : 'CHANGED',
        title: revClause.title || origClause.title,
        originalSectionNumber: origClause.sectionNumber,
        revisedSectionNumber: revClause.sectionNumber,
        originalText: origClause.rawText,
        revisedText: revClause.rawText,
        originalFindings: oFindings,
        revisedFindings: rFindings,
        riskImpact,
        summaryOfChange: isIdentical
          ? 'Provision remains verbatim identical.'
          : riskImpact === 'IMPROVED'
          ? `Modified: Risk reduced from ${getSeverityLabel(origMaxSeverity)} to ${getSeverityLabel(revMaxSeverity)}.`
          : riskImpact === 'WORSENED'
          ? `Modified: Risk increased from ${getSeverityLabel(origMaxSeverity)} to ${getSeverityLabel(revMaxSeverity)}.`
          : 'Modified wording with neutral risk delta.',
      });
    } else {
      matchedRevIndices.add(r);
      // Added clause
      const revMaxSeverity = getHighestSeverity(rFindings);
      diffItems.push({
        id: `diff-${diffItems.length + 1}`,
        status: 'ADDED',
        title: revClause.title,
        revisedSectionNumber: revClause.sectionNumber,
        revisedText: revClause.rawText,
        originalFindings: [],
        revisedFindings: rFindings,
        riskImpact: revMaxSeverity > 0 ? 'WORSENED' : 'NEUTRAL',
        summaryOfChange: revMaxSeverity > 0
          ? `Newly inserted clause introducing ${getSeverityLabel(revMaxSeverity)} risk.`
          : 'Newly inserted clause without critical legal risk flags.',
      });
    }
  }

  // Find removed clauses from original that were not matched
  for (let o = 0; o < origSegments.length; o++) {
    if (!matchedOrigIndices.has(o)) {
      const origClause = origSegments[o];
      const oFindings = origFindings.filter((f) => f.clauseId === origClause.id);
      const origMaxSeverity = getHighestSeverity(oFindings);

      diffItems.push({
        id: `diff-${diffItems.length + 1}`,
        status: 'REMOVED',
        title: origClause.title,
        originalSectionNumber: origClause.sectionNumber,
        originalText: origClause.rawText,
        originalFindings: oFindings,
        revisedFindings: [],
        riskImpact: origMaxSeverity > 0 ? 'IMPROVED' : 'NEUTRAL',
        summaryOfChange: origMaxSeverity > 0
          ? `Clause removed: Eliminated ${getSeverityLabel(origMaxSeverity)} risk finding.`
          : 'Clause removed in revision.',
      });
    }
  }

  // Compute resolved and newly introduced risks
  const resolvedRisks: Finding[] = origFindings.filter((of) => {
    return !revFindings.some((rf) => rf.category === of.category);
  });

  const newRisks: Finding[] = revFindings.filter((rf) => {
    return !origFindings.some((of) => of.category === rf.category);
  });

  const addedCount = diffItems.filter((d) => d.status === 'ADDED').length;
  const removedCount = diffItems.filter((d) => d.status === 'REMOVED').length;
  const changedCount = diffItems.filter((d) => d.status === 'CHANGED').length;
  const unchangedCount = diffItems.filter((d) => d.status === 'UNCHANGED').length;

  return {
    originalScore: origRawAnalysis.overallRiskScore,
    revisedScore: revRawAnalysis.overallRiskScore,
    scoreDelta: revRawAnalysis.overallRiskScore - origRawAnalysis.overallRiskScore,
    originalTier: origRawAnalysis.overallRiskTier,
    revisedTier: revRawAnalysis.overallRiskTier,
    addedCount,
    removedCount,
    changedCount,
    unchangedCount,
    resolvedRisks,
    newRisks,
    clauses: diffItems,
  };
}

function getHighestSeverity(findings: Finding[]): number {
  if (findings.length === 0) return 0;
  let max = 0;
  for (const f of findings) {
    const lvl = f.riskLevel || f.level || 'LOW';
    if (lvl === 'CRITICAL') max = Math.max(max, 4);
    else if (lvl === 'HIGH') max = Math.max(max, 3);
    else if (lvl === 'MODERATE') max = Math.max(max, 2);
    else if (lvl === 'LOW') max = Math.max(max, 1);
  }
  return max;
}

function getSeverityLabel(score: number): string {
  switch (score) {
    case 4: return 'CRITICAL';
    case 3: return 'HIGH';
    case 2: return 'MODERATE';
    case 1: return 'LOW';
    default: return 'NO RISK';
  }
}
