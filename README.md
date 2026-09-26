# LexiClear AI — Legal Document Intelligence & Access Studio

> **Theme**: AI for Legal Assistance & Access  
> **Mission**: Empower non-lawyers, freelancers, tenants, and small business owners to understand, compare, and navigate complex contracts with confidence, while strictly upholding responsible AI boundaries and preserving data privacy.

---

## 1. Problem Statement Alignment

Legal documents are frequently dense, one-sided, and inaccessible to everyday individuals. When signing master services agreements, residential leases, or commercial non-disclosure agreements, users routinely face asymmetric liability, broad indemnification obligations, overreaching intellectual property assignments, and restrictive covenants without understanding the legal consequences.

**LexiClear AI** provides an interactive, self-help document navigation studio that:
1. **Simplifies Complex Legal Documents**: Delivers plain-English explanations of opaque clauses.
2. **Highlights Important Risks & Obligations**: Scans contracts deterministically across 6 core risk domains to flag liabilities, notice windows, and asymmetric covenants.
3. **Proposes Balanced Alternatives**: Formulates bilateral, commercially reasonable counter-proposals as negotiation starting points.
4. **Compares Contract Revisions (Redline Engine)**: 100% deterministic side-by-side revision differ categorizing clauses into Added, Removed, Changed, and Unchanged, computing quantitative risk deltas and eliminated hazard findings with zero external API calls.
5. **Generates Strategic Negotiation Trade-off Matrices**: Prioritizes contract terms into Must-Have Walk-Aways, Moderate Compromises, and Standard Accept terms for empowered negotiation.
6. **Answers Document-Grounded Questions**: Provides bounded legal document Q&A grounded strictly in verified source text offsets.
7. **Prepares Users for Legal Counsel**: Synthesizes a structured Attorney Consultation Brief with executive summaries, prioritized concerns, trade-off matrices, and specific questions for counsel.
8. **Maintains Clear Self-Help Boundaries**: Features persistent statutory disclaimers communicating that LexiClear AI provides informational self-help assistance, **not** legal representation or formal legal advice.

---

## 2. Architecture & Provenance Boundaries

LexiClear AI enforces a strict three-tier provenance model to ensure that generative models never hallucinate legal facts:

