import React, { useState } from 'react';
import { 
  Shield, AlertOctagon, AlertTriangle, AlertCircle, Sparkles, 
  RefreshCw, Check, Copy, HelpCircle, ArrowRight, MessageSquare, Info, 
  ExternalLink, Scale
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { UserPerspective } from '../../types/document';
import { Finding } from '../../types/analysis';
import { getMarketBenchmarkForCategory } from '../../engine/marketBenchmarks';
import { geminiClientService } from '../../services/geminiClientService';
import { 
  ExplainFindingResponse, 
  BalancedAlternativeResponse,
  AI_DISCLAIMERS 
} from '../../schemas/gemini.schemas';

interface ClauseInspectorProps {
  theme: 'light' | 'dark';
  findings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  perspective: UserPerspective;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
}

export const ClauseInspector: React.FC<ClauseInspectorProps> = ({
  theme,
  findings,
  selectedFindingId,
  onSelectFinding,
  perspective,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
}) => {
  const isDark = theme === 'dark';

  // AI Synthesis Local State
  const [aiExplanations, setAiExplanations] = useState<Record<string, ExplainFindingResponse>>({});
  const [aiAlternatives, setAiAlternatives] = useState<Record<string, BalancedAlternativeResponse>>({});
  const [loadingExplanationId, setLoadingExplanationId] = useState<string | null>(null);
  const [loadingAlternativeId, setLoadingAlternativeId] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [alternativeError, setAlternativeError] = useState<string | null>(null);
  const [copiedRedlineId, setCopiedRedlineId] = useState<string | null>(null);

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesQuery = !searchQuery || 
      f.plainEnglishSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.exactQuote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const activeFinding = findings.find((f) => f.id === selectedFindingId) || filteredFindings[0] || findings[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRedlineId(id);
    setTimeout(() => setCopiedRedlineId(null), 2500);
  };

  const handleSynthesizeExplanation = async (finding: Finding) => {
    if (!finding) return;
    setLoadingExplanationId(finding.id);
    setExplanationError(null);

    try {
      const response = await geminiClientService.explainFinding({
        findingId: finding.id,
        perspective,
        category: finding.category,
        severity: finding.riskLevel || finding.level || 'LOW',
        exactExcerpt: finding.exactQuote,
        deterministicExplanation: finding.plainEnglishSummary,
      });
      setAiExplanations((prev) => ({ ...prev, [finding.id]: response }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to synthesize explanation.';
      setExplanationError(message);
    } finally {
      setLoadingExplanationId(null);
    }
  };

  const handleGenerateAlternative = async (finding: Finding) => {
    if (!finding) return;
    setLoadingAlternativeId(finding.id);
    setAlternativeError(null);

    try {
      const response = await geminiClientService.generateBalancedAlternative({
        findingId: finding.id,
        exactClause: finding.exactQuote,
        perspective,
        category: finding.category,
        deterministicSummary: finding.plainEnglishSummary,
      });
      setAiAlternatives((prev) => ({ ...prev, [finding.id]: response }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate balanced alternative.';
      setAlternativeError(message);
    } finally {
      setLoadingAlternativeId(null);
    }
  };

  const currentExplanation = activeFinding ? aiExplanations[activeFinding.id] : null;
  const currentAlternative = activeFinding ? aiAlternatives[activeFinding.id] : null;

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Controls */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex-1 max-w-md">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flagged clauses or keywords..."
            className={`w-full rounded-lg px-3 py-1.5 text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
            aria-label="Filter flagged clauses"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="cat-filter-select" className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Category:
          </label>
          <select
            id="cat-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`rounded-lg px-3 py-1.5 text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="all">All Categories ({findings.length})</option>
            <option value="unilateral_indemnification">Indemnification & Liability</option>
            <option value="ip_ownership_overreach">Intellectual Property</option>
            <option value="restrictive_covenants_noncompete">Non-Compete & Restrictive</option>
            <option value="termination_and_cure_penalties">Termination & Notice</option>
            <option value="mandatory_arbitration_and_venue">Arbitration & Venue</option>
            <option value="payment_and_withholding_traps">Payment & Withholding</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Sidebar list + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left List of Flagged Findings (4 cols) */}
        <div className={`lg:col-span-4 rounded-xl p-4 space-y-2 h-[760px] flex flex-col border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
              Flagged Provisions
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {filteredFindings.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1" role="list" aria-label="Flagged clauses list">
            {filteredFindings.map((finding) => (
              <button
                key={finding.id}
                role="listitem"
                onClick={() => onSelectFinding(finding.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeFinding?.id === finding.id
                    ? (isDark 
                        ? 'border-emerald-500 bg-slate-800 shadow-sm ring-1 ring-emerald-500/20' 
                        : 'border-emerald-700 bg-emerald-50 text-slate-950 shadow-2xs ring-1 ring-emerald-700/20')
                    : (isDark 
                        ? 'border-slate-800 hover:bg-slate-800/50 text-slate-300' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800')
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {finding.category.replace(/_/g, ' ')}
                  </span>
                  <RiskBadge level={finding.riskLevel || finding.level || 'LOW'} showIcon={false} className="text-[9px] py-0 px-1" />
                </div>
                <p className={`text-xs font-medium line-clamp-2 ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}>
                  {finding.plainEnglishSummary}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Detail Inspector (8 cols) */}
        <div className={`lg:col-span-8 rounded-xl p-6 space-y-6 border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {activeFinding ? (
            <>
              {/* Finding Title & Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge level={activeFinding.riskLevel || activeFinding.level || 'LOW'} />
                    <span className={`text-xs font-mono uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Section: {activeFinding.clauseId} • {activeFinding.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {activeFinding.plainEnglishSummary}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSynthesizeExplanation(activeFinding)}
                    disabled={loadingExplanationId === activeFinding.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-900/40' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    {loadingExplanationId === activeFinding.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>Explain in Plain English</span>
                  </button>

                  <button
                    onClick={() => handleGenerateAlternative(activeFinding)}
                    disabled={loadingAlternativeId === activeFinding.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isDark 
                        ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800' 
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {loadingAlternativeId === activeFinding.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <Scale className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>Generate Balanced Redline</span>
                  </button>
                </div>
              </div>

              {/* Error Banners if AI calls fail */}
              {explanationError && (
                <div role="alert" className="p-3 rounded-lg text-xs bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                  <strong>Explanation Error:</strong> {explanationError}
                </div>
              )}
              {alternativeError && (
                <div role="alert" className="p-3 rounded-lg text-xs bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                  <strong>Alternative Error:</strong> {alternativeError}
                </div>
              )}

              {/* Side-by-Side: Verified Original Excerpt vs Balanced Redline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left Card: Verified Document Fact (Original Clause) */}
                <div className={`rounded-xl p-4 space-y-2.5 border ${
                  isDark ? 'bg-rose-950/10 border-rose-900/40' : 'bg-rose-50/70 border-rose-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-rose-400' : 'text-rose-900'
                      }`}>
                        Verified Document Fact
                      </span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80 uppercase text-rose-600">
                      Asymmetric
                    </span>
                  </div>

                  <blockquote className={`font-mono text-xs leading-relaxed p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-slate-950 text-rose-200/90 border-rose-900/30' 
                      : 'bg-white text-rose-950 border-rose-200 shadow-2xs'
                  }`}>
                    "{activeFinding.exactQuote}"
                  </blockquote>

                  <div className={`text-xs pt-1 ${isDark ? 'text-rose-300/90' : 'text-rose-950'}`}>
                    <strong>Deterministic Risk:</strong> {activeFinding.strategicRisk}
                  </div>
                </div>

                {/* Right Card: Balanced Negotiation Counter-Proposal */}
                <div className={`rounded-xl p-4 space-y-2.5 border ${
                  isDark ? 'bg-emerald-950/10 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-emerald-400' : 'text-emerald-900'
                    }`}>
                      {currentAlternative ? 'AI Balanced Alternative' : 'Standard Mutual Alternative'}
                    </span>

                    <button
                      onClick={() => handleCopy(
                        activeFinding.id, 
                        currentAlternative ? currentAlternative.proposedLanguage : activeFinding.suggestedBalancedRevision
                      )}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                        isDark 
                          ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60' 
                          : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                      }`}
                    >
                      {copiedRedlineId === activeFinding.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Redline</span>
                        </>
                      )}
                    </button>
                  </div>

                  <blockquote className={`font-mono text-xs leading-relaxed p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-slate-950 text-emerald-200/90 border-emerald-900/30' 
                      : 'bg-white text-emerald-950 border-emerald-200 shadow-2xs'
                  }`}>
                    {currentAlternative ? currentAlternative.proposedLanguage : activeFinding.suggestedBalancedRevision}
                  </blockquote>

                  {currentAlternative ? (
                    <div className="space-y-1 pt-1 text-xs">
                      <div className={isDark ? 'text-emerald-300' : 'text-emerald-950'}>
                        <strong>Commercial Rationale:</strong> {currentAlternative.rationale}
                      </div>
                      <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        <strong>Negotiation Goal:</strong> {currentAlternative.negotiationGoal}
                      </div>
                      <div className="text-[10px] text-slate-500 italic pt-1">
                        {currentAlternative.disclaimer}
                      </div>
                    </div>
                  ) : (
                    <div className={`text-xs pt-1 ${isDark ? 'text-emerald-300/80' : 'text-emerald-950'}`}>
                      <strong>Standard Practice:</strong> Balances mutual protection while maintaining commercially reasonable terms.
                      <div className="text-[10px] text-slate-500 italic pt-1">
                        {AI_DISCLAIMERS.NEGOTIATION}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* AI Plain-English Synthesis Panel (Feature #1) */}
              {currentExplanation && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-950 border-emerald-900/50' : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Plain-English Synthesis</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">Grounded Semantic Synthesis</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>Plain Explanation: </strong>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>{currentExplanation.plainExplanation}</span>
                    </div>
                    <div>
                      <strong className="text-amber-700 dark:text-amber-400">Key Concern: </strong>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>{currentExplanation.keyConcern}</span>
                    </div>
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-400">Target Question to Ask: </strong>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>{currentExplanation.questionToAsk}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 italic border-t pt-2 border-slate-200 dark:border-slate-800">
                    {currentExplanation.disclaimer}
                  </div>
                </div>
              )}

              {/* Market Benchmark & Policy Comparison (Problem Statement Alignment) */}
              {(() => {
                const benchmark = getMarketBenchmarkForCategory(activeFinding.category);
                return (
                  <div className={`rounded-xl p-4 space-y-3 border ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-900'
                      }`}>
                        <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Market Standard & Policy Benchmark</span>
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        benchmark.estimatedAsymmetryPercent >= 80 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {benchmark.estimatedAsymmetryPercent}% Asymmetry Variance
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className={`p-3 rounded-lg border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                          Standard Market Norm:
                        </span>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                          {benchmark.marketStandardNorm}
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <span className="font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                          Current Draft Variance:
                        </span>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                          {benchmark.typicalVariance}
                        </p>
                      </div>
                    </div>

                    {/* Actionable Next Steps & Options */}
                    <div className="pt-1 space-y-1.5">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Negotiation Options & Recommended Next Steps:
                      </span>
                      <ul className="space-y-1">
                        {benchmark.keyOptionsAndNextSteps.map((opt, oIdx) => (
                          <li key={oIdx} className={`text-xs flex items-start gap-1.5 ${
                            isDark ? 'text-slate-300' : 'text-slate-800'
                          }`}>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">›</span>
                            <span>{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}

              {/* Suggested Questions for Legal Counsel */}
              <div className={`rounded-xl p-4 space-y-3 border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-900'
                }`}>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Questions to Present to Legal Counsel</span>
                </h4>
                <ul className="space-y-2">
                  {activeFinding.attorneyQuestions.map((q: string, idx: number) => (
                    <li key={idx} className={`flex items-start gap-2.5 text-xs p-2.5 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-900 border-slate-800 text-slate-300' 
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                    }`}>
                      <span className={`font-mono font-bold shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        0{idx + 1}.
                      </span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className={`text-center py-20 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Select a clause from the left list to review its side-by-side comparison and AI synthesis.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
