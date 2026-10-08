/**
 * SellMyGhar Core Domain Entities & Schemas
 * 
 * Strict boundary between Private Records (stored in DB/Private Buckets)
 * and Public Projections (exposed via public read-only listing APIs).
 */

// -------------------------------------------------------------
// 1. Users & Profiles
// -------------------------------------------------------------
export type UserRole = 
  | 'OWNER'
  | 'BUYER'
  | 'STAFF_AGENT'
  | 'STAFF_VERIFIER'
  | 'STAFF_ADMIN';

export type ContactChannel = 'WHATSAPP' | 'CALL' | 'SMS';

export interface UserPrivateRecord {
  id: string; // Auth UID
  primary_phone: string; // E.164 (e.g., +919876543210)
  phone_verified_at: string; // ISO 8601
  email: string | null;
  full_name: string;
  roles: UserRole[];
  preferred_contact_channel: ContactChannel;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

// -------------------------------------------------------------
// 2. Seller Leads (Top of Funnel before full onboarding)
// -------------------------------------------------------------
export type LeadStatus = 
  | 'NEW'
  | 'CONTACTED'
  | 'FOLLOW_UP'
  | 'SITE_VISIT'
  | 'NEGOTIATION'
  | 'CONVERTED'
  | 'LOST'
  | 'QUALIFIED'
  | 'PROPERTY_DETAILS'
  | 'VERIFICATION'
  | 'LISTED'
  | 'BUYER_MATCHED'
  | 'VISIT'
  | 'CLOSED';

export type BHKType = '1BHK' | '2BHK' | '2.5BHK' | '3BHK' | '3.5BHK' | '4BHK+' | 'PENTHOUSE';

export interface SellerLeadPrivateRecord {
  id: string;
  owner_name: string;
  phone: string;
  apartment_society_name: string;
  locality_id: string;
  bhk_type: BHKType;
  expected_price_inr: number | null;
  lead_status: LeadStatus;
  assigned_staff_id: string | null;
  assigned_at?: string | null;
  property_id?: string | null;
  next_follow_up_at?: string | null;
  follow_up_notes?: string | null;
  notes?: string | null;
  attribution: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    ip_hash: string; // SHA-256 hash of client IP
  };
  consent_record_id: string; // Statutory DPDP reference
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// 3. Properties (Canonical Private Asset Record)
// -------------------------------------------------------------
export type KhataType = 'A_KHATA' | 'B_KHATA' | 'E_KHATA' | 'PANCHAYAT' | 'NOT_SURE';
export type OccupancyStatus = 'SELF_OCCUPIED' | 'TENANT_OCCUPIED' | 'VACANT';
export type PropertyFacing = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST' | 'NORTH_EAST' | 'NORTH_WEST' | 'SOUTH_EAST' | 'SOUTH_WEST';
export type VerificationTier = 
  | 'LEVEL_0_UNVERIFIED'
  | 'LEVEL_1_OWNER_DECLARED' // Phone OTP + Owner Declaration signed
  | 'LEVEL_2_DOCS_REVIEWED'   // Sale deed + Katha + EC basic review
  | 'LEVEL_3_PHYSICALLY_INSPECTED'; // SellMyGhar field agent visited & tagged

export interface PropertyPrivateRecord {
  id: string;
  owner_id: string; // FK to UserPrivateRecord.id
  project_locality_id: string; // FK to ProjectLocalityRecord.id
  
  // SENSITIVE PRIVATE IDENTIFIERS (Never sent to public/buyers)
  unit_number: string; // Flat/Villa number e.g., "A-1204"
  wing_tower: string;   // e.g., "Tower 2, Wing B"
  unit_floor: number;   // Exact floor (e.g., 12)
  total_floors: number; // e.g., 18
  
  // Physical Specifications
  bhk_type: BHKType;
  super_built_up_sqft: number;
  carpet_area_sqft: number;
  balconies_count: number;
  bathrooms_count: number;
  facing: PropertyFacing;
  car_parks_count: number;
  is_covered_parking: boolean;
  
  // Legal & Financial
  khata_type: KhataType;
  encumbrance_status: 'CLEAN' | 'EXISTING_LOAN' | 'UNDER_DISPUTE' | 'PENDING_CHECK';
  loan_bank_name: string | null;
  occupancy_status: OccupancyStatus;
  monthly_maintenance_inr: number;
  
