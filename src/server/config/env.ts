import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

/**
 * Fail-Closed Server Configuration & Credential Validator
 * 
 * [Non-Negotiable Architecture Constraint]:
 * System MUST fail closed. Missing or insecure credentials (DATABASE_URL, REDIS_URL,
 * JWT_SECRET, GCS_PRIVATE_BUCKET) must throw clear, fatal configuration errors
 * rather than silently pretending to persist data or defaulting to insecure mocks.
 */

export class ConfigurationError extends Error {
  constructor(public readonly missingKey: string, message: string) {
    super(`[FATAL CONFIG FAIL-CLOSED] ${missingKey}: ${message}`);
    this.name = 'ConfigurationError';
  }
}

export interface AppConfig {
  databaseUrl: string;
  jwtSecret: Uint8Array;
  gcsPrivateBucket: string;
  gcpProjectId: string;
  redisUrl: string;
  isProduction: boolean;
  allowSandbox: boolean;
}

/**
 * Validates required configuration keys with strict fail-closed enforcement.
 */
export function getValidatedConfig(overrides?: { allowSandbox?: boolean }): AppConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowSandbox = overrides?.allowSandbox ?? (process.env.ALLOW_DEV_FALLBACKS === 'true' && !isProduction);

  // 1. DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (!allowSandbox) {
      throw new ConfigurationError(
        'DATABASE_URL',
        'PostgreSQL connection string is missing. Fail-closed: database operations cannot proceed.'
      );
    }
  }

  // 2. JWT_SECRET
  const jwtSecretStr = process.env.JWT_SECRET;
  if (!jwtSecretStr || jwtSecretStr.length < 32) {
    if (!allowSandbox) {
      throw new ConfigurationError(
        'JWT_SECRET',
        'Cryptographic secret is missing or under 32 characters. Fail-closed: session tokens cannot be signed securely.'
      );
    }
  }

  // 3. GCS_PRIVATE_BUCKET
  const gcsPrivateBucket = process.env.GCS_PRIVATE_BUCKET;
  if (!gcsPrivateBucket) {
    if (!allowSandbox) {
      throw new ConfigurationError(
        'GCS_PRIVATE_BUCKET',
        'Private storage bucket name is missing. Fail-closed: document uploads cannot proceed.'
      );
    }
  }

  // 4. REDIS_URL
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    if (!allowSandbox) {
      throw new ConfigurationError(
        'REDIS_URL',
        'Shared Redis / Memorystore connection string is missing. Fail-closed: distributed rate limiting and anti-toll fraud cannot proceed.'
      );
    }
  }

  const effectiveSecret = jwtSecretStr || 'sellmyghar-sandbox-fallback-secret-minimum-32-chars-long';

  return {
    databaseUrl: databaseUrl || '',
    jwtSecret: new TextEncoder().encode(effectiveSecret),
    gcsPrivateBucket: gcsPrivateBucket || 'sellmyghar-vault-asia-south1',
    gcpProjectId: process.env.GCP_PROJECT_ID || 'sellmyghar-prod',
    redisUrl: redisUrl || '',
    isProduction,
    allowSandbox,
  };
}
