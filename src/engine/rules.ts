/**
 * LexiClear AI - Modular Deterministic Rule Set
 * Phase 3 Legal Knowledge & Risk Pattern Catalog
 *
 * Implements the approved core categories and sub-categories:
 * 1. Liability / Indemnification
 * 2. Intellectual Property
 * 3. Termination / Notice
 * 4. Dispute Resolution / Arbitration
 * 5. Payment / Financial Penalties
 * 6. Restrictive Covenants
 * 7. Renewal
 * 8. Confidentiality
 * 9. Warranties & Disclaimers
 *
 * CRITICAL REQUIREMENT:
 * Every matched rule extracts an exact, verbatim substring from the clause text.
 * No evidence is ever fabricated or synthesized.
 */

import { ParsedClause } from './parser';
import { RiskCategory, RiskLevel } from '../models/domain.models';

export interface DeterministicRule {
  readonly checkId: string;
  readonly category: RiskCategory;
  readonly severity: RiskLevel;
  readonly title: string;
  readonly explanation: string;
  readonly whyItMatters: string;
  readonly suggestedQuestion: string;
  readonly suggestedBalancedRevision: string;
  readonly matchClause: (clause: ParsedClause) => { isMatched: boolean; exactQuote: string } | null;
}

// =========================================================================
// PRE-COMPILED REGULAR EXPRESSIONS (Compiled once at module load)
// =========================================================================
const REGEX_SENTENCE_BOUNDARY = /[.!?\n]/;
const REGEX_SENTENCE_PUNCTUATION = /[.!?]/;

const REGEX_INDEMNITY_UNILATERAL = /\b(shall|must|agrees?\s+to)\s+(?:defend(?:,\s*|\s+and\s+)?)?indemnify(?:\s*(?:,|and)\s*hold\s+harmless)?\b/i;
const REGEX_EACH_PARTY_INDEMNIFY = /each\s+party\s+shall\s+indemnify/i;

const REGEX_LIABILITY_UNCAPPED = /\b(uncapped|unlimited\s+liability|without\s+limitation|shall\s+not\s+be\s+limited)\b/i;
const REGEX_LIABILITY_KEYWORD = /liabilit/i;

const REGEX_IP_WORK_FOR_HIRE = /\b(work\s+made\s+for\s+hire|irrevocably\s+assigns?|sole\s+and\s+exclusive\s+property\s+of\s+(?:client|company))\b/i;

const REGEX_IP_PRE_EXISTING = /\b(all\s+inventions|conceived,\s+developed|prior\s+inventions|pre-existing\s+tools)\b/i;
const REGEX_IP_ASSIGN_TRANSFER = /assign|transfer|own/i;

const REGEX_TERM_ASYMMETRIC_NOTICE = /\b(sixty|ninety|60|90)\s*(?:\([0-9]+\))?\s*days?\s+(?:prior\s+)?written\s+notice\b/i;
const REGEX_TERMINATE_KEYWORD = /terminat/i;

const REGEX_TERM_IMMEDIATE = /\b(terminate\s+immediately|at\s+any\s+time\s+with\s+or\s+without\s+cause|at\s+its\s+sole\s+discretion)\b/i;

const REGEX_DISPUTE_ARBITRATION = /\b(binding\s+arbitration|waives?\s+(?:any\s+)?right\s+to\s+a\s+jury\s+trial|class\s+action\s+waiver)\b/i;
const REGEX_DISPUTE_DISTANT_FORUM = /\b(?:exclusive\s+venue|exclusive\s+jurisdiction)\s+(?:shall\s+be\s+in|of\s+the\s+courts\s+of)\s+([^.;\n]+)/i;

const REGEX_PAYMENT_WITHHOLDING = /\b(withhold\s+(?:any\s+)?payments?|sole\s+and\s+absolute\s+satisfaction|subjective\s+standard)\b/i;
const REGEX_PAYMENT_EXTENDED_TERMS = /\b(net-60|net-90|sixty\s*\(60\)\s*days|ninety\s*\(90\)\s*days)\s+(?:of|following|after)\s+(?:receipt\s+of\s+)?invoice\b/i;

