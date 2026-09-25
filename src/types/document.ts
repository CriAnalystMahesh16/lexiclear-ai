export type DocumentType = 
  | 'independent_contractor_agreement'
  | 'commercial_or_residential_lease'
  | 'non_disclosure_agreement'
  | 'terms_of_service'
  | 'custom_contract';

export type UserPerspective = 
  | 'service_provider_or_contractor'
  | 'client_or_hiring_entity'
  | 'tenant'
  | 'landlord'
  | 'neutral_observer';

export interface ClauseSegment {
  id: string;
  sectionNumber: string;
  title: string;
  rawText: string;
  redactedText: string;
  startIndex: number;
  endIndex: number;
}
