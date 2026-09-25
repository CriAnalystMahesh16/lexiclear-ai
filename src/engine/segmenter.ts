import { ClauseSegment } from '../types/document';

const SECTION_HEADER_REGEX = /(?:^|\n\n+)(?:(?:SECTION|ARTICLE|CLAUSE)\s+(\d+(?:\.\d+)*|[A-Z]+)[\.:\s]*([^\n]*)|(\d+(?:\.\d+)*)[\.:\s]+([^\n]+))/gi;

export function segmentDocument(rawText: string, redactedText: string): ClauseSegment[] {
  const segments: ClauseSegment[] = [];
  const lines = rawText.split(/\n\n+/);
  const redactedLines = redactedText.split(/\n\n+/);

  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawParagraph = lines[i].trim();
    const redactedParagraph = (redactedLines[i] || rawParagraph).trim();

    if (!rawParagraph) continue;

    // Detect section numbering or title
    const headerMatch = rawParagraph.match(/^(?:(?:SECTION|ARTICLE|CLAUSE)\s+([\d\.]+)|([\d\.]+))[\.\s:]*(.*)/i);
    let sectionNumber = `${i + 1}`;
    let title = `Paragraph ${i + 1}`;

    if (headerMatch) {
      sectionNumber = (headerMatch[1] || headerMatch[2] || `${i + 1}`).replace(/[\.\s]+$/, '');
      title = (headerMatch[3] || '').trim().split('\n')[0] || `Section ${sectionNumber}`;
      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }
    } else if (rawParagraph.length < 80 && !rawParagraph.endsWith('.')) {
      title = rawParagraph;
    }

    const startIndex = rawText.indexOf(rawParagraph, currentOffset);
    const endIndex = startIndex !== -1 ? startIndex + rawParagraph.length : currentOffset + rawParagraph.length;
    currentOffset = endIndex;

    segments.push({
      id: `sec-${i + 1}`,
      sectionNumber,
      title: title || `Clause ${i + 1}`,
      rawText: rawParagraph,
      redactedText: redactedParagraph,
      startIndex: startIndex !== -1 ? startIndex : 0,
      endIndex
    });
  }

  return segments;
}
