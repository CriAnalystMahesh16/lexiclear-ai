/**
 * LexiClear AI - Centralized Security and Model Constants
 * Phase 2 Architectural Boundary Controls
 */

export const SECURITY_LIMITS = {
  /** Maximum allowable document input length in characters (~500KB plaintext) */
  MAX_DOCUMENT_SIZE_CHARS: 500_000,

  /** Maximum excerpt length per clause or quotation in characters */
  MAX_EXCERPT_LENGTH_CHARS: 2_000,

  /** Maximum number of findings processed per document */
  MAX_FINDINGS_PER_DOC: 100,

  /** Maximum number of obligations extracted per document */
  MAX_OBLIGATIONS_PER_DOC: 200,

  /** Maximum allowable API payload size in bytes (1MB) */
  MAX_API_PAYLOAD_SIZE_BYTES: 1_000_000,

  /** Maximum characters for free-form user inquiry to document Q&A */
  MAX_USER_QUERY_CHARS: 500,

  /** Minimum characters for a valid contract document */
  MIN_DOCUMENT_SIZE_CHARS: 20,

  /** Rate limiter sliding window in milliseconds (1 minute) */
  RATE_LIMIT_WINDOW_MS: 60 * 1000,

  /** Maximum requests allowable per rate limit window */
  MAX_REQUESTS_PER_WINDOW: 60,

  /** Maximum tracked client IP entries in memory to prevent unbounded memory growth */
  MAX_TRACKED_CLIENTS: 5000,
} as const;

export const ALLOWED_RISK_LEVELS = [
  'LOW',
  'MODERATE',
  'HIGH',
  'CRITICAL'
] as const;

export const ALLOWED_RISK_CATEGORIES = [
  'unilateral_indemnification',
  'ip_ownership_overreach',
  'restrictive_covenants_noncompete',
  'termination_and_cure_penalties',
  'mandatory_arbitration_and_venue',
  'payment_and_withholding_traps',
  'unreasonable_warranties_liabilities',
  'confidentiality_overreach',
  'automatic_renewal_trap',
  'limitation_of_liability_asymmetry'
] as const;

export const ALLOWED_PII_TYPES = [
  'NAME',
  'EMAIL',
  'PHONE',
  'SSN',
  'AADHAAR',
  'PAN',
  'BANK_ACCOUNT',
  'CREDIT_CARD',
  'FINANCIAL',
  'ADDRESS'
] as const;

export const ALLOWED_LEGAL_DOMAINS = [
  'commercial_contracts',
  'employment_and_contractor',
  'real_estate_and_leasing',
  'intellectual_property',
  'consumer_and_saas_terms',
  'general_business'
] as const;

export const ALLOWED_LEGAL_TOPICS = [
  'indemnification_liability',
  'ip_assignment',
  'restrictive_covenants',
  'termination_rights',
  'payment_terms',
  'dispute_resolution',
  'confidentiality',
  'warranties_disclaimers',
  'renewal_terms'
] as const;

export const ALLOWED_USER_PERSPECTIVES = [
  'service_provider_or_contractor',
  'client_or_hiring_entity',
  'tenant',
  'landlord',
  'neutral_observer'
] as const;
