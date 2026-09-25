/**
 * LexiClear AI - Deterministic Document Parser
 * Phase 3 Legal Document Structure Extraction
 *
 * Preserves the exact original source text.
 * Deterministically parses sections, numbered clauses, headings, and paragraphs.
 * Records character boundaries (startOffset, endOffset) and assigns stable IDs.
 */

export interface ParsedClause {
  readonly id: string;
  readonly clauseNumber: string;
  readonly heading: string;
  readonly originalText: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly parentSectionId?: string;
  readonly startLine: number;
  readonly endLine: number;
}

export interface ParsedSection {
  readonly id: string;
  readonly sectionNumber: string;
  readonly heading: string;
  readonly rawText: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly clauses: readonly ParsedClause[];
}

export interface ParsedDocument {
  readonly originalText: string;
  readonly characterCount: number;
  readonly lineCount: number;
  readonly sections: readonly ParsedSection[];
  readonly clauses: readonly ParsedClause[];
}

// Pre-compiled regex patterns for standard contract headings and numbering
const SECTION_OR_ARTICLE_PATTERN = /^(?:SECTION|ARTICLE|CLAUSE)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[\.:\s\-—]*(.*)/i;
const NUMBERED_CLAUSE_PATTERN = /^([0-9]+(?:\.[0-9]+)+|[0-9]+\.)[\s\-—]+(.*)/;
const ROMAN_OR_ALPHA_PATTERN = /^(?:\(([a-z0-9]+)\)|([a-z0-9]+)\.)[\s\-—]+(.*)/i;

/**
 * Deterministically parses plain-text legal documents into sections and clauses.
 * Preserves the verbatim source text without modification.
 */
