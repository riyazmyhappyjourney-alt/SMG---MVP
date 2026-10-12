-- ====================================================================
-- SellMyGhar.in - Unified Staging DDL Initialization Script
-- Target Environment: Supabase PostgreSQL 16+ (Clean / Empty Project)
-- Total Tables: 19 | Safe Re-execution: Idempotent | RLS: Excluded
-- Statutory Retention Safeguards: ON DELETE RESTRICT on core property & deal ledgers
-- ====================================================================

BEGIN;

-- ====================================================================
-- TIER 1: INDEPENDENT TABLES (ZERO FOREIGN KEY DEPENDENCIES)
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(64) UNIQUE,
  email VARCHAR(255),
  display_name VARCHAR(120),
  password_hash VARCHAR(255),
  token_version INT NOT NULL DEFAULT 1,
  roles TEXT[] NOT NULL DEFAULT '{BUYER}',
  module_permissions TEXT[] NOT NULL DEFAULT '{}',
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone) WHERE phone IS NOT NULL;

-- 2. Consents Table (DPDP Notice & Consent Audit Records)
CREATE TABLE IF NOT EXISTS consents (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
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

-- 3. Audit Logs Table (Immutable SIEM / Statutory Audit Trail)
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);

-- 4. OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(64) NOT NULL,
  otp_hash VARCHAR(128) NOT NULL,
  attempts_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  is_consumed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications (phone);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_active ON otp_verifications (phone, is_consumed, expires_at);

