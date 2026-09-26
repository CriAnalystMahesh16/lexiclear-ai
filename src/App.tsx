import React, { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import { 
  FileText, Shield, AlertTriangle, BookOpen, CheckSquare, 
  HelpCircle, Download, Printer, RefreshCw, Eye, EyeOff, 
  ChevronRight, ArrowRight, Scale, Sparkles, MessageSquare, 
  Copy, Check, Search, Filter, Lock, CheckCircle2,
  Sun, Moon, Upload, AlertOctagon, AlertCircle, GitCompare
} from 'lucide-react';
import { SAMPLE_CONTRACTS, SampleContract } from './data/sampleContracts';
import { scrubPII } from './engine/piiScrubber';
import { segmentDocument } from './engine/segmenter';
import { runDeterministicRuleScan } from './engine/ruleScanner';
import { verifyAndFilterFindings } from './engine/quoteVerifier';
import { ClauseSegment, UserPerspective } from './types/document';
import { AnalysisResult } from './types/analysis';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { RiskBadge } from './components/common/RiskBadge';
import { DocumentIntake } from './components/intake/DocumentIntake';
import { ClauseInspector } from './components/clause/ClauseInspector';
import { AttorneyBriefPanel } from './components/docket/AttorneyBriefPanel';
import { DocumentQAPanel } from './components/qa/DocumentQAPanel';
import { ContractDiffViewer } from './components/diff/ContractDiffViewer';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'editor' | 'overview' | 'comparator' | 'obligations' | 'docket' | 'diff'>('editor');
  const [selectedSample, setSelectedSample] = useState<string>('freelance_msa');
  const [contractText, setContractText] = useState<string>(SAMPLE_CONTRACTS[0].content);
  const [perspective, setPerspective] = useState<UserPerspective>('service_provider_or_contractor');
  const [showUnmaskedPII, setShowUnmaskedPII] = useState<boolean>(false);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ariaLiveStatus, setAriaLiveStatus] = useState<string>('Ready for analysis.');

  const assistantTriggerRef = useRef<HTMLButtonElement>(null);
  const wasAssistantOpen = useRef(isAssistantOpen);

  // Restore focus to assistant trigger button when drawer closes
  useEffect(() => {
    if (wasAssistantOpen.current && !isAssistantOpen) {
      assistantTriggerRef.current?.focus();
    }
    wasAssistantOpen.current = isAssistantOpen;
  }, [isAssistantOpen]);

  // Arrow key navigation between tabs
  const tabsList = ['editor', 'overview', 'comparator', 'obligations', 'docket', 'diff'] as const;
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = tabsList.indexOf(activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = tabsList[(currentIndex + 1) % tabsList.length];
      setActiveTab(nextTab);
      setAriaLiveStatus(`Switched to tab: ${nextTab}`);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = tabsList[(currentIndex - 1 + tabsList.length) % tabsList.length];
      setActiveTab(prevTab);
      setAriaLiveStatus(`Switched to tab: ${prevTab}`);
    }
  };

  // Deferred value prevents synchronous full-document re-scanning on every keystroke
  const deferredContractText = useDeferredValue(contractText);

  // Client-Side PII Scrubbing
  const piiResult = useMemo(() => {
    return scrubPII(deferredContractText, 'doc-active', 'contract', perspective);
  }, [deferredContractText, perspective]);

  // Document Segmentation
  const segments: ClauseSegment[] = useMemo(() => {
    return segmentDocument(deferredContractText, piiResult.redactedText);
  }, [deferredContractText, piiResult.redactedText]);

  // Deterministic Analysis Engine
  const analysisResult: AnalysisResult = useMemo(() => {
    const rawAnalysis = runDeterministicRuleScan(segments, perspective);
    const verifiedFindings = verifyAndFilterFindings(rawAnalysis.findings, segments);
    return {
      ...rawAnalysis,
      findings: verifiedFindings,
    };
  }, [segments, perspective]);

  // Auto-select first finding
  useEffect(() => {
    if (analysisResult.findings.length > 0 && !selectedFindingId) {
      setSelectedFindingId(analysisResult.findings[0].id);
    }
  }, [analysisResult.findings, selectedFindingId]);

  const handleSelectSample = (sample: SampleContract) => {
    setSelectedSample(sample.id);
    setContractText(sample.content);
    setPerspective(sample.defaultPerspective);
    setSelectedFindingId(null);
    setUploadError(null);
    setAriaLiveStatus(`Loaded sample contract: ${sample.title}`);
  };

  const handleScanContract = () => {
    setIsScanning(true);
    setAriaLiveStatus('Auditing contract clauses and computing risk scores...');
    setTimeout(() => {
      setIsScanning(false);
      setActiveTab('overview');
      setAriaLiveStatus(`Audit complete. Found ${analysisResult.findings.length} risk items. Risk score: ${analysisResult.overallRiskScore}/100.`);
    }, 350);
  };

  const currentSampleContract = useMemo(() => {
    return SAMPLE_CONTRACTS.find((s) => s.id === selectedSample) || {
      title: 'Custom Agreement Document',
      category: 'General Contract',
    };
  }, [selectedSample]);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
      isDark 
        ? 'bg-slate-950 text-slate-100 selection:bg-emerald-950 selection:text-emerald-300' 
        : 'bg-slate-50/70 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900'
    }`}>
      
      {/* Accessible Skip Navigation Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-700 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white font-medium text-xs"
      >
        Skip to main content
      </a>

      {/* ARIA Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" role="status">
        {ariaLiveStatus}
      </div>

      {/* Persistent Legal Disclaimer Banner */}
      <DisclaimerBanner theme={theme} />

      {/* Main App Navigation Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-2xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base transition-colors ${
              isDark ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-700 text-white'
            }`}>
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  LexiClear AI
                </h1>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  v4.0
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Legal Document Intelligence & Access Studio
              </p>
            </div>
          </div>

          {/* Core Journey Tab Navigation */}
          <nav 
            role="tablist" 
            aria-label="Main User Journey Stages"
            className="hidden md:flex items-center gap-6 text-xs"
          >
            <button
              id="tab-editor"
              role="tab"
              aria-selected={activeTab === 'editor'}
              aria-controls="panel-editor"
              onKeyDown={handleTabKeyDown}
              onClick={() => setActiveTab('editor')}
              className={`py-1 transition-colors relative focus-visible:ring-2 focus-visible:ring-emerald-500 rounded ${
                activeTab === 'editor' 
                  ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-bold') 
                  : (isDark ? 'hover:text-slate-200 text-slate-400' : 'hover:text-slate-950 text-slate-700')
              }`}
            >
              1. Document Studio
              {activeTab === 'editor' && (
                <span className={`absolute bottom-[-20px] left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-500' : 'bg-emerald-700'}`} />
              )}
            </button>

            <button
              id="tab-overview"
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="panel-overview"
              onKeyDown={handleTabKeyDown}
              onClick={() => setActiveTab('overview')}
              className={`py-1 transition-colors relative flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded ${
                activeTab === 'overview' 
                  ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-bold') 
                  : (isDark ? 'hover:text-slate-200 text-slate-400' : 'hover:text-slate-950 text-slate-700')
              }`}
            >
              2. Risk Overview
              <span className={`font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                ({analysisResult.overallRiskScore})
              </span>
              {activeTab === 'overview' && (
                <span className={`absolute bottom-[-20px] left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-500' : 'bg-emerald-700'}`} />
              )}
            </button>

            <button
              id="tab-comparator"
              role="tab"
              aria-selected={activeTab === 'comparator'}
              aria-controls="panel-comparator"
              onKeyDown={handleTabKeyDown}
              onClick={() => setActiveTab('comparator')}
              className={`py-1 transition-colors relative flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded ${
                activeTab === 'comparator' 
                  ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-bold') 
                  : (isDark ? 'hover:text-slate-200 text-slate-400' : 'hover:text-slate-950 text-slate-700')
              }`}
            >
              3. Clause Inspector
              <span className={`font-mono text-[10px] font-bold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                ({analysisResult.findings.length})
              </span>
              {activeTab === 'comparator' && (
                <span className={`absolute bottom-[-20px] left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-500' : 'bg-emerald-700'}`} />
              )}
            </button>

            <button
              id="tab-obligations"
              role="tab"
              aria-selected={activeTab === 'obligations'}
              aria-controls="panel-obligations"
              onKeyDown={handleTabKeyDown}
              onClick={() => setActiveTab('obligations')}
              className={`py-1 transition-colors relative ${
                activeTab === 'obligations' 
                  ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-bold') 
                  : (isDark ? 'hover:text-slate-200 text-slate-400' : 'hover:text-slate-950 text-slate-700')
              }`}
            >
              4. Obligation Audit
              {activeTab === 'obligations' && (
                <span className={`absolute bottom-[-20px] left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-500' : 'bg-emerald-700'}`} />
              )}
            </button>

            <button
              id="tab-docket"
              role="tab"
              aria-selected={activeTab === 'docket'}
              aria-controls="panel-docket"
              onKeyDown={handleTabKeyDown}
              onClick={() => setActiveTab('docket')}
              className={`py-1 transition-colors relative flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded ${
                activeTab === 'docket' 
                  ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-bold') 
                  : (isDark ? 'hover:text-slate-200 text-slate-400' : 'hover:text-slate-950 text-slate-700')
              }`}
            >
              5. Attorney Brief
              {activeTab === 'docket' && (
                <span className={`absolute bottom-[-20px] left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-500' : 'bg-emerald-700'}`} />
              )}
            </button>

            <button
              id="tab-diff"
              role="tab"
              aria-selected={activeTab === 'diff'}
              aria-controls="panel-diff"
              onKeyDown={handleTabKeyDown}
              onClick={() => setActiveTab('diff')}
              className={`py-1 transition-colors relative flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded ${
                activeTab === 'diff' 
                  ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-bold') 
                  : (isDark ? 'hover:text-slate-200 text-slate-400' : 'hover:text-slate-950 text-slate-700')
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              6. Revision Diff
              {activeTab === 'diff' && (
                <span className={`absolute bottom-[-20px] left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-500' : 'bg-emerald-700'}`} />
              )}
            </button>
          </nav>


          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            
            {/* Perspective Lens Selector */}
            <div className={`hidden lg:flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Lens:</span>
              <select
                id="perspective-select-header"
                value={perspective}
                onChange={(e) => setPerspective(e.target.value as UserPerspective)}
                className={`rounded-lg px-2 py-1 text-xs border transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                }`}
                aria-label="Perspective Lens"
              >
                <option value="service_provider_or_contractor">Freelancer / Contractor</option>
                <option value="client_or_hiring_entity">Client / Employer</option>
                <option value="tenant">Tenant / Resident</option>
                <option value="landlord">Property Owner</option>
                <option value="neutral_observer">Neutral Observer</option>
              </select>
            </div>

            {/* PII Masking Status Button */}
            <button
              onClick={() => setShowUnmaskedPII(!showUnmaskedPII)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                showUnmaskedPII
                  ? (isDark 
                      ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/40' 
                      : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100')
                  : (isDark 
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/40' 
                      : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100')
              }`}
              title={showUnmaskedPII ? "Mask sensitive client data" : "View unmasked data locally"}
              aria-label={showUnmaskedPII ? "Hide personal information" : "Show personal information locally"}
            >
              {showUnmaskedPII ? <EyeOff className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
              <span className="hidden sm:inline">{showUnmaskedPII ? 'Unmasked (Local)' : 'PII Scrubbed'}</span>
              <span className="font-mono text-[10px]">({piiResult.entities.length})</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Document Q&A Assistant Button */}
            <button
              ref={assistantTriggerRef}
              onClick={() => setIsAssistantOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isDark 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60' 
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              }`}
              aria-label="Open Document Q&A Panel"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Ask Document</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div 
          role="tablist" 
          aria-label="Mobile Navigation" 
          className="md:hidden border-t px-4 py-2 flex items-center justify-between overflow-x-auto text-xs gap-3"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'editor'}
            onClick={() => setActiveTab('editor')}
            className={activeTab === 'editor' ? 'font-bold text-emerald-600' : 'text-slate-500'}
          >
            Studio
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'font-bold text-emerald-600' : 'text-slate-500'}
          >
            Overview ({analysisResult.overallRiskScore})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'comparator'}
            onClick={() => setActiveTab('comparator')}
            className={activeTab === 'comparator' ? 'font-bold text-emerald-600' : 'text-slate-500'}
          >
            Inspector ({analysisResult.findings.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'obligations'}
            onClick={() => setActiveTab('obligations')}
            className={activeTab === 'obligations' ? 'font-bold text-emerald-600' : 'text-slate-500'}
          >
            Obligations
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'docket'}
            onClick={() => setActiveTab('docket')}
            className={activeTab === 'docket' ? 'font-bold text-emerald-600' : 'text-slate-500'}
          >
            Brief
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'diff'}
            onClick={() => setActiveTab('diff')}
            className={activeTab === 'diff' ? 'font-bold text-emerald-600' : 'text-slate-500'}
          >
            Diff
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 focus:outline-none">
        
        {/* =========================================================================
            STAGE 1: DOCUMENT INTAKE & LOCAL PII MASKING
           ========================================================================= */}
        {activeTab === 'editor' && (
          <section id="panel-editor" role="tabpanel" aria-labelledby="tab-editor" tabIndex={0}>
            <DocumentIntake
              theme={theme}
              contractText={contractText}
              setContractText={setContractText}
              selectedSample={selectedSample}
              onSelectSample={handleSelectSample}
              perspective={perspective}
              setPerspective={setPerspective}
              showUnmaskedPII={showUnmaskedPII}
              setShowUnmaskedPII={setShowUnmaskedPII}
              piiResult={piiResult}
              segments={segments}
              isScanning={isScanning}
              onScanContract={handleScanContract}
              uploadError={uploadError}
              setUploadError={setUploadError}
              onOpenRevisionDiff={() => setActiveTab('diff')}
            />
          </section>
        )}

        {/* =========================================================================
            STAGE 2: EXECUTIVE RISK RADAR & OVERVIEW
           ========================================================================= */}
        {activeTab === 'overview' && (
          <section id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabIndex={0} className="space-y-6">
            
            {/* Top Stat Row: Score, Asymmetries, Missing Safeguards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Overall Risk Score */}
              <div className={`rounded-xl p-5 flex flex-col justify-between border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className={`text-xs uppercase tracking-wider font-semibold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Review Priority Score
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black font-mono tracking-tight">
                      {analysisResult.overallRiskScore}
                    </span>
                    <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      / 100
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t mt-4 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <RiskBadge level={analysisResult.overallRiskTier} />
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Perspective: {perspective.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* High / Medium / Low Breakdown */}
              <div className={`rounded-xl p-5 flex flex-col justify-between border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className={`text-xs uppercase tracking-wider font-semibold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Flagged Risk Breakdown
                  </div>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                        <AlertOctagon className="w-3.5 h-3.5" /> Critical / High
                      </span>
                      <span className="font-mono font-bold">
                        {analysisResult.findings.filter(f => (f.riskLevel || f.level) === 'CRITICAL' || (f.riskLevel || f.level) === 'HIGH').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sky-600 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> Moderate
                      </span>
                      <span className="font-mono font-bold">
                        {analysisResult.findings.filter(f => (f.riskLevel || f.level) === 'MODERATE').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Standard / Low
                      </span>
                      <span className="font-mono font-bold">
                        {analysisResult.findings.filter(f => (f.riskLevel || f.level) === 'LOW').length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Total Clauses Scanned:</span>
                  <span className="font-mono font-bold">{segments.length}</span>
                </div>
              </div>

              {/* Missing Standard Safeguards */}
              <div className={`rounded-xl p-5 flex flex-col justify-between border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className={`text-xs uppercase tracking-wider font-semibold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Missing Standard Protections
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {analysisResult.missingStandardProtections.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('comparator')}
                  className={`flex items-center justify-between text-xs font-semibold pt-3 border-t transition-colors ${
                    isDark ? 'border-slate-800 text-emerald-400 hover:text-emerald-300' : 'border-slate-200 text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  <span>Inspect All Clauses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Findings List Summary Card */}
            <div className={`rounded-xl p-6 space-y-4 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Prioritized Legal Risks for {perspective.replace(/_/g, ' ')}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Grounded strictly in verified clause offsets. Click any finding to inspect side-by-side redlines.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('comparator')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
                    isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  Open Clause Inspector
                </button>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {analysisResult.findings.map((finding) => (
                  <div 
                    key={finding.id} 
                    className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setSelectedFindingId(finding.id);
                      setActiveTab('comparator');
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={finding.riskLevel || finding.level || 'LOW'} showIcon={false} className="text-[10px] py-0 px-1" />
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {finding.plainEnglishSummary}
                        </span>
                      </div>
                      <p className={`text-xs font-mono line-clamp-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        "{finding.exactQuote}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Section {finding.clauseId}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>
        )}

        {/* =========================================================================
            STAGE 3: CLAUSE INSPECTOR & AI SYNTHESIS (Features #1 & #2)
           ========================================================================= */}
        {activeTab === 'comparator' && (
          <section id="panel-comparator" role="tabpanel" aria-labelledby="tab-comparator" tabIndex={0}>
            <ClauseInspector
              theme={theme}
              findings={analysisResult.findings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={setSelectedFindingId}
              perspective={perspective}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
            />
          </section>
        )}

        {/* =========================================================================
            STAGE 4: OBLIGATION AUDIT & NOTICE DEADLINES
           ========================================================================= */}
        {activeTab === 'obligations' && (
          <section id="panel-obligations" role="tabpanel" aria-labelledby="tab-obligations" tabIndex={0} className="space-y-6">
            <div className={`rounded-xl p-6 space-y-4 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div>
                <h2 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Mandatory Contractual Obligations & Notice Windows
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Chronological audit of legal duties, critical cure windows, and consequences of breach.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-mono uppercase text-[11px] ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500 bg-slate-50'
                    }`}>
                      <th className="py-3 px-4">Party Bound</th>
                      <th className="py-3 px-4">Required Action</th>
                      <th className="py-3 px-4">Notice Window / Trigger</th>
                      <th className="py-3 px-4">Consequence of Breach</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {analysisResult.obligations.map((ob) => (
                      <tr key={ob.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}>
                        <td className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {ob.responsibleParty}
                        </td>
                        <td className={`py-3.5 px-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                          {ob.actionRequired}
                        </td>
                        <td className={`py-3.5 px-4 font-mono font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {ob.deadlineOrTrigger}
                        </td>
                        <td className="py-3.5 px-4 text-rose-600 font-medium">
                          {ob.consequenceOfBreach}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            STAGE 5: ATTORNEY CONSULTATION BRIEF (Feature #3)
           ========================================================================= */}
        {activeTab === 'docket' && (
          <section id="panel-docket" role="tabpanel" aria-labelledby="tab-docket" tabIndex={0}>
            <AttorneyBriefPanel
              theme={theme}
              documentTitle={currentSampleContract.title}
              analysisResult={analysisResult}
              perspective={perspective}
            />
          </section>
        )}

        {/* =========================================================================
            STAGE 6: CONTRACT REVISION DIFF & REDLINE COMPARATOR (Problem Alignment)
           ========================================================================= */}
        {activeTab === 'diff' && (
          <section id="panel-diff" role="tabpanel" aria-labelledby="tab-diff" tabIndex={0}>
            <ContractDiffViewer
              theme={theme}
              originalContractText={contractText}
              perspective={perspective}
              onClose={() => setActiveTab('editor')}
            />
          </section>
        )}

      </main>

      {/* Slide-Over Legal Q&A Assistant Drawer (Feature #4) */}
      <DocumentQAPanel
        theme={theme}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        documentId={selectedSample}
        segments={segments}
        perspective={perspective}
      />

      {/* Accessible Minimal Footer */}
      <footer className={`border-t py-4 text-xs transition-colors ${
        isDark 
          ? 'border-slate-800 bg-slate-950 text-slate-500' 
          : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              LexiClear AI
            </span>
            <span aria-hidden="true">·</span>
            <span>Legal Access & Document Intelligence Studio</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>WCAG 2.1 AA Compliant</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Knowledge Client-Side PII Shield</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
