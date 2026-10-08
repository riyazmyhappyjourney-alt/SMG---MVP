export type LeadStatus = 
  | 'NEW'
  | 'CONTACTED'
  | 'DOCS_REQUESTED'
  | 'IN_VERIFICATION'
  | 'VERIFIED'
  | 'LISTED'
  | 'SOLD';

export type VerificationStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLARIFICATION_REQUESTED';

export type StatutoryDocType = 
  | 'Parent Title Deed'
  | 'Mother Deed'
  | 'Khata Certificate'
  | 'Encumbrance Certificate'
  | 'BBMP Tax Receipt';

export interface OwnerDocument {
  id: string;
  property_id: string;
  doc_type: StatutoryDocType;
  file_name: string;
  file_size_kb?: number;
  uploaded_at: string;
  verification_status: VerificationStatus;
  feedback_notes?: string;
}

export interface OwnerPropertyMedia {
  id: string;
  property_id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'FLOOR_PLAN';
  url: string;
  is_featured: boolean;
}

export interface OwnerProperty {
  id: string;
  owner_user_id: string;
  society_name: string;
  locality: string;
  zone: 'East' | 'South' | 'North' | 'West' | 'Central';
  bhk_type: string;
  sbua_sqft: number;
  carpet_area_sqft?: number;
  floor_num: number;
  total_floors: number;
  facing: string;
  asking_price_inr: number;
  // NOTE: reserve_price_inr is strictly internal/staff-only and NEVER included here
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  lead_status: LeadStatus;
  khata_type: 'A-Khata' | 'B-Khata' | 'e-Aasthi' | 'Gram Panchayat';
  completion_score: number; // 0 to 100
  documents: OwnerDocument[];
  media: OwnerPropertyMedia[];
  view_count?: number;
  offers_count?: number;
  created_at: string;
  updated_at: string;
}

export interface OwnerDashboardStats {
  draftCount: number;
  inVerificationCount: number;
  docsNeededCount: number;
  listedCount: number;
  offersReceivedCount: number;
}
