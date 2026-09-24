export type EntityRole = 'customer' | 'supplier' | 'carrier' | 'manufacturer' | 'partner' | 'prospect';

export type EntityReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'needs_correction';
export type EntityDocumentationStatus = 'not_checked' | 'pending' | 'incomplete' | 'approved' | 'rejected' | 'expired';
export type EntityFinancialStatus = 'clear' | 'warning' | 'blocked';
export type EntityOperationalStatus = 'allowed' | 'warning' | 'blocked';

export interface ReviewEntityPayload {
  review_status: EntityReviewStatus;
  documentation_status?: EntityDocumentationStatus;
  status?: string;
  reviewed_by?: string;
  internal_notes?: string;
  document_notes?: string;
}

export interface BlockEntityPayload {
  blocked: boolean;
  reason?: string;
  updated_by?: string;
}

export interface Entity {
  id: string;
  company_id: string;
  legal_name: string | null;
  trade_name: string | null;
  display_name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  review_status: string;
  documentation_status: string;
  financial_status: string;
  operational_status: string;
  is_customer: number;
  is_supplier: number;
  is_carrier: number;
  is_manufacturer: number;
  is_partner: number;
  is_prospect: number;
  quick_register: number;
  duplicate_suspect: number;
  document_notes: string | null;
  internal_notes: string | null;
  created_from: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntitySuggestion {
  id: string;
  display_name: string;
  legal_name: string | null;
  trade_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  reason: string;
  strength: 'strong' | 'suspect' | 'weak';
}

export interface EntityFormData {
  legal_name: string;
  trade_name: string;
  display_name: string;
  document: string;
  email: string;
  phone: string;
  status: string;
  review_status: string;
  documentation_status: string;
  financial_status: string;
  operational_status: string;
  roles: EntityRole[];
  quick_register: boolean;
  document_notes: string;
  internal_notes: string;
}