-- 5. Partner Logos CMS Table
CREATE TABLE IF NOT EXISTS partner_logos (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_logos_active ON partner_logos (is_active, display_order);

-- 6. Partner Section Settings CMS Table
CREATE TABLE IF NOT EXISTS partner_section_settings (
  id VARCHAR(32) PRIMARY KEY,
  heading VARCHAR(255) NOT NULL,
  scroll_speed VARCHAR(32) NOT NULL DEFAULT 'normal',
  pause_on_hover BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Hero Slides CMS Table
CREATE TABLE IF NOT EXISTS hero_slides (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_first BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides (is_active, is_first DESC, display_order ASC);

-- 8. Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  template_key VARCHAR(64) PRIMARY KEY,
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  plain_text_template TEXT NOT NULL DEFAULT 'SellMyGhar notification update.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- TIER 2: PRIMARY BUSINESS ENTITIES (DEPEND ON TIER 1)
-- ====================================================================

-- 9. User Identities Table (OAuth & Phone Auth Linking)
CREATE TABLE IF NOT EXISTS user_identities (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(64),
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_identities_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON user_identities (user_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_lookup ON user_identities (provider, provider_user_id);

-- 10. Properties Table
-- [STATUTORY RETENTION SAFEGUARD]: ON DELETE RESTRICT guarantees user deletion
-- cannot purge properties subject to statutory limitation / tax audit retention.
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  project_locality_id VARCHAR(64) NOT NULL,
  unit_number VARCHAR(50) NOT NULL,
  wing_tower VARCHAR(50),
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
CREATE INDEX IF NOT EXISTS idx_properties_crm_status ON properties (crm_status);

-- 11. Seller Leads Table
CREATE TABLE IF NOT EXISTS seller_leads (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  owner_name VARCHAR(100),
  phone VARCHAR(64) NOT NULL,
  apartment_society_name VARCHAR(120) NOT NULL,
  locality_id VARCHAR(64) NOT NULL,
  bhk_type VARCHAR(20) NOT NULL,
  expected_price_inr BIGINT,
  listing_intent VARCHAR(20) NOT NULL DEFAULT 'SELL',
  lead_status VARCHAR(30) NOT NULL DEFAULT 'NEW',
  assigned_staff_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
  next_follow_up_at TIMESTAMPTZ,
  follow_up_notes TEXT,
  notes TEXT,
  attribution JSONB DEFAULT '{}'::jsonb,
  consent_record_id VARCHAR(64) REFERENCES consents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_leads_phone ON seller_leads (phone);
CREATE INDEX IF NOT EXISTS idx_seller_leads_status ON seller_leads (lead_status);
CREATE INDEX IF NOT EXISTS idx_seller_leads_property ON seller_leads (property_id);
CREATE INDEX IF NOT EXISTS idx_seller_leads_staff ON seller_leads (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_seller_leads_user ON seller_leads (user_id);

-- 12. Erasure Requests Table (DPDP Section 12 Statutory Compliance)
CREATE TABLE IF NOT EXISTS erasure_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  phone_hash VARCHAR(128) NOT NULL,
  request_status VARCHAR(32) NOT NULL,
  requester_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_admin_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  records_affected_summary JSONB,
  client_ip_hash VARCHAR(128) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_erasure_user_status ON erasure_requests (user_id, request_status);

-- ====================================================================
-- TIER 3: WORKFLOWS, MEDIA, OFFERS, VISITS & TRANSACTIONS
-- ====================================================================

-- 13. Documents Table (Title Diligence Vault with Dual Column Path Support)
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  uploader_user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  doc_type VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  storage_path VARCHAR(512),
  storage_bucket_path VARCHAR(512),
  sha256_checksum VARCHAR(64) NOT NULL,
  magic_bytes_status VARCHAR(32) NOT NULL DEFAULT 'VALID_PDF',
  av_engine VARCHAR(128) NOT NULL DEFAULT 'ClamAV-1.4.0',
  av_status VARCHAR(32) NOT NULL DEFAULT 'CLEAN',
  av_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
  verified_by_staff_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  discrepancy_note TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_property ON documents (property_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (verification_status);

-- 14. Deals Table (Statutory Transaction Records)
-- [STATUTORY RETENTION SAFEGUARD]: ON DELETE RESTRICT on property_id preserves
-- legal escrow and completed sale records under mandatory statutory holds.
CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  buyer_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  seller_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  deal_status VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_property ON deals (property_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals (deal_status);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_seller ON deals (buyer_user_id, seller_user_id);

-- 15. Property Offers Table
CREATE TABLE IF NOT EXISTS property_offers (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  lead_id VARCHAR(64) REFERENCES seller_leads(id) ON DELETE SET NULL,
  buyer_name VARCHAR(120) NOT NULL,
  buyer_phone VARCHAR(64) NOT NULL,
  offer_amount_inr BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
  notes TEXT,
  counter_offer_amount_inr BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_offers_property ON property_offers (property_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_status ON property_offers (status);
CREATE INDEX IF NOT EXISTS idx_property_offers_lead ON property_offers (lead_id);

-- 16. Visits Table
CREATE TABLE IF NOT EXISTS visits (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  lead_id VARCHAR(64) REFERENCES seller_leads(id) ON DELETE SET NULL,
  client_name VARCHAR(120) NOT NULL,
  client_phone VARCHAR(64) NOT NULL,
  visit_date VARCHAR(32) NOT NULL,
  visit_time VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
  assigned_staff_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  whatsapp_reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_property ON visits (property_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits (status);
CREATE INDEX IF NOT EXISTS idx_visits_staff ON visits (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_visits_lead ON visits (lead_id);

-- 17. Property Media Table
-- [MARKETING ASSET LIFECYCLE]: Stores replaceable marketing photos only.
-- Evidentiary legal records (title deeds, sale agreements, tax receipts, encumbrance certificates)
-- are strictly isolated in the `documents` table under ON DELETE RESTRICT.
-- ON DELETE CASCADE here is intentional for marketing photos when non-retained properties
-- are deleted; retained properties cannot be deleted due to RESTRICT guards on deals and documents.
CREATE TABLE IF NOT EXISTS property_media (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  checksum VARCHAR(64) NOT NULL,
  storage_path VARCHAR(512),
  mime_type VARCHAR(64),
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property ON property_media (property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_featured ON property_media (property_id, is_featured);

-- 18. Buyer Enquiries Table
CREATE TABLE IF NOT EXISTS buyer_enquiries (
  id VARCHAR(64) PRIMARY KEY,
  buyer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  preferred_locality_or_society VARCHAR(255) NOT NULL,
  bhk_type VARCHAR(20) NOT NULL,
  property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
  lead_status VARCHAR(30) NOT NULL DEFAULT 'NEW',
  assigned_staff_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
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

-- 19. Publication Notifications Table
CREATE TABLE IF NOT EXISTS publication_notifications (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_CONFIGURATION',
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  provider_response TEXT,
  provider_message_id VARCHAR(128),
  event_type VARCHAR(64),
  error_message TEXT,
  delivery_attempts INT DEFAULT 1,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pub_notif_status ON publication_notifications (status);
CREATE INDEX IF NOT EXISTS idx_pub_notif_property ON publication_notifications (property_id);

-- ====================================================================
-- IDEMPOTENT INITIAL CMS SEEDS (VERIFIED REPOSITORY ASSETS)
-- ====================================================================

-- Seed Partner Section Settings
INSERT INTO partner_section_settings (id, heading, scroll_speed, pause_on_hover, updated_at)
VALUES ('default', 'Trusted Channel Partners of', 'normal', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Hero Slides (Exact verified files from public/images/)
INSERT INTO hero_slides (id, title, alt_text, image_url, display_order, is_active, is_first, created_at, updated_at)
VALUES
  ('slide-township-sunset', 'Township Exterior at Sunset', 'Luxury Apartment Township at Sunset in Bengaluru', '/images/luxury-apartment-township-sunset.webp', 0, true, true, NOW(), NOW()),
  ('slide-clubhouse-amenities', 'Society Clubhouse and Amenities', 'Premium Society Clubhouse and Township Amenities', '/images/brigade-granada-clubhouse.webp', 1, true, false, NOW(), NOW()),
  ('slide-night-community', 'Modern Residential Community at Night', 'Modern Residential Community in Bengaluru', '/images/bengaluru-night-apartments.webp', 2, true, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Partner Logos (Exact verified files from public/images/partners/)
INSERT INTO partner_logos (id, name, logo_url, alt_text, display_order, is_active, created_at, updated_at)
VALUES
  ('partner-godrej', 'Godrej Properties', '/images/partners/godrej.svg', 'Godrej Properties Official Channel Partner', 0, true, NOW(), NOW()),
  ('partner-brigade', 'Brigade Group', '/images/partners/brigade.svg', 'Brigade Group Official Channel Partner', 1, true, NOW(), NOW()),
  ('partner-sobha', 'Sobha Realty', '/images/partners/sobha.svg', 'Sobha Realty Official Channel Partner', 2, true, NOW(), NOW()),
  ('partner-prestige', 'Prestige Group', '/images/partners/Prestige_Group.png', 'Prestige Group Official Channel Partner', 3, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;
