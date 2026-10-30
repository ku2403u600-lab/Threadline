export type EvidenceStatus =
  | 'verified'
  | 'supplier_claimed'
  | 'estimated_inferred'
  | 'not_confirmed'
  | 'illustrative_demo';

export interface FieldEvidence {
  status: EvidenceStatus;
  source: string | null;
  checked_at: string | null;
  note: string | null;
}

export interface SupplierLocation {
  city: string;
  state: string;
  country: string;
  address: string | null;
}

export interface SupplierContact {
  website: string | null;
  email: string | null;
  phone: string | null;
}

export interface CommercialTerms {
  price: number | null;
  price_unit: string | null; // e.g. "per metre", "per kg"
  currency: string; // "INR"
  moq: number | null;
  moq_unit: string | null; // e.g. "metres", "kg", "pieces"
  lead_time: string | null; // e.g. "3-5 business days (stock)", "2-3 weeks (weaving)"
  swatches: 'available_free' | 'available_paid' | 'not_available' | 'unknown';
}

export interface TechnicalSpecs {
  composition: string | null;
  gsm: number | null;
  width: string | null; // e.g. "44 inches", "58 inches"
  certifications: string[]; // e.g. ["GOTS", "OEKO-TEX Standard 100", "Craftmark"]
}

export interface SupplierRecord {
  supplier_id: string;
  name: string;
  supplier_type: string[];
  materials: string[];
  products_or_services: string[];
  location: SupplierLocation;
  contact: SupplierContact;
  commercial: CommercialTerms;
  technical: TechnicalSpecs;
  field_evidence: Record<string, FieldEvidence>;
  record_status: 'real_verified' | 'real_unverified' | 'illustrative_demo';
  last_reviewed_at: string | null;
  internal_notes?: string;
  rationale_tags?: string[];
  specialty_summary?: string;
}

export interface SourcingRequirements {
  garment: string | null;
  intended_use: string | null;
  material_preferences: string[];
  technical_constraints: string[];
  quantity: number | null;
  quantity_unit: string | null;
  budget: number | null;
  budget_unit: string | null;
  location: string | null;
  sustainability_criteria: string[];
}

export interface SourcingFilter {
  city?: string;
  state?: string;
  materials?: string[];
  max_moq?: number;
  max_price?: number;
  certifications_required?: string[];
  exclude_demo?: boolean;
}

export interface RankedSupplierResult {
  supplier: SupplierRecord;
  matchScore: number;
  matchReasons: string[];
  tradeOffs: string[];
  missingFields: string[];
  isDemo: boolean;
}

export interface RfqDraft {
  subject: string;
  recipientName: string;
  recipientContact: string | null;
  supplierId: string;
  garmentProject: string;
  materialsRequested: string;
  quantityRequested: string;
  deliveryLocation: string;
  questions: string[];
  body: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: {
    name: string;
    mimeType: string;
    size: number;
    dataUrl?: string; // for thumbnail display
  }[];
  shortlist?: RankedSupplierResult[];
  rfqDraft?: RfqDraft;
  visualObservations?: {
    visibleCues: string[];
    uncertainProperties: string[];
    recommendedVerifications: string[];
  };
  tradeOffNotes?: string[];
  missingRequirementQuestions?: string[];
}

export interface TestScenario {
  id: string;
  scenario: string;
  expectedBehavior: string;
  status: 'not run' | 'passed' | 'failed' | 'blocked';
  observedBehavior?: string;
  scores?: {
    accuracy: number; // 0-2
    clarity: number;
    scope: number;
    evidence: number;
    privacyTone: number;
    accessibility: number;
  };
  testerNotes?: string;
  testedAt?: string;
}

export type VoiceGender = 'female' | 'male';

export interface VoiceOption {
  id: string; // 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon'
  name: string;
  gender: VoiceGender;
  personaLabel: string;
  description: string;
  speechStyleDescription: string;
  pitch: number;
  rate: number;
}

