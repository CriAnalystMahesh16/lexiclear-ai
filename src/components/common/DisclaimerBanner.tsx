import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  theme?: 'light' | 'dark';
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';

  return (
    <aside 
      aria-label="Legal Disclaimer and Privacy Assurance" 
      className={`border-b px-4 py-2.5 text-xs font-normal transition-colors ${
        isDark 
          ? 'bg-slate-900 text-slate-300 border-slate-800' 
          : 'bg-amber-50/90 text-amber-950 border-amber-200/80'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 leading-relaxed">
          <Info className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} aria-hidden="true" />
          <span>
            <strong className={`font-semibold ${isDark ? 'text-slate-100' : 'text-amber-950'}`}>
              Legal Notice:
            </strong>{' '}
            LexiClear AI provides informational and self-help document assistance. It is not legal advice or legal representation.
          </span>
        </div>
        <div className={`flex items-center gap-2 text-[11px] shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} aria-hidden="true" />
          <span>Client-Side PII Scrubbing</span>
          <span aria-hidden="true">·</span>
          <span>Zero Raw Contract Network Egress</span>
        </div>
      </div>
    </aside>
  );
};
