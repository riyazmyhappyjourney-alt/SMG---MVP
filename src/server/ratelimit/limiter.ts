import { getValidatedConfig, ConfigurationError } from '../config/env';
import { executeQuery } from '../db/pool';

/**
 * Rate Limiting & Abuse Prevention Engine
 * 
 * [Shared Distributed Architecture]:
 * Operates with shared atomic PostgreSQL rate-limit storage across all Cloud Run
 * and clustered server instances.
 * 
 * When REDIS_URL is configured and an external Redis driver is attached via configureClient,
 * it operates via the custom attached cache.
 * 
 * Local dev sandbox mode uses InMemoryFallbackStore strictly when ALLOW_DEV_FALLBACKS=true.
 */

export interface DistributedCacheClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode?: string, duration?: number) => Promise<unknown>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  del: (key: string) => Promise<number>;
  ttl: (key: string) => Promise<number>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
  reason?: string;
}

// In-memory fallback simulation strictly for isolated unit testing / local sandbox without DB
export class InMemoryFallbackStore implements DistributedCacheClient {
  private store = new Map<string, { val: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.val;
  }

  async set(key: string, value: string, _mode?: string, duration?: number): Promise<unknown> {
    const expiresAt = duration ? Date.now() + duration * 1000 : Infinity;
    this.store.set(key, { val: value, expiresAt });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const cur = await this.get(key);
    const nextVal = cur ? parseInt(cur, 10) + 1 : 1;
    const expiresAt = this.store.get(key)?.expiresAt || Date.now() + 3600 * 1000;
    this.store.set(key, { val: nextVal.toString(), expiresAt });
    return nextVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    return Math.max(0, Math.ceil((item.expiresAt - Date.now()) / 1000));
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Production Shared Rate Limit Store backed by PostgreSQL.
 * Provides atomic, multi-instance rate limits and lockout tracking across all containers.
 */
export class PostgresRateLimitStore implements DistributedCacheClient {
  private static tableEnsured = false;

  private async ensureTable(): Promise<void> {
    if (PostgresRateLimitStore.tableEnsured) return;
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS shared_rate_limits (
          key VARCHAR(255) PRIMARY KEY,
          val TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_shared_rate_limits_exp ON shared_rate_limits (expires_at);
      `);
      PostgresRateLimitStore.tableEnsured = true;
    } catch (err: any) {
      // Table check note
      console.warn('[PostgresRateLimitStore] Table initialization note:', err.message);
    }
  }

  async get(key: string): Promise<string | null> {
    await this.ensureTable();
    const res = await executeQuery<{ val: string }>(
      `SELECT val FROM shared_rate_limits WHERE key = $1 AND expires_at > NOW() LIMIT 1;`,
      [key]
    );
    if (!res.rows || res.rows.length === 0) return null;
    return res.rows[0].val;
  }

  async set(key: string, value: string, _mode?: string, duration?: number): Promise<unknown> {
    await this.ensureTable();
    const durationSeconds = typeof duration === 'number' && duration > 0 ? duration : 3600;
    await executeQuery(
      `INSERT INTO shared_rate_limits (key, val, expires_at, updated_at)
       VALUES ($1, $2, NOW() + ($3 || ' seconds')::interval, NOW())
       ON CONFLICT (key) DO UPDATE
       SET val = EXCLUDED.val,
           expires_at = EXCLUDED.expires_at,
           updated_at = NOW();`,
      [key, String(value), durationSeconds]
    );
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    await this.ensureTable();
    const res = await executeQuery<{ val: string }>(
      `INSERT INTO shared_rate_limits (key, val, expires_at, updated_at)
       VALUES ($1, '1', NOW() + INTERVAL '1 hour', NOW())
       ON CONFLICT (key) DO UPDATE
       SET val = CASE 
         WHEN shared_rate_limits.expires_at <= NOW() THEN '1'
         ELSE (COALESCE(NULLIF(shared_rate_limits.val, '')::integer, 0) + 1)::text
       END,
       expires_at = CASE 
         WHEN shared_rate_limits.expires_at <= NOW() THEN NOW() + INTERVAL '1 hour'
         ELSE shared_rate_limits.expires_at
       END,
       updated_at = NOW()
       RETURNING val;`,
      [key]
    );
    const valStr = res.rows[0]?.val || '1';
    return parseInt(valStr, 10);
  }

  async expire(key: string, seconds: number): Promise<number> {
    await this.ensureTable();
    await executeQuery(
      `UPDATE shared_rate_limits
       SET expires_at = NOW() + ($2 || ' seconds')::interval, updated_at = NOW()
       WHERE key = $1;`,
      [key, seconds]
    );
    return 1;
  }

  async del(key: string): Promise<number> {
    await this.ensureTable();
    await executeQuery(`DELETE FROM shared_rate_limits WHERE key = $1;`, [key]);
    return 1;
  }

  async ttl(key: string): Promise<number> {
    await this.ensureTable();
    const res = await executeQuery<{ ttl: number }>(
      `SELECT GREATEST(0, CEIL(EXTRACT(EPOCH FROM (expires_at - NOW()))))::integer as ttl
       FROM shared_rate_limits
       WHERE key = $1 AND expires_at > NOW() LIMIT 1;`,
      [key]
    );
    if (!res.rows || res.rows.length === 0) return -2;
    return Number(res.rows[0].ttl);
  }
}

export class DistributedRateLimiter {
  private static client: DistributedCacheClient | null = null;

  public static getActiveLimiterType(): 'POSTGRES_SHARED_STORE' | 'CUSTOM_ATTACHED_STORE' | 'IN_MEMORY_FALLBACK' {
    if (this.client instanceof PostgresRateLimitStore) return 'POSTGRES_SHARED_STORE';
    if (this.client instanceof InMemoryFallbackStore) return 'IN_MEMORY_FALLBACK';
    if (this.client) return 'CUSTOM_ATTACHED_STORE';
    return 'POSTGRES_SHARED_STORE';
  }

  public static isDistributed(): boolean {
    const type = this.getActiveLimiterType();
    return type === 'POSTGRES_SHARED_STORE' || type === 'CUSTOM_ATTACHED_STORE';
  }

  private static getClient(): DistributedCacheClient {
    if (!this.client) {
      const config = getValidatedConfig();
      if (config.isProduction && !config.databaseUrl) {
        throw new ConfigurationError(
          'DATABASE_URL',
          'Production rate limiting requires a shared database connection. Fail-closed.'
        );
      }
      this.client = new PostgresRateLimitStore();
    }
    return this.client;
  }

  static configureClient(client: DistributedCacheClient | null) {
    this.client = client;
  }

  static async check(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const client = this.getClient();

    const lockoutKey = `lockout:${key}`;
    const isLocked = await client.get(lockoutKey);
    if (isLocked) {
      const ttl = await client.ttl(lockoutKey);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
        reason: 'Too many attempts. Resource is temporarily locked out.'
      };
    }

    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, windowSeconds);
    }

    if (count > limit) {
      const ttl = await client.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
        reason: 'Rate limit exceeded. Please try again later.'
      };
    }

    return { allowed: true, remaining: limit - count };
  }

  static async registerFailedOtpAttempt(phone: string): Promise<{ lockedOut: boolean; attemptsLeft: number }> {
    const client = this.getClient();
    const failKey = `otp-fails:${phone}`;
    const fails = await client.incr(failKey);
    if (fails === 1) {
      await client.expire(failKey, 1800);
    }

    if (fails >= 5) {
      await client.set(`lockout:otp-phone:${phone}`, '1', 'EX', 1800);
      return { lockedOut: true, attemptsLeft: 0 };
    }

    return { lockedOut: false, attemptsLeft: 5 - fails };
  }

  static async isPhoneLockedOut(phone: string): Promise<{ lockedOut: boolean; retryAfterSeconds: number }> {
    const client = this.getClient();
    const key = `lockout:otp-phone:${phone}`;
    const val = await client.get(key);
    if (val) {
      const ttl = await client.ttl(key);
      return { lockedOut: true, retryAfterSeconds: ttl > 0 ? ttl : 1800 };
    }
    return { lockedOut: false, retryAfterSeconds: 0 };
  }

  static async resetOtpFailures(phone: string): Promise<void> {
    const client = this.getClient();
    const failKey = `otp-fails:${phone}`;
    await client.del(failKey);
    await client.del(`lockout:otp-phone:${phone}`);
  }
}
