/**
 * LexiClear AI - Deterministic Risk Scorer
 * Phase 3 Explainable Review Priority Calculation
 *
 * Computes a transparent, reproducible risk score (0-100) representing
 * document-review priority.
 *
 * Explicit Disclaimer:
 * The score represents document-review priority, not legal validity or enforceability.
 */

import { RiskLevel } from '../models/domain.models';

export interface ScoreExplanation {
  readonly score: number;
  readonly tier: RiskLevel;
  readonly baseScore: number;
  readonly asymmetryPenalty: number;
  readonly breakdown: {
    readonly criticalCount: number;
    readonly highCount: number;
    readonly moderateCount: number;
    readonly lowCount: number;
  };
  readonly rationale: string;
  readonly disclaimer: string;
}

const SEVERITY_WEIGHTS: Record<RiskLevel, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MODERATE: 8,
  LOW: 3,
};

/**
 * Deterministically computes overall risk score and tier.
 */
export function calculateDeterministicRiskScore(params: {
  findings: readonly { readonly riskLevel?: RiskLevel; readonly level?: RiskLevel }[];
  asymmetryCount: number;
}): ScoreExplanation {
  let criticalCount = 0;
  let highCount = 0;
  let moderateCount = 0;
  let lowCount = 0;

  for (const f of params.findings) {
    const level = f.riskLevel || f.level || 'LOW';
    if (level === 'CRITICAL') criticalCount++;
    else if (level === 'HIGH') highCount++;
    else if (level === 'MODERATE') moderateCount++;
    else if (level === 'LOW') lowCount++;
  }

  const baseScore =
    criticalCount * SEVERITY_WEIGHTS.CRITICAL +
    highCount * SEVERITY_WEIGHTS.HIGH +
    moderateCount * SEVERITY_WEIGHTS.MODERATE +
    lowCount * SEVERITY_WEIGHTS.LOW;

  // Add 10 points per detected asymmetry up to a 20 point cap
  const asymmetryPenalty = Math.min(20, params.asymmetryCount * 10);

  const rawTotal = baseScore + asymmetryPenalty;
  const finalScore = Math.min(100, Math.max(0, rawTotal));

  let tier: RiskLevel = 'LOW';
  if (finalScore > 75) {
    tier = 'CRITICAL';
  } else if (finalScore > 50) {
    tier = 'HIGH';
  } else if (finalScore > 25) {
    tier = 'MODERATE';
  }

  const rationale = `Calculated from ${criticalCount} critical finding(s) (+${criticalCount * 25} pts), ${highCount} high finding(s) (+${highCount * 15} pts), ${moderateCount} moderate finding(s) (+${moderateCount * 8} pts), and ${params.asymmetryCount} asymmetry flag(s) (+${asymmetryPenalty} pts).`;

  return {
    score: finalScore,
    tier,
    baseScore,
    asymmetryPenalty,
    breakdown: {
      criticalCount,
      highCount,
      moderateCount,
      lowCount,
    },
    rationale,
    disclaimer: 'The risk score reflects document-review negotiation priority; it is not a determination of legal validity or enforceability.',
  };
}
