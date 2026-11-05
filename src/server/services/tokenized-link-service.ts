import crypto from 'crypto';
import { executeQuery } from '../db/pool';
import { devSandboxStore } from '../db/dev-sandbox-store';

export interface CompletionTokenRecord {
  id: string;
  property_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_by_user_id?: string | null;
  created_at: string;
}

export class TokenizedLinkService {
  /**
   * Generate a secure single-use tokenized link for self-completion (Default TTL: 7 days)
   */
  static async generateCompletionLink(propertyId: string, createdByUserId?: string, ttlDays = 7): Promise<{
    token: string;
    url: string;
    expiresAt: string;
  }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
    const tokenId = `tok-comp-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;

    try {
      await executeQuery(
        `INSERT INTO property_completion_tokens (id, property_id, token_hash, expires_at, created_by_user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW());`,
        [tokenId, propertyId, tokenHash, expiresAt, createdByUserId || null]
      );
    } catch {
      // Sandbox fallback
    }

    if (devSandboxStore) {
      if (!(devSandboxStore as any).propertyCompletionTokens) {
        (devSandboxStore as any).propertyCompletionTokens = new Map<string, CompletionTokenRecord>();
      }
      (devSandboxStore as any).propertyCompletionTokens.set(tokenHash, {
        id: tokenId,
        property_id: propertyId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used_at: null,
        created_by_user_id: createdByUserId || null,
        created_at: new Date().toISOString()
      });
    }

    const url = `/seller/complete/${propertyId}?token=${rawToken}`;
    return {
      token: rawToken,
      url,
      expiresAt
    };
  }

  /**
   * Verify completion token: Validates existence, expiry, and single-use status
   */
  static async verifyCompletionToken(propertyId: string, rawToken: string): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    if (!rawToken || !propertyId) {
      return { isValid: false, error: 'Property ID and completion token are required.' };
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    try {
      const res = await executeQuery(
        `SELECT id, property_id, expires_at, used_at
         FROM property_completion_tokens
         WHERE token_hash = $1 AND property_id = $2
         LIMIT 1;`,
        [tokenHash, propertyId]
      );

      if (res.rows && res.rows.length > 0) {
        const record = res.rows[0];
        if (record.used_at) {
          return { isValid: false, error: 'This self-completion link has already been used.' };
        }
        const expTime = new Date(record.expires_at).getTime();
        if (Date.now() > expTime) {
          return { isValid: false, error: 'This self-completion link has expired. Please contact your Relationship Manager for a new link.' };
        }
        return { isValid: true };
      }
    } catch {}

    // Sandbox fallback
    if (devSandboxStore && (devSandboxStore as any).propertyCompletionTokens) {
      const record = (devSandboxStore as any).propertyCompletionTokens.get(tokenHash);
      if (record && record.property_id === propertyId) {
        if (record.used_at) {
          return { isValid: false, error: 'This self-completion link has already been used.' };
        }
        if (Date.now() > new Date(record.expires_at).getTime()) {
          return { isValid: false, error: 'This self-completion link has expired. Please contact your Relationship Manager for a new link.' };
        }
        return { isValid: true };
      }
    }

    return { isValid: false, error: 'Invalid or unrecognized completion token.' };
  }

  /**
   * Mark token as used upon successful submission
   */
  static async markTokenUsed(propertyId: string, rawToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    try {
      await executeQuery(
        `UPDATE property_completion_tokens
         SET used_at = NOW()
         WHERE token_hash = $1 AND property_id = $2;`,
        [tokenHash, propertyId]
      );
    } catch {}

    if (devSandboxStore && (devSandboxStore as any).propertyCompletionTokens) {
      const record = (devSandboxStore as any).propertyCompletionTokens.get(tokenHash);
      if (record) {
        record.used_at = new Date().toISOString();
      }
    }
  }
}