const REGEX_RESTRICTIVE_NON_COMPETE = /\b(non-compete|shall\s+not\s+(?:directly\s+or\s+indirectly\s+)?compete|similar\s+business|competing\s+services)\b/i;
const REGEX_RESTRICTIVE_NON_SOLICIT = /\b(non-solicitation|shall\s+not\s+solicit|entice\s+away|induce\s+any\s+employee)\b/i;

const REGEX_RENEWAL_AUTOMATIC = /\b(automatically\s+renew|successive\s+terms?\s+of|evergreen|unless\s+(?:either\s+party\s+)?provides?\s+notice\s+of\s+non-renewal)\b/i;

const REGEX_CONFIDENTIALITY_PERPETUAL = /\b(in\s+perpetuity|perpetual\s+obligation|survive\s+indefinitely)\b/i;
const REGEX_CONFIDENTIAL_KEYWORD = /confidential/i;

const REGEX_WARRANTY_STRUCTURAL = /\b(solely\s+responsible\s+for\s+(?:all\s+)?repairs|hvac|no\s+warranties\s+regarding\s+habitability|regardless\s+of\s+whether\s+damage)\b/i;

/**
 * Helper to safely extract the complete sentence containing matching keywords.
 * Guaranteed to be an exact verbatim substring of the clause.
 */
function extractSentenceWithMatch(text: string, regex: RegExp): string {
  const match = text.match(regex);
  if (!match || match.index === undefined) return '';

  const matchIdx = match.index;

  // Search backward for start of sentence or text boundary
  let startIdx = matchIdx;
  while (startIdx > 0 && !REGEX_SENTENCE_BOUNDARY.test(text[startIdx - 1])) {
    startIdx--;
  }

  // Search forward for end of sentence or text boundary
  let endIdx = matchIdx + match[0].length;
  while (endIdx < text.length && !REGEX_SENTENCE_BOUNDARY.test(text[endIdx])) {
    endIdx++;
  }

  // Include the punctuation mark if present
  if (endIdx < text.length && REGEX_SENTENCE_PUNCTUATION.test(text[endIdx])) {
    endIdx++;
  }

  const quote = text.substring(startIdx, endIdx).trim();
  // Ensure the extracted string exists verbatim in text
  return text.includes(quote) && quote.length > 5 ? quote : match[0];
}

