import { describe, it, expect } from 'vitest';
import { scrubPII } from '../../src/engine/piiScrubber';
import { SAMPLE_CONTRACTS } from '../../src/data/sampleContracts';

describe('Security Boundary: Zero PII Leakage', () => {
  it('should guarantee that 0 SSNs or personal emails leak into the redacted output for all benchmark contracts', () => {
    for (const sample of SAMPLE_CONTRACTS) {
      const result = scrubPII(sample.content);

      // Verify no SSN pattern
      expect(result.redactedText).not.toMatch(/\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/);
      // Verify no raw email addresses
      expect(result.redactedText).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    }
  });
});