  // Pricing Strategy (Private negotiation bounds)
  asking_price_inr: number;
  reserve_minimum_price_inr: number; // Strictly confidential to owner & senior deal closer
  
  // Verification State
  verification_tier: VerificationTier;
  internal_verification_notes: string;
  crm_status?: LeadStatus;
  
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// 4. Listings (Public Discovery Projection)
// -------------------------------------------------------------
export type ListingStatus = 'ACTIVE' | 'UNDER_OFFER' | 'SOLD' | 'WITHDRAWN';

export interface PublicListingPhoto {
  id: string;
  cdn_url: string;
  caption: string;
  is_cover: boolean;
  order: number;
}

export interface PublicListingProjection {
  id: string; // Public listing ID e.g. "sgl-bng-9182"
  slug: string; // SEO friendly URL slug
  project_name: string; // e.g., "Prestige Falcon City"
  locality_name: string; // e.g., "Kanakapura Road, South Bengaluru"
  bhk_type: BHKType;
  super_built_up_sqft: number;
  carpet_area_sqft: number;
  floor_band: string; // Obfuscated band: e.g., "Mid Floor (Floors 6-12)"
  facing: PropertyFacing;
  bathrooms_count: number;
  car_parks_count: number;
  asking_price_inr: number;
  price_per_sqft_inr: number;
  photos: PublicListingPhoto[]; // EXIF metadata stripped, WebP compressed
  amenities: string[];
  public_verification_badge: 'OWNER_VERIFIED' | 'DOCS_CHECKED' | 'INSPECTED';
  status: ListingStatus;
  published_at: string;
}

// -------------------------------------------------------------
// 5. Projects & Localities (Master Bengaluru Registry)
// -------------------------------------------------------------
export interface ProjectLocalityRecord {
  id: string;
  name: string; // e.g., "Sobha Dream Acres"
  builder: string; // e.g., "Sobha Limited"
  locality: string; // e.g., "Panathur / Balagere"
  sub_zone: 'EAST_BENGALURU' | 'SOUTH_BENGALURU' | 'NORTH_BENGALURU' | 'WEST_BENGALURU' | 'CENTRAL';
  pincode: string;
  launch_year: number;
  approx_total_units: number;
  rera_registration_number: string | null;
  approx_coordinates: {
    lat: number;
    lng: number;
  }; // Complex gate level only, never unit
  amenities_available: string[];
  is_featured: boolean;
}

// -------------------------------------------------------------
// 6. Documents (Private Secure File Records)
// -------------------------------------------------------------
export type DocumentType = 
  | 'SALE_DEED'
  | 'PARENT_DEED'
  | 'KHATA_CERTIFICATE'
  | 'KHATA_EXTRACT'
  | 'ENCUMBRANCE_CERTIFICATE'
  | 'PROPERTY_TAX_RECEIPT'
  | 'ELECTRICITY_BILL'
  | 'OCCUPANCY_CERTIFICATE'
  | 'POSSESSION_LETTER';

export interface DocumentPrivateRecord {
  id: string;
  property_id: string;
  uploader_user_id: string;
  doc_type: DocumentType;
  storage_bucket_path: string; // Private bucket path e.g. "gs://sellmyghar-vault-asia-south1/docs/..."
  file_name: string;
  file_size_bytes: number;
  mime_type: 'application/pdf' | 'image/jpeg' | 'image/png';
  sha256_checksum: string;
  verification_status: 'PENDING_REVIEW' | 'VERIFIED' | 'DISCREPANCY_FLAGGED' | 'REJECTED';
  verified_by_staff_id: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// -------------------------------------------------------------
// 7. Buyer Enquiries
// -------------------------------------------------------------
export interface BuyerEnquiryPrivateRecord {
  id: string;
  listing_id: string;
  buyer_user_id: string | null;
  buyer_name: string;
  buyer_phone: string;
  funding_mode: 'PRE_APPROVED_LOAN' | 'SELF_FUNDED' | 'NEED_LOAN_ASSISTANCE' | 'EXPLORING';
  buying_timeline: 'IMMEDIATE_30_DAYS' | '1_TO_3_MONTHS' | '3_PLUS_MONTHS';
  status: 'NEW' | 'CONTACTED' | 'VISIT_PROPOSED' | 'VISIT_SCHEDULED' | 'DROPPED';
  consent_record_id: string;
  created_at: string;
}

// -------------------------------------------------------------
// 8. Visits (Physical Property Inspection Coordination)
// -------------------------------------------------------------
export type VisitStatus = 
  | 'REQUESTED'
  | 'OWNER_CONFIRMED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'BUYER_NO_SHOW';

export const ACTIVE_VISIT_STATUSES: readonly VisitStatus[] = [
  'REQUESTED',
  'OWNER_CONFIRMED',
  'RESCHEDULED',
] as const;

export interface VisitPrivateRecord {
  id: string;
  property_id: string;
  listing_id: string;
  buyer_user_id: string;
  assigned_staff_id: string;
  scheduled_slot: string; // ISO 8601
  status: VisitStatus;
  owner_notes: string | null;
  buyer_feedback_rating: number | null; // 1-5
  buyer_feedback_notes: string | null;
  staff_visit_summary: string | null;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// 9. Offers & Negotiations
// -------------------------------------------------------------
export type OfferStatus = 
  | 'SUBMITTED'
  | 'PRESENTED_TO_OWNER'
  | 'COUNTERED_BY_OWNER'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED';

export const ACTIVE_OFFER_STATUSES: readonly OfferStatus[] = [
  'SUBMITTED',
  'PRESENTED_TO_OWNER',
  'COUNTERED_BY_OWNER',
  'ACCEPTED',
] as const;

export interface OfferPrivateRecord {
  id: string;
  property_id: string;
  buyer_user_id: string;
  offered_price_inr: number;
  expected_closing_days: number;
  loan_contingency: boolean;
  status: OfferStatus;
  counter_price_inr: number | null;
  staff_negotiation_notes: string | null;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// 10. Deals & Transactions
// -------------------------------------------------------------
export type DealStage = 
  | 'TOKEN_ADVANCE'
  | 'AGREEMENT_TO_SELL'
  | 'BUYER_LOAN_SANCTION'
  | 'SALE_DEED_DRAFT'
  | 'SUB_REGISTRAR_REGISTRATION'
  | 'COMMISSION_INVOICED'
  | 'COMPLETED';

export const ACTIVE_DEAL_STAGES: readonly DealStage[] = [
  'TOKEN_ADVANCE',
  'AGREEMENT_TO_SELL',
  'BUYER_LOAN_SANCTION',
  'SALE_DEED_DRAFT',
  'SUB_REGISTRAR_REGISTRATION',
  'COMMISSION_INVOICED',
] as const;

export interface DealPrivateRecord {
  id: string;
  property_id: string;
  buyer_user_id: string;
  final_sale_price_inr: number;
  stage: DealStage;
  target_registration_date: string | null;
  sellmyghar_service_fee_inr: number;
  gst_invoice_number: string | null;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// 11. Statutory DPDP Consents
// -------------------------------------------------------------
export type ConsentPurpose = 
  | 'SELLER_ONBOARDING'
  | 'BUYER_ENQUIRY'
  | 'VISIT_COORDINATION'
  | 'TRANSACTION_FACILITATION'
  | 'MARKETING_OPT_IN';

export interface ConsentPrivateRecord {
  id: string;
  phone: string;
  user_id: string | null;
  purpose: ConsentPurpose;
  notice_version: string; // e.g. "dpdp-v1-202609"
  is_consented: boolean;
  consented_at: string;
  is_withdrawn: boolean;
  withdrawn_at: string | null;
  ip_hash: string;
  user_agent_hash: string;
}

// -------------------------------------------------------------
// 12. Security Audit Logs
// -------------------------------------------------------------
export interface AuditLogPrivateRecord {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_entity: string;
  target_entity_id: string;
  ip_address: string;
  timestamp: string;
  diff_summary: Record<string, unknown>;
}

// -------------------------------------------------------------
// 13. Staff CRM Tasks
// -------------------------------------------------------------
export interface TaskPrivateRecord {
  id: string;
  assigned_staff_id: string;
  related_entity_type: 'SELLER_LEAD' | 'PROPERTY' | 'BUYER_ENQUIRY' | 'VISIT' | 'DEAL';
  related_entity_id: string;
  due_at: string;
  task_type: 'CALL_SELLER' | 'COLLECT_DOCS' | 'SCHEDULE_INSPECTION' | 'FOLLOWUP_OFFER';
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  completion_notes: string | null;
  created_at: string;
}