export const LEGAL_RULES_CATALOG: readonly DeterministicRule[] = [
  // =========================================================================
  // 1. LIABILITY & INDEMNIFICATION
  // =========================================================================
  {
    checkId: 'RULE_INDEMNITY_UNILATERAL_01',
    category: 'unilateral_indemnification',
    severity: 'CRITICAL',
    title: 'Unilateral Indemnification & Defense Burden',
    explanation: 'You agree to cover all legal bills, losses, and damages suffered by the counterparty without reciprocal indemnification protection.',
    whyItMatters: 'Exposes your personal and business assets to third-party litigation costs without any reciprocal guarantee if the counterparty causes a claim.',
    suggestedQuestion: 'Can we amend Section 3 to make indemnification mutual and carve out ordinary negligence?',
    suggestedBalancedRevision: 'Make indemnification strictly mutual, limited to direct damages arising from gross negligence or willful misconduct, and subject to an agreed liability ceiling.',
    matchClause: (clause) => {
      if (REGEX_INDEMNITY_UNILATERAL.test(clause.originalText) && !REGEX_EACH_PARTY_INDEMNIFY.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_INDEMNITY_UNILATERAL);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },
  {
    checkId: 'RULE_LIABILITY_UNCAPPED_02',
    category: 'limitation_of_liability_asymmetry',
    severity: 'CRITICAL',
    title: 'Unlimited / Uncapped Liability Exposure',
    explanation: 'The contract specifies that your liability shall be uncapped or without limitation, while counterparty liability is capped or excluded.',
    whyItMatters: 'Allows catastrophic financial claims against you far exceeding the commercial value of the engagement.',
    suggestedQuestion: 'What is the commercial justification for an uncapped liability exposure under this agreement?',
    suggestedBalancedRevision: 'Cap liability for both parties equally at the total fees paid or payable under this Agreement during the preceding 12 months.',
    matchClause: (clause) => {
      if (REGEX_LIABILITY_UNCAPPED.test(clause.originalText) && REGEX_LIABILITY_KEYWORD.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_LIABILITY_UNCAPPED);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },

  // =========================================================================
  // 2. INTELLECTUAL PROPERTY
  // =========================================================================
  {
    checkId: 'RULE_IP_WORK_FOR_HIRE_01',
    category: 'ip_ownership_overreach',
    severity: 'HIGH',
    title: 'Broad Work-For-Hire & Inventions Assignment',
    explanation: 'The agreement transfers complete ownership of all created works, inventions, and concepts to the counterparty immediately upon creation.',
    whyItMatters: 'Without explicit exclusions, you may forfeit proprietary frameworks, algorithms, or tools you reuse across different clients.',
    suggestedQuestion: 'Can we attach an Exhibit A listing pre-existing Background Technology to be excluded from the assignment?',
    suggestedBalancedRevision: 'Provide that work product ownership transfers only upon full payment, and carve out pre-existing background technology with a non-exclusive license.',
    matchClause: (clause) => {
      if (REGEX_IP_WORK_FOR_HIRE.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_IP_WORK_FOR_HIRE);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },
  {
    checkId: 'RULE_IP_PRE_EXISTING_CARVEOUT_02',
    category: 'ip_ownership_overreach',
    severity: 'HIGH',
    title: 'Pre-Existing & Personal Inventions Overreach',
    explanation: 'The contract assigns inventions developed during the term without clear boundaries regarding off-hours work or prior tools.',
    whyItMatters: 'Puts your pre-existing codebases and separate personal projects in legal jeopardy if the counterparty claims they relate to the business.',
    suggestedQuestion: 'Does state labor law protect off-hours inventions developed without employer resources?',
    suggestedBalancedRevision: 'Explicitly state that contractor retains all rights in tools, methods, and libraries existing prior to the effective date.',
    matchClause: (clause) => {
      if (REGEX_IP_PRE_EXISTING.test(clause.originalText) && REGEX_IP_ASSIGN_TRANSFER.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_IP_PRE_EXISTING);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },

  // =========================================================================
  // 3. TERMINATION & NOTICE
  // =========================================================================
  {
    checkId: 'RULE_TERM_ASYMMETRIC_NOTICE_01',
    category: 'termination_and_cure_penalties',
    severity: 'MODERATE',
    title: 'Extended Advance Termination Notice Requirement',
    explanation: 'Imposes a lengthy notice period (e.g. 60 or 90 days) to terminate, restricting flexibility and mobility.',
    whyItMatters: 'Locks you into an unfavorable agreement for months if working conditions deteriorate or payments stall.',
    suggestedQuestion: 'Can we reduce the required notice window from 90 days to a mutual 30 days?',
    suggestedBalancedRevision: 'Provide that either party may terminate for convenience upon thirty (30) calendar days written notice.',
    matchClause: (clause) => {
      if (REGEX_TERM_ASYMMETRIC_NOTICE.test(clause.originalText) && REGEX_TERMINATE_KEYWORD.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_TERM_ASYMMETRIC_NOTICE);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },
  {
    checkId: 'RULE_TERM_IMMEDIATE_AT_WILL_02',
    category: 'termination_and_cure_penalties',
    severity: 'MODERATE',
    title: 'Immediate Termination for Convenience Without Cure',
    explanation: 'The counterparty reserves the right to terminate immediately with or without cause, without offering a cure period.',
    whyItMatters: 'Leaves you vulnerable to abrupt termination without compensation for unbilled ramp-up hours or ongoing pipeline investments.',
    suggestedQuestion: 'Can we incorporate a mandatory 14-day written cure period prior to termination for cause?',
    suggestedBalancedRevision: 'Require written notice specifying the breach and granting a fourteen (14) day cure period before termination takes effect.',
    matchClause: (clause) => {
      if (REGEX_TERM_IMMEDIATE.test(clause.originalText) && REGEX_TERMINATE_KEYWORD.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_TERM_IMMEDIATE);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },

  // =========================================================================
  // 4. DISPUTE RESOLUTION & ARBITRATION
  // =========================================================================
  {
    checkId: 'RULE_DISPUTE_MANDATORY_ARBITRATION_01',
    category: 'mandatory_arbitration_and_venue',
    severity: 'MODERATE',
    title: 'Mandatory Binding Arbitration & Jury Waiver',
    explanation: 'Disputes must be submitted to confidential binding arbitration, waiving access to local courts and trial by jury.',
    whyItMatters: 'Arbitration filing fees often exceed several thousand dollars, making small unpaid invoice claims uneconomical to pursue.',
    suggestedQuestion: 'Can we carve out small claims court actions from mandatory arbitration for unpaid fees?',
    suggestedBalancedRevision: 'Allow either party to bring claims under $15,000 in small claims court, with arbitration reserved for major claims.',
    matchClause: (clause) => {
      if (REGEX_DISPUTE_ARBITRATION.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_DISPUTE_ARBITRATION);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },
  {
    checkId: 'RULE_DISPUTE_DISTANT_FORUM_02',
    category: 'mandatory_arbitration_and_venue',
    severity: 'MODERATE',
    title: 'Distant Foreign Jurisdiction and Venue Selection',
    explanation: 'The contract dictates that legal proceedings must take place in an out-of-state or distant jurisdiction.',
    whyItMatters: 'Defending or prosecuting claims in a distant state requires retaining out-of-state counsel and incurring travel expenses.',
    suggestedQuestion: 'Can the governing law and venue be designated as the state where services are actually performed?',
    suggestedBalancedRevision: 'Designate the jurisdiction and venue to the county and state in which the service provider resides.',
    matchClause: (clause) => {
      if (REGEX_DISPUTE_DISTANT_FORUM.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_DISPUTE_DISTANT_FORUM);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },

  // =========================================================================
  // 5. PAYMENT & FINANCIAL WITHHOLDING
  // =========================================================================
  {
    checkId: 'RULE_PAYMENT_SUBJECTIVE_WITHHOLDING_01',
    category: 'payment_and_withholding_traps',
    severity: 'HIGH',
    title: 'Subjective Payment Withholding / Discretionary Acceptance',
    explanation: 'The counterparty reserves the right to withhold payment based on subjective criteria or discretionary satisfaction.',
    whyItMatters: 'Gives the client unilateral financial leverage to withhold compensation for completed work without objective standard of defect.',
    suggestedQuestion: 'What objective criteria determine whether deliverables meet technical specifications?',
    suggestedBalancedRevision: 'Specify that payments may only be withheld for material defects against written specifications, with deemed acceptance after 10 business days.',
    matchClause: (clause) => {
      if (REGEX_PAYMENT_WITHHOLDING.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_PAYMENT_WITHHOLDING);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },
  {
    checkId: 'RULE_PAYMENT_DELAYED_TERMS_02',
    category: 'payment_and_withholding_traps',
    severity: 'HIGH',
    title: 'Extended Payment Terms (Net-60 / Net-90)',
    explanation: 'Requires you to wait 60, 90, or more days after invoicing before payment becomes due.',
    whyItMatters: 'Severely impairs working capital and transfers financing costs onto the service provider.',
    suggestedQuestion: 'Can invoice payment terms be standardized to industry-standard Net-30?',
    suggestedBalancedRevision: 'Invoices shall be paid within thirty (30) days of receipt, with late balances accruing 1.5% monthly interest.',
    matchClause: (clause) => {
      if (REGEX_PAYMENT_EXTENDED_TERMS.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_PAYMENT_EXTENDED_TERMS);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },

  // =========================================================================
  // 6. RESTRICTIVE COVENANTS & NON-COMPETES
  // =========================================================================
  {
    checkId: 'RULE_RESTRICTIVE_NON_COMPETE_01',
    category: 'restrictive_covenants_noncompete',
    severity: 'HIGH',
    title: 'Post-Termination Non-Compete Covenant',
    explanation: 'Bars you from engaging in, working for, or consulting with competing businesses for an extended duration post-termination.',
    whyItMatters: 'May directly hinder your ability to earn a living in your core specialty; enforceability varies widely by state.',
    suggestedQuestion: 'Is this non-compete enforceable against an independent contractor under applicable state statutes?',
    suggestedBalancedRevision: 'Delete the non-compete entirely, replacing it with a reasonable covenant not to solicit active clients.',
    matchClause: (clause) => {
      if (REGEX_RESTRICTIVE_NON_COMPETE.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_RESTRICTIVE_NON_COMPETE);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },
  {
    checkId: 'RULE_RESTRICTIVE_NON_SOLICIT_02',
    category: 'restrictive_covenants_noncompete',
    severity: 'MODERATE',
    title: 'Broad Non-Solicitation of Personnel or Clients',
    explanation: 'Prohibits soliciting or hiring any employees or clients of the counterparty, often extending for years.',
    whyItMatters: 'Restricts natural networking and hiring in your professional ecosystem.',
    suggestedQuestion: 'Can non-solicitation be restricted strictly to direct active clients introduced during this specific assignment?',
    suggestedBalancedRevision: 'Narrow non-solicitation to direct clients with whom the contractor had personal contact during the last 6 months.',
    matchClause: (clause) => {
      if (REGEX_RESTRICTIVE_NON_SOLICIT.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_RESTRICTIVE_NON_SOLICIT);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },

  // =========================================================================
  // 7. RENEWAL & EVERGREEN CLAUSES
  // =========================================================================
  {
    checkId: 'RULE_RENEWAL_AUTOMATIC_01',
    category: 'automatic_renewal_trap',
    severity: 'MODERATE',
    title: 'Automatic Evergreen Renewal Mechanism',
    explanation: 'The contract automatically renews for successive multi-month or annual terms unless explicitly cancelled within a narrow window.',
    whyItMatters: 'Missing a cancellation deadline locks you into recurring contractual commitments or unexpected price adjustments.',
    suggestedQuestion: 'Can the agreement require affirmative written mutual consent for renewal rather than automatic rollover?',
    suggestedBalancedRevision: 'Require written mutual agreement at least 30 days prior to expiration to extend the contract term.',
    matchClause: (clause) => {
      if (REGEX_RENEWAL_AUTOMATIC.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_RENEWAL_AUTOMATIC);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },

  // =========================================================================
  // 8. CONFIDENTIALITY OVERREACH
  // =========================================================================
  {
    checkId: 'RULE_CONFIDENTIALITY_PERPETUAL_01',
    category: 'confidentiality_overreach',
    severity: 'LOW',
    title: 'Perpetual or Indefinite Confidentiality Period',
    explanation: 'Imposes perpetual non-disclosure obligations on all information, rather than standard commercial terms (e.g. 2-3 years).',
    whyItMatters: 'Creates permanent compliance burdens and record retention liability.',
    suggestedQuestion: 'Can non-disclosure obligations expire after two (2) years, with an exception for trade secrets?',
    suggestedBalancedRevision: 'Limit confidentiality obligations to two (2) years following disclosure, preserving trade secret protections as long as maintained under law.',
    matchClause: (clause) => {
      if (REGEX_CONFIDENTIALITY_PERPETUAL.test(clause.originalText) && REGEX_CONFIDENTIAL_KEYWORD.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_CONFIDENTIALITY_PERPETUAL);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },

  // =========================================================================
  // 9. UNREASONABLE WARRANTIES & LIABILITIES
  // =========================================================================
  {
    checkId: 'RULE_WARRANTY_STRUCTURAL_SHIFT_01',
    category: 'unreasonable_warranties_liabilities',
    severity: 'CRITICAL',
    title: 'Structural Maintenance & Habitability Liability Shift',
    explanation: 'Shifts structural, mechanical, or habitability liabilities onto a resident, tenant, or service provider.',
    whyItMatters: 'Forces you to take on major financial liabilities for capital building systems you do not own.',
    suggestedQuestion: 'Does local statutory housing law prevent landlords from waiving the implied warranty of habitability?',
    suggestedBalancedRevision: 'Limit occupant responsibility to routine interior upkeep, keeping major systems (HVAC, plumbing, roof) with the property owner.',
    matchClause: (clause) => {
      if (REGEX_WARRANTY_STRUCTURAL.test(clause.originalText)) {
        const exactQuote = extractSentenceWithMatch(clause.originalText, REGEX_WARRANTY_STRUCTURAL);
        return { isMatched: true, exactQuote };
      }
      return null;
    },
  },
];
