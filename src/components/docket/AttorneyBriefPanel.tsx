import React, { useState, useMemo } from 'react';
import { 
  Printer, Download, Sparkles, RefreshCw, AlertOctagon, 
  HelpCircle, CheckSquare, Shield, FileText, Info,
  Scale, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { AnalysisResult, RiskLevel } from '../../types/analysis';
import { UserPerspective } from '../../types/document';
import { geminiClientService } from '../../services/geminiClientService';
import { AttorneyBriefResponse, AI_DISCLAIMERS } from '../../schemas/gemini.schemas';

interface AttorneyBriefPanelProps {
  theme: 'light' | 'dark';
  documentTitle: string;
  analysisResult: AnalysisResult;
  perspective: UserPerspective;
}

export const AttorneyBriefPanel: React.FC<AttorneyBriefPanelProps> = ({
  theme,
  documentTitle,
  analysisResult,
  perspective,
}) => {
  const isDark = theme === 'dark';

  const [aiBrief, setAiBrief] = useState<AttorneyBriefResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Negotiation Trade-off Matrix populated from existing deterministic findings/risk data
  const tradeOffMatrix = useMemo(() => {
    const mustHave = analysisResult.findings.filter(
      (f) => (f.riskLevel || f.level) === 'CRITICAL' || (f.riskLevel || f.level) === 'HIGH'
    );
    const moderate = analysisResult.findings.filter(
      (f) => (f.riskLevel || f.level) === 'MODERATE'
    );
    const standard = analysisResult.findings.filter(
      (f) => (f.riskLevel || f.level) === 'LOW'
    );

    return {
      mustHave: mustHave.length > 0 ? mustHave.map(f => ({
        category: f.category.replace(/_/g, ' ').toUpperCase(),
        issue: f.plainEnglishSummary,
        clauseId: f.clauseId,
        strategy: f.suggestedBalancedRevision || 'Require bilateral reciprocal terms or strike out provision.',
        stance: 'Non-Negotiable Walk-Away',
      })) : [
        {
          category: 'LIABILITY & INDEMNITY',
          issue: 'Enforce bilateral indemnity and reciprocal liability cap.',
          clauseId: 'General',
          strategy: 'Require mutual indemnity and limit monetary damages to annual contract value.',
          stance: 'Non-Negotiable Walk-Away',
        }
      ],
      moderate: moderate.length > 0 ? moderate.map(f => ({
        category: f.category.replace(/_/g, ' ').toUpperCase(),
        issue: f.plainEnglishSummary,
        clauseId: f.clauseId,
        strategy: f.suggestedBalancedRevision || 'Propose reasonable cure window (14-30 days) and standard notice mechanisms.',
        stance: 'Trade-Off & Compromise',
      })) : [
        {
          category: 'PAYMENT & NOTICE TERMS',
          issue: 'Adjust payment milestone approval windows and notice cure mechanisms.',
          clauseId: 'General',
          strategy: 'Propose standard Net-30 payment and 14-day notice to cure before default.',
          stance: 'Trade-Off & Compromise',
        }
      ],
      standard: standard.length > 0 ? standard.map(f => ({
        category: f.category.replace(/_/g, ' ').toUpperCase(),
        issue: f.plainEnglishSummary,
        clauseId: f.clauseId,
        strategy: 'Accept standard commercial language without expenditure of negotiation capital.',
        stance: 'Standard Commercial Accept',
      })) : [
        {
          category: 'STANDARD BOILERPLATE',
          issue: 'Severability, integration, and electronic delivery clauses.',
          clauseId: 'General',
          strategy: 'Accept standard market terms as customary practice.',
          stance: 'Standard Commercial Accept',
        }
      ],
    };
  }, [analysisResult.findings]);

  const handleSynthesizeBrief = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sanitizedFindings = analysisResult.findings.map((f) => ({
        checkId: f.id,
        category: f.category,
        riskLevel: f.riskLevel || f.level || 'LOW',
        sanitizedExcerpt: f.exactQuote,
        plainSummary: f.plainEnglishSummary,
        whyItMatters: f.strategicRisk,
      }));

      const response = await geminiClientService.generateAttorneyBrief({
        documentTitle,
        domain: 'commercial_contracts',
        perspective,
        riskScore: analysisResult.overallRiskScore,
        riskTier: analysisResult.overallRiskTier,
        sanitizedFindings,
        missingProtections: analysisResult.missingStandardProtections,
      });

      setAiBrief(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to synthesize attorney consultation brief.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    let md = `# LexiClear AI — Attorney Consultation Brief\nGenerated: ${new Date().toLocaleDateString()}\nDocument: ${documentTitle}\nClient Perspective: ${perspective}\nRisk Tier: ${analysisResult.overallRiskTier} (Score: ${analysisResult.overallRiskScore}/100)\n\n`;

    const matrixMd = `## Negotiation Trade-off Matrix\n\n` +
      `### 1. High Leverage / Must-Have (Non-Negotiable Walk-Aways)\n` +
      tradeOffMatrix.mustHave.map(m => `- **${m.category}** (Sec: ${m.clauseId}): ${m.issue}\n  * *Required Stance:* ${m.strategy}\n`).join('') +
      `\n### 2. Moderate Compromise (Strategic Trade-off Opportunities)\n` +
      tradeOffMatrix.moderate.map(m => `- **${m.category}** (Sec: ${m.clauseId}): ${m.issue}\n  * *Target Compromise:* ${m.strategy}\n`).join('') +
      `\n### 3. Standard Accept (Commercially Acceptable Terms)\n` +
      tradeOffMatrix.standard.map(m => `- **${m.category}** (Sec: ${m.clauseId}): ${m.issue}\n  * *Acceptance Term:* ${m.strategy}\n`).join('') +
      `\n`;

    if (aiBrief) {
      md += `## Executive Summary\n${aiBrief.executiveSummary}\n\n`;
      md += `## Top Strategic Concerns\n`;
      aiBrief.topConcerns.forEach((c, idx) => {
        md += `### ${idx + 1}. ${c.title} [${c.severity}]\n`;
        md += `- **Category:** ${c.category}\n`;
        md += `- **Evidence Excerpt:** "${c.evidenceSnippet}"\n`;
        md += `- **Strategic Implication:** ${c.strategicImplication}\n\n`;
      });
      md += `## Questions for Legal Counsel\n`;
      aiBrief.questionsForCounsel.forEach((q, idx) => {
        md += `${idx + 1}. ${q}\n`;
      });
      md += `\n## Recommended Redline Priorities\n`;
      aiBrief.redlinePriorities.forEach((r, idx) => {
        md += `### ${idx + 1}. ${r.issue} [Priority: ${r.priority}]\n`;
        md += `- **Recommended Action:** ${r.recommendedAction}\n\n`;
      });

      md += matrixMd;

      md += `## Pre-Consultation Action Checklist\n`;
      md += `- [ ] 1. Confirm governing law and state statutory restrictions for non-compete/arbitration.\n`;
      md += `- [ ] 2. Submit mutual indemnity and reciprocal liability cap redlines as non-negotiable walk-aways.\n`;
      md += `- [ ] 3. Present the listed strategic questions directly to reviewing counsel.\n`;
      md += `- [ ] 4. Retain all exhibit and schedule disclosures in writing before signing.\n\n`;

      md += `\n---\n*Disclaimer: ${aiBrief.disclaimer}*\n`;
    } else {
      md += `## I. Executive Summary\n${analysisResult.executiveSummary}\n\n`;
      md += `## II. High-Priority Redlines & Attorney Inquiries\n`;
      analysisResult.findings.forEach((f, i) => {
        md += `### 0${i + 1}. ${f.category.replace(/_/g, ' ').toUpperCase()} (${f.riskLevel || f.level || 'LOW'})\n`;
        md += `- **Original Excerpt:** "${f.exactQuote}"\n`;
        md += `- **Plain English:** ${f.plainEnglishSummary}\n`;
        md += `- **Strategic Risk:** ${f.strategicRisk}\n`;
        md += `- **Proposed Balanced Revision:** ${f.suggestedBalancedRevision}\n`;
        md += `- **Questions for Counsel:**\n${f.attorneyQuestions.map(q => `  * ${q}`).join('\n')}\n\n`;
      });

      md += matrixMd;

      md += `## III. Pre-Consultation Action Checklist\n`;
      md += `- [ ] 1. Confirm governing law and state statutory restrictions for non-compete/arbitration.\n`;
      md += `- [ ] 2. Submit mutual indemnity and reciprocal liability cap redlines as non-negotiable walk-aways.\n`;
      md += `- [ ] 3. Present the listed strategic questions directly to reviewing counsel.\n`;
      md += `- [ ] 4. Retain all exhibit and schedule disclosures in writing before signing.\n\n`;

      md += `\n---\n*Disclaimer: ${AI_DISCLAIMERS.ATTORNEY_BRIEF}*\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LexiClear_Attorney_Docket_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-6">
      <div className={`rounded-xl p-8 space-y-6 border print:bg-white print:text-black print:border-none ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Header & Export Actions */}
        <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-6 print:border-slate-300 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <div className={`text-xs font-mono uppercase tracking-wider font-semibold mb-1 ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              LexiClear AI • Confidential Consultation Pack
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-950'} print:text-black`}>
              Attorney Consultation Brief
            </h2>
            <div className={`flex items-center gap-2 text-xs mt-1 print:text-slate-600 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span>Generated: {new Date().toLocaleDateString()}</span>
              <span aria-hidden="true">·</span>
              <span>Document: {documentTitle}</span>
              <span aria-hidden="true">·</span>
              <span>Risk Tier: {analysisResult.overallRiskTier} ({analysisResult.overallRiskScore}/100)</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={handleSynthesizeBrief}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isDark 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50' 
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Synthesize AI Executive Brief</span>
            </button>

            <button
              onClick={() => window.print()}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-2xs'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Markdown</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-lg text-xs bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Notice to Attorney */}
        <div className={`p-4 rounded-lg text-xs border print:bg-slate-100 print:text-slate-800 print:border-slate-300 ${
          isDark 
            ? 'bg-slate-950 border-slate-800 text-slate-300' 
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}>
          <strong className={isDark ? 'text-white' : 'text-amber-950'}>Notice to Reviewing Attorney:</strong>{' '}
          This brief was compiled using LexiClear AI to highlight asymmetric indemnity, restrictive covenants, and missing safeguards. 
          It is prepared strictly as an agenda for your independent evaluation and formal advice.
        </div>

        {/* Negotiation Trade-off Matrix */}
        <section aria-labelledby="tradeoff-matrix-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 id="tradeoff-matrix-heading" className={`text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-emerald-400' : 'text-emerald-800'
            }`}>
              <Scale className="w-3.5 h-3.5" />
              <span>Negotiation Trade-off Matrix</span>
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Strategic Leverage Positioning
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: High Leverage / Must-Have */}
            <div className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-slate-950 border-rose-900/60' : 'bg-rose-50/50 border-rose-200'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-900/60">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    High Leverage / Must-Have
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                    Walk-Away
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 mb-2.5">
                  Critical asymmetrical hazards requiring firm non-negotiable redlines.
                </p>
                <div className="space-y-2">
                  {tradeOffMatrix.mustHave.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-lg text-xs border ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-rose-100 shadow-2xs'
                    }`}>
                      <div className="font-semibold text-rose-950 dark:text-rose-200 text-[11px] mb-1">
                        {item.category}
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mb-1.5 leading-snug">
                        {item.issue}
                      </p>
                      <div className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                        <strong>Stance:</strong> {item.strategy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Moderate Compromise */}
            <div className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-slate-950 border-amber-900/60' : 'bg-amber-50/50 border-amber-200'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/60">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" />
                    Moderate Compromise
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                    Flexible
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 mb-2.5">
                  Operational terms suitable for counterparty trade-offs and concessions.
                </p>
                <div className="space-y-2">
                  {tradeOffMatrix.moderate.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-lg text-xs border ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100 shadow-2xs'
                    }`}>
                      <div className="font-semibold text-amber-950 dark:text-amber-200 text-[11px] mb-1">
                        {item.category}
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mb-1.5 leading-snug">
                        {item.issue}
                      </p>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        <strong>Target:</strong> {item.strategy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Standard Accept */}
            <div className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-slate-950 border-emerald-900/60' : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-900/60">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Standard Accept
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    Standard
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 mb-2.5">
                  Market-standard protections to accept without negotiation delay.
                </p>
                <div className="space-y-2">
                  {tradeOffMatrix.standard.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-lg text-xs border ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-emerald-100 shadow-2xs'
                    }`}>
                      <div className="font-semibold text-emerald-950 dark:text-emerald-200 text-[11px] mb-1">
                        {item.category}
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mb-1.5 leading-snug">
                        {item.issue}
                      </p>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        <strong>Outcome:</strong> {item.strategy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI-Synthesized Brief View */}
        {aiBrief ? (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="space-y-2">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                I. Synthesized Executive Summary
              </h3>
              <div className={`p-4 rounded-lg text-xs leading-relaxed border ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {aiBrief.executiveSummary}
              </div>
            </div>

            {/* Top Concerns */}
            <div className="space-y-3">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                II. Prioritized Concerns & Evidence
              </h3>
              <div className="space-y-3">
                {aiBrief.topConcerns.map((concern, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {idx + 1}. {concern.title}
                      </span>
                      <RiskBadge level={concern.severity as RiskLevel} />
                    </div>
                    <blockquote className={`p-3 rounded font-mono text-[11px] border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                      "{concern.evidenceSnippet}"
                    </blockquote>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      <strong>Strategic Implication:</strong> {concern.strategicImplication}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions for Counsel */}
            <div className="space-y-2">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                III. Key Questions for Legal Counsel
              </h3>
              <div className={`p-4 rounded-lg border space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  {aiBrief.questionsForCounsel.map((q, idx) => (
                    <li key={idx} className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Redline Priorities */}
            <div className="space-y-2">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                IV. Redline Priorities
              </h3>
              <div className="space-y-2">
                {aiBrief.redlinePriorities.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>{item.issue}</div>
                      <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.recommendedAction}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      item.priority === 'HIGH' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      item.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {item.priority} Priority
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Pre-Consultation Checklist */}
            <div className="space-y-2">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                V. Actionable Pre-Consultation Checklist
              </h3>
              <div className={`p-4 rounded-lg border space-y-2.5 text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <strong>Jurisdiction Check:</strong> Confirm state-specific statutory limitations on non-compete enforceability and mandatory arbitration venue.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <strong>Non-Negotiable Guardrails:</strong> Establish firm walk-away caps on unilateral indemnity and uncapped liability prior to counterparty meeting.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <strong>Targeted Counsel Inquiries:</strong> Present the prioritized strategic questions directly to reviewing legal counsel for formal sign-off.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <strong>Audit Complete Exhibits:</strong> Ensure all referenced schedules, specifications, and intellectual property carve-outs are attached in writing.
                  </span>
                </label>
              </div>
            </div>

            {/* Responsible AI Disclaimer */}
            <div className="text-[11px] text-slate-500 italic border-t pt-3 border-slate-200 dark:border-slate-800">
              {aiBrief.disclaimer}
            </div>
          </div>
        ) : (
          /* Deterministic Fallback View */
          <div className="space-y-6">
            {/* Section 1: Executive Summary */}
            <div className="space-y-2">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                I. Executive Summary & Missing Safeguards
              </h3>
              <div className={`p-4 rounded-lg text-xs leading-relaxed border ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {analysisResult.executiveSummary}
              </div>
            </div>

            {/* Section 2: Flagged Clauses & Counsel Inquiries */}
            <div className="space-y-4">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                II. Itemized Clauses & Inquiries for Counsel
              </h3>

              <div className="space-y-4">
                {analysisResult.findings.map((f, i) => (
                  <div key={f.id} className={`p-4 rounded-lg space-y-3 border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/60 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-xs ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        0{i + 1}. {f.category.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <RiskBadge level={f.riskLevel || f.level || 'LOW'} />
                    </div>

                    <blockquote className={`p-3 rounded font-mono text-[11px] border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                      "{f.exactQuote}"
                    </blockquote>

                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>Plain-English Translation:</strong> {f.plainEnglishSummary}
                    </div>

                    <div className={`p-2.5 rounded border text-xs ${
                      isDark ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}>
                      <strong>Proposed Mutual Revision:</strong> {f.suggestedBalancedRevision}
                    </div>

                    <div className={`p-2.5 rounded border text-xs ${
                      isDark ? 'bg-slate-900 border-slate-800 text-emerald-300' : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                    }`}>
                      <strong className="block mb-1">Questions for Attorney:</strong>
                      <ul className="list-disc list-inside space-y-1">
                        {f.attorneyQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Actionable Pre-Consultation Checklist */}
            <div className="space-y-2">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                III. Pre-Consultation Action Checklist
              </h3>
              <div className={`p-4 rounded-lg border space-y-2.5 text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <strong>Jurisdiction Check:</strong> Confirm state-specific statutory limitations on non-compete enforceability and mandatory arbitration venue.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <strong>Non-Negotiable Guardrails:</strong> Establish firm walk-away caps on unilateral indemnity and uncapped liability prior to counterparty meeting.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <strong>Targeted Counsel Inquiries:</strong> Present the prioritized strategic questions directly to reviewing legal counsel for formal sign-off.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <strong>Audit Complete Exhibits:</strong> Ensure all referenced schedules, specifications, and intellectual property carve-outs are attached in writing.
                  </span>
                </label>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic border-t pt-3 border-slate-200 dark:border-slate-800">
              {AI_DISCLAIMERS.ATTORNEY_BRIEF}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
