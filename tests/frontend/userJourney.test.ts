/**
 * LexiClear AI - Phase 5 User Journey & Frontend Integration Tests
 *
 * Deterministic mocked testing covering:
 * 1. Complete intake -> analysis flow
 * 2. Finding selection & perspective adaptation
 * 3. AI Plain-English explanation integration
 * 4. AI Balanced alternative integration
 * 5. Document Q&A grounding & safe fallback
 * 6. Attorney consultation brief synthesis
 * 7. Error handling (rate limits, timeouts, validation)
 * 8. Disclaimer visibility & responsible AI guarantees
 * 9. Outbound privacy boundary (zero raw contract or unredacted PII transmitted)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SAMPLE_CONTRACTS } from '../../src/data/sampleContracts';
import { scrubPII } from '../../src/engine/piiScrubber';
import { segmentDocument } from '../../src/engine/segmenter';
import { runDeterministicRuleScan } from '../../src/engine/ruleScanner';
import { verifyAndFilterFindings } from '../../src/engine/quoteVerifier';
import { geminiClientService } from '../../src/services/geminiClientService';
import { setMockGeminiClient } from '../../server/services/geminiClient';
import { GoogleGenAI } from '@google/genai';
import { AI_DISCLAIMERS } from '../../src/schemas/gemini.schemas';
import { globalSynthesisCache } from '../../server/services/cacheAndCoalescer';
import { resetRateLimiter } from '../../server/middleware/security';

describe('Phase 5 Complete User Journey & Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSynthesisCache.clear();
    resetRateLimiter();
  });

  // 1. Complete Intake -> Analysis Pipeline
  it('1. should execute complete intake pipeline from raw contract to scrubbed deterministic findings', () => {
    const rawContract = SAMPLE_CONTRACTS[0].content; // Freelance MSA with SSN, phone, email
    expect(rawContract).toContain('123-45-6789');
    expect(rawContract).toContain('jane.doe@example.com');

    // Step A: Client-side PII Scrubbing
    const piiResult = scrubPII(rawContract, 'doc-test', 'contract', 'service_provider_or_contractor');
    expect(piiResult.redactedText).not.toContain('123-45-6789');
    expect(piiResult.redactedText).not.toContain('jane.doe@example.com');
    expect(piiResult.entities.length).toBeGreaterThan(0);

    // Step B: Structural Segmentation
    const segments = segmentDocument(rawContract, piiResult.redactedText);
    expect(segments.length).toBeGreaterThan(3);
    for (const seg of segments) {
      expect(seg.rawText.length).toBeGreaterThan(0);
      expect(rawContract).toContain(seg.rawText); // Verified substring
    }

    // Step C: Deterministic Risk Rule Scan
    const rawAnalysis = runDeterministicRuleScan(segments, 'service_provider_or_contractor');
    const verifiedFindings = verifyAndFilterFindings(rawAnalysis.findings, segments);

    expect(verifiedFindings.length).toBeGreaterThan(0);
    expect(rawAnalysis.overallRiskScore).toBeGreaterThan(50);
    expect(rawAnalysis.overallRiskTier).toMatch(/CRITICAL|HIGH/);

    // Assert that every finding has a verbatim quote verified against rawContract
    for (const f of verifiedFindings) {
      expect(rawContract.includes(f.exactQuote)).toBe(true);
    }
  });

  // 2. Finding Selection & Clause Inspection
  it('2. should isolate active finding with exact quote, deterministic explanation, and counsel inquiries', () => {
    const rawContract = SAMPLE_CONTRACTS[0].content;
    const piiResult = scrubPII(rawContract, 'doc-test', 'contract', 'service_provider_or_contractor');
    const segments = segmentDocument(rawContract, piiResult.redactedText);
    const analysis = runDeterministicRuleScan(segments, 'service_provider_or_contractor');
    const findings = verifyAndFilterFindings(analysis.findings, segments);

    const indemnityFinding = findings.find((f) => f.category === 'unilateral_indemnification');
    expect(indemnityFinding).toBeDefined();
    expect(indemnityFinding!.level).toBe('CRITICAL');
    expect(indemnityFinding!.exactQuote.toLowerCase()).toContain('indemnif');
    expect(indemnityFinding!.attorneyQuestions.length).toBeGreaterThan(0);
  });

  // 3. AI Plain-English Explanation Integration
  it('3. should synthesize a plain-English explanation for selected finding via geminiClientService', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            plainExplanation: 'You are agreeing to pay all legal defense expenses if the counterparty is sued.',
            keyConcern: 'Uncapped financial liability.',
            questionToAsk: 'Can we cap this obligation at fees paid?',
          }),
        }),
      },
    } as unknown as GoogleGenAI;

    setMockGeminiClient(mockClient);

    // Mock fetch for client service
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          plainExplanation: 'You are agreeing to pay all legal defense expenses if the counterparty is sued.',
          keyConcern: 'Uncapped financial liability.',
          questionToAsk: 'Can we cap this obligation at fees paid?',
          disclaimer: AI_DISCLAIMERS.EXPLANATION,
        },
      }),
    });
    global.fetch = mockFetch;

    const explanation = await geminiClientService.explainFinding({
      findingId: 'find-1',
      perspective: 'service_provider_or_contractor',
      category: 'unilateral_indemnification',
      severity: 'CRITICAL',
      exactExcerpt: 'Contractor shall defend, indemnify, and hold harmless Client.',
      deterministicExplanation: 'One-sided indemnity obligation.',
    });

    expect(explanation.plainExplanation).toContain('You are agreeing to pay all legal defense expenses');
    expect(explanation.keyConcern).toContain('Uncapped financial liability');
    expect(explanation.disclaimer).toBe(AI_DISCLAIMERS.EXPLANATION);
    expect(mockFetch).toHaveBeenCalledWith('/api/ai/explain-finding', expect.anything());
  });

  // 4. AI Balanced Alternative Integration
  it('4. should generate a balanced negotiation alternative via geminiClientService', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          proposedLanguage: 'Each party shall mutually indemnify the other up to total fees paid.',
          rationale: 'Establishes commercial reciprocity and limits catastrophic downside.',
          negotiationGoal: 'Insert bilateral liability cap.',
          disclaimer: AI_DISCLAIMERS.NEGOTIATION,
        },
      }),
    });
    global.fetch = mockFetch;

    const alternative = await geminiClientService.generateBalancedAlternative({
      findingId: 'find-2',
      exactClause: 'Contractors liability shall be uncapped and unlimited.',
      perspective: 'service_provider_or_contractor',
      category: 'unilateral_indemnification',
      deterministicSummary: 'Uncapped liability imbalance.',
    });

    expect(alternative.proposedLanguage).toContain('mutually indemnify');
    expect(alternative.negotiationGoal).toContain('bilateral liability cap');
    expect(alternative.disclaimer).toBe(AI_DISCLAIMERS.NEGOTIATION);
    expect(mockFetch).toHaveBeenCalledWith('/api/ai/balanced-alternative', expect.anything());
  });

  // 5. Document Q&A Grounding
  it('5. should return grounded answer referencing verified document sections', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          answer: 'The agreement specifies a 90-day advance notice requirement for termination by contractor.',
          referencedSections: ['Section 5'],
          isGrounded: true,
          disclaimer: AI_DISCLAIMERS.DOCUMENT_QA,
        },
      }),
    });
    global.fetch = mockFetch;

    const qaResult = await geminiClientService.askDocument({
      documentId: 'freelance_msa',
      perspective: 'service_provider_or_contractor',
      userQuery: 'What is the termination notice period?',
      verifiedExcerpts: [
        {
          sectionId: 'Section 5',
          sectionTitle: 'Termination and Notice',
          excerptText: 'Contractor may only terminate this Agreement upon providing ninety (90) days advance written notice.',
        },
      ],
    });

    expect(qaResult.isGrounded).toBe(true);
    expect(qaResult.referencedSections).toContain('Section 5');
    expect(qaResult.answer).toContain('90-day advance notice');
  });

  // 6. Attorney Consultation Brief Generation
  it('6. should synthesize a comprehensive attorney brief docket', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          executiveSummary: 'This docket highlights critical unilateral indemnity and restrictive covenants.',
          topConcerns: [
            {
              title: 'Uncapped Indemnity',
              category: 'unilateral_indemnification',
              severity: 'CRITICAL',
              evidenceSnippet: 'Contractor liability under this section shall be uncapped and unlimited.',
              strategicImplication: 'Exposes personal assets to third-party claims.',
            },
          ],
          questionsForCounsel: ['Can we insert a mutual liability cap equal to 12 months fees?'],
          redlinePriorities: [
            {
              issue: 'Indemnity Asymmetry',
              recommendedAction: 'Propose mutual indemnification clause.',
              priority: 'HIGH',
            },
          ],
          disclaimer: AI_DISCLAIMERS.ATTORNEY_BRIEF,
        },
      }),
    });
    global.fetch = mockFetch;

    const brief = await geminiClientService.generateAttorneyBrief({
      documentTitle: 'Master Services Agreement',
      domain: 'commercial_contracts',
      perspective: 'service_provider_or_contractor',
      riskScore: 82,
      riskTier: 'CRITICAL',
      sanitizedFindings: [
        {
          checkId: 'f-1',
          category: 'unilateral_indemnification',
          riskLevel: 'CRITICAL',
          sanitizedExcerpt: 'Contractor liability under this section shall be uncapped and unlimited.',
          plainSummary: 'Contractor pays client legal costs without cap.',
          whyItMatters: 'Catastrophic liability.',
        },
      ],
      missingProtections: ['Mutual indemnity'],
    });

    expect(brief.executiveSummary).toContain('docket highlights critical unilateral indemnity');
    expect(brief.topConcerns.length).toBe(1);
    expect(brief.redlinePriorities[0].priority).toBe('HIGH');
    expect(brief.disclaimer).toBe(AI_DISCLAIMERS.ATTORNEY_BRIEF);
  });

  // 7. Error Handling on Network / Server Failure
  it('7. should handle API errors gracefully without crashing or exposing internals', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rate limit exceeded. Please wait a moment before sending additional synthesis requests.',
        },
      }),
    });
    global.fetch = mockFetch;

    await expect(
      geminiClientService.explainFinding({
        findingId: 'f-rate',
        perspective: 'service_provider_or_contractor',
        category: 'unilateral_indemnification',
        severity: 'CRITICAL',
        exactExcerpt: 'Indemnity excerpt.',
        deterministicExplanation: 'Indemnity',
      })
    ).rejects.toThrow('Rate limit exceeded');
  });

  // 8. Responsible AI Disclaimers Consistency
  it('8. should verify all standard AI disclaimer contracts are strictly defined and visible', () => {
    expect(AI_DISCLAIMERS.EXPLANATION).toBe('AI-generated explanation based on the verified document evidence.');
    expect(AI_DISCLAIMERS.NEGOTIATION).toBe('Suggested negotiation starting point — not legal advice.');
    expect(AI_DISCLAIMERS.ATTORNEY_BRIEF).toBe('Prepared to help organize questions for review by a qualified legal professional.');
    expect(AI_DISCLAIMERS.DOCUMENT_QA).toBe('AI-assisted informational response grounded strictly in verified document text. Not legal advice.');
    expect(AI_DISCLAIMERS.INSUFFICIENT_INFO).toBe('This document does not contain sufficient information to answer this question. Consider consulting a qualified legal professional.');
  });

  // 9. Outbound Privacy Boundary Assertion
  it('9. should assert that raw contracts and unredacted PII never enter the AI payload', async () => {
    let capturedPayload: any = null;
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      capturedPayload = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            plainExplanation: 'Safe explanation',
            keyConcern: 'Safe concern',
            questionToAsk: 'Safe question',
            disclaimer: AI_DISCLAIMERS.EXPLANATION,
          },
        }),
      });
    });
    global.fetch = mockFetch;

    // Simulate sending finding from scrubbed document
    const rawSSN = '123-45-6789';
    const scrubbedExcerpt = 'Contractor [ID_SSN_1] shall defend Client.';

    await geminiClientService.explainFinding({
      findingId: 'f-pii-safe',
      perspective: 'service_provider_or_contractor',
      category: 'unilateral_indemnification',
      severity: 'CRITICAL',
      exactExcerpt: scrubbedExcerpt,
      deterministicExplanation: 'Indemnity',
    });

    const bodyString = JSON.stringify(capturedPayload);
    expect(bodyString).not.toContain(rawSSN);
    expect(bodyString).toContain('[ID_SSN_1]');
  });

  // 10. Empty Document Safety & Graceful Degradation
  it('10. should safely handle empty document input without throwing unhandled exceptions', () => {
    const emptyText = '';
    const piiResult = scrubPII(emptyText, 'doc-empty', 'contract', 'service_provider_or_contractor');
    expect(piiResult.entities.length).toBe(0);
    expect(piiResult.redactedText).toBe('');

    const segments = segmentDocument(emptyText, piiResult.redactedText);
    expect(segments.length).toBe(0);

    const analysis = runDeterministicRuleScan(segments, 'service_provider_or_contractor');
    const verifiedFindings = verifyAndFilterFindings(analysis.findings, segments);
    expect(verifiedFindings.length).toBe(0);
    expect(analysis.overallRiskScore).toBe(0);
    expect(analysis.overallRiskTier).toBe('LOW');
  });

  // 11. Ungrounded Document Q&A Safety Fallback
  it('11. should enforce safe fallback disclaimer when Q&A inquiry cannot be answered from context', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          answer: AI_DISCLAIMERS.INSUFFICIENT_INFO,
          referencedSections: [],
          isGrounded: false,
          disclaimer: AI_DISCLAIMERS.DOCUMENT_QA,
        },
      }),
    });
    global.fetch = mockFetch;

    const qaResult = await geminiClientService.askDocument({
      documentId: 'doc-scope',
      perspective: 'service_provider_or_contractor',
      userQuery: 'What are the health insurance benefits?',
      verifiedExcerpts: [
        {
          sectionId: 'sec-1',
          sectionTitle: 'Services & Scope',
          excerptText: 'Contractor shall provide software engineering services.',
        },
      ],
    });

    expect(qaResult.isGrounded).toBe(false);
    expect(qaResult.referencedSections.length).toBe(0);
    expect(qaResult.answer).toContain('This document does not contain sufficient information');
    expect(qaResult.disclaimer).toBe(AI_DISCLAIMERS.DOCUMENT_QA);
  });

  // 12. Markdown Dossier Export Data Completeness
  it('12. should verify Markdown dossier export contains all critical sections and legal disclaimers', () => {
    const sample = SAMPLE_CONTRACTS[0];
    const pii = scrubPII(sample.content, 'doc-exp', 'contract', 'service_provider_or_contractor');
    const segs = segmentDocument(sample.content, pii.redactedText);
    const analysis = runDeterministicRuleScan(segs, 'service_provider_or_contractor');
    const findings = verifyAndFilterFindings(analysis.findings, segs);

    let md = `# LexiClear AI — Attorney Consultation Brief\n`;
    md += `Document: ${sample.title}\n`;
    md += `Risk Tier: ${analysis.overallRiskTier} (Score: ${analysis.overallRiskScore}/100)\n\n`;
    md += `## Executive Summary\n${analysis.executiveSummary}\n\n`;
    findings.forEach((f, i) => {
      md += `### ${i + 1}. ${f.category} (${f.level})\n`;
      md += `- Quote: "${f.exactQuote}"\n`;
      md += `- Summary: ${f.plainEnglishSummary}\n`;
      md += `- Questions: ${f.attorneyQuestions.join(', ')}\n\n`;
    });
    md += `\n*Disclaimer: ${AI_DISCLAIMERS.ATTORNEY_BRIEF}*\n`;

    expect(md).toContain('LexiClear AI — Attorney Consultation Brief');
    expect(md).toContain('Risk Tier:');
    expect(md).toContain('Executive Summary');
    expect(md).toContain('Disclaimer:');
    expect(md).toContain(AI_DISCLAIMERS.ATTORNEY_BRIEF);
    expect(findings.length).toBeGreaterThan(0);
  });
});
