import React, { useState, useMemo } from 'react';
import { 
  GitCompare, ArrowRight, ShieldCheck, ShieldAlert, CheckCircle2, 
  AlertTriangle, FileText, ArrowDownRight, ArrowUpRight, Minus, 
  Plus, Edit3, Trash2, RotateCcw, Copy, Check
} from 'lucide-react';
import { diffContractRevisions, ContractDiffResult, ClauseDiffItem } from '../../engine/contractDiffer';
import { SAMPLE_REVISION_COUNTER_OFFER } from '../../data/sampleContracts';
import { UserPerspective } from '../../types/document';
import { RiskBadge } from '../common/RiskBadge';

interface ContractDiffViewerProps {
  theme: 'light' | 'dark';
  originalContractText: string;
  perspective: UserPerspective;
  onClose?: () => void;
}

export const ContractDiffViewer: React.FC<ContractDiffViewerProps> = ({
  theme,
  originalContractText,
  perspective,
  onClose,
}) => {
  const isDark = theme === 'dark';
  const [revisionText, setRevisionText] = useState<string>(SAMPLE_REVISION_COUNTER_OFFER);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CHANGED' | 'ADDED' | 'REMOVED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deterministic diff computation with zero external LLM calls
  const diffResult: ContractDiffResult = useMemo(() => {
    return diffContractRevisions(originalContractText, revisionText, perspective);
  }, [originalContractText, revisionText, perspective]);

  const filteredClauses = useMemo(() => {
    if (filterStatus === 'ALL') return diffResult.clauses;
    return diffResult.clauses.filter((c) => c.status === filterStatus);
  }, [diffResult.clauses, filterStatus]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isScoreImproved = diffResult.scoreDelta < 0;
  const isScoreWorsened = diffResult.scoreDelta > 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className={`rounded-xl p-6 border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-200 dark:border-slate-800">
          <div>
            <div className={`text-xs font-mono uppercase tracking-wider font-semibold mb-1 ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              Deterministic Revision Audit • Problem Statement Alignment
            </div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-950'}`}>
              <GitCompare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Contract Revision & Redline Diff
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Side-by-side clause tracking, structural additions/removals, and quantitative risk shift analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRevisionText(SAMPLE_REVISION_COUNTER_OFFER)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50' 
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Balanced Counter-Offer Preset</span>
            </button>

            <button
              onClick={() => setRevisionText('')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Revision</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:opacity-80"
              >
                Back to Studio
              </button>
            )}
          </div>
        </div>

        {/* Revision Input Textarea (Editable) */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="revision-input-textarea"
              className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Proposed Revision / Counter-Offer Text (Editable)</span>
            </label>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {revisionText.length.toLocaleString()} characters
            </span>
          </div>

          <textarea
            id="revision-input-textarea"
            value={revisionText}
            onChange={(e) => setRevisionText(e.target.value)}
            rows={5}
            placeholder="Paste counterparty revision or balanced redline text here..."
            className={`w-full rounded-lg p-3 text-xs font-mono leading-relaxed border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Top Stat Row: Quantitative Risk Shift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Score Delta */}
        <div className={`rounded-xl p-4 border flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
            Risk Score Impact
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono">
              {diffResult.revisedScore}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ml-auto flex items-center gap-0.5 ${
              isScoreImproved 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                : isScoreWorsened 
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' 
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {isScoreImproved ? <ArrowDownRight className="w-3.5 h-3.5" /> : isScoreWorsened ? <ArrowUpRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              {diffResult.scoreDelta > 0 ? `+${diffResult.scoreDelta}` : diffResult.scoreDelta} pts
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Original: {diffResult.originalScore}/100</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {isScoreImproved ? 'Risk Reduced' : isScoreWorsened ? 'Risk Elevated' : 'No Change'}
            </span>
          </div>
        </div>

        {/* Risk Tier Shift */}
        <div className={`rounded-xl p-4 border flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
            Risk Tier Transition
          </div>
          <div className="my-2 flex items-center gap-2">
            <RiskBadge level={diffResult.originalTier} showIcon={false} className="text-[10px]" />
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <RiskBadge level={diffResult.revisedTier} showIcon={true} className="text-[10px]" />
          </div>
          <div className="text-[11px] text-slate-500">
            {diffResult.originalTier === diffResult.revisedTier 
              ? 'Tier remains constant' 
              : `Shifted from ${diffResult.originalTier} to ${diffResult.revisedTier}`}
          </div>
        </div>

        {/* Structural Changes Breakdown */}
        <div className={`rounded-xl p-4 border flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
            Clause Modifications
          </div>
          <div className="my-2 flex items-center gap-3 text-xs font-mono font-bold">
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> {diffResult.changedCount} Changed
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Plus className="w-3 h-3" /> {diffResult.addedCount} Added
            </span>
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> {diffResult.removedCount} Cut
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {diffResult.unchangedCount} clauses retained intact
          </div>
        </div>

        {/* Net Risk Delta Summary */}
        <div className={`rounded-xl p-4 border flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
            Remediated Safeguards
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {diffResult.resolvedRisks.length}
            </span>
            <span className="text-xs text-slate-500">hazards eliminated</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {diffResult.resolvedRisks.length > 0 
              ? diffResult.resolvedRisks.map(r => r.category.replace(/_/g, ' ')).join(', ') 
              : 'Zero hazards removed yet'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Filter Clauses:</span>
          {(['ALL', 'CHANGED', 'ADDED', 'REMOVED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                filterStatus === status
                  ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-700 text-white')
                  : (isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
              }`}
            >
              {status === 'ALL' ? `All Clauses (${diffResult.clauses.length})` : status}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredClauses.length} of {diffResult.clauses.length} clauses
        </div>
      </div>

      {/* Side-by-Side Clause Comparison List */}
      <div className="space-y-4">
        {filteredClauses.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-5 space-y-4 transition-all ${
              item.status === 'CHANGED'
                ? (isDark ? 'bg-slate-900 border-amber-900/60' : 'bg-amber-50/20 border-amber-200')
                : item.status === 'ADDED'
                ? (isDark ? 'bg-slate-900 border-emerald-900/60' : 'bg-emerald-50/20 border-emerald-200')
                : item.status === 'REMOVED'
                ? (isDark ? 'bg-slate-900 border-rose-900/60' : 'bg-rose-50/20 border-rose-200')
                : (isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')
            }`}
          >
            {/* Clause Header & Status Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  item.status === 'ADDED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : item.status === 'REMOVED'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : item.status === 'CHANGED'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {item.status}
                </span>
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {item.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {item.riskImpact === 'IMPROVED' && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Risk Mitigated
                  </span>
                )}
                {item.riskImpact === 'WORSENED' && (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5" /> Risk Escalated
                  </span>
                )}
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.summaryOfChange}
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Document Version */}
              <div className={`p-3.5 rounded-lg border space-y-2 text-xs font-mono leading-relaxed ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-sans font-semibold pb-1 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <span>Original Document</span>
                  {item.originalSectionNumber && <span>Sec. {item.originalSectionNumber}</span>}
                </div>
                {item.originalText ? (
                  <p className={item.status === 'REMOVED' ? 'line-through text-rose-600 dark:text-rose-400' : isDark ? 'text-slate-300' : 'text-slate-800'}>
                    {item.originalText}
                  </p>
                ) : (
                  <span className="italic text-slate-400 dark:text-slate-600">Clause does not exist in original agreement</span>
                )}
                {item.originalFindings.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1 font-sans">
                    {item.originalFindings.map((f) => (
                      <RiskBadge key={f.id} level={f.riskLevel || f.level || 'LOW'} showIcon={false} className="text-[9px] py-0 px-1" />
                    ))}
                  </div>
                )}
              </div>

              {/* Revised Document Version */}
              <div className={`p-3.5 rounded-lg border space-y-2 text-xs font-mono leading-relaxed ${
                item.status === 'ADDED'
                  ? (isDark ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-200')
                  : item.status === 'CHANGED'
                  ? (isDark ? 'bg-amber-950/20 border-amber-900/50' : 'bg-amber-50/40 border-amber-200')
                  : isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-sans font-semibold pb-1 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <span className={item.status === 'ADDED' ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    Proposed Revision / Redline
                  </span>
                  {item.revisedText && (
                    <button
                      onClick={() => handleCopyText(item.revisedText!, item.id)}
                      className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                {item.revisedText ? (
                  <p className={
                    item.status === 'ADDED' 
                      ? 'text-emerald-700 dark:text-emerald-300 font-medium' 
                      : isDark ? 'text-slate-200' : 'text-slate-900'
                  }>
                    {item.revisedText}
                  </p>
                ) : (
                  <span className="italic text-slate-400 dark:text-slate-600">Clause eliminated in proposed revision</span>
                )}
                {item.revisedFindings.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1 font-sans">
                    {item.revisedFindings.map((f) => (
                      <RiskBadge key={f.id} level={f.riskLevel || f.level || 'LOW'} showIcon={false} className="text-[9px] py-0 px-1" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
