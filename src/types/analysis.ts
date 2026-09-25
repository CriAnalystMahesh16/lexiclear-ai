import { UserPerspective } from './document';
import { ALLOWED_RISK_CATEGORIES, ALLOWED_RISK_LEVELS } from '../models/security.constants';

export type RiskLevel = typeof ALLOWED_RISK_LEVELS[number];

export type RiskCategory = typeof ALLOWED_RISK_CATEGORIES[number];

export interface Finding {
  id: string;
  clauseId: string;
  category: RiskCategory;
  level: RiskLevel;
  exactQuote: string;
  plainEnglishSummary: string;
  strategicRisk: string;
  suggestedBalancedRevision: string;
  attorneyQuestions: string[];
}

export interface ObligationItem {
  id: string;
  clauseId: string;
  responsibleParty: string;
  actionRequired: string;
  deadlineOrTrigger: string;
  consequenceOfBreach: string;
}

export interface AnalysisResult {
  docId: string;
  overallRiskScore: number;
  overallRiskTier: RiskLevel;
  executiveSummary: string;
  perspective: UserPerspective;
  findings: Finding[];
  obligations: ObligationItem[];
  missingStandardProtections: string[];
  analyzedAt: string;
  isFallbackDeterministic?: boolean;
}
