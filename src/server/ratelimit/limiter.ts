import { getValidatedConfig } from '../config/env';

/**
 * Rate Limiting & Abuse Prevention Engine
 * 
 * [Rate Limiting Architecture]:
 * Operates with instance-local in-memory storage for MVP launch.
 * When REDIS_URL is configured in production, a shared cache can be attached;
 * otherwise, a clear production warning is logged that limits are instance-local.
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
  private static warnedInstanceLocal = false;

  public static getActiveLimiterType(): 'IN_MEMORY_INSTANCE_LOCAL' | 'CUSTOM_ATTACHED_STORE' {
    return this.client instanceof InMemoryFallbackStore || !this.client
      ? 'IN_MEMORY_INSTANCE_LOCAL'
      : 'CUSTOM_ATTACHED_STORE';
  }

  public static isDistributed(): boolean {
    return this.getActiveLimiterType() === 'CUSTOM_ATTACHED_STORE';
  }

  private static getClient(): DistributedCacheClient {
    if (!this.client) {
      const config = getValidatedConfig();
      if (config.isProduction && !this.warnedInstanceLocal) {
        if (config.redisUrl) {
          console.warn(
            '[RATE_LIMIT] Notice: REDIS_URL is defined, but no distributed Redis client driver is attached. Active store is InMemoryFallbackStore. Rate limits remain instance-local to this container.'
          );
        } else {
          console.warn(
            '[RATE_LIMIT] Warning: REDIS_URL is not configured in production. Active store is InMemoryFallbackStore. Rate limits are instance-local to this container.'
          );
        }
        this.warnedInstanceLocal = true;
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
