import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * Secure password hashing using Node.js built-in crypto.scrypt
 * Format: scrypt$<saltHex>$<derivedKeyHex>
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

/**
 * Timing-safe verification of a plaintext password against an scrypt hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const salt = Buffer.from(parts[1], 'hex');
  const originalKey = Buffer.from(parts[2], 'hex');

  try {
    const derivedKey = (await scryptAsync(password, salt, originalKey.length)) as Buffer;
    return timingSafeEqual(originalKey, derivedKey);
  } catch {
    return false;
  }
}

// ====================================================================
// POSTGRESQL-BACKED DURABLE SINGLE-USE PASSWORD RESET ENGINE
// Stores only SHA-256 token hashes, enforcing single-use and 15-minute expiration
// ====================================================================

import { createHash } from 'crypto';
import { getDbPool, executeQuery } from '../db/pool';

/**
 * Generates a cryptographically secure single-use password reset token.
 * Persists only the SHA-256 hash to PostgreSQL.
 * Token expires after 15 minutes (900,000 ms).
 */
export async function generatePasswordResetToken(userId: string, email: string): Promise<{ token: string; expiresAt: Date }> {
  // Generate 32 bytes (256-bit) cryptographically random token
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const ttlMs = 15 * 60 * 1000; // 15 minutes
  const expiresAt = new Date(Date.now() + ttlMs);
  const tokenId = `rst-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;

  // Persist token hash to PostgreSQL
  await executeQuery(
    `INSERT INTO password_reset_tokens (id, user_id, email, token_hash, expires_at, is_consumed, created_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW());`,
    [tokenId, userId, email.toLowerCase().trim(), tokenHash, expiresAt.toISOString()]
  );

  // Opportunistic background cleanup of expired tokens (> 24 hours)
  executeQuery(`DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '1 day';`).catch(() => {});

  return { token: rawToken, expiresAt };
}

/**
 * Non-mutating pre-validation of a password reset token by comparing its SHA-256 hash.
 * Checks for existence, expiration, and single-use status without taking locks or consuming.
 */
export async function validatePasswordResetToken(rawToken: string): Promise<{ valid: boolean; email?: string; userId?: string; reason?: string }> {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
    return { valid: false, reason: 'INVALID_TOKEN_FORMAT' };
  }

  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  const res = await executeQuery<{ user_id: string; email: string; expires_at: string; is_consumed: boolean }>(
    `SELECT user_id, email, expires_at, is_consumed
     FROM password_reset_tokens
     WHERE token_hash = $1
     LIMIT 1;`,
    [tokenHash]
  );

  if (!res.rows || res.rows.length === 0) {
    return { valid: false, reason: 'TOKEN_NOT_FOUND' };
  }

  const record = res.rows[0];

  if (record.is_consumed) {
    return { valid: false, reason: 'TOKEN_ALREADY_USED' };
  }

  if (new Date() > new Date(record.expires_at)) {
    return { valid: false, reason: 'TOKEN_EXPIRED' };
  }

  return { valid: true, email: record.email, userId: record.user_id };
}

/**
 * Atomically completes password reset within a single PostgreSQL transaction:
 * 1. Computes scrypt hash in memory first (0 database locks held).
 * 2. Checks token validity and obtains user_id.
 * 3. Locks the user row (FOR UPDATE) to strictly serialize all resets for this specific user.
 * 4. Atomically revalidates and consumes the token under the user lock.
 * 5. Updates user password, increments token_version (invalidating active sessions), resets lockouts.
 * 6. Invalidates all sibling reset tokens for this user.
 * 7. On any error, completely rolls back all mutations.
 */
export async function executePasswordResetCompletion(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; userId?: string; email?: string; error?: string }> {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
    return { success: false, error: 'Invalid or missing reset token.' };
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  // Pre-compute scrypt password hash before opening database transaction
  const newHash = await hashPassword(newPassword);

  // 1. Hash the submitted raw reset token
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  // 2. Perform a non-locking lookup to determine the token's associated user
  const initialLookup = await executeQuery<{ user_id: string; email: string; expires_at: string; is_consumed: boolean }>(
    `SELECT user_id, email, expires_at, is_consumed
     FROM password_reset_tokens
     WHERE token_hash = $1
     LIMIT 1;`,
    [tokenHash]
  );

  if (!initialLookup.rows || initialLookup.rows.length === 0) {
    return { success: false, error: 'Password reset link is invalid or expired. Please request a new link.' };
  }

  const record = initialLookup.rows[0];
  if (record.is_consumed || new Date() > new Date(record.expires_at)) {
    return { success: false, error: 'Password reset link is invalid, expired, or already used. Please request a new link.' };
  }

  const userId = record.user_id;

  // 3. Begin transaction
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 4. Lock the corresponding user row using SELECT ... FOR UPDATE (serializes concurrent resets for this user)
    const userLock = await client.query<{ id: string; is_active: boolean }>(
      `SELECT id, is_active FROM users WHERE id = $1 FOR UPDATE;`,
      [userId]
    );

    // 7. Verify that the user exists and remains active
    if (!userLock.rows || userLock.rows.length === 0 || !userLock.rows[0].is_active) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Account is deactivated or not found.' };
    }

    // 5 & 6. Revalidate token ownership, expiry, and unused status after obtaining user lock, and atomically consume
    const consumeRes = await client.query<{ id: string }>(
      `UPDATE password_reset_tokens
       SET is_consumed = true, consumed_at = NOW()
       WHERE token_hash = $1 AND user_id = $2 AND is_consumed = false AND expires_at > NOW()
       RETURNING id;`,
      [tokenHash, userId]
    );

    if (!consumeRes.rows || consumeRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Password reset link is invalid, expired, or already used. Please request a new link.' };
    }

    // 4. Update password hash, increment token_version to invalidate active sessions, reset failed attempts & lockout
    await client.query(
      `UPDATE users
       SET password_hash = $1,
           token_version = token_version + 1,
           locked_until = NULL,
           failed_login_attempts = 0,
           updated_at = NOW()
       WHERE id = $2;`,
      [newHash, userId]
    );

    // 5. Invalidate ALL other pending reset tokens for this user account (sibling invalidation)
    await client.query(
      `UPDATE password_reset_tokens
       SET is_consumed = true, consumed_at = NOW()
       WHERE user_id = $1 AND token_hash != $2 AND is_consumed = false;`,
      [userId, tokenHash]
    );

    await client.query('COMMIT');
    return { success: true, userId, email: record.email };
  } catch (txErr: any) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr: any) {
      console.error('[ResetPassword] Rollback failed:', rbErr);
    }
    throw txErr;
  } finally {
    client.release();
  }
}

/**
 * Backward compatibility helpers
 */
export async function consumePasswordResetToken(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const res = await executeQuery(
    `UPDATE password_reset_tokens SET is_consumed = true, consumed_at = NOW() WHERE token_hash = $1 AND is_consumed = false RETURNING id;`,
    [tokenHash]
  );
  return Boolean(res.rows && res.rows.length > 0);
}

export async function claimPasswordResetToken(rawToken: string): Promise<{ success: boolean; email?: string; userId?: string; reason?: string }> {
  const check = await validatePasswordResetToken(rawToken);
  if (!check.valid) return { success: false, reason: check.reason };
  return { success: true, email: check.email, userId: check.userId };
}

export function releasePasswordResetTokenClaim(_rawToken: string): boolean {
  return true;
}