export function parseLegalDocument(sourceText: string): ParsedDocument {
  if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length === 0) {
    return {
      originalText: sourceText || '',
      characterCount: 0,
      lineCount: 0,
      sections: [],
      clauses: [],
    };
  }

  const sections: ParsedSection[] = [];
  const clauses: ParsedClause[] = [];

  // Split into paragraphs preserving raw positions
  // Regex splits on double-newlines OR single-newlines followed by a new Section, Article, or Numbered Clause
  const paragraphRegex = /\S[\s\S]*?(?=\n\s*\n|\n(?=(?:SECTION|ARTICLE|CLAUSE)\s+[0-9IVXLCDM]+|[0-9]+(?:\.[0-9]+)+|[0-9]+\.[\s\-—])|\s*$)/gi;
  let match: RegExpExecArray | null;

  let currentSection: {
    id: string;
    sectionNumber: string;
    heading: string;
    rawText: string;
    startOffset: number;
    endOffset: number;
    clauses: ParsedClause[];
  } | null = null;

  let sectionCounter = 0;
  let clauseCounter = 0;

  // Track line numbers
  const lineBreakOffsets: number[] = [0];
  for (let i = 0; i < sourceText.length; i++) {
    if (sourceText[i] === '\n') {
      lineBreakOffsets.push(i + 1);
    }
  }

  function getLineNumber(offset: number): number {
    let low = 0;
    let high = lineBreakOffsets.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lineBreakOffsets[mid] <= offset) {
        if (mid === lineBreakOffsets.length - 1 || lineBreakOffsets[mid + 1] > offset) {
          return mid + 1;
        }
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return 1;
  }

  while ((match = paragraphRegex.exec(sourceText)) !== null) {
    const rawParagraph = match[0];
    const startOffset = match.index;
    const endOffset = startOffset + rawParagraph.length;
    const trimmedParagraph = rawParagraph.trim();

    if (!trimmedParagraph) continue;

    const startLine = getLineNumber(startOffset);
    const endLine = getLineNumber(endOffset);

    // 1. Check for Major Section / Article Header
    const sectionMatch = trimmedParagraph.match(SECTION_OR_ARTICLE_PATTERN);
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }

      sectionCounter++;
      const sectionNumber = sectionMatch[1];
      const headingCandidate = (sectionMatch[2] || '').split('\n')[0].trim();
      const heading = headingCandidate || `Section ${sectionNumber}`;

      currentSection = {
        id: `sec-${sectionNumber.replace(/\./g, '-')}`,
        sectionNumber,
        heading,
        rawText: rawParagraph,
        startOffset,
        endOffset,
        clauses: [],
      };

      // If there are body lines after the section header, create a clause
      const lines = rawParagraph.split('\n');
      const bodyLines = lines.slice(1).join('\n').trim();

      if (bodyLines.length > 0) {
        const clauseId = `clause-${sectionNumber.replace(/\./g, '-')}`;
        const clauseItem: ParsedClause = {
          id: clauseId,
          clauseNumber: sectionNumber,
          heading,
          originalText: rawParagraph,
          startOffset,
          endOffset,
          parentSectionId: currentSection.id,
          startLine,
          endLine,
        };

        currentSection.clauses.push(clauseItem);
        clauses.push(clauseItem);
      }
      continue;
    }

    // 2. Check for Numbered Subsection (e.g. "1.1", "1.1.1", "2.")
    const numberedMatch = trimmedParagraph.match(NUMBERED_CLAUSE_PATTERN);
    if (numberedMatch) {
      clauseCounter++;
      const clauseNumber = numberedMatch[1].replace(/[\.\s]+$/, '');
      const firstLine = (numberedMatch[2] || '').split('\n')[0].trim();
      const heading = firstLine.length > 0 && firstLine.length < 80 
        ? firstLine 
        : `Clause ${clauseNumber}`;

      // If we don't have an active section, create an implicit parent section
      if (!currentSection) {
        sectionCounter++;
        currentSection = {
          id: `sec-${sectionCounter}`,
          sectionNumber: `${sectionCounter}`,
          heading: `Section ${sectionCounter}`,
          rawText: rawParagraph,
          startOffset,
          endOffset,
          clauses: [],
        };
      }

      const clauseId = `clause-${clauseNumber.replace(/\./g, '-')}`;
      const clauseItem: ParsedClause = {
        id: clauseId,
        clauseNumber,
        heading,
        originalText: rawParagraph,
        startOffset,
        endOffset,
        parentSectionId: currentSection.id,
        startLine,
        endLine,
      };

      currentSection.clauses.push(clauseItem);
      clauses.push(clauseItem);
      continue;
    }

    // 3. Check for Sub-items like "(a)", "(b)", "i.", etc.
    const subItemMatch = trimmedParagraph.match(ROMAN_OR_ALPHA_PATTERN);
    if (subItemMatch && currentSection) {
      clauseCounter++;
      const itemNumber = subItemMatch[1] || subItemMatch[2];
      const heading = `Subclause (${itemNumber})`;

      const clauseId = `${currentSection.id}-sub-${itemNumber}`;
      const clauseItem: ParsedClause = {
        id: clauseId,
        clauseNumber: itemNumber,
        heading,
        originalText: rawParagraph,
        startOffset,
        endOffset,
        parentSectionId: currentSection.id,
        startLine,
        endLine,
      };

      currentSection.clauses.push(clauseItem);
      clauses.push(clauseItem);
      continue;
    }

    // 4. Standard Paragraph
    clauseCounter++;
    const isHeadingLike = trimmedParagraph.length < 80 && !trimmedParagraph.endsWith('.');
    const heading = isHeadingLike ? trimmedParagraph : `Paragraph ${clauseCounter}`;

    if (!currentSection) {
      sectionCounter++;
      currentSection = {
        id: `sec-${sectionCounter}`,
        sectionNumber: `${sectionCounter}`,
        heading: isHeadingLike ? trimmedParagraph : `Section ${sectionCounter}`,
        rawText: rawParagraph,
        startOffset,
        endOffset,
        clauses: [],
      };
    }

    const clauseId = `clause-${clauseCounter}`;
    const clauseItem: ParsedClause = {
      id: clauseId,
      clauseNumber: `${clauseCounter}`,
      heading,
      originalText: rawParagraph,
      startOffset,
      endOffset,
      parentSectionId: currentSection.id,
      startLine,
      endLine,
    };

    currentSection.clauses.push(clauseItem);
    clauses.push(clauseItem);
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    originalText: sourceText,
    characterCount: sourceText.length,
    lineCount: lineBreakOffsets.length,
    sections,
    clauses,
  };
}
