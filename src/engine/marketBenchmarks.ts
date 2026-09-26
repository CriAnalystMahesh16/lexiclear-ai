/**
 * LexiClear AI - Market Benchmark & Comparative Policy Engine
 * Problem Alignment & Comparative Access Layer
 *
 * Provides deterministic comparative policy benchmarks across standard commercial,
 * leasing, employment, and consumer contract norms.
 *
 * Satisfies Hackathon Requirement:
 * - "Comparing contracts, agreements, or policies"
 * - "Highlighting important clauses, obligations, risks, or inconsistencies"
 * - "Helping users understand their options and potential next steps"
 */

import { RiskCategory } from '../types/analysis';

export interface MarketBenchmark {
  readonly category: RiskCategory;
  readonly standardTitle: string;
  readonly marketStandardNorm: string;
  readonly typicalVariance: string;
  readonly estimatedAsymmetryPercent: number;
  readonly keyOptionsAndNextSteps: readonly string[];
}

export const MARKET_BENCHMARKS: Record<RiskCategory, MarketBenchmark> = {
  unilateral_indemnification: {
    category: 'unilateral_indemnification',
    standardTitle: 'Mutual & Capped Indemnification',
    marketStandardNorm: 'Mutual defense and indemnity strictly limited to third-party claims arising from material breach, gross negligence, or willful misconduct, subject to aggregate liability caps.',
    typicalVariance: 'Unilateral, uncapped indemnity forcing one party to pay legal defense fees and settlements for routine operational errors.',
    estimatedAsymmetryPercent: 85,
    keyOptionsAndNextSteps: [
      'Option A: Request reciprocal "Each party shall indemnify..." language.',
      'Option B: Add a liability cap tying maximum indemnity exposure to fees paid in previous 12 months.',
      'Option C: Carve out third-party intellectual property or gross negligence claims into a defined super-cap rather than unlimited exposure.',
      'Next Step: Ask legal counsel to draft an industry-standard reciprocal indemnity amendment.'
    ],
  },
  ip_ownership_overreach: {
    category: 'ip_ownership_overreach',
    standardTitle: 'Deliverables Assignment with Retained Background IP',
    marketStandardNorm: 'Client owns bespoke final Deliverables upon full and timely payment; service provider explicitly retains all background tools, pre-existing libraries, algorithms, and general know-how.',
    typicalVariance: 'Immediate assignment of all inventions, tools, and ideas conceived at any time, including pre-existing proprietary frameworks.',
    estimatedAsymmetryPercent: 90,
    keyOptionsAndNextSteps: [
      'Option A: Insert explicit "Background IP" exclusion clause listing pre-existing tools and open-source components.',
      'Option B: Condition transfer of ownership upon receipt of full payment ("Upon receipt of final payment, Contractor assigns...").',
      'Option C: Grant Client an irrevocable non-exclusive license rather than complete assignment of underlying utilities.',
      'Next Step: Prepare an exhibit listing all prior inventions and proprietary libraries used in the engagement.'
    ],
  },
  restrictive_covenants_noncompete: {
    category: 'restrictive_covenants_noncompete',
    standardTitle: 'Reasonable Non-Solicitation (No General Non-Compete)',
    marketStandardNorm: 'Narrow non-solicitation of active customers and staff for 6-12 months. Broad post-termination non-competes are disfavored, strictly scrutinized, or void as public policy in many jurisdictions.',
    typicalVariance: 'Multi-year, nationwide or global ban on performing services or consulting for any business operating in the same industry.',
    estimatedAsymmetryPercent: 95,
    keyOptionsAndNextSteps: [
      'Option A: Delete the non-compete clause entirely and replace with a targeted customer non-solicitation limited to direct accounts served.',
      'Option B: Restrict geographic scope to specific metropolitan area and shorten duration to maximum 6 months.',
      'Option C: Verify jurisdiction rules (e.g., California, Minnesota, and New York restrict non-compete enforceability).',
      'Next Step: Have reviewing counsel assess statutory enforceability under applicable state labor codes.'
    ],
  },
  termination_and_cure_penalties: {
    category: 'termination_and_cure_penalties',
    standardTitle: 'Bilateral Notice & Mandatory Cure Period',
    marketStandardNorm: 'Mutual termination for convenience with 30 days written notice, plus a mandatory 15-30 day written notice and cure window prior to termination for default.',
    typicalVariance: 'Counterparty may terminate immediately without cause, while locking the other party into 60-90 days notice with forfeiture of accrued payments.',
    estimatedAsymmetryPercent: 80,
    keyOptionsAndNextSteps: [
      'Option A: Make convenience termination symmetric (both parties have 30 days notice).',
      'Option B: Add a mandatory 15-day cure notice requirement before either party can declare a material breach.',
      'Option C: Ensure payment for all work performed and non-cancelable expenses incurred up to the effective termination date.',
      'Next Step: Request reciprocal cure periods in the formal redline comments.'
    ],
  },
  mandatory_arbitration_and_venue: {
    category: 'mandatory_arbitration_and_venue',
    standardTitle: 'Neutral Forum & Shared Dispute Costs',
    marketStandardNorm: 'Neutral local venue (or the defendant\'s principal place of business), with mediation as a prerequisite and equal 50/50 sharing of administrative and arbitrator fees.',
    typicalVariance: 'Distant, out-of-state exclusive forum forcing one party to bear all filing fees, arbitrator compensation, and administrative expenses.',
    estimatedAsymmetryPercent: 75,
    keyOptionsAndNextSteps: [
      'Option A: Change venue to the county/state where the work is performed or defendant resides.',
      'Option B: Include a 30-day informal executive negotiation or non-binding mediation step before arbitration.',
      'Option C: Strike the unilateral fee-shifting clause so arbitration costs are shared equally unless an arbitrator awards fees to the prevailing party.',
      'Next Step: Clarify dispute resolution costs and venue with reviewing attorney.'
    ],
  },
  payment_and_withholding_traps: {
    category: 'payment_and_withholding_traps',
    standardTitle: 'Net-30 Terms with Objective Acceptance',
    marketStandardNorm: 'Payment due Net-15 to Net-30 from invoice receipt. Withholding permitted only for specific, objectively documented material non-conformities reported within 10 days.',
    typicalVariance: 'Net-60 or Net-90 extended payment terms with unilateral subjective withholding rights without interest or late penalties.',
    estimatedAsymmetryPercent: 70,
    keyOptionsAndNextSteps: [
      'Option A: Propose Net-30 standard payment terms with 1.5% monthly late interest on undisputed overdue balances.',
      'Option B: Require written specification of non-conformities within 10 business days of delivery; otherwise deemed accepted.',
      'Option C: Allow withholding only on the disputed portion of an invoice while paying undisputed amounts on time.',
      'Next Step: Submit revised payment milestones and objective acceptance criteria.'
    ],
  },
  unreasonable_warranties_liabilities: {
    category: 'unreasonable_warranties_liabilities',
    standardTitle: 'Workmanship Standard & Consequential Damage Disclaimer',
    marketStandardNorm: 'Warranty of professional workmanship in accordance with industry standards for 30-90 days, with complete mutual disclaimer of consequential, punitive, or lost-profit damages.',
    typicalVariance: 'Strict liability for pre-existing defects, unlimited consequential damages, or tenant bearing landlord structural and HVAC capital expenses.',
    estimatedAsymmetryPercent: 85,
    keyOptionsAndNextSteps: [
      'Option A: Disclaim all implied warranties (merchantability, fitness for a particular purpose, habitability).',
      'Option B: Limit remedy for warranty breach to re-performance of non-conforming services or refund.',
      'Option C: Ensure mutual waiver of indirect, incidental, and consequential damages.',
      'Next Step: Align warranty repair responsibilities with commercial industry standards.'
    ],
  },
  confidentiality_overreach: {
    category: 'confidentiality_overreach',
    standardTitle: 'Time-Bounded Mutual Non-Disclosure',
    marketStandardNorm: 'Mutual confidentiality obligations surviving 2-3 years post-termination, with standard carve-outs for public knowledge, prior possession, independent development, and legal process.',
    typicalVariance: 'Perpetual one-way non-disclosure without standard exceptions or right to disclose pursuant to subpoena or court order.',
    estimatedAsymmetryPercent: 65,
    keyOptionsAndNextSteps: [
      'Option A: Limit non-trade-secret confidentiality to 2 or 3 years following contract termination.',
      'Option B: Ensure standard exceptions are included: public information, independent development, prior possession.',
      'Option C: Add right to disclose confidential information under compelled judicial process with advance notice.',
      'Next Step: Ensure mutual standard NDA language is incorporated.'
    ],
  },
  automatic_renewal_trap: {
    category: 'automatic_renewal_trap',
    standardTitle: 'Affirmative Renewal or 30-Day Reminder Notice',
    marketStandardNorm: 'Contract expires at the end of the initial term, or auto-renews only on a month-to-month basis with a required written 30-day reminder notice prior to renewal.',
    typicalVariance: 'Automatic 12-month lock-in at increased rates unless certified mail notice is sent within a narrow 120-day window.',
    estimatedAsymmetryPercent: 80,
    keyOptionsAndNextSteps: [
      'Option A: Change post-term renewal to month-to-month with 30 days written notice of cancellation.',
      'Option B: Require counterparty to provide written reminder notice 30-60 days before any auto-renewal deadline.',
      'Option C: Permit electronic notice (email) for non-renewal rather than certified postal mail.',
      'Next Step: Add calendar reminders for non-renewal notice milestones.'
    ],
  },
  limitation_of_liability_asymmetry: {
    category: 'limitation_of_liability_asymmetry',
    standardTitle: 'Reciprocal Aggregate Liability Cap',
    marketStandardNorm: 'Bilateral aggregate liability cap equal to total fees paid or payable under the agreement in the 12 months preceding the claim, applying equally to both parties.',
    typicalVariance: 'Counterparty liability capped at nominal amount ($100 or fees paid) while user liability remains completely uncapped.',
    estimatedAsymmetryPercent: 90,
    keyOptionsAndNextSteps: [
      'Option A: Make the liability cap fully mutual: "In no event shall either party\'s total aggregate liability exceed..."',
      'Option B: Set the cap at a commercially reasonable multiple (e.g., 1x or 2x total contract value).',
      'Option C: Ensure mutual exclusion of consequential, special, and punitive damages.',
      'Next Step: Negotiate a balanced mutual liability ceiling with reviewing counsel.'
    ],
  },
};

/**
 * Returns the market benchmark and comparative policy data for a given risk category.
 */
export function getMarketBenchmarkForCategory(category: RiskCategory): MarketBenchmark {
  return MARKET_BENCHMARKS[category] || {
    category,
    standardTitle: 'Standard Mutual Provision',
    marketStandardNorm: 'Bilateral commercial terms maintaining proportional risk allocation and reciprocal safeguards.',
    typicalVariance: 'Unilateral allocation favoring drafting party.',
    estimatedAsymmetryPercent: 60,
    keyOptionsAndNextSteps: [
      'Option A: Seek mutual reciprocity for this provision.',
      'Option B: Discuss acceptable risk tolerances with reviewing attorney.'
    ],
  };
}
