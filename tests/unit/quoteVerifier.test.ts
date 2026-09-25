import { describe, it, expect } from 'vitest';
import { verifyAndFilterFindings } from '../../src/engine/quoteVerifier';
import { Finding } from '../../src/types/analysis';
import { ClauseSegment } from '../../src/types/document';

describe('Hallucination Quote Verifier', () => {
  const mockSegments: ClauseSegment[] = [
    {
      id: 'sec-1',
      sectionNumber: '1',
      title: 'Indemnity',
      rawText: 'Contractor shall defend, indemnify, and hold harmless Client against all claims.',
      redactedText: 'Contractor shall defend, indemnify, and hold harmless Client against all claims.',
      startIndex: 0,
      endIndex: 78
    }
  ];

  it('should retain findings with quotes that exist in the source segment', () => {
    const validFinding: Finding = {
      id: 'f-1',
      clauseId: 'sec-1',
      category: 'unilateral_indemnification',
      level: 'CRITICAL',
      exactQuote: 'defend, indemnify, and hold harmless',
      plainEnglishSummary: 'One-sided indemnity.',
      strategicRisk: 'High risk.',
      suggestedBalancedRevision: 'Make mutual.',
      attorneyQuestions: ['Can we make mutual?']
    };

    const verified = verifyAndFilterFindings([validFinding], mockSegments);
    expect(verified.length).toBe(1);
    expect(verified[0].id).toBe('f-1');
  });

  it('should filter out hallucinated findings whose quote does not exist in the source', () => {
    const hallucinatedFinding: Finding = {
      id: 'f-fake',
      clauseId: 'sec-1',
      category: 'unilateral_indemnification',
      level: 'CRITICAL',
      exactQuote: 'Non-existent statutory penalty of ten million dollars',
      plainEnglishSummary: 'Fake penalty.',
      strategicRisk: 'High risk.',
      suggestedBalancedRevision: 'Remove.',
      attorneyQuestions: []
    };

    const verified = verifyAndFilterFindings([hallucinatedFinding], mockSegments);
    expect(verified.length).toBe(0);
  });
});
