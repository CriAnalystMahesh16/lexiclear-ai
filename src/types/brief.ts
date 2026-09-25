import { DocumentType, UserPerspective } from './document';
import { RiskLevel } from './analysis';

export interface ConsultationDocket {
  docTitle: string;
  documentType: DocumentType;
  perspective: UserPerspective;
  generatedDate: string;
  executiveSummary: string;
  overallRiskTier: RiskLevel;
  overallRiskScore: number;
  keyConcerns: {
    title: string;
    level: RiskLevel;
    originalQuote: string;
    plainExplanation: string;
    counterProposal: string;
    questionsForAttorney: string[];
  }[];
  statutoryNoticeDisclaimer: string;
}
