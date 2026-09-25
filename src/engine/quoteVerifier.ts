/**
 * LexiClear AI - Deterministic Exact Quote Verifier
 * Phase 3 Zero-Hallucination Evidence Gate
 *
 * CRITICAL ASSERTION:
 * Asserts that finding.exactQuote is an EXACT verbatim substring of the original document.
 * If the evidence cannot be verified against the source text, the finding is DISCARDED.
 *
 * Prevents evidence fabrication and guarantees 100% quotation fidelity.
 */

export interface FindingWithEvidence {
  readonly exactQuote: string;
}

export interface SegmentLike {
  readonly id?: string;
  readonly rawText?: string;
  readonly originalText?: string;
}

/**
 * Checks whether an extracted quote is a verbatim substring of the source document.
 */
export function isVerbatimSubstring(sourceDocument: string, candidateQuote: string): boolean {
  if (!sourceDocument || typeof sourceDocument !== 'string') return false;
  if (!candidateQuote || typeof candidateQuote !== 'string') return false;

  const trimmedQuote = candidateQuote.trim();
  if (trimmedQuote.length === 0) return false;

  return sourceDocument.includes(trimmedQuote);
}

/**
 * Filters a list of findings, keeping only those whose exactQuote exists
 * verbatim within the raw source text or segment array.
 */
export function verifyAndFilterFindings<T extends { exactQuote: string }>(
  findings: readonly T[],
  sourceDocumentOrSegments: string | readonly SegmentLike[]
): T[] {
  if (!sourceDocumentOrSegments || findings.length === 0) {
    return [];
  }

  // Handle both full document string and segment array
  let fullSourceText = '';
  const segmentTextMap = new Map<string, string>();

  if (typeof sourceDocumentOrSegments === 'string') {
    fullSourceText = sourceDocumentOrSegments;
  } else {
    for (const seg of sourceDocumentOrSegments) {
      const text = seg.rawText || seg.originalText || '';
      fullSourceText += (fullSourceText ? '\n\n' : '') + text;
      if (seg.id) {
        segmentTextMap.set(seg.id, text);
      }
    }
  }

  return findings.filter((finding) => {
    // If finding has clauseId and we have segment map, verify against specific segment first
    const clauseId = (finding as any).clauseId;
    if (clauseId && segmentTextMap.has(clauseId)) {
      const segText = segmentTextMap.get(clauseId)!;
      if (isVerbatimSubstring(segText, finding.exactQuote)) {
        return true;
      }
    }

    // Otherwise verify against full source text
    return isVerbatimSubstring(fullSourceText, finding.exactQuote);
  });
}
