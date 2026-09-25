/**
 * LexiClear AI - Client-Side Gemini Service
 * Phase 4 AI Integration
 *
 * Calls server-side proxy routes (/api/ai/*).
 * Never directly accesses GEMINI_API_KEY.
 * Implements client-side deduplication and in-flight coalescing.
 */

import {
  ExplainFindingRequest,
  ExplainFindingResponse,
  BalancedAlternativeRequest,
  BalancedAlternativeResponse,
  AttorneyBriefRequest,
  AttorneyBriefResponse,
  DocumentQARequest,
  DocumentQAResponse,
} from '../schemas/gemini.schemas';

class GeminiClientService {
  private inFlight = new Map<string, Promise<any>>();
  private memoryCache = new Map<string, any>();

  private async fetchApi<T>(endpoint: string, payload: unknown): Promise<T> {
    const key = `${endpoint}:${JSON.stringify(payload)}`;

    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const message = errorData?.error?.message || `Request failed with status ${response.status}`;
          throw new Error(message);
        }

        const data = await response.json();
        const result = data.data as T;
        this.memoryCache.set(key, result);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  public async explainFinding(request: ExplainFindingRequest): Promise<ExplainFindingResponse> {
    return this.fetchApi<ExplainFindingResponse>('/api/ai/explain-finding', request);
  }

  public async generateBalancedAlternative(
    request: BalancedAlternativeRequest
  ): Promise<BalancedAlternativeResponse> {
    return this.fetchApi<BalancedAlternativeResponse>('/api/ai/balanced-alternative', request);
  }

  public async generateAttorneyBrief(request: AttorneyBriefRequest): Promise<AttorneyBriefResponse> {
    return this.fetchApi<AttorneyBriefResponse>('/api/ai/attorney-brief', request);
  }

  public async askDocument(request: DocumentQARequest): Promise<DocumentQAResponse> {
    return this.fetchApi<DocumentQAResponse>('/api/ai/ask-document', request);
  }
}

export const geminiClientService = new GeminiClientService();
