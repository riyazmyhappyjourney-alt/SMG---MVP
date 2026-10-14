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
// SECURE IN-MEMORY PASSWORD RESET TOKEN REGISTRY (DPDP & ZERO-SCHEMA MIGRATION)
// Stores only SHA-256 token hashes, enforcing single-use and 15-minute expiration
// ====================================================================

import { createHash } from 'crypto';

interface PasswordResetRecord {
  tokenHash: string;
  email: string;
  userId: string;
  expiresAt: number;
  isConsumed: boolean;
  createdAt: number;
}

const passwordResetStore = new Map<string, PasswordResetRecord>();

/**
 * Generates a cryptographically secure single-use password reset token.
 * Stores only the SHA-256 hash of the token.
 * Token expires after 15 minutes (900,000 ms).
 */
export function generatePasswordResetToken(userId: string, email: string): { token: string; expiresAt: Date } {
  const now = Date.now();
  // Purge expired tokens
  for (const [hash, record] of Array.from(passwordResetStore.entries())) {
    if (record.expiresAt < now || record.isConsumed) {
      passwordResetStore.delete(hash);
    }
  }

  // Generate 32 bytes (256-bit) cryptographically random token
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const ttlMs = 15 * 60 * 1000; // 15 minutes
  const expiresAt = new Date(now + ttlMs);

  passwordResetStore.set(tokenHash, {
    tokenHash,
    email: email.toLowerCase().trim(),
    userId,
    expiresAt: expiresAt.getTime(),
    isConsumed: false,
    createdAt: now,
  });

  return { token: rawToken, expiresAt };
}

/**
 * Validates a password reset token by comparing its SHA-256 hash.
 * Checks for expiration and single-use status.
 */
export function validatePasswordResetToken(rawToken: string): { valid: boolean; email?: string; userId?: string; reason?: string } {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
    return { valid: false, reason: 'INVALID_TOKEN_FORMAT' };
  }

  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const record = passwordResetStore.get(tokenHash);

  if (!record) {
    return { valid: false, reason: 'TOKEN_NOT_FOUND' };
  }

  if (record.isConsumed) {
    return { valid: false, reason: 'TOKEN_ALREADY_USED' };
  }

  if (Date.now() > record.expiresAt) {
    passwordResetStore.delete(tokenHash);
    return { valid: false, reason: 'TOKEN_EXPIRED' };
  }

  return { valid: true, email: record.email, userId: record.userId };
}

/**
 * Consumes a password reset token upon successful password update, preventing reuse.
 */
export function consumePasswordResetToken(rawToken: string): boolean {
  if (!rawToken) return false;
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const record = passwordResetStore.get(tokenHash);
  if (!record) return false;
  record.isConsumed = true;
  passwordResetStore.delete(tokenHash);
  return true;
}
