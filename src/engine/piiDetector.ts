/**
 * LexiClear AI - Deterministic PII Detection & Redaction Engine
 * Phase 3 Legal Privacy Layer
 *
 * Scans contract text for sensitive identifiers:
 * - Email addresses
 * - Phone numbers (domestic and international)
 * - Social Security Numbers (SSN)
 * - Aadhaar-like identifiers (12 digits, 4-4-4 format)
 * - PAN-like identifiers (5 uppercase letters + 4 digits + 1 letter)
 * - Bank account numbers
 * - Physical street addresses
 * - Monetary figures
 *
 * Guarantees:
 * - Source document remains unmodified in memory.
 * - Redacted view is generated separately with predictable token placeholders.
 * - Zero logging of raw PII.
 */

export interface DetectedPiiEntity {
  readonly id: string;
  readonly type: 
    | 'EMAIL'
    | 'PHONE'
    | 'SSN'
    | 'AADHAAR'
    | 'PAN'
    | 'BANK_ACCOUNT'
    | 'CREDIT_CARD'
    | 'ADDRESS'
    | 'MONETARY';
  readonly token: string;
  readonly originalValue: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

export interface PiiScanResult {
  readonly originalText: string;
  readonly redactedText: string;
  readonly entities: readonly DetectedPiiEntity[];
  readonly entityCounts: Readonly<Record<string, number>>;
  readonly redactionMap: Readonly<Record<string, string>>;
}

// Pre-compiled regular expressions for high performance and zero backtracking vulnerability
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /(?<!\d)(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}(?!\d)/g;
const SSN_REGEX = /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g;
const AADHAAR_REGEX = /\b\d{4}[-\s]\d{4}[-\s]\d{4}\b/g;
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{4}[-\s]?\d{6}[-\s]?\d{5}\b/g;
const BANK_ACCOUNT_REGEX = /\b(?:account|acct|acc)[#:\s]*([0-9]{9,18})\b/gi;
const FINANCIAL_REGEX = /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s?(?:USD|dollars))?\b/gi;
const ADDRESS_REGEX = /\b\d{1,5}\s+(?:[A-Z][a-z0-9.]+\s+){1,4}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Way)\b(?:,?\s+(?:Apt|Suite|Unit|#)\s*[A-Za-z0-9]+)?(?:,?\s+[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\s*\d{5})?/gi;

/**
 * Scans text and extracts PII entities with character offsets.
 */
export function detectAndRedactPii(sourceText: string): PiiScanResult {
  if (!sourceText || typeof sourceText !== 'string') {
    return {
      originalText: '',
      redactedText: '',
      entities: [],
      entityCounts: {},
      redactionMap: {},
    };
  }

  const entities: DetectedPiiEntity[] = [];
  const redactionMap: Record<string, string> = {};
  const entityCounters: Record<string, number> = {
    EMAIL: 1,
    PHONE: 1,
    SSN: 1,
    AADHAAR: 1,
    PAN: 1,
    BANK_ACCOUNT: 1,
    CREDIT_CARD: 1,
    ADDRESS: 1,
    MONETARY: 1,
  };

  // Helper function to safely execute regex scans
  function extractWithPattern(
    regex: RegExp,
    type: DetectedPiiEntity['type'],
    prefix: string
  ) {
    let match: RegExpExecArray | null;
    // Reset regex lastIndex
    regex.lastIndex = 0;

    while ((match = regex.exec(sourceText)) !== null) {
      const originalValue = match[0];
      const startOffset = match.index;
      const endOffset = startOffset + originalValue.length;

      // Avoid overlapping duplicates
      const isOverlapping = entities.some(
        (e) => (startOffset >= e.startOffset && startOffset < e.endOffset) ||
               (endOffset > e.startOffset && endOffset <= e.endOffset)
      );

      if (!isOverlapping) {
        const count = entityCounters[type]++;
        const token = `[${prefix}_${count}]`;

        entities.push({
          id: `pii-${entities.length + 1}`,
          type,
          token,
          originalValue,
          startOffset,
          endOffset,
        });

        redactionMap[token] = originalValue;
      }
    }
  }

  // Execute extraction in order of specificity (longest/most specific patterns first)
  extractWithPattern(CREDIT_CARD_REGEX, 'CREDIT_CARD', 'CARD_NUM');
  extractWithPattern(SSN_REGEX, 'SSN', 'ID_SSN');
  extractWithPattern(AADHAAR_REGEX, 'AADHAAR', 'ID_AADHAAR');
  extractWithPattern(PAN_REGEX, 'PAN', 'ID_PAN');
  extractWithPattern(EMAIL_REGEX, 'EMAIL', 'EMAIL');
  extractWithPattern(BANK_ACCOUNT_REGEX, 'BANK_ACCOUNT', 'BANK_ACCT');
  extractWithPattern(PHONE_REGEX, 'PHONE', 'TEL');
  extractWithPattern(ADDRESS_REGEX, 'ADDRESS', 'LOCATION');
  extractWithPattern(FINANCIAL_REGEX, 'MONETARY', 'AMOUNT');

  // Sort entities reverse by startOffset so substitutions do not invalidate downstream string indexes
  const sortedEntities = [...entities].sort((a, b) => b.startOffset - a.startOffset);

  let redactedText = sourceText;
  for (const entity of sortedEntities) {
    redactedText =
      redactedText.substring(0, entity.startOffset) +
      entity.token +
      redactedText.substring(entity.endOffset);
  }

  // Summary counts
  const entityCounts: Record<string, number> = {};
  for (const entity of entities) {
    entityCounts[entity.type] = (entityCounts[entity.type] || 0) + 1;
  }

  return {
    originalText: sourceText,
    redactedText,
    entities,
    entityCounts,
    redactionMap,
  };
}
