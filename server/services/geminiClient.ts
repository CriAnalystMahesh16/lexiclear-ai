/**
 * LexiClear AI - Server-Side Gemini Client Initialization
 * Phase 4 Responsible AI Gateway
 *
 * Implements server-side singleton GoogleGenAI client with 'aistudio-build' User-Agent.
 * GEMINI_API_KEY exists exclusively on the server and is never exposed to browser.
 */

import { GoogleGenAI } from '@google/genai';

let customClientInstance: GoogleGenAI | null = null;

/**
 * Returns the active server-side GoogleGenAI client.
 * Uses singleton caching for high efficiency.
 */
export function getGeminiClient(): GoogleGenAI {
  if (customClientInstance) {
    return customClientInstance;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Allows test suites to inject a deterministic mocked client.
 */
export function setMockGeminiClient(mockClient: GoogleGenAI | null): void {
  customClientInstance = mockClient;
}
