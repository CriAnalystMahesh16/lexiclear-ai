import { describe, it, expect } from 'vitest';
import { segmentDocument } from '../../src/engine/segmenter';

describe('Deterministic Clause Segmenter', () => {
  it('should split numbered clauses into indexed segments', () => {
    const text = `1. SERVICES AND COMPENSATION\nClient agrees to pay Contractor.\n\n2. INDEMNIFICATION\nContractor shall defend and hold harmless Client.`;
    const segments = segmentDocument(text, text);

    expect(segments.length).toBe(2);
    expect(segments[0].sectionNumber).toBe('1');
    expect(segments[0].title).toBe('SERVICES AND COMPENSATION');
    expect(segments[1].sectionNumber).toBe('2');
    expect(segments[1].title).toBe('INDEMNIFICATION');
  });
});
