import React, { useState } from 'react';
import { 
  Printer, Download, Sparkles, RefreshCw, AlertOctagon, 
  HelpCircle, CheckSquare, Shield, FileText, Info 
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

  const handleSynthesizeBrief = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sanitizedFindings = analysisResult.findings.map((f) => ({
        checkId: f.id,
        category: f.category,
        riskLevel: f.level,
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
      md += `\n---\n*Disclaimer: ${aiBrief.disclaimer}*\n`;
    } else {
      md += `## I. Executive Summary\n${analysisResult.executiveSummary}\n\n`;
      md += `## II. High-Priority Redlines & Attorney Inquiries\n`;
      analysisResult.findings.forEach((f, i) => {
        md += `### 0${i + 1}. ${f.category.replace(/_/g, ' ').toUpperCase()} (${f.level})\n`;
        md += `- **Original Excerpt:** "${f.exactQuote}"\n`;
        md += `- **Plain English:** ${f.plainEnglishSummary}\n`;
        md += `- **Strategic Risk:** ${f.strategicRisk}\n`;
        md += `- **Proposed Balanced Revision:** ${f.suggestedBalancedRevision}\n`;
        md += `- **Questions for Counsel:**\n${f.attorneyQuestions.map(q => `  * ${q}`).join('\n')}\n\n`;
      });
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
                      <RiskBadge level={f.level} />
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

            <div className="text-[11px] text-slate-500 italic border-t pt-3 border-slate-200 dark:border-slate-800">
              {AI_DISCLAIMERS.ATTORNEY_BRIEF}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