```
┌────────────────────────────────────────────────────────┐
│                   FACT / SOURCE TIER                   │
│  - Raw document parsed locally in browser              │
│  - Structural clause segmentation & offset tracking    │
│  - Verbatim substring indexing                         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              DETERMINISTIC ANALYSIS TIER               │
│  - 100% Client-Side Rule Pattern Engine                │
│  - Asymmetry & Missing Safeguard Detection             │
│  - Verbatim Substring Quote Verification               │
│  - Client-Side PII Tokenization & Redaction            │
│  - Deterministic Jaccard Clause Revision Differ        │
│  - Quantitative Risk Delta & Tier Transition Math      │
│  - Negotiation Trade-off Priority Triaging             │
└───────────────────────────┬────────────────────────────┘
                            │ (Only sanitized excerpts transmitted)
┌───────────────────────────▼────────────────────────────┐
│             GEMINI SEMANTIC SYNTHESIS TIER             │
│  - Express server-side proxy (/api/ai/*)               │
│  - Official @google/genai TypeScript SDK               │
│  - GEMINI_API_KEY isolated to server runtime           │
│  - Strict Zod schema parsing on inputs & outputs       │
│  - Canonical SHA-256 caching & request coalescing      │
│  - Anti-jailbreak & prompt injection guardrails        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Privacy & Zero-Knowledge Client-Side PII Shield

To protect user confidentiality, LexiClear AI ensures that **raw contracts never reach the network or external AI models**:
- **Client-Side Redaction**: Detects and redacts direct personal identifiers locally in memory:
  - Social Security Numbers (`[ID_SSN_1]`)
  - Email addresses (`[EMAIL_1]`)
  - Phone numbers (`[TEL_1]`)
  - Aadhaar numbers (`[ID_AADHAAR_1]`)
  - Permanent Account Numbers (`[ID_PAN_1]`)
  - Bank account numbers (`[BANK_ACCT_1]`)
  - Physical street addresses & financial figures (`[AMOUNT_1]`)
- **Pre-Flight Outbound Audit**: Server middleware rejects any request containing unredacted PII patterns with HTTP 400.
- **Redaction Map Retention**: The original entity mappings remain exclusively in browser session memory for optional local rehydration.

---

## 4. Contract Revision Diff & Redline Engine

The **Contract Version Diff** engine (`src/engine/contractDiffer.ts`) provides a deterministic, zero-latency revision analysis tool:
- **Structural Clause Alignment**: Pairs clauses between original and revised contracts using token-level Jaccard similarity index.
- **Modification Categorization**:
  - `UNCHANGED`: Retained exact or near-exact phrasing.
  - `CHANGED`: Substantially modified clause language requiring review.
  - `ADDED`: Newly introduced clauses not present in original draft.
  - `REMOVED`: Deleted clauses, highlighting potential loss of protections.
- **Quantitative Risk Delta**:
  - Automatically calculates net risk score impact (`scoreDelta`, e.g., `-38 pts`).
  - Displays risk tier transitions (e.g., `CRITICAL ➔ MODERATE`).
  - Flags eliminated hazard findings that were successfully resolved in the counter-proposal.
  - Identifies newly introduced risks in added clauses.
- **1-Click Counter-Proposal Preset**: Includes pre-loaded balanced counter-offers for instant side-by-side evaluation alongside manual custom revision input.

---

## 5. Strategic Negotiation Trade-off Matrix

Embedded directly into the **Attorney Consultation Brief** and docket export (`src/components/docket/AttorneyBriefPanel.tsx`):

| Negotiation Tier | Strategic Objective | Typical Provisions |
| :--- | :--- | :--- |
| **High Leverage / Must-Have** | Non-negotiable walk-away positions to eliminate catastrophic liability | Uncapped indemnification, unilateral liability, non-compete clauses, total IP assignment |
| **Moderate Compromise** | Reasonable concessions and trade-off points during discussions | Payment payment terms (Net-45 vs Net-30), cure notice windows (15 vs 30 days), governing law |
| **Standard Accept** | Commercially standard boilerplate accepted without expenditure of negotiation capital | Severability, counterpart execution, standard electronic notices, force majeure definition |

Exports seamlessly into formatted Markdown dossiers ready to hand to legal counsel.

---

## 6. Deterministic Legal Knowledge Catalog & Market Benchmarks

The deterministic analysis engine inspects documents across 6 high-stakes commercial categories with market standard benchmarks:

| Category | Typical Trap Identified | Market Benchmark | Balanced Alternative Proposed |
| :--- | :--- | :--- | :--- |
| **Liability & Indemnification** | Unilateral defense burdens, uncapped liability | Mutual liability capped at 12 months fees paid | Mutual indemnification with 12-month fee cap |
| **Intellectual Property** | Work-for-hire overreach, loss of pre-existing tools | Client owns deliverables; vendor retains pre-existing tools | Background technology carve-out & payment triggers |
| **Termination & Notice** | Immediate termination without cause, 90-day locks | 30 days written notice with 14-30 day cure period | Mutual 30-day notice with 14-day cure window |
| **Dispute Resolution** | Mandatory arbitration, jury waiver, distant venue | Mutual venue in shared location or mutual home state | Small claims carve-out, home state venue |
| **Payment & Withholding** | Subjective satisfaction clauses, Net-90 terms | Net-30 days with explicit invoice dispute mechanism | Objective acceptance criteria, Net-30 terms |
| **Restrictive Covenants** | Post-termination non-competes, broad non-solicits | Direct-client solicitation ban only; zero non-compete | Narrow direct-client non-solicitation only |

---

## 7. Gemini API Semantic Endpoints

All AI operations run as server-side proxy routes via the official `@google/genai` SDK:

1. **`POST /api/ai/explain-finding`**:
   - Synthesizes plain-English explanations, core strategic concerns, and targeted negotiation questions based on deterministic findings.
2. **`POST /api/ai/balanced-alternative`**:
   - Generates reciprocal counter-proposals with commercial rationale and strategic goals.
3. **`POST /api/ai/ask-document`**:
   - Answers specific user questions grounded strictly in verified document section excerpts. Rejects out-of-context queries with an insufficient-information disclaimer.
4. **`POST /api/ai/attorney-brief`**:
   - Compiles an executive summary, prioritized risk matrix, trade-off matrix, and consultation agenda for formal legal review.

---

## 8. Performance & Security Hardening

- **Bundle Optimization**: Rolldown-compatible vendor splitting separates React and Lucide icons into standalone chunks, maintaining a lean, ultra-fast initial load.
- **Canonical SHA-256 Hashing**: Recursive JSON key sorting guarantees deterministic cache keys for nested payloads.
- **In-Flight Request Coalescing**: Deduplicates simultaneous identical AI queries, preventing redundant API calls.
- **Pre-Compiled Regular Expressions**: Module-level regex constants eliminate repeated regex re-compilation during clause parsing.
- **Rate Limiting & Security Headers**: Enforces a 60 req/min sliding rate limit, 1MB maximum payload size (HTTP 413), HTTP 405 method guards, and an 8,000ms upstream timeout (HTTP 504).
- **Zero Sensitive Logging**: No prompts, contracts, or API keys are logged to console.

---

## 9. Accessibility (WCAG 2.1 AA Compliant)

- **Skip Navigation**: Accessible top-level skip link enables keyboard users to bypass navigation and jump directly to `#main-content`.
- **Semantic Landmark Structure**: `header`, `nav`, `main`, `section`, `article`, `aside`, and `footer`.
- **WAI-ARIA Tablist Navigation**: Complete `role="tablist"`, `role="tab"`, `aria-selected`, and `role="tabpanel"` semantics with keyboard arrow navigation (`ArrowLeft` / `ArrowRight`).
- **Focus Management**: Focus is automatically directed into active views and restored to triggering buttons on panel dismissal.
- **Keyboard Shortcuts**: Full keyboard access across all 6 studio panels with single-key quick navigation and `Escape` handlers.
- **Reduced Motion Support**: All spinners and transitions respect `prefers-reduced-motion: reduce`.
- **Color Independence & High Contrast**: Risk levels pair distinct iconography and text badges with colors exceeding the 4.5:1 WCAG contrast ratio in both Light and Dark themes.

