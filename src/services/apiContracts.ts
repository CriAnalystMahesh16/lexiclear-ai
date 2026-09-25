/**
 * LexiClear AI - API Client Contracts
 * Phase 2 Architectural Service Boundary
 */

import {
  AnalyzeRequest,
  AnalyzeSuccessResponse,
  AskDocumentRequest,
  AskDocumentSuccessResponse,
  GenerateBriefRequest,
  GenerateBriefSuccessResponse,
  ApiErrorResponse,
} from '../schemas/api.schemas';

export type ApiResponse<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ApiErrorResponse['error'] };

export interface LexiClearApiClient {
  analyzeDocument(request: AnalyzeRequest): Promise<ApiResponse<AnalyzeSuccessResponse['data']>>;
  askDocument(request: AskDocumentRequest): Promise<ApiResponse<AskDocumentSuccessResponse['data']>>;
  generateBrief(request: GenerateBriefRequest): Promise<ApiResponse<GenerateBriefSuccessResponse['data']>>;
}
