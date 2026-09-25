/**
 * LexiClear AI - Server Service Boundary Types
 * Phase 2 Architectural Gate
 *
 * Defines contracts for future server-side AI execution services.
 * In Phase 2, NO Gemini calls are made; this establishes the service contracts.
 */

import { GeminiMemoRequest, GeminiMemoResponse } from '../../src/models/domain.models';

export interface ILegalSynthesisService {
  synthesizeExecutiveBrief(request: GeminiMemoRequest): Promise<GeminiMemoResponse>;
}

export interface IDocumentQueryService {
  answerGroundedQuery(params: {
    query: string;
    excerpts: readonly string[];
    perspective: string;
  }): Promise<{
    answer: string;
    referencedSections: readonly string[];
  }>;
}
