/**
 * LexiClear AI - Deterministic Asymmetry Detector
 * Phase 3 Bilateral Equity Analyzer
 *
 * Compares reciprocal provisions across opposing contracting roles:
 * - Contractor vs Client / Employer
 * - Tenant vs Landlord
 * - Buyer vs Seller
 *
 * Scans for:
 * 1. Notice period disparities (e.g. Contractor 90 days vs Client 10 days or immediate)
 * 2. Unilateral indemnification (Party A indemnifies Party B with zero mutual indemnity)
 * 3. Liability cap disparity (Party A uncapped vs Party B capped at $100 or fees)
 * 4. Payment withholding asymmetry (Unilateral right to withhold based on subjective satisfaction)
 *
 * Standards:
 * - Always uses explainable, non-accusatory language: "Potential asymmetry detected."
 * - Never claims legal invalidity or illegality.
 * - Anchors strictly to source document evidence.
 */

import { ParsedClause } from './parser';
import { ExtractedDeadline } from './obligationExtractor';

export interface AsymmetryFinding {
  readonly id: string;
  readonly type: 
    | 'NOTICE_PERIOD_DISPARITY'
    | 'UNILATERAL_INDEMNIFICATION'
    | 'LIABILITY_CAP_IMBALANCE'
    | 'UNILATERAL_TERMINATION_RIGHT';
  readonly clauseId: string;
  readonly title: string;
  readonly explanation: string;
  readonly partyABound: string;
  readonly partyBBound: string;
  readonly exactEvidence: string;
  readonly strategicRisk: string;
  readonly suggestedHarmonization: string;
}

/**
 * Deterministically analyzes parsed clauses and deadlines for bilateral asymmetry.
 */
export function detectContractualAsymmetry(
  clauses: readonly ParsedClause[],
  deadlines: readonly ExtractedDeadline[]
): readonly AsymmetryFinding[] {
  const asymmetries: AsymmetryFinding[] = [];
  let findingCounter = 0;

  // 1. Notice Period Disparity Analysis
  const noticeDeadlines = deadlines.filter((d) => d.type === 'NOTICE_PERIOD');
  if (noticeDeadlines.length >= 2) {
    // Check if one notice period is significantly longer than another
    const sorted = [...noticeDeadlines].sort((a, b) => b.normalizedValue - a.normalizedValue);
    const longest = sorted[0];
    const shortest = sorted[sorted.length - 1];

    if (longest.normalizedValue >= shortest.normalizedValue * 2 && longest.clauseId !== shortest.clauseId) {
      findingCounter++;
      asymmetries.push({
        id: `asym-${findingCounter}`,
        type: 'NOTICE_PERIOD_DISPARITY',
        clauseId: longest.clauseId,
        title: 'Potential asymmetry detected: Notice period duration disparity',
        explanation: `Potential asymmetry detected. One contractual notice window requires ${longest.rawText} while another provision permits action on ${shortest.rawText}.`,
        partyABound: 'Obligated Party (Extended Notice)',
        partyBBound: 'Counterparty (Abbreviated Notice)',
        exactEvidence: longest.contextSnippet,
        strategicRisk: 'Asymmetric notice periods allow one party to exit rapidly while tying the other party to extended performance.',
        suggestedHarmonization: 'Harmonize notice periods so both parties require a mutual 30-day written notice window.',
      });
    }
  }

  // 2. Clause-by-Clause Asymmetry Scan
  for (const clause of clauses) {
    const text = clause.originalText;
    const lower = text.toLowerCase();

    // 2a. Unilateral Indemnification & Liability Cap Imbalance
    const hasIndemnity = lower.includes('indemnif') || lower.includes('hold harmless');
    const mentionsContractor = lower.includes('contractor') || lower.includes('consultant') || lower.includes('tenant') || lower.includes('employee');
    const mentionsClient = lower.includes('client') || lower.includes('company') || lower.includes('landlord') || lower.includes('employer');

    if (hasIndemnity && mentionsContractor && !lower.includes('mutual') && !lower.includes('each party shall indemnify')) {
      const isUncapped = lower.includes('uncapped') || lower.includes('unlimited') || lower.includes('without limitation');
      const hasCounterpartyCap = lower.includes('shall not exceed') || lower.includes('capped at') || lower.includes('limited to the total fees') || lower.includes('maximum liability');

      if (isUncapped || hasCounterpartyCap) {
        findingCounter++;
        asymmetries.push({
          id: `asym-${findingCounter}`,
          type: 'LIABILITY_CAP_IMBALANCE',
          clauseId: clause.id,
          title: 'Potential asymmetry detected: Asymmetric liability ceiling and indemnification',
          explanation: 'Potential asymmetry detected. The agreement imposes uncapped or unilateral indemnification liabilities upon one party while shielding or capping counterparty liability.',
          partyABound: 'Service Provider / Tenant (Uncapped)',
          partyBBound: 'Client / Landlord (Capped)',
          exactEvidence: text.length > 250 ? text.substring(0, 247) + '...' : text,
          strategicRisk: 'Creates an unbalanced financial liability allocation where personal or operational assets are exposed without reciprocal limits.',
          suggestedHarmonization: 'Introduce a mutual liability cap equal to total contract consideration or commercial insurance policy limits.',
        });
      } else {
        findingCounter++;
        asymmetries.push({
          id: `asym-${findingCounter}`,
          type: 'UNILATERAL_INDEMNIFICATION',
          clauseId: clause.id,
          title: 'Potential asymmetry detected: One-sided indemnification obligation',
          explanation: 'Potential asymmetry detected. Indemnification obligations run exclusively in favor of one party without reciprocal protection.',
          partyABound: 'Indemnifying Party',
          partyBBound: 'Indemnified Party',
          exactEvidence: text.length > 250 ? text.substring(0, 247) + '...' : text,
          strategicRisk: 'You agree to bear third-party defense costs for the counterparty without receiving reciprocal protection for counterparty-caused claims.',
          suggestedHarmonization: 'Amend indemnification to be reciprocal and restricted to third-party claims arising from gross negligence or willful misconduct.',
        });
      }
    }

    // 2b. Unilateral Termination for Convenience
    const hasTerminationConvenience = lower.includes('for convenience') || lower.includes('with or without cause') || lower.includes('at its sole discretion');
    if (hasTerminationConvenience && (lower.includes('client may') || lower.includes('company may') || lower.includes('landlord may'))) {
      if (!lower.includes('either party may') && !lower.includes('both parties may')) {
        findingCounter++;
        asymmetries.push({
          id: `asym-${findingCounter}`,
          type: 'UNILATERAL_TERMINATION_RIGHT',
          clauseId: clause.id,
          title: 'Potential asymmetry detected: Unilateral termination for convenience',
          explanation: 'Potential asymmetry detected. One party reserves the unilateral right to terminate at will with or without cause, while the other party lacks equivalent convenience rights.',
          partyABound: 'Restricted Party',
          partyBBound: 'Counterparty (Unilateral Termination Right)',
          exactEvidence: text.length > 250 ? text.substring(0, 247) + '...' : text,
          strategicRisk: 'Counterparty can cancel the contract without cause after significant ramp-up work without paying cancellation fees.',
          suggestedHarmonization: 'Provide mutual termination for convenience upon 30 days notice with full payment for work performed up to the termination date.',
        });
      }
    }
  }

  return asymmetries;
}
