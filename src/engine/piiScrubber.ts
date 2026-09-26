import { PIIEntity, RedactionMap, RedactedDocument, PIIType } from '../types/pii';

// Pre-compiled high-efficiency regex patterns
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
const SSN_REGEX = /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g;
const AADHAAR_REGEX = /\b\d{4}[-\s]\d{4}[-\s]\d{4}\b/g;
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{4}[-\s]?\d{6}[-\s]?\d{5}\b/g;
const BANK_ACCOUNT_REGEX = /\b(?:account|acct|acc)[#:\s]*([0-9]{9,18})\b/gi;
const FINANCIAL_REGEX = /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s?(?:USD|dollars))?\b/gi;
const ADDRESS_REGEX = /\b\d{1,5}\s+(?:[A-Z][a-z0-9.]+\s+){1,4}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Way)\b(?:,?\s+(?:Apt|Suite|Unit|#)\s*[A-Za-z0-9]+)?(?:,?\s+[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\s*\d{5})?/gi;

export function scrubPII(
  text: string,
  docId: string = 'doc-1',
  documentType: string = 'custom_contract',
  perspective: string = 'neutral_observer'
): RedactedDocument {
  const entities: PIIEntity[] = [];
  const redactionMap: RedactionMap = {};

  const entityCounter: Record<string, number> = {
    EMAIL: 1,
    PHONE: 1,
    SSN: 1,
    AADHAAR: 1,
    PAN: 1,
    BANK_ACCOUNT: 1,
    CREDIT_CARD: 1,
    FINANCIAL: 1,
    ADDRESS: 1,
  };

  // Helper to extract matches with pre-compiled regex avoiding overlaps
  function collectEntities(regex: RegExp, type: PIIType, prefix: string) {
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const originalValue = match[0];
      const startIndex = match.index;
      const endIndex = match.index + originalValue.length;

      const isOverlapping = entities.some(
        (e) => (startIndex >= e.startIndex && startIndex < e.endIndex) ||
               (endIndex > e.startIndex && endIndex <= e.endIndex)
      );

      if (!isOverlapping) {
        const count = entityCounter[type]++;
        const token = `[${prefix}_${count}]`;
        entities.push({
          id: `pii-${entities.length + 1}`,
          type,
          originalValue,
          token,
          startIndex,
          endIndex,
        });
        redactionMap[token] = originalValue;
      }
    }
  }

  collectEntities(CREDIT_CARD_REGEX, 'CREDIT_CARD', 'CARD_NUM');
  collectEntities(SSN_REGEX, 'SSN', 'ID_SSN');
  collectEntities(AADHAAR_REGEX, 'AADHAAR', 'ID_AADHAAR');
  collectEntities(PAN_REGEX, 'PAN', 'ID_PAN');
  collectEntities(EMAIL_REGEX, 'EMAIL', 'EMAIL');
  collectEntities(PHONE_REGEX, 'PHONE', 'TEL');
  collectEntities(BANK_ACCOUNT_REGEX, 'BANK_ACCOUNT', 'BANK_ACCT');
  collectEntities(FINANCIAL_REGEX, 'FINANCIAL', 'AMOUNT');
  collectEntities(ADDRESS_REGEX, 'ADDRESS', 'LOCATION');

  // Sort reverse by start index to avoid invalidating offsets during replacement
  const sortedEntities = [...entities].sort((a, b) => b.startIndex - a.startIndex);
  let redactedText = text;

  for (const entity of sortedEntities) {
    redactedText =
      redactedText.substring(0, entity.startIndex) +
      entity.token +
      redactedText.substring(entity.endIndex);
  }

  return {
    docId,
    documentType,
    perspective,
    rawText: text,
    redactedText,
    entities,
    redactionMap,
  };
}

export function rehydrateText(redactedText: string, redactionMap: RedactionMap): string {
  let restored = redactedText;
  for (const [token, original] of Object.entries(redactionMap)) {
    restored = restored.replaceAll(token, original);
  }
  return restored;
}
