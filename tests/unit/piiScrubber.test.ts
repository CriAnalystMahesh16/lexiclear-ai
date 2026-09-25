import { describe, it, expect } from 'vitest';
import { scrubPII, rehydrateText } from '../../src/engine/piiScrubber';
import { detectAndRedactPii } from '../../src/engine/piiDetector';

describe('Zero-Knowledge PII Scrubber Engine', () => {
  it('should mask sensitive SSNs, emails, phone numbers, and financial figures', () => {
    const rawContract = 'Contractor Jane Doe (SSN: 123-45-6789, email: jane.doe@example.com, tel: 512-555-0199) receives $95.00 per hour.';
    const result = scrubPII(rawContract);

    expect(result.redactedText).not.toContain('123-45-6789');
    expect(result.redactedText).not.toContain('jane.doe@example.com');
    expect(result.redactedText).not.toContain('512-555-0199');
    expect(result.redactedText).not.toContain('$95.00');

    expect(result.redactedText).toContain('[ID_SSN_1]');
    expect(result.redactedText).toContain('[EMAIL_1]');
    expect(result.redactedText).toContain('[TEL_1]');
    expect(result.redactedText).toContain('[AMOUNT_1]');
    expect(result.entities.length).toBe(4);
  });

  it('should detect and redact Aadhaar, PAN, and bank account numbers', () => {
    const rawFinancialText = 'Beneficiary PAN ABCDE1234F, Aadhaar 1234 5678 9012, and Account 9876543210123.';
    const result = detectAndRedactPii(rawFinancialText);

    expect(result.redactedText).not.toContain('ABCDE1234F');
    expect(result.redactedText).not.toContain('1234 5678 9012');
    expect(result.redactedText).not.toContain('9876543210123');

    expect(result.redactedText).toContain('[ID_PAN_1]');
    expect(result.redactedText).toContain('[ID_AADHAAR_1]');
    expect(result.redactedText).toContain('[BANK_ACCT_1]');
    expect(result.entities.length).toBe(3);
  });

  it('should rehydrate text correctly from the local redaction map', () => {
    const rawContract = 'Contact support@testcorp.com for $5,000 refund.';
    const result = scrubPII(rawContract);
    const restored = rehydrateText(result.redactedText, result.redactionMap);

    expect(restored).toBe(rawContract);
  });
});

