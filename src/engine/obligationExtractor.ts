/**
 * LexiClear AI - Deterministic Obligation & Deadline Extractor
 * Phase 3 Legal Duty & Milestone Engine
 *
 * Scans clauses for:
 * - Responsible party (Contractor, Client, Tenant, Landlord, Employee, Employer, etc.)
 * - Obligation action verbs (shall, must, will, agrees to, is required to)
 * - Notice periods, cure periods, and deadlines
 * - Value normalization (e.g. "ninety (90) days" -> value: 90, unit: "days")
 * - Verbatim evidence preservation
 */

import { ParsedClause } from './parser';

export interface ExtractedDeadline {
  readonly id: string;
  readonly clauseId: string;
  readonly type: 
    | 'NOTICE_PERIOD'
    | 'CURE_PERIOD'
    | 'PAYMENT_WINDOW'
    | 'RENEWAL_WINDOW'
    | 'RESTRICTIVE_PERIOD'
    | 'MILESTONE';
  readonly normalizedValue: number;
  readonly unit: 'hours' | 'days' | 'business_days' | 'months' | 'years';
  readonly rawText: string;
  readonly contextSnippet: string;
}

export interface ExtractedObligation {
  readonly id: string;
  readonly clauseId: string;
  readonly responsibleParty: string;
  readonly actionRequired: string;
  readonly deadlineOrTrigger: string;
  readonly consequenceOfBreach: string;
  readonly isConditionPrecedent: boolean;
  readonly exactEvidence: string;
}

// Pre-compiled patterns for modal obligation verbs
const OBLIGATION_VERB_REGEX = /\b(shall(?:\s+not)?|must(?:\s+not)?|agrees?\s+to|is\s+required\s+to|undertakes?\s+to|is\s+obligated\s+to)\s+([^.;\n]+)/i;

// Pre-compiled patterns for party identification
const PARTY_PATTERNS = [
  /\b(Contractor|Consultant|Service\s+Provider|Developer|Vendor)\b/i,
  /\b(Client|Company|Customer|Employer)\b/i,
  /\b(Tenant|Resident|Lessee)\b/i,
  /\b(Landlord|Owner|Lessor)\b/i,
  /\b(Employee|Worker)\b/i,
  /\b(Buyer|Purchaser)\b/i,
  /\b(Seller)\b/i,
  /\b(Each\s+Party|Both\s+Parties|Either\s+Party)\b/i,
];

// Pre-compiled patterns for deadlines and duration phrases
const DEADLINE_REGEX = /\b(?:within\s+)?(?:(one|two|three|four|five|ten|fourteen|fifteen|thirty|sixty|ninety|180|365|\d+)\s*(?:\([0-9]+\))?)\s*(calendar\s+days?|business\s+days?|days?|weeks?|months?|years?|hours?)\b/gi;

const WORD_TO_NUMBER: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  seven: 7,
  ten: 10,
  fourteen: 14,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fortyfive: 45,
  sixty: 60,
  ninety: 90,
};

/**
 * Normalizes numeric representation from contract wording.
 */
function parseNumericValue(valueStr: string): number {
  const cleanStr = valueStr.trim().toLowerCase();
  if (WORD_TO_NUMBER[cleanStr] !== undefined) {
    return WORD_TO_NUMBER[cleanStr];
  }
  const numericMatch = cleanStr.match(/\d+/);
  return numericMatch ? parseInt(numericMatch[0], 10) : 0;
}

/**
 * Normalizes time units.
 */
function normalizeTimeUnit(unitStr: string): ExtractedDeadline['unit'] {
  const lower = unitStr.toLowerCase();
  if (lower.includes('business')) return 'business_days';
  if (lower.includes('day')) return 'days';
  if (lower.includes('week')) return 'days'; // normalized conceptually if needed, but represented as days
  if (lower.includes('month')) return 'months';
  if (lower.includes('year')) return 'years';
  if (lower.includes('hour')) return 'hours';
  return 'days';
}

/**
 * Categorizes deadline type from surrounding clause context.
 */
function categorizeDeadlineType(context: string): ExtractedDeadline['type'] {
  const lower = context.toLowerCase();
  if (lower.includes('cure') || lower.includes('remedy') || lower.includes('correct')) {
    return 'CURE_PERIOD';
  }
  if (lower.includes('notice') || lower.includes('terminat')) {
    return 'NOTICE_PERIOD';
  }
  if (lower.includes('pay') || lower.includes('invoice') || lower.includes('net-')) {
    return 'PAYMENT_WINDOW';
  }
  if (lower.includes('renew') || lower.includes('cancel')) {
    return 'RENEWAL_WINDOW';
  }
  if (lower.includes('non-compete') || lower.includes('restrict')) {
    return 'RESTRICTIVE_PERIOD';
  }
  return 'MILESTONE';
}

