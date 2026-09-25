export type PIIType = 
  | 'NAME' 
  | 'EMAIL' 
  | 'PHONE' 
  | 'SSN' 
  | 'AADHAAR'
  | 'PAN'
  | 'BANK_ACCOUNT'
  | 'FINANCIAL' 
  | 'ADDRESS';

export interface PIIEntity {
  id: string;
  type: PIIType;
  originalValue: string;
  token: string;
  startIndex: number;
  endIndex: number;
}

export interface RedactionMap {
  [token: string]: string;
}

export interface RedactedDocument {
  docId: string;
  documentType: string;
  perspective: string;
  rawText: string;
  redactedText: string;
  entities: PIIEntity[];
  redactionMap: RedactionMap;
}
