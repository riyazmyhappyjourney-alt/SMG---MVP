import crypto from 'crypto';
import { executeQuery } from '../db/pool';
import { getValidatedConfig } from '../config/env';
import { DistributedRateLimiter } from '../ratelimit/limiter';
import { getSmsProvider } from '../notifications/sms-provider';
import { recordAuditEvent } from '../audit/logger';
import { AuthenticatedUser, AppRole } from '../../core/types/auth';

/**
 * Production-Hardened Customer OTP & Identity Service
 * 
 * Guarantees:
 * 1. Cryptographically secure random 6-digit OTP generation (Node.js crypto.randomInt)
 * 2. Never stores raw OTP in database or logs
 * 3. Salted HMAC-SHA256 OTP hash storage
 * 4. 5-minute single-use expiration
 * 5. Automatic invalidation/superseding of prior OTPs on resend
 * 6. Max 5 verification attempts before account-level lockout
 * 7. Timing-safe cryptographic comparison
 * 8. Zero synthetic phone numbers
 * 9. Unified user_identities registration
 */

const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export function hashOtp(phone: string, otp: string): string {
  const config = getValidatedConfig();
  return crypto.createHmac('sha256', config.jwtSecret)
    .update(`${phone}:${otp.trim()}`)
    .digest('hex');
}