---

## 10. Verification Results

```text
✓ Vitest Test Suite:      80 passed across 9 test files (0 failures)
✓ TypeScript Compilation: 0 errors (npx tsc --noEmit)
✓ Production Build:       Vite build successful in ~931ms
✓ Applet Compilation:     compile_applet build succeeded
✓ Code Linter:            lint_applet clean (0 lint warnings/errors)
```

---

## 11. Google Cloud Run Deployment & Production Operations

### Environment Variables
| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Server-side Gemini API key for semantic synthesis (never exposed to browser) |
| `PORT` | Optional (default: `3000` or Cloud Run assigned) | Port the Express server listens on (`0.0.0.0`) |
| `NODE_ENV` | Optional (set to `production` in production) | Enables static asset serving and disables dev Vite middleware |

### Production Run Instructions
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the production assets**:
   ```bash
   npm run build
   ```

3. **Start the production server**:
   ```bash
   NODE_ENV=production PORT=8080 npm start
   ```

### Deploying to Google Cloud Run
Deploy directly from source or via Google Cloud CLI:
```bash
gcloud run deploy lexiclear-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets GEMINI_API_KEY=projects/YOUR_PROJECT/secrets/gemini-api-key:latest
```
*Note: In Google Cloud Run, `PORT` is automatically injected by the environment (defaulting to 8080) and the Express server automatically binds to `0.0.0.0:${PORT}`.*
