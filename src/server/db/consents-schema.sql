-- ====================================================================
-- SellMyGhar - DPDP Act 2023 Statutory Consents Ledger Schema
-- Region: asia-south1 (Mumbai) | Engine: PostgreSQL 16+
-- ====================================================================

CREATE TABLE IF NOT EXISTS consents (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  user_id VARCHAR(64),
  purpose VARCHAR(64) NOT NULL, -- 'SELLER_ONBOARDING' | 'MARKETING_OPT_IN' | 'VISIT_COORDINATION'
  notice_version VARCHAR(32) NOT NULL,
  is_consented BOOLEAN NOT NULL DEFAULT true,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_withdrawn BOOLEAN NOT NULL DEFAULT false,
  withdrawn_at TIMESTAMPTZ,
  ip_hash VARCHAR(128) NOT NULL,
  user_agent_hash VARCHAR(128) NOT NULL
);

-- Fast lookup indexes for outreach eligibility and withdrawal execution
CREATE INDEX IF NOT EXISTS idx_consents_phone_purpose ON consents (phone, purpose);
CREATE INDEX IF NOT EXISTS idx_consents_active_status ON consents (phone, is_consented, is_withdrawn);
CREATE INDEX IF NOT EXISTS idx_consents_withdrawn_timestamp ON consents (withdrawn_at) WHERE is_withdrawn = true;