/**
 * Extracts deterministic obligations and deadlines from parsed clauses.
 */
export function extractObligationsAndDeadlines(clauses: readonly ParsedClause[]): {
  obligations: readonly ExtractedObligation[];
  deadlines: readonly ExtractedDeadline[];
} {
  const obligations: ExtractedObligation[] = [];
  const deadlines: ExtractedDeadline[] = [];

  let obligationCounter = 0;
  let deadlineCounter = 0;

  for (const clause of clauses) {
    const text = clause.originalText;
    const sentences = text.split(/(?<=[.!?])\s+/);

    // 1. Scan for Deadlines
    DEADLINE_REGEX.lastIndex = 0;
    let deadlineMatch: RegExpExecArray | null;

    while ((deadlineMatch = DEADLINE_REGEX.exec(text)) !== null) {
      deadlineCounter++;
      const fullPhrase = deadlineMatch[0];
      const rawNumber = deadlineMatch[1] || '0';
      const rawUnit = deadlineMatch[2] || 'days';

      const normalizedValue = parseNumericValue(rawNumber);
      const unit = normalizeTimeUnit(rawUnit);

      // Extract sentence boundary around deadline to prevent bleed from adjacent sentences
      let sentenceStart = deadlineMatch.index;
      while (sentenceStart > 0 && !/[.!?\n]/.test(text[sentenceStart - 1])) {
        sentenceStart--;
      }
      let sentenceEnd = deadlineMatch.index + fullPhrase.length;
      while (sentenceEnd < text.length && !/[.!?\n]/.test(text[sentenceEnd])) {
        sentenceEnd++;
      }
      const contextSnippet = text.substring(sentenceStart, sentenceEnd).trim();

      deadlines.push({
        id: `deadline-${deadlineCounter}`,
        clauseId: clause.id,
        type: categorizeDeadlineType(contextSnippet),
        normalizedValue,
        unit,
        rawText: fullPhrase,
        contextSnippet,
      });
    }

    // 2. Scan for Obligations sentence-by-sentence
    for (const sentence of sentences) {
      const verbMatch = sentence.match(OBLIGATION_VERB_REGEX);
      if (!verbMatch) continue;

      let detectedParty = 'Party';
      for (const partyRegex of PARTY_PATTERNS) {
        const partyMatch = sentence.match(partyRegex);
        if (partyMatch) {
          detectedParty = partyMatch[1];
          break;
        }
      }

      obligationCounter++;
      const modalVerb = verbMatch[1];
      const actionText = verbMatch[2].trim();

      // Look for deadline or trigger in the sentence
      let deadlineOrTrigger = 'As specified in agreement';
      DEADLINE_REGEX.lastIndex = 0;
      const sentenceDeadline = sentence.match(DEADLINE_REGEX);
      if (sentenceDeadline) {
        deadlineOrTrigger = sentenceDeadline[0];
      } else if (sentence.toLowerCase().includes('upon termination')) {
        deadlineOrTrigger = 'Upon contract termination';
      } else if (sentence.toLowerCase().includes('immediately')) {
        deadlineOrTrigger = 'Immediate';
      }

      // Consequence of breach extraction
      let consequenceOfBreach = 'Potential material breach of contract';
      if (sentence.toLowerCase().includes('liquidated damages')) {
        consequenceOfBreach = 'Subject to liquidated damages assessment';
      } else if (sentence.toLowerCase().includes('forfeit')) {
        consequenceOfBreach = 'Forfeiture of fees or retained funds';
      } else if (sentence.toLowerCase().includes('terminate')) {
        consequenceOfBreach = 'Immediate termination of agreement';
      }

      const isConditionPrecedent = 
        sentence.toLowerCase().includes('prior to') ||
        sentence.toLowerCase().includes('condition precedent') ||
        sentence.toLowerCase().includes('as a condition');

      obligations.push({
        id: `ob-${obligationCounter}`,
        clauseId: clause.id,
        responsibleParty: detectedParty,
        actionRequired: `${modalVerb} ${actionText.substring(0, 180)}`,
        deadlineOrTrigger,
        consequenceOfBreach,
        isConditionPrecedent,
        exactEvidence: sentence.trim(),
      });
    }
  }

  return { obligations, deadlines };
}