export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export class OtpService {
  /**
   * Generates and dispatches a cryptographically secure 6-digit OTP.
   */
  static async requestOtp(
    phone: string,
    clientIp: string
  ): Promise<{ success: boolean; cooldownSeconds: number }> {
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      throw new Error('Valid 10-digit Indian mobile number is required.');
    }
    const normalizedPhone = `+91${cleanDigits}`;

    // 1. Enforce distributed rate limits
    const phoneLimit = await DistributedRateLimiter.check(`otp-phone:${normalizedPhone}`, 3, 900);
    if (!phoneLimit.allowed) {
      throw new Error(`OTP limit reached. Please wait ${phoneLimit.retryAfterSeconds}s before requesting again.`);
    }

    const ipLimit = await DistributedRateLimiter.check(`otp-ip:${clientIp}`, 10, 900);
    if (!ipLimit.allowed) {
      throw new Error('Too many OTP attempts from this network. Try later.');
    }

    // 2. Invalidate any existing active OTP for this phone
    await executeQuery(
      `UPDATE otp_verifications SET is_consumed = true WHERE phone = $1 AND is_consumed = false;`,
      [normalizedPhone]
    );

    // 3. Cryptographically generate 6-digit OTP
    const otpNumber = crypto.randomInt(100000, 1000000);
    const otpCode = otpNumber.toString();
    const otpHash = hashOtp(normalizedPhone, otpCode);

    const otpId = `otp-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS).toISOString();

    // 4. Persist OTP hash record
    await executeQuery(
      `INSERT INTO otp_verifications (id, phone, otp_hash, attempts_count, max_attempts, expires_at, is_consumed, created_at)
       VALUES ($1, $2, $3, 0, $4, $5, false, NOW());`,
      [otpId, normalizedPhone, otpHash, MAX_ATTEMPTS, expiresAt]
    );

    // 5. Deliver through SMS Provider abstraction
    const smsProvider = getSmsProvider();
    await smsProvider.sendOtp(normalizedPhone, otpCode);

    // 6. Security Audit Event (Never logs raw OTP)
    await recordAuditEvent({
      actor: { uid: `anon-otp-${cleanDigits}`, roles: ['BUYER'], phone: normalizedPhone },
      action: 'OTP_REQUESTED',
      targetEntity: 'otp_verifications',
      targetEntityId: otpId,
      clientIp,
      diffSummary: { phone: normalizedPhone, expiresAt },
    });

    return { success: true, cooldownSeconds: 60 };
  }

  /**
   * Verifies OTP, checks attempts/expiration, consumes single-use record, and resolves user identity.
   */
  static async verifyOtp(
    phone: string,
    enteredOtp: string,
    clientIp: string,
    providedName?: string
  ): Promise<{ authenticatedUser: AuthenticatedUser; userRecord: any }> {
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      throw new Error('Valid 10-digit Indian mobile number is required.');
    }
    const normalizedPhone = `+91${cleanDigits}`;

    // 1. Lockout check
    const lockoutCheck = await DistributedRateLimiter.isPhoneLockedOut(normalizedPhone);
    if (lockoutCheck.lockedOut) {
      throw new Error(`Phone is temporarily locked due to multiple failed OTP attempts. Retry in ${lockoutCheck.retryAfterSeconds}s.`);
    }

    // 2. Fetch latest active unconsumed OTP
    const activeRes = await executeQuery<{
      id: string;
      phone: string;
      otp_hash: string;
      attempts_count: number;
      max_attempts: number;
      expires_at: string;
      is_consumed: boolean;
    }>(
      `SELECT id, phone, otp_hash, attempts_count, max_attempts, expires_at, is_consumed
       FROM otp_verifications
       WHERE phone = $1 AND is_consumed = false
       ORDER BY created_at DESC LIMIT 1;`,
      [normalizedPhone]
    );

    if (!activeRes.rows || activeRes.rows.length === 0) {
      await recordAuditEvent({
        actor: { uid: `anon-${cleanDigits}`, roles: ['BUYER'], phone: normalizedPhone },
        action: 'OTP_VERIFICATION_FAILED',
        targetEntity: 'otp_verifications',
        targetEntityId: 'none',
        clientIp,
        diffSummary: { reason: 'NO_ACTIVE_OTP_FOUND', phone: normalizedPhone },
      });
      throw new Error('No active verification code found for this phone. Please request a new code.');
    }

    const otpRecord = activeRes.rows[0];

    // 3. Expiration Check
    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      await executeQuery(`UPDATE otp_verifications SET is_consumed = true WHERE id = $1;`, [otpRecord.id]);
      await recordAuditEvent({
        actor: { uid: `anon-${cleanDigits}`, roles: ['BUYER'], phone: normalizedPhone },
        action: 'OTP_EXPIRED',
        targetEntity: 'otp_verifications',
        targetEntityId: otpRecord.id,
        clientIp,
        diffSummary: { phone: normalizedPhone, expiredAt: otpRecord.expires_at },
      });
      throw new Error('Verification code has expired. Please request a new code.');
    }

    // 4. Max attempts check
    if (otpRecord.attempts_count >= otpRecord.max_attempts) {
      await executeQuery(`UPDATE otp_verifications SET is_consumed = true WHERE id = $1;`, [otpRecord.id]);
      await DistributedRateLimiter.registerFailedOtpAttempt(normalizedPhone);
      await recordAuditEvent({
        actor: { uid: `anon-${cleanDigits}`, roles: ['BUYER'], phone: normalizedPhone },
        action: 'OTP_VERIFICATION_FAILED',
        targetEntity: 'otp_verifications',
        targetEntityId: otpRecord.id,
        clientIp,
        diffSummary: { reason: 'MAX_ATTEMPTS_EXCEEDED', phone: normalizedPhone },
      });
      throw new Error('Account locked for 30 minutes due to 5 consecutive invalid OTP attempts.');
    }

    // 5. Timing-safe cryptographic comparison
    const expectedHash = hashOtp(normalizedPhone, enteredOtp.trim());
    const isValid = timingSafeCompare(expectedHash, otpRecord.otp_hash);

    if (!isValid) {
      const nextAttempts = otpRecord.attempts_count + 1;
      await executeQuery(
        `UPDATE otp_verifications SET attempts_count = $1 WHERE id = $2;`,
        [nextAttempts, otpRecord.id]
      );

      const { lockedOut, attemptsLeft } = await DistributedRateLimiter.registerFailedOtpAttempt(normalizedPhone);

      await recordAuditEvent({
        actor: { uid: `anon-${cleanDigits}`, roles: ['BUYER'], phone: normalizedPhone },
        action: 'OTP_VERIFICATION_FAILED',
        targetEntity: 'otp_verifications',
        targetEntityId: otpRecord.id,
        clientIp,
        diffSummary: { attempts_count: nextAttempts, attemptsLeft, phone: normalizedPhone },
      });

      if (lockedOut || nextAttempts >= otpRecord.max_attempts) {
        await executeQuery(`UPDATE otp_verifications SET is_consumed = true WHERE id = $1;`, [otpRecord.id]);
        throw new Error('Account locked for 30 minutes due to 5 consecutive invalid OTP attempts.');
      }
      throw new Error(`Invalid OTP. ${attemptsLeft} attempts remaining.`);
    }

    // 6. Consume OTP immediately (Single-use enforcement)
    await executeQuery(`UPDATE otp_verifications SET is_consumed = true WHERE id = $1;`, [otpRecord.id]);
    await DistributedRateLimiter.resetOtpFailures(normalizedPhone);

    await recordAuditEvent({
      actor: { uid: `anon-${cleanDigits}`, roles: ['BUYER'], phone: normalizedPhone },
      action: 'OTP_VERIFIED',
      targetEntity: 'otp_verifications',
      targetEntityId: otpRecord.id,
      clientIp,
      diffSummary: { phone: normalizedPhone },
    });

    // 7. Identity Resolution & Account Linking
    // Check if PHONE identity exists
    const identityRes = await executeQuery<{
      id: string;
      user_id: string;
      provider: string;
      provider_user_id: string;
    }>(
      `SELECT id, user_id, provider, provider_user_id FROM user_identities WHERE provider = 'PHONE' AND provider_user_id = $1 LIMIT 1;`,
      [normalizedPhone]
    );

    let userRecord: any = null;

    if (identityRes.rows && identityRes.rows.length > 0) {
      // Identity exists -> fetch linked user
      const userRes = await executeQuery(
        `SELECT id, phone, email, display_name, roles, is_active, token_version FROM users WHERE id = $1 LIMIT 1;`,
        [identityRes.rows[0].user_id]
      );
      if (userRes.rows && userRes.rows.length > 0) {
        userRecord = userRes.rows[0];
      }
    }

    if (!userRecord) {
      // Check if user with phone already exists in users table
      const existingUserRes = await executeQuery(
        `SELECT id, phone, email, display_name, roles, is_active, token_version FROM users WHERE phone = $1 LIMIT 1;`,
        [normalizedPhone]
      );

      if (existingUserRes.rows && existingUserRes.rows.length > 0) {
        userRecord = existingUserRes.rows[0];
        // Create matching PHONE identity
        const identId = `ident-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
        await executeQuery(
          `INSERT INTO user_identities (id, user_id, provider, provider_user_id, phone, is_verified, created_at)
           VALUES ($1, $2, 'PHONE', $3, $3, true, NOW())
           ON CONFLICT (provider, provider_user_id) DO NOTHING;`,
          [identId, userRecord.id, normalizedPhone]
        );
      } else {
        // Create new customer user with strictly OWNER role
        const newUserId = `usr-c-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
        const displayName = providedName?.trim() || `Owner ${normalizedPhone.slice(-4)}`;

        await executeQuery(
          `INSERT INTO users (id, phone, email, display_name, roles, is_active, token_version, created_at, updated_at)
           VALUES ($1, $2, NULL, $3, '{OWNER}', true, 1, NOW(), NOW())
           ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
           RETURNING *;`,
          [newUserId, normalizedPhone, displayName]
        );

        const identId = `ident-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
        await executeQuery(
          `INSERT INTO user_identities (id, user_id, provider, provider_user_id, phone, is_verified, created_at)
           VALUES ($1, $2, 'PHONE', $3, $3, true, NOW())
           ON CONFLICT (provider, provider_user_id) DO NOTHING;`,
          [identId, newUserId, normalizedPhone]
        );

        userRecord = {
          id: newUserId,
          phone: normalizedPhone,
          email: null,
          display_name: displayName,
          roles: ['OWNER'],
          is_active: true,
          token_version: 1,
        };
      }
    }

    // 8. Update display name if explicitly provided
    if (providedName && providedName.trim() && userRecord.display_name !== providedName.trim()) {
      await executeQuery(
        `UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2;`,
        [providedName.trim(), userRecord.id]
      );
      userRecord.display_name = providedName.trim();
    }

    // 9. Staff Account Hijack Defense: Prevent public customer OTP login into staff accounts
    const roles = (Array.isArray(userRecord.roles) ? userRecord.roles : ['OWNER']) as AppRole[];
    const isStaff = roles.some((r) => r.startsWith('STAFF_'));
    if (isStaff) {
      await recordAuditEvent({
        actor: { uid: userRecord.id, roles, phone: normalizedPhone },
        action: 'STAFF_ACCESS_DENIED',
        targetEntity: 'users',
        targetEntityId: userRecord.id,
        clientIp,
        diffSummary: { reason: 'STAFF_ACCOUNT_OTP_ATTEMPT', phone: normalizedPhone },
      });
      throw new Error('Staff accounts must authenticate via enterprise corporate credentials. Public customer OTP is rejected.');
    }

    const authenticatedUser: AuthenticatedUser = {
      uid: userRecord.id,
      phone: normalizedPhone,
      email: userRecord.email || null,
      roles: ['OWNER'],
      permissions: [
        'properties:create',
        'properties:read_own',
        'properties:update_own',
        'properties:read_reserve_price',
        'documents:upload_own',
        'documents:read_own',
        'visits:read_own',
        'offers:read_own',
        'listings:read_public',
      ],
    };

    await recordAuditEvent({
      actor: authenticatedUser,
      action: 'LOGIN_SUCCESS',
      targetEntity: 'users',
      targetEntityId: userRecord.id,
      clientIp,
      diffSummary: { authMethod: 'PHONE_OTP', phone: normalizedPhone },
    });

    return { authenticatedUser, userRecord };
  }
}
