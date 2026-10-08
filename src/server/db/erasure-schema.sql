-- ====================================================================
-- SellMyGhar - DPDP Act 2023 Statutory Erasure Ledger Schema
-- Region: asia-south1 (Mumbai) | Engine: PostgreSQL 16+
-- ====================================================================

CREATE TABLE IF NOT EXISTS erasure_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  phone_hash VARCHAR(128) NOT NULL,
  request_status VARCHAR(32) NOT NULL, -- 'PENDING_ADMIN_REVIEW' | 'APPROVED_EXECUTED' | 'REJECTED_STATUTORY_HOLD'
  requester_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_admin_id VARCHAR(64),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  records_affected_summary JSONB,
  client_ip_hash VARCHAR(128) NOT NULL
);

-- Fast lookup indexes for admin review queues and user status checks
CREATE INDEX IF NOT EXISTS idx_erasure_user_status ON erasure_requests (user_id, request_status);
CREATE INDEX IF NOT EXISTS idx_erasure_pending_queue ON erasure_requests (requested_at) WHERE request_status = 'PENDING_ADMIN_REVIEW';

-- ====================================================================
-- IMMUTABLE AUDIT SAFEGUARDS (Zero DELETE, Zero TRUNCATE)
-- Prevents erasure request history from being erased
-- ====================================================================
REVOKE DELETE, TRUNCATE ON erasure_requests FROM PUBLIC;
REVOKE DELETE, TRUNCATE ON erasure_requests FROM CURRENT_USER;

CREATE OR REPLACE FUNCTION enforce_erasure_requests_no_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'CRITICAL SECURITY VIOLATION: erasure_requests records are permanent legal audit artifacts. DELETE and TRUNCATE operations are strictly forbidden.'
    USING ERRCODE = '28000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_erasure_delete ON erasure_requests;

CREATE TRIGGER trg_prevent_erasure_delete
BEFORE DELETE OR TRUNCATE ON erasure_requests
FOR EACH STATEMENT
EXECUTE FUNCTION enforce_erasure_requests_no_delete();
