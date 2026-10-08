-- ====================================================================
-- SellMyGhar - PostgreSQL Core Tables Schema
-- Tables: users, consents, seller_leads, properties, documents, erasure_requests, audit_logs
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(120),
  password_hash VARCHAR(255),
  token_version INT NOT NULL DEFAULT 1,
  roles TEXT[] NOT NULL DEFAULT '{OWNER}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Consents Table
CREATE TABLE IF NOT EXISTS consents (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(64) NOT NULL,
  user_id VARCHAR(64),
  purpose VARCHAR(64) NOT NULL,
  notice_version VARCHAR(32) NOT NULL,
  is_consented BOOLEAN NOT NULL DEFAULT true,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_withdrawn BOOLEAN NOT NULL DEFAULT false,
  withdrawn_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_hash VARCHAR(128) NOT NULL,
  user_agent_hash VARCHAR(128) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consents_phone_purpose ON consents (phone, purpose);
CREATE INDEX IF NOT EXISTS idx_consents_active_status ON consents (phone, is_consented, is_withdrawn);
CREATE INDEX IF NOT EXISTS idx_consents_withdrawn_timestamp ON consents (withdrawn_at) WHERE is_withdrawn = true;

-- 3. Seller Leads Table
CREATE TABLE IF NOT EXISTS seller_leads (
  id VARCHAR(64) PRIMARY KEY,
  owner_name VARCHAR(100) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  apartment_society_name VARCHAR(120) NOT NULL,
  locality_id VARCHAR(64) NOT NULL,
  bhk_type VARCHAR(20) NOT NULL,
  expected_price_inr BIGINT,
  listing_intent VARCHAR(20) NOT NULL DEFAULT 'SELL',
  lead_status VARCHAR(30) NOT NULL DEFAULT 'NEW',
  assigned_staff_id VARCHAR(64),
  assigned_at TIMESTAMPTZ,
  property_id VARCHAR(64),
  next_follow_up_at TIMESTAMPTZ,
  follow_up_notes TEXT,
  notes TEXT,
  attribution JSONB,
  consent_record_id VARCHAR(64) REFERENCES consents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_leads_phone ON seller_leads (phone);
CREATE INDEX IF NOT EXISTS idx_seller_leads_status ON seller_leads (lead_status);
CREATE INDEX IF NOT EXISTS idx_seller_leads_property ON seller_leads (property_id);
CREATE INDEX IF NOT EXISTS idx_seller_leads_staff ON seller_leads (assigned_staff_id);

-- 4. Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  project_locality_id VARCHAR(64) NOT NULL,
  unit_number VARCHAR(50) NOT NULL,
  wing_tower VARCHAR(50) NOT NULL,
  unit_floor INT NOT NULL,
  total_floors INT NOT NULL,
  bhk_type VARCHAR(20) NOT NULL,
  super_built_up_sqft INT NOT NULL,
  carpet_area_sqft INT NOT NULL,
  balconies_count INT NOT NULL,
  bathrooms_count INT NOT NULL,
  facing VARCHAR(30) NOT NULL,
  car_parks_count INT NOT NULL,
  is_covered_parking BOOLEAN NOT NULL DEFAULT true,
  khata_type VARCHAR(30) NOT NULL,
  encumbrance_status VARCHAR(30) NOT NULL,
  loan_bank_name VARCHAR(100),
  occupancy_status VARCHAR(30) NOT NULL,
  monthly_maintenance_inr INT NOT NULL DEFAULT 0,
  asking_price_inr BIGINT NOT NULL,
  reserve_minimum_price_inr BIGINT NOT NULL,
  listing_intent VARCHAR(20) NOT NULL DEFAULT 'SELL',
  crm_status VARCHAR(30) NOT NULL DEFAULT 'NEW',
  listing_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  title VARCHAR(255),
  description TEXT,
  amenities JSONB DEFAULT '[]'::jsonb,
  property_type VARCHAR(64) DEFAULT 'Apartment',
  public_address TEXT,
  floor_band VARCHAR(64),
  developer_name VARCHAR(120),
  landmarks JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  verification_tier VARCHAR(50) NOT NULL DEFAULT 'LEVEL_1_OWNER_DECLARED',
  internal_verification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties (owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_locality ON properties (project_locality_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_status ON properties (listing_status);

-- 5. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  uploader_user_id VARCHAR(64) NOT NULL,
  doc_type VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  sha256_checksum VARCHAR(64) NOT NULL,
  magic_bytes_status VARCHAR(32) NOT NULL DEFAULT 'VALID_PDF',
  av_engine VARCHAR(128) NOT NULL DEFAULT 'ClamAV-1.4.0',
  av_status VARCHAR(32) NOT NULL DEFAULT 'CLEAN',
  av_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
  verified_by_staff_id VARCHAR(64),
  verified_at TIMESTAMPTZ,
  discrepancy_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_property ON documents (property_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (verification_status);

-- 6. Erasure Requests Table
CREATE TABLE IF NOT EXISTS erasure_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  phone_hash VARCHAR(128) NOT NULL,
  request_status VARCHAR(32) NOT NULL,
  requester_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_admin_id VARCHAR(64),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  records_affected_summary JSONB,
  client_ip_hash VARCHAR(128) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_erasure_user_status ON erasure_requests (user_id, request_status);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor_id VARCHAR(64) NOT NULL,
  actor_role VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  target_entity VARCHAR(64) NOT NULL,
  target_entity_id VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  diff_summary JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs (target_entity, target_entity_id);

-- 8. Deals Table
CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  deal_status VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Property Offers Table
CREATE TABLE IF NOT EXISTS property_offers (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  status VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Visits Table
CREATE TABLE IF NOT EXISTS visits (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  status VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Property Media Table (Supabase Storage integration for property-media bucket)
CREATE TABLE IF NOT EXISTS property_media (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL,
  url TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  checksum VARCHAR(64) NOT NULL,
  storage_path VARCHAR(512),
  mime_type VARCHAR(64),
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property ON property_media (property_id);

-- 12. Buyer Enquiries Table
CREATE TABLE IF NOT EXISTS buyer_enquiries (
  id VARCHAR(64) PRIMARY KEY,
  buyer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  preferred_locality_or_society VARCHAR(255) NOT NULL,
  bhk_type VARCHAR(20) NOT NULL,
  property_id VARCHAR(64),
  lead_status VARCHAR(30) NOT NULL DEFAULT 'NEW',
  assigned_staff_id VARCHAR(64),
  assigned_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  follow_up_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_phone ON buyer_enquiries (phone);
CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_status ON buyer_enquiries (lead_status);
CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_staff ON buyer_enquiries (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_property ON buyer_enquiries (property_id);

