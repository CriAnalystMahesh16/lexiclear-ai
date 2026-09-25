import React from 'react';
import { RiskLevel } from '../../types/analysis';
import { AlertCircle, AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '', showIcon = true }) => {
  switch (level) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-rose-50 text-rose-800 border border-rose-200/90 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800/80 ${className}`}
          role="status"
          aria-label="Critical Risk Level"
        >
          {showIcon && <AlertOctagon className="w-3 h-3 text-rose-700 dark:text-rose-400 shrink-0" aria-hidden="true" />}
          <span className="font-mono uppercase tracking-wider">Critical Risk</span>
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800/80 ${className}`}
          role="status"
          aria-label="High Risk Level"
        >
          {showIcon && <AlertTriangle className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />}
          <span className="font-mono uppercase tracking-wider">High Risk</span>
        </span>
      );
    case 'MODERATE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-sky-50 text-sky-900 border border-sky-200/90 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800/80 ${className}`}
          role="status"
          aria-label="Moderate Risk Level"
        >
          {showIcon && <AlertCircle className="w-3 h-3 text-sky-700 dark:text-sky-400 shrink-0" aria-hidden="true" />}
          <span className="font-mono uppercase tracking-wider">Moderate Risk</span>
        </span>
      );
    case 'LOW':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-emerald-50 text-emerald-900 border border-emerald-200/90 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800/80 ${className}`}
          role="status"
          aria-label="Low Risk Level"
        >
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />}
          <span className="font-mono uppercase tracking-wider">Standard / Low</span>
        </span>
      );
  }
};
