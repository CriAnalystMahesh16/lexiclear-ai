import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Sparkles, RefreshCw, 
  CheckCircle2, AlertCircle, HelpCircle, Shield 
} from 'lucide-react';
import { ClauseSegment, UserPerspective } from '../../types/document';
import { geminiClientService } from '../../services/geminiClientService';
import { DocumentQAResponse, AI_DISCLAIMERS } from '../../schemas/gemini.schemas';

interface DocumentQAPanelProps {
  theme: 'light' | 'dark';
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  segments: ClauseSegment[];
  perspective: UserPerspective;
}

interface QAItem {
  question: string;
  answer: string;
  referencedSections: string[];
  isGrounded: boolean;
  disclaimer: string;
}

export const DocumentQAPanel: React.FC<DocumentQAPanelProps> = ({
  theme,
  isOpen,
  onClose,
  documentId,
  segments,
  perspective,
}) => {
  const isDark = theme === 'dark';
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<QAItem[]>([
    {
      question: 'Is liability uncapped for the contractor or tenant?',
      answer: 'Yes. The indemnification provisions mandate that the service provider’s liabilities are uncapped and unlimited, while counterparty liabilities are strictly capped. This represents an asymmetric risk imbalance.',
      referencedSections: ['Section 3'],
      isGrounded: true,
      disclaimer: AI_DISCLAIMERS.DOCUMENT_QA,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus management and Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    // Auto-focus on input field when drawer opens
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAskQuestion = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const targetQuery = (presetQuery || query).trim();
    if (!targetQuery || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Extract top verified excerpts relevant to this document
    // Limit to top 5 segments (max 2000 chars each) to keep payload bounded
    const verifiedExcerpts = segments.slice(0, 5).map((seg) => ({
      sectionId: seg.id,
      sectionTitle: seg.title,
      excerptText: seg.rawText.substring(0, 1800),
    }));

    try {
      const response = await geminiClientService.askDocument({
        documentId,
        perspective,
        userQuery: targetQuery,
        verifiedExcerpts,
      });

      setHistory((prev) => [
        ...prev,
        {
          question: targetQuery,
          answer: response.answer,
          referencedSections: response.referencedSections,
          isGrounded: response.isGrounded,
          disclaimer: response.disclaimer,
        },
      ]);
      setQuery('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to evaluate document question.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="qa-drawer-title"
      className={`fixed inset-y-0 right-0 w-full sm:w-[420px] border-l shadow-2xl z-50 flex flex-col transition-transform ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <MessageSquare className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} aria-hidden="true" />
          <h2 id="qa-drawer-title" className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Document-Grounded Q&A
          </h2>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg text-xs transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            isDark 
              ? 'text-slate-400 hover:text-white bg-slate-800' 
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
          aria-label="Close Q&A Drawer (Escape)"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Suggested Questions */}
      <div className={`p-3 border-b space-y-1.5 ${
        isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
      }`}>
        <span className={`text-[10px] font-semibold uppercase tracking-wider block ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Suggested Document Inquiries:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleAskQuestion(undefined, 'What is the advance notice period for termination?')}
            className={`text-[11px] text-left px-2 py-1 rounded border transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 shadow-2xs'
            }`}
          >
            Termination notice period?
          </button>
          <button
            onClick={() => handleAskQuestion(undefined, 'Who owns pre-existing code and tools?')}
            className={`text-[11px] text-left px-2 py-1 rounded border transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 shadow-2xs'
            }`}
          >
            Ownership of pre-existing tools?
          </button>
          <button
            onClick={() => handleAskQuestion(undefined, 'Are there mandatory arbitration or distant venue clauses?')}
            className={`text-[11px] text-left px-2 py-1 rounded border transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 shadow-2xs'
            }`}
          >
            Arbitration & venue rules?
          </button>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
        {history.map((item, idx) => (
          <div key={idx} className={`p-3.5 rounded-xl border space-y-2 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                Q: {item.question}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                item.isGrounded 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {item.isGrounded ? 'Grounded' : 'Ungrounded'}
              </span>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              {item.answer}
            </p>

            {item.referencedSections.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-slate-500">
                <span>Referenced:</span>
                {item.referencedSections.map((sec, sIdx) => (
                  <span key={sIdx} className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                    {sec}
                  </span>
                ))}
              </div>
            )}

            <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200 dark:border-slate-800">
              {item.disclaimer}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none text-emerald-600" aria-hidden="true" />
            <span>Verifying question against supplied document text...</span>
          </div>
        )}

        {error && (
          <div 
            role="alert"
            className="p-3 rounded-lg text-xs bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => handleAskQuestion(e)} className={`p-3 border-t flex gap-2 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about notice periods, covenants, caps..."
          disabled={isLoading}
          className={`flex-1 rounded-lg px-3 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            isDark 
              ? 'bg-slate-950 border-slate-800 text-slate-200' 
              : 'bg-white border-slate-300 text-slate-900'
          }`}
          aria-label="Ask a question about the document"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={`px-4 py-2 text-white text-xs font-semibold rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 ${
            isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-700 hover:bg-emerald-800'
          }`}
        >
          Ask
        </button>
      </form>
    </aside>
  );
};
