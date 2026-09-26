import React, { useRef } from 'react';
import { 
  FileText, Upload, Shield, Eye, EyeOff, Lock, CheckCircle2, 
  AlertTriangle, Clock, Hash, Layers, Sparkles, RefreshCw, ArrowRight,
  GitCompare 
} from 'lucide-react';
import { SAMPLE_CONTRACTS, SampleContract } from '../../data/sampleContracts';
import { ClauseSegment, UserPerspective } from '../../types/document';
import { RedactedDocument, PIIEntity } from '../../types/pii';

interface DocumentIntakeProps {
  theme: 'light' | 'dark';
  contractText: string;
  setContractText: (text: string) => void;
  selectedSample: string;
  onSelectSample: (sample: SampleContract) => void;
  perspective: UserPerspective;
  setPerspective: (perspective: UserPerspective) => void;
  showUnmaskedPII: boolean;
  setShowUnmaskedPII: (show: boolean) => void;
  piiResult: RedactedDocument;
  segments: ClauseSegment[];
  isScanning: boolean;
  onScanContract: () => void;
  uploadError: string | null;
  setUploadError: (err: string | null) => void;
  onOpenRevisionDiff?: () => void;
}

const MAX_CHAR_LIMIT = 500000;

export const DocumentIntake: React.FC<DocumentIntakeProps> = ({
  theme,
  contractText,
  setContractText,
  selectedSample,
  onSelectSample,
  perspective,
  setPerspective,
  showUnmaskedPII,
  setShowUnmaskedPII,
  piiResult,
  segments,
  isScanning,
  onScanContract,
  uploadError,
  setUploadError,
  onOpenRevisionDiff,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = contractText.split(/\s+/).filter(Boolean).length;
  const charCount = contractText.length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.txt', '.md', '.text'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt && file.type && !file.type.includes('text')) {
      setUploadError('Unsupported file format. Please upload a plain text (.txt) or markdown (.md) document.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB file limit
      setUploadError('File is too large (max 2MB). Please paste a smaller excerpt or document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content || !content.trim()) {
        setUploadError('Uploaded file appears to be empty.');
        return;
      }
      if (content.length > MAX_CHAR_LIMIT) {
        setUploadError(`Document exceeds maximum character limit (${MAX_CHAR_LIMIT.toLocaleString()} characters).`);
        return;
      }
      setContractText(content);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the uploaded document.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Sample Contract Selector */}
      <section 
        aria-labelledby="sample-selector-heading"
        className={`rounded-xl p-5 border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 id="sample-selector-heading" className={`text-xs font-semibold uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Demo-Ready Sample Documents
          </h2>
          <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Fictional parties and pre-configured adversarial risks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_CONTRACTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                selectedSample === sample.id
                  ? (isDark 
                      ? 'border-emerald-500 bg-emerald-950/20 text-emerald-200 shadow-xs' 
                      : 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-2xs ring-1 ring-emerald-700/20')
                  : (isDark 
                      ? 'border-slate-800 hover:bg-slate-800/60 text-slate-300' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800')
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono uppercase tracking-wider ${
                  selectedSample === sample.id 
                    ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-800 font-bold') 
                    : (isDark ? 'text-slate-400' : 'text-slate-600')
                }`}>
                  {sample.category}
                </span>
                {selectedSample === sample.id && (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} aria-hidden="true" />
                )}
              </div>
              <h3 className={`text-xs font-semibold mb-1 ${
                selectedSample === sample.id
                  ? (isDark ? 'text-white' : 'text-slate-950 font-bold')
                  : (isDark ? 'text-slate-200' : 'text-slate-900')
              }`}>
                {sample.title}
              </h3>
              <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {sample.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Privacy Explanation & Architecture Banner */}
      <section 
        aria-label="Privacy Architecture Explanation"
        className={`rounded-xl p-4 border flex flex-col sm:flex-row items-start gap-3.5 ${
          isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
        }`}
      >
        <Shield className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`} aria-hidden="true" />
        <div className="text-xs space-y-1">
          <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-emerald-950 font-bold'}`}>
            Zero-Knowledge Client-Side Privacy Guarantee
          </h3>
          <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-emerald-900'}`}>
            LexiClear AI executes all PII detection, redaction, and structural rule parsing locally in your browser. 
            Direct identifiers (SSNs, emails, phone numbers, bank accounts) are converted into secure token placeholders. 
            Raw unredacted contract text is <strong>never</strong> transmitted to Gemini or external AI models.
          </p>
        </div>
      </section>

      {/* Document Workspace Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar: Document Structure & PII Audit (4 cols) */}
        <div className={`lg:col-span-4 rounded-xl p-4 space-y-4 border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {/* Metadata Statistics */}
          <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Document Metadata
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Sections</div>
                <div className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{segments.length}</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Length</div>
                <div className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{charCount.toLocaleString()} <span className="text-[10px] font-normal">chars</span></div>
              </div>
              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Word Count</div>
                <div className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{wordCount.toLocaleString()}</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Est. Read</div>
                <div className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{readingTimeMin} min</div>
              </div>
            </div>
          </div>

          {/* Redacted PII Entities List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Client-Side Redactions</span>
              </h3>
              <span className={`text-[11px] font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {piiResult.entities.length} items scrubbed
              </span>
            </div>

            {piiResult.entities.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {piiResult.entities.map((entity: PIIEntity, i: number) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between text-[11px] p-2 rounded border font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{entity.token}</span>
                    <span className="text-[10px] opacity-75">{entity.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-xs italic p-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                No direct personal identifiers detected in current text.
              </p>
            )}
          </div>

          {/* Perspective Lens Selector in Studio */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label 
              htmlFor="studio-perspective-select" 
              className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Analyze from Perspective of:
            </label>
            <select
              id="studio-perspective-select"
              value={perspective}
              onChange={(e) => setPerspective(e.target.value as UserPerspective)}
              className={`w-full rounded px-3 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="service_provider_or_contractor">Freelancer / Contractor</option>
              <option value="client_or_hiring_entity">Client / Employer</option>
              <option value="tenant">Tenant / Resident</option>
              <option value="landlord">Property Owner</option>
              <option value="neutral_observer">Neutral Observer</option>
            </select>
          </div>
        </div>

        {/* Right Canvas: Contract Textarea with Actions (8 cols) */}
        <div className={`lg:col-span-8 rounded-xl p-5 space-y-4 border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload document file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 shadow-2xs'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document (.txt / .md)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUnmaskedPII(!showUnmaskedPII)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  showUnmaskedPII
                    ? (isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-950 border-amber-300')
                    : (isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-950 border-emerald-300')
                }`}
                title="Toggle between PII-sanitized network view and raw local text"
              >
                {showUnmaskedPII ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showUnmaskedPII ? 'Viewing Raw Input (Local Only)' : 'Viewing Redacted Preview'}</span>
              </button>

              {onOpenRevisionDiff && (
                <button
                  type="button"
                  onClick={onOpenRevisionDiff}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-slate-800 border-emerald-700/80 text-emerald-300 hover:bg-slate-700' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 shadow-2xs'
                  }`}
                  title="Compare this contract side-by-side with a counter-offer or revision"
                >
                  <GitCompare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Compare Revision (Diff)</span>
                </button>
              )}
            </div>

            {/* Run Audit Button */}
            <button
              onClick={onScanContract}
              disabled={isScanning || !contractText.trim()}
              className={`flex items-center gap-2 px-5 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 ${
                isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditing Clauses...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Complete Risk Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Upload Error Banner if any */}
          {uploadError && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              isDark ? 'bg-rose-950/40 border-rose-900 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={showUnmaskedPII ? contractText : piiResult.redactedText}
              onChange={(e) => {
                setContractText(e.target.value);
              }}
              rows={18}
              className={`w-full font-mono text-xs leading-relaxed p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y ${
                isDark 
                  ? 'bg-slate-950 text-slate-200 border-slate-800' 
                  : 'bg-slate-50 text-slate-900 border-slate-300'
              }`}
              placeholder="Paste contract text here or choose a demo contract above..."
              aria-label="Contract Text Input"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Real-time local PII masking active</span>
            </div>
            <span className="font-mono text-[11px]">{charCount} / {MAX_CHAR_LIMIT.toLocaleString()} chars</span>
          </div>
        </div>

      </div>
    </div>
  );
};
