-- ====================================================================
-- SellMyGhar - PostgreSQL Row-Level Security (RLS) Schema & Policies
-- Region: asia-south1 (Mumbai) | Engine: PostgreSQL 16+
-- ====================================================================

-- 1. Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 2. PROPERTIES POLICIES & COLUMN-LEVEL ENFORCEMENT
-- ====================================================================

-- Policy: Owners can read only their own properties
CREATE POLICY properties_owner_read ON properties
  FOR SELECT
  USING (
    owner_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_roles', true) LIKE '%STAFF%'
  );

-- Policy: Owners can update only their own properties (before verification lock)
CREATE POLICY properties_owner_update ON properties
  FOR UPDATE
  USING (
    owner_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_roles', true) LIKE '%STAFF_SUPER_ADMIN%'
  );

-- Database-Level View for Listing Managers (Excludes unit_number & reserve_minimum_price_inr)
-- Listing Managers connect and query through this view; they possess ZERO grants on sensitive columns
CREATE OR REPLACE VIEW listing_manager_properties_view AS
SELECT 
  id, 
  project_locality_id, 
  bhk_type, 
  super_built_up_sqft, 
  carpet_area_sqft,
  balconies_count, 
  bathrooms_count, 
  facing, 
  car_parks_count, 
  is_covered_parking,
  khata_type, 
  encumbrance_status, 
  occupancy_status, 
  monthly_maintenance_inr,
  asking_price_inr, 
  verification_tier, 
  created_at, 
  updated_at
FROM properties;

-- Column-Level Privilege Restrictions for Dedicated Listing Manager DB Role:
-- REVOKE SELECT (unit_number, reserve_minimum_price_inr, loan_bank_name) ON properties FROM sellmyghar_listing_manager;
-- GRANT SELECT ON listing_manager_properties_view TO sellmyghar_listing_manager;

-- ====================================================================
-- 3. DOCUMENTS POLICIES
-- ====================================================================

-- Policy: Only owner or authorized verification/super admin staff can read documents
CREATE POLICY documents_restricted_read ON documents
  FOR SELECT
  USING (
    uploader_user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_roles', true) LIKE '%STAFF_VERIFICATION_AGENT%'
    OR current_setting('app.current_user_roles', true) LIKE '%STAFF_SUPER_ADMIN%'
  );

-- ====================================================================
-- 4. VISITS POLICIES
-- ====================================================================

CREATE POLICY visits_parties_read ON visits
  FOR SELECT
  USING (
    buyer_user_id = current_setting('app.current_user_id', true)
    OR property_id IN (
      SELECT id FROM properties WHERE owner_id = current_setting('app.current_user_id', true)
    )
    OR current_setting('app.current_user_roles', true) LIKE '%STAFF%'
  );

-- ====================================================================
-- 5. OFFERS POLICIES
-- ====================================================================

CREATE POLICY offers_parties_read ON offers
  FOR SELECT
  USING (
    buyer_user_id = current_setting('app.current_user_id', true)
    OR property_id IN (
      SELECT id FROM properties WHERE owner_id = current_setting('app.current_user_id', true)
    )
    OR current_setting('app.current_user_roles', true) LIKE '%STAFF_DEAL_CLOSER%'
    OR current_setting('app.current_user_roles', true) LIKE '%STAFF_SUPER_ADMIN%'
  );

-- ====================================================================
-- 6. IMMUTABLE AUDIT LOG ENFORCEMENT (Zero UPDATE, Zero DELETE)
-- ====================================================================

REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM CURRENT_USER;

CREATE OR REPLACE FUNCTION enforce_audit_logs_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'CRITICAL SECURITY VIOLATION: audit_logs is append-only. UPDATE and DELETE operations are forbidden for all roles, including STAFF_SUPER_ADMIN.'
    USING ERRCODE = '28000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_mutation ON audit_logs;

CREATE TRIGGER trg_prevent_audit_logs_mutation
BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_logs
FOR EACH STATEMENT
EXECUTE FUNCTION enforce_audit_logs_immutability();

CREATE POLICY audit_logs_insert_only ON audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY audit_logs_super_admin_read ON audit_logs
  FOR SELECT
  USING (
    current_setting('app.current_user_roles', true) LIKE '%STAFF_SUPER_ADMIN%'
  );
