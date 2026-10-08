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
