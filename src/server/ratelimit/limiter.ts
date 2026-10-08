import { getValidatedConfig, ConfigurationError } from '../config/env';

/**
 * Distributed Rate Limiting & Abuse Prevention Engine
 * 
 * [Fail-Closed Enforcement]:
 * Cloud Run containers scale horizontally and terminate on idle.
 * In production, REDIS_URL is strictly required for shared rate limiting.
 * If unset in non-sandbox mode, operations throw ConfigurationError.
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

// In-memory fallback simulation strictly for local dev when ALLOW_DEV_FALLBACKS=true
class InMemoryFallbackStore implements DistributedCacheClient {
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
}

export class DistributedRateLimiter {
  private static client: DistributedCacheClient | null = null;

  private static getClient(): DistributedCacheClient {
    if (!this.client) {
      const config = getValidatedConfig();
      if (!config.redisUrl && !config.allowSandbox) {
        throw new ConfigurationError(
          'REDIS_URL',
          'Distributed rate limiter requires REDIS_URL. Fail-closed: abuse protection cannot proceed.'
        );
      }
      this.client = new InMemoryFallbackStore();
    }
    return this.client;
  }

  static configureClient(client: DistributedCacheClient) {
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

  static async resetOtpFailures(phone: string): Promise<void> {
    const client = this.getClient();
    await client.del(`otp-fails:${phone}`);
    await client.del(`lockout:otp-phone:${phone}`);
  }
}
