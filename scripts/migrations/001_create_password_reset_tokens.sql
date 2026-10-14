-- ==============================================================================
-- SellMyGhar.in - Migration 001: Create password_reset_tokens Table
-- Description: Single-use, durable password reset tokens with SHA-256 hash storage
-- ==============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_consumed BOOLEAN NOT NULL DEFAULT false,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient sibling token cancellation and user audit
CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_active 
  ON password_reset_tokens (user_id, is_consumed, expires_at);

-- Partial index for low-overhead expired token cleanup
CREATE INDEX IF NOT EXISTS idx_pwd_reset_expiry 
  ON password_reset_tokens (expires_at) 
  WHERE is_consumed = false;
