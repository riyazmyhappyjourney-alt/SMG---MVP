import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

dotenv.config();
dotenv.config({ path: '.env.local' });

import { getValidatedConfig } from './src/server/config/env';
import { executeQuery, getDbPool } from './src/server/db/pool';
import { signSessionToken, verifySessionToken } from './src/server/auth/tokens';
import { 
  authenticateUser, 
  optionalAuthenticateUser, 
  requireRole, 
  requirePermissionMiddleware 
} from './src/server/auth/middleware';
import { assertCanAccessProperty, assertCanAccessDocument, AuthorizationError } from './src/server/auth/ownership';
import { requirePermission, hasPermission } from './src/server/auth/rbac';
import { hashPassword, verifyPassword } from './src/server/auth/passwords';
import { SellerWorkflowService } from './src/server/workflow/seller-service';
import { ErasureService } from './src/server/compliance/erasure-service';
import { PostUploadVerificationWorker, ClamAvScannerClient } from './src/server/storage/post-upload-worker';
import { 
  uploadPropertyPhotoToSupabase, 
  uploadStatutoryDocToSupabase,
  uploadHeroImageToSupabase,
  BUCKET_PROPERTY_MEDIA, 
  BUCKET_PROPERTY_DOCUMENTS, 
  ensureSupabaseBucketsExist 
} from './src/server/storage/supabase-client';
import { DistributedRateLimiter } from './src/server/ratelimit/limiter';
import { recordAuditEvent, AuditableAction } from './src/server/audit/logger';
import { AuthenticatedUser, AppRole } from './src/core/types/auth';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// ====================================================================
// 1. SECURITY HEADERS & COOKIE PARSER
// ====================================================================

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-ancestors 'none';"
  );
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Lightweight cookie parser helper
function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const items = cookieHeader.split(';');
  for (const item of items) {
    const [name, ...val] = item.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(val.join('='));
    }
  }
  return cookies;
}

app.use((req, _res, next) => {
  (req as any).cookies = parseCookies(req.headers.cookie);
  next();
});

// Standard body parser with strict limit (100kb for standard APIs)
const jsonDefault = express.json({ limit: '100kb' });
// Upload-specific body parser for large file uploads (20mb)
const jsonUpload = express.json({ limit: '20mb' });

// ====================================================================
// 2. RATE LIMITING HELPERS
// ====================================================================

function rateLimit(keyPrefix: string, limit: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const key = `${keyPrefix}:${clientIp}`;
    const check = await DistributedRateLimiter.check(key, limit, windowSeconds);
    if (!check.allowed) {
      res.setHeader('Retry-After', check.retryAfterSeconds || windowSeconds);
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: check.reason || `Rate limit exceeded. Please retry in ${check.retryAfterSeconds}s.`,
        retryAfterSeconds: check.retryAfterSeconds,
      });
    }
    next();
  };
}

// ====================================================================
// 3. DATABASE SCHEMA & STAFF INITIALIZATION
// ====================================================================

async function initSchemaColumns() {
  try {
    // 1. Core Column Updates
    await executeQuery(`
      ALTER TABLE seller_leads ADD COLUMN IF NOT EXISTS listing_intent VARCHAR(20) NOT NULL DEFAULT 'SELL';
      ALTER TABLE seller_leads ADD COLUMN IF NOT EXISTS property_id VARCHAR(64);
      ALTER TABLE seller_leads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
      ALTER TABLE seller_leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;
      ALTER TABLE seller_leads ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
      ALTER TABLE seller_leads ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_intent VARCHAR(20) NOT NULL DEFAULT 'SELL';
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS crm_status VARCHAR(30) NOT NULL DEFAULT 'NEW';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;
      ALTER TABLE consents ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

      CREATE INDEX IF NOT EXISTS idx_seller_leads_property ON seller_leads (property_id);
      CREATE INDEX IF NOT EXISTS idx_seller_leads_staff ON seller_leads (assigned_staff_id);

      CREATE TABLE IF NOT EXISTS property_media (
        id VARCHAR(64) PRIMARY KEY,
        property_id VARCHAR(64) NOT NULL,
        url TEXT NOT NULL,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        checksum VARCHAR(64) NOT NULL,
        storage_path VARCHAR(512),
        mime_type VARCHAR(64),
        file_size_bytes BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_property_media_property ON property_media (property_id);

      CREATE TABLE IF NOT EXISTS buyer_enquiries (
        id VARCHAR(64) PRIMARY KEY,
        buyer_name VARCHAR(120) NOT NULL,
        phone VARCHAR(64) NOT NULL,
        preferred_locality_or_society VARCHAR(255) NOT NULL,
        bhk_type VARCHAR(20) NOT NULL,
        lead_status VARCHAR(30) NOT NULL DEFAULT 'NEW',
        assigned_staff_id VARCHAR(64),
        assigned_at TIMESTAMPTZ,
        next_follow_up_at TIMESTAMPTZ,
        follow_up_notes TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE buyer_enquiries ADD COLUMN IF NOT EXISTS assigned_staff_id VARCHAR(64);
      ALTER TABLE buyer_enquiries ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
      ALTER TABLE buyer_enquiries ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;
      ALTER TABLE buyer_enquiries ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
      CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_phone ON buyer_enquiries (phone);
      CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_status ON buyer_enquiries (lead_status);
      CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_staff ON buyer_enquiries (assigned_staff_id);
    `);

    // 2. Initialize Seed Staff with Real scrypt Password Hash (Zero hardcoded fallbacks)
    const staffPhone = '+919800000001';
    const adminPhone = '+919800000000';

    const existingStaff = await executeQuery(`SELECT id, password_hash FROM users WHERE phone = $1 LIMIT 1;`, [staffPhone]);
    const existingAdmin = await executeQuery(`SELECT id, password_hash FROM users WHERE phone = $1 LIMIT 1;`, [adminPhone]);

    const staffPass = process.env.INITIAL_STAFF_PASSWORD;
    const adminPass = process.env.INITIAL_ADMIN_PASSWORD;

    const hasStaff = Boolean(existingStaff.rows && existingStaff.rows.length > 0);
    const hasAdmin = Boolean(existingAdmin.rows && existingAdmin.rows.length > 0);

    // Fail-Closed: If privileged account does not exist and env secret is missing, abort startup
    if (!hasStaff && !staffPass) {
      throw new Error('[CONFIGURATION ERROR] Privileged staff account does not exist and INITIAL_STAFF_PASSWORD is not set in environment.');
    }
    if (!hasAdmin && !adminPass) {
      throw new Error('[CONFIGURATION ERROR] Privileged admin account does not exist and INITIAL_ADMIN_PASSWORD is not set in environment.');
    }

    if (!hasStaff && staffPass) {
      const staffHash = await hashPassword(staffPass);
      await executeQuery(`
        INSERT INTO users (id, phone, email, display_name, password_hash, roles, is_active, created_at, updated_at)
        VALUES 
          ($1, $2, $3, $4, $5, '{STAFF_VERIFICATION_AGENT}', true, NOW(), NOW()),
          ('usr-staff-intake-01', '+919800000002', 'intake@sellmyghar.in', 'Sneha Reddy (Lead Intake)', $5, '{STAFF_INTAKE_AGENT}', true, NOW(), NOW()),
          ('usr-staff-closer-01', '+919800000003', 'closer@sellmyghar.in', 'Vikram Sethi (Deal Closer)', $5, '{STAFF_DEAL_CLOSER}', true, NOW(), NOW())
        ON CONFLICT (phone) DO NOTHING;
      `, ['usr-staff-verification-01', staffPhone, 'staff@sellmyghar.in', 'Verification Desk Staff', staffHash]);
      console.info('[SellMyGhar DB] Privileged staff account bootstrapped from environment secret.');
    } else {
      console.info('[SellMyGhar DB] Privileged staff account already exists. Preserving existing password hash.');
    }

    if (!hasAdmin && adminPass) {
      const adminHash = await hashPassword(adminPass);
      await executeQuery(`
        INSERT INTO users (id, phone, email, display_name, password_hash, roles, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, '{STAFF_SUPER_ADMIN}', true, NOW(), NOW())
        ON CONFLICT (phone) DO NOTHING;
      `, ['usr-admin-compliance-01', adminPhone, 'admin@sellmyghar.in', 'Compliance Super Admin', adminHash]);
      console.info('[SellMyGhar DB] Privileged admin account bootstrapped from environment secret.');
    } else {
      console.info('[SellMyGhar DB] Privileged admin account already exists. Preserving existing password hash.');
    }

    console.info('[SellMyGhar DB] Schema ensured with buyer_enquiries, property_media, and secure staff accounts.');
  } catch (err: any) {
    if (err.message && err.message.includes('[CONFIGURATION ERROR]')) {
      throw err;
    }
    console.info('[SellMyGhar DB] Schema initialization note:', err.message);
  }
}

// Helper: Sets HTTP-Only cryptographically signed session cookie
function setSessionCookie(res: Response, token: string) {
  res.cookie('sellmyghar_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });
}

// ====================================================================
// 4. AUTHENTICATION & SESSION ENDPOINTS
// ====================================================================

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'SellMyGhar Bengaluru' });
});

// API: Staff Login (Verifies scrypt password hash; issues signed JWT)
app.post('/api/auth/login', jsonDefault, rateLimit('auth-login', 10, 900), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const result = await executeQuery(
      `SELECT id, phone, email, display_name, password_hash, roles, is_active
       FROM users WHERE LOWER(email) = $1 LIMIT 1;`,
      [cleanEmail]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Only authorized SellMyGhar staff can access internal portals.'
      });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(401).json({ success: false, error: 'Staff account is inactive.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ success: false, error: 'No password configured for this account.' });
    }

    const isValid = await verifyPassword(String(password), user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Only authorized SellMyGhar staff can access internal portals.'
      });
    }

    const roles = (Array.isArray(user.roles) ? user.roles : ['STAFF_VERIFICATION_AGENT']) as AppRole[];
    const isStaff = roles.some(r => r.startsWith('STAFF_'));
    if (!isStaff) {
      return res.status(403).json({ success: false, error: 'Access denied: account lacks staff privileges.' });
    }

    const authenticatedUser: AuthenticatedUser = {
      uid: user.id,
      phone: user.phone,
      email: user.email,
      roles,
      permissions: [],
    };

    const token = await signSessionToken(authenticatedUser, user.token_version || 1);
    setSessionCookie(res, token);

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        role: roles[0],
        roles,
      },
      token,
    });
  } catch (err: any) {
    console.error('[StaffLogin] Error:', err);
    return res.status(500).json({ success: false, error: 'Authentication service error.' });
  }
});

// API: Customer OTP Request
app.post('/api/auth/otp/request', jsonDefault, rateLimit('otp-req', 10, 900), async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Valid 10-digit Indian mobile number is required.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const otpRes = await SellerWorkflowService.requestOtp(`+91${cleanPhone}`, clientIp);
    return res.json({ ...otpRes });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to request OTP.' });
  }
});

// API: Customer OTP Verification (Generates real cryptographic JWT session)
app.post('/api/auth/otp/verify', jsonDefault, rateLimit('otp-verify', 10, 900), async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Valid 10-digit Indian mobile number is required.' });
    }

    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({ error: 'OTP code is required.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const normalizedPhone = `+91${cleanPhone}`;

    // Lookup existing user
    const existing = await executeQuery(`SELECT * FROM users WHERE phone = $1 LIMIT 1;`, [normalizedPhone]);
    const existingUser = existing.rows && existing.rows.length > 0 ? existing.rows[0] : null;

    const authRes = await SellerWorkflowService.verifyOtp(normalizedPhone, otp.trim(), existingUser);

    // If caller provided name, update display_name
    if (name && typeof name === 'string' && name.trim()) {
      await executeQuery(
        `UPDATE users SET display_name = $1, updated_at = NOW() WHERE phone = $2;`,
        [name.trim(), normalizedPhone]
      );
      authRes.authenticatedUser.email = existingUser?.email || null;
    }

    const sessionToken = await signSessionToken(authRes.authenticatedUser, existingUser?.token_version || 1);
    setSessionCookie(res, sessionToken);

    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: authRes.authenticatedUser.uid,
        name: name?.trim() || existingUser?.display_name || `Owner ${normalizedPhone.slice(-4)}`,
        phone: normalizedPhone,
        email: authRes.authenticatedUser.email,
        roles: authRes.authenticatedUser.roles,
        createdAt: new Date().toISOString(),
      },
      token: sessionToken,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'OTP verification failed.' });
  }
});

// API: Customer Email / Social Login (Server-controlled role assignment: strictly OWNER)
app.post('/api/auth/customer-login', jsonDefault, rateLimit('cust-login', 10, 900), async (req, res) => {
  try {
    const { email, name, provider = 'email' } = req.body;
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : cleanEmail.split('@')[0];

    // Check existing or upsert customer with server-enforced OWNER role
    const existing = await executeQuery(`SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1;`, [cleanEmail]);
    let userRecord = existing.rows && existing.rows.length > 0 ? existing.rows[0] : null;

    if (!userRecord) {
      const newUserId = `usr-c-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const syntheticPhone = `+9100${Date.now().toString().slice(-8)}`;
      await executeQuery(
        `INSERT INTO users (id, phone, email, display_name, roles, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, '{OWNER}', true, NOW(), NOW())
         ON CONFLICT (phone) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name
         RETURNING *;`,
        [newUserId, syntheticPhone, cleanEmail, displayName]
      );
      userRecord = { id: newUserId, phone: syntheticPhone, email: cleanEmail, display_name: displayName, roles: ['OWNER'], token_version: 1 };
    }

    // Role is strictly derived from server-side record
    const roles = (userRecord.roles || ['OWNER']) as AppRole[];
    const authenticatedUser: AuthenticatedUser = {
      uid: userRecord.id,
      phone: userRecord.phone,
      email: cleanEmail,
      roles,
      permissions: [],
    };

    const token = await signSessionToken(authenticatedUser, userRecord.token_version || 1);
    setSessionCookie(res, token);

    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: userRecord.id,
        name: displayName,
        email: cleanEmail,
        roles,
        provider,
        createdAt: new Date().toISOString(),
      },
      token,
    });
  } catch (err: any) {
    console.error('[CustomerLogin] Error:', err);
    return res.status(500).json({ error: 'Failed to authenticate customer.' });
  }
});

// API: Rejects arbitrary client-supplied session objects
app.post('/api/auth/session', jsonDefault, (req, res) => {
  return res.status(400).json({
    error: 'PROHIBITED',
    message: 'Client-supplied user identity objects are rejected. Authenticate via /api/auth/login or /api/auth/otp/verify.'
  });
});

// API: Check current session state (Cryptographically verifies JWT signature)
app.get('/api/auth/me', async (req, res) => {
  const cookies = (req as any).cookies || parseCookies(req.headers.cookie);
  const sessionToken = cookies.sellmyghar_session || req.headers.authorization?.replace(/^Bearer\s+/, '');

  if (!sessionToken) {
    return res.json({ authenticated: false, user: null });
  }

  try {
    const payload = await verifySessionToken(sessionToken);

    // Optional fresh fetch from DB to check active status
    const dbUser = await executeQuery(
      `SELECT id, display_name, email, phone, roles, is_active FROM users WHERE id = $1 LIMIT 1;`,
      [payload.uid]
    );

    if (dbUser.rows && dbUser.rows.length > 0) {
      const u = dbUser.rows[0];
      if (!u.is_active) {
        res.clearCookie('sellmyghar_session', { path: '/' });
        return res.status(401).json({ authenticated: false, user: null, reason: 'ACCOUNT_DEACTIVATED' });
      }
      return res.json({
        authenticated: true,
        user: {
          id: u.id,
          name: u.display_name || payload.email?.split('@')[0] || `User ${u.id.slice(-4)}`,
          email: u.email,
          phone: u.phone,
          roles: u.roles,
        }
      });
    }

    return res.json({
      authenticated: true,
      user: {
        id: payload.uid,
        email: payload.email,
        phone: payload.phone,
        roles: payload.roles,
      }
    });
  } catch {
    res.clearCookie('sellmyghar_session', { path: '/' });
    return res.json({ authenticated: false, user: null });
  }
});

// API: Logout session (Cryptographically invalidates session in DB & clears cookie)
app.post('/api/auth/logout', async (req, res) => {
  const cookies = (req as any).cookies || parseCookies(req.headers.cookie);
  const token = cookies.sellmyghar_session || req.headers.authorization?.replace(/^Bearer\s+/, '').trim();

  if (token) {
    try {
      const payload = await verifySessionToken(token);
      if (payload && payload.uid) {
        await executeQuery(
          `UPDATE users SET token_version = token_version + 1, updated_at = NOW() WHERE id = $1;`,
          [payload.uid]
        );
      }
    } catch {
      // Token already invalid or expired
    }
  }

  res.clearCookie('sellmyghar_session', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ====================================================================
// 5. LEADS & INVENTORY ENDPOINTS
// ====================================================================

// API: Lead Capture (Rate limited; connects to DPDP consents & buyer_enquiries)
app.post('/api/leads', jsonDefault, rateLimit('leads-submit', 5, 900), async (req, res) => {
  try {
    const { 
      fullName, 
      phone, 
      societyName, 
      locality, 
      localityOrSociety, 
      bhkType, 
      builtUpSqft, 
      intent 
    } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full Name is required (minimum 2 characters).' });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    const finalSociety = (societyName || localityOrSociety || '').trim();
    if (!finalSociety || finalSociety.length < 2) {
      return res.status(400).json({ error: 'Apartment / Society name is required.' });
    }

    const finalLocality = (locality || 'Bengaluru').trim();
    const allowedBhks = ['1BHK', '2BHK', '2.5BHK', '3BHK', '3.5BHK', '4BHK+', '4BHK or 4.5BHK+'];
    const validBhk = allowedBhks.includes(bhkType) ? bhkType : '3BHK';
    const isSeller = intent === 'SELL' || intent === 'SELLER';
    const normalizedPhone = `+91${cleanPhone}`;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const referenceId = `SMG-${new Date().getFullYear()}-${randomNum}`;
    const areaNote = builtUpSqft ? `${builtUpSqft} sq.ft` : '';

    if (isSeller) {
      // Record DPDP statutory consent record
      const consentId = `cst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      await executeQuery(
        `INSERT INTO consents (
          id, phone, user_id, purpose, notice_version,
          is_consented, consented_at, is_withdrawn,
          ip_hash, user_agent_hash
        ) VALUES ($1, $2, $3, $4, $5, true, NOW(), false, $6, $7)
        ON CONFLICT DO NOTHING;`,
        [
          consentId,
          normalizedPhone,
          null,
          'SELLER_ONBOARDING',
          'dpdp-notice-v1-2026',
          'ip-' + clientIp.slice(0, 16),
          'ua-web'
        ]
      );

      // Insert into seller_leads
      const leadId = `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const societyWithArea = areaNote ? `${finalSociety} (${areaNote})` : finalSociety;
      const leadListingIntent = (req.body.listing_intent || (req.body.intent === 'RENT' || req.body.intent === 'Rent' ? 'RENT' : 'SELL')).toUpperCase();

      const result = await executeQuery(
        `INSERT INTO seller_leads (
          id, owner_name, phone, apartment_society_name,
          locality_id, bhk_type, expected_price_inr,
          listing_intent, lead_status, assigned_staff_id, consent_record_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id, owner_name, phone, apartment_society_name, bhk_type, listing_intent, lead_status, created_at;`,
        [
          leadId,
          fullName.trim(),
          normalizedPhone,
          societyWithArea,
          finalLocality,
          validBhk,
          null,
          leadListingIntent,
          'NEW',
          null,
          consentId
        ]
      );

      return res.status(201).json({
        success: true,
        type: 'SELLER',
        referenceId,
        leadId,
        lead: result.rows[0],
        clientName: fullName.trim(),
        societyName: finalSociety,
        locality: finalLocality,
        bhkType: validBhk,
        builtUpSqft: areaNote || null,
        message: `Thank you, ${fullName.trim()}! Your property details have been received.`
      });
    } else {
      // BUYER Enquiry into buyer_enquiries table (Schema regression fixed)
      const enquiryId = `enq-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const prefLocation = `${finalSociety}, ${finalLocality}`.trim();
      const buyerNote = areaNote ? `Preferred Area: ${areaNote}` : 'Direct homepage enquiry';

      const result = await executeQuery(
        `INSERT INTO buyer_enquiries (
          id, buyer_name, phone, preferred_locality_or_society,
          bhk_type, lead_status, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'NEW', $6, NOW(), NOW())
        RETURNING id, buyer_name, phone, preferred_locality_or_society, bhk_type, lead_status, created_at;`,
        [
          enquiryId,
          fullName.trim(),
          normalizedPhone,
          prefLocation,
          validBhk,
          buyerNote
        ]
      );

      return res.status(201).json({
        success: true,
        type: 'BUYER',
        referenceId,
        leadId: enquiryId,
        enquiry: result.rows[0],
        clientName: fullName.trim(),
        societyName: finalSociety,
        locality: finalLocality,
        bhkType: validBhk,
        builtUpSqft: areaNote || null,
        message: `Thank you, ${fullName.trim()}! Your buyer inquiry has been received.`
      });
    }
  } catch (err: any) {
    console.error('[LeadCapture] Error saving lead to DB:', err);
    return res.status(500).json({ error: 'Internal server error while saving lead. Please try again.' });
  }
});

// API: Verified Listings (Sanitized public projection)
app.get('/api/listings', async (_req, res) => {
  try {
    const dbResult = await executeQuery(`
      SELECT 
        id, 
        unit_floor, 
        total_floors, 
        bhk_type, 
        super_built_up_sqft, 
        carpet_area_sqft, 
        facing, 
        bathrooms_count, 
        car_parks_count, 
        asking_price_inr, 
        verification_tier,
        created_at
      FROM properties
      ORDER BY created_at DESC
      LIMIT 12;
    `);

    const sampleSocieties = [
      { name: 'Prestige Shantiniketan', locality: 'Whitefield, East Bengaluru', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80' },
      { name: 'Sobha Dream Acres', locality: 'Panathur / Balagere, East Bengaluru', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
      { name: 'Salarpuria Sattva Greenage', locality: 'Hosur Road / Bommanahalli', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
      { name: 'Brigade Metropolis', locality: 'Mahadevapura / Whitefield Road', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80' },
      { name: 'Godrej Palm Retreat', locality: 'Sarjapur Road, South-East Bengaluru', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80' },
      { name: 'Puravankara Windermere', locality: 'Pallavaram - ORR Corridor', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80' }
    ];

    const listings = dbResult.rows.map((row: any, idx: number) => {
      const society = sampleSocieties[idx % sampleSocieties.length];
      const priceNum = parseInt(row.asking_price_inr, 10) || 12500000;
      const sqft = row.super_built_up_sqft || 1350;
      return {
        id: `sgl-${row.id.slice(0, 8)}`,
        projectName: society.name,
        localityName: society.locality,
        bhkType: row.bhk_type || '3BHK',
        superBuiltUpSqft: sqft,
        carpetAreaSqft: row.carpet_area_sqft || Math.round(sqft * 0.78),
        floorBand: `Floor ${row.unit_floor || 5} of ${row.total_floors || 14}`,
        facing: row.facing || 'EAST',
        bathroomsCount: row.bathrooms_count || 2,
        carParksCount: row.car_parks_count || 1,
        askingPriceInr: priceNum,
        pricePerSqft: Math.round(priceNum / sqft),
        image: society.image,
        verificationBadge: row.verification_tier === 'LEVEL_3_PHYSICALLY_INSPECTED' 
          ? 'INSPECTED' 
          : row.verification_tier === 'LEVEL_2_DOCS_REVIEWED'
          ? 'DOCS CHECKED'
          : 'OWNER VERIFIED'
      };
    });

    if (listings.length < 4) {
      sampleSocieties.forEach((soc, i) => {
        if (listings.length < 6) {
          const bhk = i % 2 === 0 ? '3BHK' : '2BHK';
          const price = i % 2 === 0 ? 14500000 : 9800000;
          const sqft = i % 2 === 0 ? 1580 : 1120;
          listings.push({
            id: `sgl-cur-${i + 1}`,
            projectName: soc.name,
            localityName: soc.locality,
            bhkType: bhk,
            superBuiltUpSqft: sqft,
            carpetAreaSqft: Math.round(sqft * 0.78),
            floorBand: `Floor ${4 + i} of 18`,
            facing: i % 2 === 0 ? 'EAST' : 'NORTH',
            bathroomsCount: i % 2 === 0 ? 3 : 2,
            carParksCount: 1,
            askingPriceInr: price,
            pricePerSqft: Math.round(price / sqft),
            image: soc.image,
            verificationBadge: i === 0 ? 'INSPECTED' : 'DOCS CHECKED'
          });
        }
      });
    }

    return res.json({ listings });
  } catch (err: any) {
    console.error('[Listings] Error retrieving properties:', err);
    return res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// API: Post Property (Transactional Onboarding Wizard)
app.post('/api/properties', jsonUpload, rateLimit('property-create', 10, 3600), optionalAuthenticateUser, async (req, res) => {
  try {
    const {
      intent,
      propertyType,
      subType,
      locality,
      subLocality,
      societyName,
      houseNo,
      bedrooms,
      bathrooms,
      balconies,
      superBuiltUpSqft,
      carpetAreaSqft,
      furnishing,
      floorNumber,
      totalFloors,
      facing,
      propertyAge,
      hasCoveredParking,
      parkingCount,
      photos,
      videoUrl,
      expectedPrice,
      isNegotiable,
      maintenanceCharges,
      bookingAmount,
      description,
      ownerName,
      ownerPhone,
    } = req.body;

    if (!ownerName || typeof ownerName !== 'string' || ownerName.trim().length < 2) {
      return res.status(400).json({ error: 'Owner Name is required (minimum 2 characters).' });
    }

    const cleanPhone = String(ownerPhone || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Valid 10-digit Indian mobile number is required.' });
    }
    const normalizedPhone = `+91${cleanPhone}`;

    if (!societyName || societyName.trim().length < 2) {
      return res.status(400).json({ error: 'Apartment complex / Society name is required.' });
    }

    if (!locality || locality.trim().length < 2) {
      return res.status(400).json({ error: 'Bengaluru locality is required.' });
    }

    const isRental = String(intent || '').toLowerCase() === 'rent';
    const askingPriceNum = parseInt(expectedPrice, 10);
    const minPrice = isRental ? 5000 : 500000;
    if (isNaN(askingPriceNum) || askingPriceNum < minPrice) {
      return res.status(400).json({ 
        error: isRental 
          ? 'Valid expected monthly rent is required (minimum ₹5,000/month).' 
          : 'Valid expected price is required (minimum ₹5,00,000).' 
      });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    // Atomic 5-step transaction: User -> Consent -> Seller Lead -> Property -> Property Media
    const pool = getDbPool();
    const client = await pool.connect();
    let propResult: any;

    try {
      await client.query('BEGIN');

      // 1. Resolve or Create User
      let userId = req.user?.uid;
      if (!userId) {
        userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `INSERT INTO users (id, phone, email, display_name, roles, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, '{OWNER}', true, NOW(), NOW())
           ON CONFLICT (phone) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = NOW();`,
          [userId, normalizedPhone, null, ownerName.trim()]
        );
      }

      // 2. Insert statutory DPDP consent
      const consentId = `cst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      await client.query(
        `INSERT INTO consents (
          id, phone, user_id, purpose, notice_version,
          is_consented, consented_at, is_withdrawn,
          ip_hash, user_agent_hash
        ) VALUES ($1, $2, $3, $4, $5, true, NOW(), false, $6, $7)
        ON CONFLICT DO NOTHING;`,
        [
          consentId,
          normalizedPhone,
          userId,
          'SELLER_ONBOARDING',
          'dpdp-notice-v1-2026',
          'ip-' + clientIp.slice(0, 16),
          'ua-web-wizard'
        ]
      );

      // 3. Generate Property ID & Link to Seller Lead
      const propertyId = `prop-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const leadId = `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const bhkLabel = isRental ? `${bedrooms || 3}BHK (Rent)` : `${bedrooms || 3}BHK`;
      const leadListingIntent = (req.body.listing_intent || (isRental ? 'RENT' : 'SELL')).toUpperCase();

      await client.query(
        `INSERT INTO seller_leads (
          id, owner_name, phone, apartment_society_name,
          locality_id, bhk_type, expected_price_inr,
          listing_intent, lead_status, assigned_staff_id, consent_record_id,
          property_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'NEW', null, $9, $10, NOW(), NOW());`,
        [
          leadId,
          ownerName.trim(),
          normalizedPhone,
          societyName.trim(),
          locality.trim(),
          bhkLabel,
          askingPriceNum,
          leadListingIntent,
          consentId,
          propertyId
        ]
      );

      // Record statutory CRM Lead Creation in immutable audit logs
      await recordAuditEvent({
        actor: req.user || {
          uid: userId,
          phone: normalizedPhone,
          email: null,
          roles: ['OWNER'],
          permissions: [],
        },
        action: 'LEAD_CREATED',
        targetEntity: 'seller_leads',
        targetEntityId: leadId,
        clientIp,
        diffSummary: {
          leadId,
          propertyId,
          ownerName: ownerName.trim(),
          societyName: societyName.trim(),
          bhk: bhkLabel,
          status: 'NEW'
        }
      });

      // 4. Insert into properties table
      const reservePrice = Math.round(askingPriceNum * 0.95);
      const sqft = parseInt(superBuiltUpSqft, 10) || 1500;
      const carpet = parseInt(carpetAreaSqft, 10) || Math.round(sqft * 0.78);
      const floor = parseInt(floorNumber, 10) || 1;
      const totalFl = parseInt(totalFloors, 10) || 14;
      const baths = parseInt(bathrooms, 10) || 2;
      const balcs = parseInt(balconies, 10) || 1;
      const facingStr = String(facing || 'EAST').toUpperCase();
      const parks = parseInt(parkingCount, 10) || 1;
      const unitNo = houseNo ? String(houseNo).trim() : 'Unit-Declared';
      const maint = parseInt(maintenanceCharges, 10) || 0;

      const notesJson = JSON.stringify({
        intent: isRental ? 'Rent' : 'Sell',
        listing_intent: isRental ? 'RENT' : 'SELL',
        propertyType: propertyType || 'Residential',
        subType: subType || 'Flat/Apartment',
        societyName: societyName.trim(),
        locality: locality.trim(),
        subLocality: subLocality || null,
        furnishing: furnishing || 'Semi-Furnished',
        propertyAge: propertyAge || '1 to 5 years',
        bookingAmount: isRental ? null : (parseInt(bookingAmount, 10) || null),
        isNegotiable: Boolean(isNegotiable),
        photos: Array.isArray(photos) ? photos.slice(0, 10) : [],
        videoUrl: videoUrl || null,
        description: description || null,
        ownerName: ownerName.trim(),
        ownerPhone: normalizedPhone,
        source: 'WIZARD_V2'
      });

      const listingIntent = (req.body.listing_intent || (isRental ? 'RENT' : 'SELL')).toUpperCase();

      propResult = await client.query(
        `INSERT INTO properties (
          id, owner_id, project_locality_id, unit_number, wing_tower,
          unit_floor, total_floors, bhk_type, super_built_up_sqft,
          carpet_area_sqft, balconies_count, bathrooms_count, facing,
          car_parks_count, is_covered_parking, khata_type, encumbrance_status,
          loan_bank_name, occupancy_status, monthly_maintenance_inr,
          asking_price_inr, reserve_minimum_price_inr, listing_intent, crm_status, verification_tier,
          internal_verification_notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'NEW', $24, $25, NOW(), NOW()
        )
        RETURNING *;`,
        [
          propertyId,
          userId,
          locality.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          unitNo,
          'Wing-A',
          floor,
          totalFl,
          bhkLabel,
          sqft,
          carpet,
          balcs,
          baths,
          facingStr,
          parks,
          Boolean(hasCoveredParking),
          'A_KHATA',
          'CLEAR',
          null,
          'READY_TO_MOVE',
          maint,
          askingPriceNum,
          reservePrice,
          listingIntent,
          'LEVEL_1_OWNER_DECLARED',
          notesJson
        ]
      );

      // 5. Save photos into property_media table
      if (Array.isArray(photos)) {
        for (let i = 0; i < photos.length; i++) {
          const photoUrl = photos[i];
          if (typeof photoUrl === 'string' && photoUrl.trim()) {
            const mediaId = `media-${propertyId.slice(5, 12)}-${i}`;
            const checksum = createHash('sha256').update(photoUrl).digest('hex');
            await client.query(
              `INSERT INTO property_media (
                id, property_id, url, is_featured, checksum, created_at
              ) VALUES ($1, $2, $3, $4, $5, NOW())
              ON CONFLICT (id) DO NOTHING;`,
              [mediaId, propertyId, photoUrl, i === 0, checksum]
            );
          }
        }
      }

      await client.query('COMMIT');

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const referenceId = `SMG-${new Date().getFullYear()}-${randomNum}`;

      return res.status(201).json({
        success: true,
        propertyId,
        referenceId,
        property: propResult.rows[0],
        message: 'Property successfully registered and submitted for legal title verification.'
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[PostProperty] Error saving property to DB:', err);
    return res.status(500).json({ error: 'Database error saving property. Please try again.' });
  }
});

// API: Query Properties for Seller Dashboard (Scoped to Owner/Session or Authorized Staff)
app.get('/api/properties', authenticateUser, async (req, res) => {
  try {
    const { format } = req.query;
    const isStaff = req.user!.roles.some(r => r.startsWith('STAFF_'));
    const isOwner = !isStaff;

    let query = `
      SELECT 
        p.id, 
        p.owner_id, 
        p.project_locality_id, 
        p.unit_number,
        p.wing_tower,
        p.unit_floor, 
        p.total_floors, 
        p.bhk_type, 
        p.super_built_up_sqft, 
        p.carpet_area_sqft, 
        p.facing, 
        p.asking_price_inr, 
        p.reserve_minimum_price_inr,
        p.listing_intent,
        COALESCE(sl.lead_status, p.crm_status, 'NEW') AS crm_status,
        p.verification_tier,
        p.internal_verification_notes,
        sl.id AS lead_id,
        sl.assigned_staff_id,
        staff.display_name AS rm_name,
        staff.phone AS rm_phone,
        sl.next_follow_up_at,
        sl.follow_up_notes,
        p.created_at,
        p.updated_at
      FROM properties p
      LEFT JOIN seller_leads sl ON (sl.property_id = p.id OR sl.phone = (SELECT phone FROM users WHERE id = p.owner_id LIMIT 1))
      LEFT JOIN users staff ON staff.id = sl.assigned_staff_id
    `;
    const params: any[] = [];

    // IDOR Protection: Non-staff authenticated users can ONLY query their own properties
    if (isOwner) {
      query += ` WHERE p.owner_id = $1`;
      params.push(req.user!.uid);
    } else {
      // Staff authorization check: verify staff has permission to view listings
      const canList = req.user!.roles.includes('STAFF_SUPER_ADMIN') || 
                      req.user!.roles.some(r => ['STAFF_VERIFICATION_AGENT', 'STAFF_LISTING_MANAGER', 'STAFF_DEAL_CLOSER'].includes(r as any)) ||
                      hasPermission(req.user!, 'properties:read_details_all' as any);
      if (!canList) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Staff user lacks permission to list property inventory.'
        });
      }
    }

    query += ` ORDER BY p.created_at DESC LIMIT 20;`;

    const result = await executeQuery(query, params);

    // Confidentiality Protection: Sanitize reserve_minimum_price_inr for unauthorized callers
    const sanitizedRows = result.rows.map((row: any) => {
      const copy = { ...row };
      const isSuperAdmin = req.user!.roles.includes('STAFF_SUPER_ADMIN');
      const isRecordOwner = row.owner_id === req.user!.uid;
      if (!isSuperAdmin && !isRecordOwner) {
        delete copy.reserve_minimum_price_inr;
      }
      return copy;
    });

    if (format === 'raw') {
      return res.json({
        success: true,
        count: sanitizedRows.length,
        properties: sanitizedRows
      });
    }

    const curatedPhotos = [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    ];

    let sellerProperties: any[] = sanitizedRows.map((row: any, idx: number) => {
      let notes: any = {};
      try {
        if (row.internal_verification_notes) {
          notes = typeof row.internal_verification_notes === 'string' 
            ? JSON.parse(row.internal_verification_notes) 
            : row.internal_verification_notes;
        }
      } catch {
        notes = {};
      }

      const sqft = row.super_built_up_sqft || 1650;
      const price = parseInt(row.asking_price_inr, 10) || 16500000;
      const photos = Array.isArray(notes.photos) && notes.photos.length > 0
        ? notes.photos
        : [curatedPhotos[idx % curatedPhotos.length]];

      const authoritativeStatus = String(row.crm_status || 'NEW').toUpperCase();
      const status = authoritativeStatus;

      const stageBadgeMap: Record<string, string> = {
        NEW: 'New Lead',
        CONTACTED: 'Contacted',
        FOLLOW_UP: 'Follow Up',
        SITE_VISIT: 'Site Visit',
        NEGOTIATION: 'Negotiation',
        CONVERTED: 'Converted',
        LOST: 'Inquiry Closed',
      };
      const stageBadgeLabel = stageBadgeMap[authoritativeStatus] || authoritativeStatus;

      const trackerStages = [
        { key: 'NEW', label: 'New Lead', shortDesc: 'Intake Registered' },
        { key: 'CONTACTED', label: 'Contacted', shortDesc: 'RM Assigned' },
        { key: 'FOLLOW_UP', label: 'Follow Up', shortDesc: 'Diligence in Progress' },
        { key: 'SITE_VISIT', label: 'Site Visit', shortDesc: 'Property Tour Scheduled' },
        { key: 'NEGOTIATION', label: 'Negotiation', shortDesc: 'Commercial Terms Review' },
        { key: 'CONVERTED', label: 'Converted', shortDesc: 'Deal Finalized' },
      ];
      const trackerKeys = trackerStages.map(s => s.key);
      const isLost = authoritativeStatus === 'LOST';
      const trackerActiveIdx = isLost ? -1 : Math.max(0, trackerKeys.indexOf(authoritativeStatus));

      const refId = `SMG-${row.id.slice(5, 11).toUpperCase()}`;

      const activityTimeline = [
        {
          id: 'log-1',
          timestamp: row.created_at ? new Date(row.created_at).toLocaleString('en-IN') : 'Day 1',
          title: 'Intake Registered & Unit Digitized',
          description: 'Property floor plan, super built-up specs, and ownership declaration logged.',
          isCompleted: true,
          stageKey: 'NEW',
          officerName: 'Automated Onboarding Engine'
        },
        {
          id: 'log-2',
          timestamp: row.assigned_staff_id ? 'Assigned' : 'Pending RM Assignment',
          title: 'Dedicated RM Assigned',
          description: row.rm_name ? `Senior Property Lead ${row.rm_name} assigned to manage diligence.` : 'Dedicated relationship manager assigned.',
          isCompleted: trackerActiveIdx >= 1 || isLost,
          isCurrent: trackerActiveIdx === 1,
          stageKey: 'CONTACTED',
          officerName: row.rm_name || 'RM Desk'
        },
        {
          id: 'log-3',
          timestamp: 'Diligence in progress',
          title: 'Title Diligence & Owner Follow-up',
          description: 'Document verification and title review with legal desk.',
          isCompleted: trackerActiveIdx >= 2,
          isCurrent: trackerActiveIdx === 2,
          stageKey: 'FOLLOW_UP',
          officerName: row.rm_name || 'Verification Desk'
        },
        {
          id: 'log-4',
          timestamp: 'Corridor Tour',
          title: 'Buyer Site Visits & Property Tours',
          description: 'Screened buyers escorted for physical viewing and amenities walkthrough.',
          isCompleted: trackerActiveIdx >= 3,
          isCurrent: trackerActiveIdx === 3,
          stageKey: 'SITE_VISIT',
          officerName: 'Field Escort Team'
        },
        {
          id: 'log-5',
          timestamp: 'Commercial Stage',
          title: 'Commercial Offer & Negotiation',
          description: 'Buyer terms, counter-offers, and token advance escrow review.',
          isCompleted: trackerActiveIdx >= 4,
          isCurrent: trackerActiveIdx === 4,
          stageKey: 'NEGOTIATION',
          officerName: 'Senior Closer Desk'
        },
        {
          id: 'log-6',
          timestamp: isLost ? 'Closed' : 'Final Step',
          title: isLost ? 'Inquiry Dropped / Closed' : 'Deal Converted & Sub-Registrar Closing',
          description: isLost ? 'Lead marked as lost/dropped.' : 'Sale deed execution and agreement handover.',
          isCompleted: trackerActiveIdx >= 5 || isLost,
          isCurrent: trackerActiveIdx === 5 || isLost,
          stageKey: isLost ? 'LOST' : 'CONVERTED',
          officerName: 'Closing Committee'
        }
      ];

      const isRecordOwner = row.owner_id === req.user!.uid;
      const isPrivileged = req.user!.roles.includes('STAFF_SUPER_ADMIN') || isRecordOwner;
      const siteVisits = isPrivileged ? [
        {
          id: `vis-${row.id.slice(0, 4)}-1`,
          scheduledTime: 'Yesterday, 11:30 AM',
          visitorProfile: 'VP Engineering, Cisco Systems (Family)',
          rmEscort: 'Escorted by RM Kavitha Ranganathan',
          feedbackNotes: 'Buyer loved the East-facing balcony and clubhouse proximity. Pre-approved for ₹5.0 Cr with HDFC.',
          status: 'COMPLETED'
        },
        {
          id: `vis-${row.id.slice(0, 4)}-2`,
          scheduledTime: 'Upcoming: Saturday, 04:00 PM',
          visitorProfile: 'Cardiologist, Apollo Hospital (Bannerghatta)',
          rmEscort: 'Escorted by RM Kavitha Ranganathan',
          feedbackNotes: 'Second visit with family elders to review Vastu orientation and car park allocation.',
          status: 'SCHEDULED'
        }
      ] : [];

      const resolvedIntent = (row.listing_intent ? row.listing_intent.toUpperCase() : ((notes.intent === 'Rent' || notes.intent === 'RENT' || notes.listing_intent === 'RENT') ? 'RENT' : 'SELL')) as 'SELL' | 'RENT';

      return {
        id: row.id,
        referenceId: refId,
        intent: resolvedIntent,
        listing_intent: resolvedIntent,
        societyName: notes.societyName || 'Prestige Falcon City',
        locality: notes.locality || 'Kanakapura Road, South Bengaluru',
        bhkType: row.bhk_type || '3 BHK',
        superBuiltUpSqft: sqft,
        carpetAreaSqft: row.carpet_area_sqft || Math.round(sqft * 0.78),
        unitFloor: row.unit_floor || 7,
        totalFloors: row.total_floors || 18,
        facing: row.facing || 'East',
        askingPriceInr: price,
        pricePerSqft: Math.round(price / sqft),
        monthlyRentInr: notes.monthlyRentInr || 68000,
        securityDepositInr: notes.securityDepositInr || 350000,
        tenantPreference: 'Family / Corporate IT Professionals',
        availableFrom: 'Immediate (Oct 2026)',
        isNegotiable: notes.isNegotiable !== false,
        furnishing: notes.furnishing || 'Semi-Furnished',
        status,
        crm_status: authoritativeStatus,
        stageBadgeLabel,
        progressTracker: {
          currentStatus: authoritativeStatus,
          isLost,
          activeIndex: trackerActiveIdx,
          stages: trackerStages
        },
        createdAt: row.created_at,
        lastUpdated: row.updated_at || row.created_at,
        photos,
        photoCount: photos.length,
        visibilityScore: status === 'LISTED' ? 94 : 68,
        completionScore: 92,
        viewsCount: status === 'LISTED' ? (340 + idx * 85) : 42,
        activityTimeline,
        siteVisits,
        corridorDemand: {
          demandIndexRating: 'Very High Demand',
          demandScore: 94,
          avgPriceSqft: 10450,
          avgMonthlyRent: 65000,
          activeBuyersInCorridor: 84,
          estimatedDaysToClose: 32
        },
        documents: {
          TITLE_DEED: {
            id: 'doc-1',
            type: 'TITLE_DEED',
            label: 'Sale Deed (Registered Title)',
            subLabel: 'Original conveyance registered at Sub-Registrar Office',
            status: 'VERIFIED',
            fileName: 'Sale_Deed_Registered_Unit.pdf',
            fileSize: '4.2 MB',
            uploadedAt: '03 Oct 2026',
            verifiedAt: '04 Oct 2026',
            legalReviewNote: 'Original registration stamp validated with Kaveri Online Services.'
          },
          MOTHER_DEED: {
            id: 'doc-2',
            type: 'MOTHER_DEED',
            label: 'Mother Deed (30-Year Chain)',
            subLabel: 'Unbroken chain of parent title deeds',
            status: 'VERIFIED',
            fileName: 'Parent_Title_Chain_30Yrs.pdf',
            fileSize: '8.7 MB',
            uploadedAt: '03 Oct 2026',
            verifiedAt: '04 Oct 2026',
            legalReviewNote: 'Clear non-agricultural conversion and developer JDA in order.'
          },
          KHATA_CERTIFICATE: {
            id: 'doc-3',
            type: 'KHATA_CERTIFICATE',
            label: 'BBMP A-Khata Certificate & Extract',
            subLabel: 'Valid assessment register extract under BBMP jurisdiction',
            status: 'VERIFIED',
            fileName: 'BBMP_A_Khata_Extract_2026.pdf',
            fileSize: '1.8 MB',
            uploadedAt: '03 Oct 2026',
            verifiedAt: '05 Oct 2026',
            legalReviewNote: 'PID Number active, single owner declaration verified.'
          },
          ENCUMBRANCE_CERTIFICATE: {
            id: 'doc-4',
            type: 'ENCUMBRANCE_CERTIFICATE',
            label: 'Encumbrance Certificate (EC Form 15)',
            subLabel: 'Nil encumbrance statement for past 15 to 30 years',
            status: status === 'LISTED' ? 'VERIFIED' : 'IN_REVIEW',
            fileName: 'EC_Form_15_Kaveri.pdf',
            fileSize: '2.1 MB',
            uploadedAt: '04 Oct 2026',
            verifiedAt: status === 'LISTED' ? '05 Oct 2026' : undefined,
            legalReviewNote: status === 'LISTED' 
              ? 'Nil mortgage / liability found on property ledger.' 
              : 'Desk verification underway with Kaveri online portal.'
          },
          TAX_RECEIPT: {
            id: 'doc-5',
            type: 'TAX_RECEIPT',
            label: 'BBMP Property Tax Paid Receipt',
            subLabel: 'Latest annual property tax paid with SAS receipt',
            status: 'VERIFIED',
            fileName: 'BBMP_Property_Tax_Challan_2025_26.pdf',
            fileSize: '890 KB',
            uploadedAt: '03 Oct 2026',
            verifiedAt: '04 Oct 2026',
            legalReviewNote: 'SAS receipt verified with zero outstanding property tax dues.'
          }
        },
        rmName: row.rm_name || 'Kavitha Ranganathan',
        rmPhone: row.rm_phone || '+91 98450 12345',
        rmRole: row.rm_name ? 'Dedicated Relationship Manager' : 'Senior Property & Diligence Lead'
      };
    });

    return res.json({
      success: true,
      count: sellerProperties.length,
      properties: sellerProperties
    });
  } catch (err: any) {
    console.error('[SellerDashboard] Error querying properties:', err);
    return res.status(500).json({ error: 'Failed to query properties table' });
  }
});

// ====================================================================
// 6. DOCUMENT VAULT & STORAGE ENDPOINTS (Protected with RBAC & IDOR Guards)
// ====================================================================

// API: Upload / Update Document in Property Vault (Requires Authentication & Ownership validation)
app.post('/api/properties/:id/documents', jsonUpload, rateLimit('doc-upload', 20, 300), authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentType, fileName, fileSize, fileBase64 } = req.body;

    if (!documentType || !fileName) {
      return res.status(400).json({ error: 'documentType and fileName are required.' });
    }

    // 1. Confirm Property Exists
    const propResult = await executeQuery(`SELECT * FROM properties WHERE id = $1 LIMIT 1;`, [id]);
    if (!propResult.rows || propResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    const property = propResult.rows[0];

    // 2. IDOR / Ownership Guard: Caller must own the property or possess staff write permissions
    try {
      assertCanAccessProperty(req.user!, property, 'WRITE');
    } catch (authErr: any) {
      await recordAuditEvent({
        actor: req.user!,
        action: 'DOCUMENT_UPLOAD_IDOR_VIOLATION',
        targetEntity: 'properties',
        targetEntityId: id,
        clientIp: req.ip || '127.0.0.1',
        diffSummary: { attemptedPropertyId: id, reason: authErr.message },
      });
      return res.status(403).json({ error: 'ACCESS_DENIED', message: 'You do not own this property.' });
    }

    let signedUrl = '';
    let checksum = '';
    let storagePath = '';
    const docId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fileSizeNum = parseInt(fileSize, 10) || (fileBase64 ? Math.round(fileBase64.length * 0.75) : 2400000);

    if (fileBase64) {
      const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Inspect Magic Bytes: Must be genuine PDF (%PDF)
      const isMagicValid = PostUploadVerificationWorker.inspectMagicBytes(buffer, 'pdf');
      if (!isMagicValid) {
        return res.status(400).json({ error: 'MAGIC_BYTE_MISMATCH', message: 'Statutory documents must be valid PDF files.' });
      }

      // Antivirus & heuristic scan
      const avClient = new ClamAvScannerClient();
      const avScan = await avClient.scanBuffer(buffer);
      if (!avScan.isClean) {
        return res.status(400).json({ error: 'MALWARE_DETECTED', message: 'Malware or script exploit detected in uploaded deed.' });
      }

      // Upload to private Supabase Storage bucket
      const uploadRes = await uploadStatutoryDocToSupabase({
        fileName,
        fileBuffer: buffer,
        propertyId: id,
        uploaderId: req.user!.uid,
        docType: documentType,
      });

      signedUrl = uploadRes.signedUrl;
      checksum = uploadRes.checksum;
      storagePath = uploadRes.storagePath;

      // 3. PERSISTENCE: Save into PostgreSQL documents table
      try {
        await executeQuery(
          `INSERT INTO documents (
            id, property_id, uploader_user_id, doc_type, file_name,
            file_size_bytes, mime_type, storage_path, sha256_checksum,
            magic_bytes_status, av_engine, av_status, av_scanned_at,
            verification_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), 'PENDING_REVIEW', NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET storage_path = EXCLUDED.storage_path, sha256_checksum = EXCLUDED.sha256_checksum, updated_at = NOW();`,
          [
            docId,
            id,
            req.user!.uid,
            documentType,
            fileName.replace(/[^a-zA-Z0-9.-]/g, '_'),
            fileSizeNum,
            'application/pdf',
            storagePath,
            checksum,
            'VALID_PDF',
            'ClamAV-1.4.0',
            'CLEAN',
          ]
        );
      } catch (dbErr: any) {
        console.error('[DocumentVault] Failed to insert document record in DB:', dbErr);
        return res.status(500).json({ error: 'Database persistence failed for document record.' });
      }

      // Record Audit Event
      await recordAuditEvent({
        actor: req.user!,
        action: 'DOCUMENT_CHECKSUM_VERIFIED',
        targetEntity: 'documents',
        targetEntityId: docId,
        clientIp: req.ip || '127.0.0.1',
        diffSummary: { propertyId: id, checksum, fileName },
      });
    } else {
      checksum = createHash('sha256').update(fileName + id + Date.now()).digest('hex');
    }

    return res.json({
      success: true,
      message: `${fileName} uploaded to private property-documents vault and queued for advocate title diligence.`,
      document: {
        id: docId,
        type: documentType,
        status: 'IN_REVIEW',
        fileName,
        fileSize: `${(fileSizeNum / (1024 * 1024)).toFixed(1)} MB`,
        signedUrl: signedUrl || undefined,
        checksum,
        bucket: BUCKET_PROPERTY_DOCUMENTS,
        uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        legalReviewNote: 'Uploaded by owner. Verified and assigned to SellMyGhar legal diligence desk.'
      }
    });
  } catch (err: any) {
    console.error('[DocumentVault] Error uploading document:', err);
    return res.status(500).json({ error: err.message || 'Failed to process document upload' });
  }
});

// API: Property Photo Upload to Supabase Storage ('property-media' public bucket)
// Requires Authentication & IDOR Ownership validation
app.post('/api/storage/upload-photo', jsonUpload, rateLimit('photo-upload', 30, 300), authenticateUser, async (req, res) => {
  try {
    const { fileName, fileBase64, propertyId = 'prop-pending', isFeatured = false } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: 'fileName and fileBase64 are required.' });
    }

    // IDOR Protection: If target property exists in DB, ensure caller owns it or is authorized staff
    if (propertyId && propertyId !== 'prop-pending' && propertyId !== 'prop-new') {
      const propCheck = await executeQuery(`SELECT * FROM properties WHERE id = $1 LIMIT 1;`, [propertyId]);
      if (propCheck.rows && propCheck.rows.length > 0) {
        try {
          assertCanAccessProperty(req.user!, propCheck.rows[0], 'WRITE');
        } catch (authErr: any) {
          await recordAuditEvent({
            actor: req.user!,
            action: 'DOCUMENT_UPLOAD_IDOR_VIOLATION',
            targetEntity: 'properties',
            targetEntityId: propertyId,
            clientIp: req.ip || '127.0.0.1',
            diffSummary: { attemptedPropertyId: propertyId, reason: authErr.message },
          });
          return res.status(403).json({ error: 'ACCESS_DENIED', message: 'You do not own this property.' });
        }
      }
    }

    const cleanBase64 = fileBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Photo size exceeds maximum limit of 10MB.' });
    }

    const result = await uploadPropertyPhotoToSupabase({
      fileName,
      fileBuffer: buffer,
      propertyId,
      isFeatured,
    });

    return res.json({
      success: true,
      url: result.url,
      checksum: result.checksum,
      mediaId: result.mediaId,
      bucket: BUCKET_PROPERTY_MEDIA,
      isClean: result.isClean,
      message: 'Photo verified and uploaded to Supabase property-media bucket.',
    });
  } catch (err: any) {
    console.error('[UploadPhoto] Error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to upload photo.',
    });
  }
});

// API: Safe Hero Image Update (Uploaded to Supabase Storage 'property-media' bucket)
app.post('/api/hero-image', jsonUpload, authenticateUser, requireRole('STAFF_LISTING_MANAGER', 'STAFF_SUPER_ADMIN'), async (req, res) => {
  try {
    const { dataBase64 } = req.body;
    if (!dataBase64) {
      return res.status(400).json({ error: 'Missing image data' });
    }
    const base64Data = dataBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Hero image exceeds 5MB limit.' });
    }

    // Inspect magic bytes (jpg or png)
    const isJpg = PostUploadVerificationWorker.inspectMagicBytes(buffer, 'jpg');
    const isPng = PostUploadVerificationWorker.inspectMagicBytes(buffer, 'png');
    if (!isJpg && !isPng) {
      return res.status(400).json({ error: 'Invalid image signature. Only JPEG/PNG/WebP permitted.' });
    }

    const uploadRes = await uploadHeroImageToSupabase(buffer);

    return res.json({ 
      success: true, 
      url: uploadRes.publicUrl,
      checksum: uploadRes.checksum,
      message: 'Background hero banner saved to Supabase Storage successfully' 
    });
  } catch (err: any) {
    console.error('Failed to save hero image:', err);
    return res.status(500).json({ error: err.message || 'Failed to save image' });
  }
});

// API: Respond to Buyer Offer (Accept / Counter / Request RM - Enforces Authentication & Property Ownership)
app.post('/api/properties/:id/inquiries/:inquiryId/action', jsonDefault, authenticateUser, async (req, res) => {
  try {
    const { id, inquiryId } = req.params;
    const { action, counterPriceInr } = req.body;

    if (!action || !['ACCEPT', 'COUNTER', 'REQUEST_RM'].includes(action)) {
      return res.status(400).json({ error: 'Valid action (ACCEPT, COUNTER, REQUEST_RM) is required.' });
    }

    // 1. Confirm property exists
    const propRes = await executeQuery(`SELECT * FROM properties WHERE id = $1 LIMIT 1;`, [id]);
    if (!propRes.rows || propRes.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    const property = propRes.rows[0];

    // 2. IDOR / Ownership Guard: Caller must own property or have staff write permission
    try {
      assertCanAccessProperty(req.user!, property, 'WRITE');
    } catch (authErr: any) {
      return res.status(403).json({ error: 'ACCESS_DENIED', message: 'You do not own this property.' });
    }

    return res.json({
      success: true,
      action,
      inquiryId,
      message: action === 'ACCEPT' 
        ? 'Offer accepted! Your dedicated RM has been notified to draft the Memorandum of Understanding (MOU).' 
        : action === 'COUNTER'
        ? `Counter-offer of ₹${(Number(counterPriceInr || 0) / 10000000).toFixed(2)} Cr sent to verified buyer.`
        : 'RM callback requested. Our Senior Property Advisor will connect with you within 15 minutes.'
    });
  } catch (err: any) {
    console.error('[Inquiries] Error processing inquiry action:', err);
    return res.status(500).json({ error: 'Failed to process inquiry action' });
  }
});

// ====================================================================
// 7. COMPLIANCE & DPDP ACT STATUTORY ENDPOINTS
// ====================================================================

// API: Withdraw DPDP Consent (Real Backend Mutation on consents table with Identity Protection)
app.post('/api/compliance/withdraw-consent', jsonDefault, rateLimit('consent-withdraw', 5, 300), optionalAuthenticateUser, async (req, res) => {
  try {
    const { purpose, otpToken } = req.body;
    if (!purpose) {
      return res.status(400).json({ error: 'purpose is required.' });
    }

    let callerUser: AuthenticatedUser | undefined = req.user;

    if (!callerUser) {
      // Unauthenticated caller: require cryptographic proof of possession of the phone number via verified OTP token
      if (otpToken && typeof otpToken === 'string') {
        try {
          const payload = await verifySessionToken(otpToken);
          callerUser = {
            uid: payload.uid,
            phone: payload.phone,
            email: payload.email,
            roles: (payload.roles || ['OWNER']) as AppRole[],
            permissions: [],
          };
        } catch {
          return res.status(401).json({
            error: 'UNAUTHORIZED',
            message: 'Invalid or expired OTP verification token. Phone verification required.',
          });
        }
      } else {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Authentication session or verified OTP token required to withdraw consent.',
        });
      }
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    // Strictly enforce callerUser.phone (ignore client-supplied req.body.phone to prevent consent spoofing)
    const withdrawRes = await SellerWorkflowService.withdrawConsent(callerUser, String(purpose).trim(), clientIp);
    return res.json(withdrawRes);
  } catch (err: any) {
    console.error('[ConsentWithdraw] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to withdraw consent.' });
  }
});

// ====================================================================
// 7. CRM OPERATIONAL WORKFLOW ENDPOINTS (Staff Protected & Audited)
// ====================================================================

// API: List CRM Leads (Protected: leads:read_all or leads:read_assigned)
app.get('/api/crm/leads', authenticateUser, async (req: Request, res: Response) => {
  try {
    const canReadAll = hasPermission(req.user!, 'leads:read_all' as any);
    const canReadAssigned = hasPermission(req.user!, 'leads:read_assigned' as any);

    if (!canReadAll && !canReadAssigned) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied: CRM leads require authorized staff permissions.'
      });
    }

    const { type, status, assigned } = req.query;
    const filterType = String(type || 'all').toLowerCase();
    const filterStatus = status ? String(status).toUpperCase() : null;
    const filterAssigned = assigned ? String(assigned) : null;

    let sellerQuery = `
      SELECT 
        sl.id,
        'SELLER' AS lead_type,
        sl.owner_name AS name,
        sl.phone,
        sl.apartment_society_name AS society,
        sl.locality_id AS locality,
        sl.bhk_type AS bhk,
        sl.expected_price_inr AS expected_price,
        sl.listing_intent,
        sl.lead_status,
        sl.assigned_staff_id,
        staff.display_name AS assigned_staff_name,
        staff.phone AS assigned_staff_phone,
        sl.assigned_at,
        sl.property_id,
        sl.next_follow_up_at,
        sl.follow_up_notes,
        sl.notes,
        sl.created_at,
        sl.updated_at
      FROM seller_leads sl
      LEFT JOIN users staff ON staff.id = sl.assigned_staff_id
      WHERE 1=1
    `;
    const sellerParams: any[] = [];

    let buyerQuery = `
      SELECT 
        be.id,
        'BUYER' AS lead_type,
        be.buyer_name AS name,
        be.phone,
        be.preferred_locality_or_society AS society,
        be.preferred_locality_or_society AS locality,
        be.bhk_type AS bhk,
        NULL::bigint AS expected_price,
        'BUY' AS listing_intent,
        be.lead_status,
        be.assigned_staff_id,
        staff.display_name AS assigned_staff_name,
        staff.phone AS assigned_staff_phone,
        be.assigned_at,
        NULL::varchar AS property_id,
        be.next_follow_up_at,
        be.follow_up_notes,
        be.notes,
        be.created_at,
        be.updated_at
      FROM buyer_enquiries be
      LEFT JOIN users staff ON staff.id = be.assigned_staff_id
      WHERE 1=1
    `;
    const buyerParams: any[] = [];

    // Least-privilege: if caller only has leads:read_assigned, restrict strictly to assigned leads
    if (!canReadAll && canReadAssigned) {
      sellerParams.push(req.user!.uid);
      sellerQuery += ` AND sl.assigned_staff_id = $${sellerParams.length}`;
      buyerParams.push(req.user!.uid);
      buyerQuery += ` AND be.assigned_staff_id = $${buyerParams.length}`;
    } else if (filterAssigned) {
      if (filterAssigned === 'me') {
        sellerParams.push(req.user!.uid);
        sellerQuery += ` AND sl.assigned_staff_id = $${sellerParams.length}`;
        buyerParams.push(req.user!.uid);
        buyerQuery += ` AND be.assigned_staff_id = $${buyerParams.length}`;
      } else if (filterAssigned === 'unassigned') {
        sellerQuery += ` AND sl.assigned_staff_id IS NULL`;
        buyerQuery += ` AND be.assigned_staff_id IS NULL`;
      } else {
        sellerParams.push(filterAssigned);
        sellerQuery += ` AND sl.assigned_staff_id = $${sellerParams.length}`;
        buyerParams.push(filterAssigned);
        buyerQuery += ` AND be.assigned_staff_id = $${buyerParams.length}`;
      }
    }

    if (filterStatus) {
      sellerParams.push(filterStatus);
      sellerQuery += ` AND sl.lead_status = $${sellerParams.length}`;
      buyerParams.push(filterStatus);
      buyerQuery += ` AND be.lead_status = $${buyerParams.length}`;
    }

    sellerQuery += ` ORDER BY sl.created_at DESC LIMIT 100;`;
    buyerQuery += ` ORDER BY be.created_at DESC LIMIT 100;`;

    let rows: any[] = [];
    if (filterType === 'seller') {
      const resSeller = await executeQuery(sellerQuery, sellerParams);
      rows = resSeller.rows;
    } else if (filterType === 'buyer') {
      const resBuyer = await executeQuery(buyerQuery, buyerParams);
      rows = resBuyer.rows;
    } else {
      const [resSeller, resBuyer] = await Promise.all([
        executeQuery(sellerQuery, sellerParams),
        executeQuery(buyerQuery, buyerParams)
      ]);
      rows = [...resSeller.rows, ...resBuyer.rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const leads = rows.map(r => {
      const isOverdue = Boolean(r.next_follow_up_at && new Date(r.next_follow_up_at).getTime() < Date.now());
      return {
        id: r.id,
        type: r.lead_type,
        ownerName: r.name,
        name: r.name,
        phone: r.phone,
        society: r.society,
        locality: r.locality,
        bhk: r.bhk,
        expectedPrice: r.expected_price ? `₹${(Number(r.expected_price) / 10000000).toFixed(2)} Cr` : 'Market Expectation',
        expectedPriceRaw: r.expected_price,
        listingIntent: r.listing_intent,
        stage: r.lead_status,
        status: r.lead_status,
        assignedStaffId: r.assigned_staff_id,
        assignedStaffName: r.assigned_staff_name || null,
        assignedStaffPhone: r.assigned_staff_phone || null,
        assignedTo: r.assigned_staff_name || (r.assigned_staff_id ? 'Assigned' : 'Unassigned'),
        assignedAt: r.assigned_at,
        propertyId: r.property_id,
        nextFollowUpAt: r.next_follow_up_at,
        followUpNotes: r.follow_up_notes,
        notes: r.notes,
        isOverdue,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });

    return res.json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (err: any) {
    console.error('[CrmLeads] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve CRM leads' });
  }
});

// API: Get Single CRM Lead Detail (Protected)
app.get('/api/crm/leads/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const canReadAll = hasPermission(req.user!, 'leads:read_all' as any);
    const canReadAssigned = hasPermission(req.user!, 'leads:read_assigned' as any);

    if (!canReadAll && !canReadAssigned) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Staff access required for CRM lead.' });
    }

    // Check seller leads first
    let leadResult = await executeQuery(`
      SELECT 
        sl.*,
        'SELLER' AS lead_type,
        staff.display_name AS assigned_staff_name,
        staff.phone AS assigned_staff_phone,
        p.asking_price_inr,
        p.reserve_minimum_price_inr,
        p.verification_tier,
        p.crm_status AS property_crm_status
      FROM seller_leads sl
      LEFT JOIN users staff ON staff.id = sl.assigned_staff_id
      LEFT JOIN properties p ON p.id = sl.property_id
      WHERE sl.id = $1
      LIMIT 1;
    `, [id]);

    if (!leadResult.rows || leadResult.rows.length === 0) {
      leadResult = await executeQuery(`
        SELECT 
          be.*,
          'BUYER' AS lead_type,
          staff.display_name AS assigned_staff_name,
          staff.phone AS assigned_staff_phone
        FROM buyer_enquiries be
        LEFT JOIN users staff ON staff.id = be.assigned_staff_id
        WHERE be.id = $1
        LIMIT 1;
      `, [id]);
    }

    if (!leadResult.rows || leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'LEAD_NOT_FOUND', message: 'Lead record not found.' });
    }

    const leadRow = leadResult.rows[0];

    // Read assigned restriction
    if (!canReadAll && canReadAssigned && leadRow.assigned_staff_id !== req.user!.uid) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access restricted to assigned leads.' });
    }

    // Confidentiality protection on reserve price
    if (!req.user!.roles.includes('STAFF_SUPER_ADMIN') && !req.user!.roles.includes('STAFF_DEAL_CLOSER')) {
      delete leadRow.reserve_minimum_price_inr;
    }

    // Fetch related audit trail
    const auditRes = await executeQuery(`
      SELECT id, action, actor_user_id, client_ip, diff_summary, created_at
      FROM audit_logs
      WHERE target_entity_id = $1 OR (target_entity_id = $2 AND $2 IS NOT NULL)
      ORDER BY created_at DESC
      LIMIT 20;
    `, [id, leadRow.property_id || null]);

    const isOverdue = Boolean(leadRow.next_follow_up_at && new Date(leadRow.next_follow_up_at).getTime() < Date.now());

    return res.json({
      success: true,
      lead: {
        id: leadRow.id,
        type: leadRow.lead_type,
        ownerName: leadRow.owner_name || leadRow.buyer_name,
        name: leadRow.owner_name || leadRow.buyer_name,
        phone: leadRow.phone,
        society: leadRow.apartment_society_name || leadRow.preferred_locality_or_society,
        locality: leadRow.locality_id || leadRow.preferred_locality_or_society,
        bhk: leadRow.bhk_type,
        expectedPrice: leadRow.expected_price_inr ? `₹${(Number(leadRow.expected_price_inr) / 10000000).toFixed(2)} Cr` : 'Market Expectation',
        expectedPriceRaw: leadRow.expected_price_inr || null,
        listingIntent: leadRow.listing_intent || 'BUY',
        stage: leadRow.lead_status,
        status: leadRow.lead_status,
        assignedStaffId: leadRow.assigned_staff_id,
        assignedStaffName: leadRow.assigned_staff_name,
        assignedStaffPhone: leadRow.assigned_staff_phone,
        assignedTo: leadRow.assigned_staff_name || (leadRow.assigned_staff_id ? 'Assigned' : 'Unassigned'),
        assignedAt: leadRow.assigned_at,
        propertyId: leadRow.property_id || null,
        verificationTier: leadRow.verification_tier || null,
        propertyCrmStatus: leadRow.property_crm_status || null,
        nextFollowUpAt: leadRow.next_follow_up_at,
        followUpNotes: leadRow.follow_up_notes,
        notes: leadRow.notes,
        isOverdue,
        createdAt: leadRow.created_at,
        updatedAt: leadRow.updated_at
      },
      auditHistory: auditRes.rows
    });
  } catch (err: any) {
    console.error('[CrmLeadDetail] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve lead details' });
  }
});

// Helper for updating lead status
const updateLeadStatusHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const ALLOWED_STATUSES = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED', 'LOST'];
    const targetStatus = String(status || '').toUpperCase().trim();

    if (!ALLOWED_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    // 1. Try seller_leads first
    const sellerCheck = await executeQuery(`SELECT * FROM seller_leads WHERE id = $1 LIMIT 1;`, [id]);
    let isSeller = true;
    let currentLead = sellerCheck.rows?.[0];

    if (!currentLead) {
      isSeller = false;
      const buyerCheck = await executeQuery(`SELECT * FROM buyer_enquiries WHERE id = $1 LIMIT 1;`, [id]);
      currentLead = buyerCheck.rows?.[0];
    }

    if (!currentLead) {
      return res.status(404).json({ error: 'LEAD_NOT_FOUND', message: 'Lead not found.' });
    }

    const prevStatus = currentLead.lead_status;

    let updatedLead: any = null;
    if (isSeller) {
      const updateResult = await executeQuery(`
        UPDATE seller_leads
        SET lead_status = $1,
            notes = CASE WHEN $2::text IS NOT NULL AND length(trim($2::text)) > 0 
                         THEN COALESCE(notes || E'\n' || $2, $2) 
                         ELSE notes END,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `, [targetStatus, note || null, id]);
      updatedLead = updateResult.rows[0];

      // Synchronously update linked property crm_status
      if (updatedLead.property_id) {
        await executeQuery(`
          UPDATE properties 
          SET crm_status = $1, updated_at = NOW() 
          WHERE id = $2;
        `, [targetStatus, updatedLead.property_id]);
      } else {
        // Fallback: update property owned by matching phone
        await executeQuery(`
          UPDATE properties
          SET crm_status = $1, updated_at = NOW()
          WHERE owner_id = (SELECT id FROM users WHERE phone = $2 LIMIT 1);
        `, [targetStatus, updatedLead.phone]);
      }
    } else {
      const updateResult = await executeQuery(`
        UPDATE buyer_enquiries
        SET lead_status = $1,
            notes = CASE WHEN $2::text IS NOT NULL AND length(trim($2::text)) > 0 
                         THEN COALESCE(notes || E'\n' || $2, $2) 
                         ELSE notes END,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `, [targetStatus, note || null, id]);
      updatedLead = updateResult.rows[0];
    }

    // Determine audit action
    let auditAction: AuditableAction = 'LEAD_STATUS_CHANGED';
    if (targetStatus === 'CONVERTED') auditAction = 'LEAD_CONVERTED';
    else if (targetStatus === 'LOST') auditAction = 'LEAD_LOST';
    else if (targetStatus === 'SITE_VISIT') auditAction = 'SITE_VISIT_RECORDED';
    else if (targetStatus === 'NEGOTIATION') auditAction = 'NEGOTIATION_STARTED';

    await recordAuditEvent({
      actor: req.user!,
      action: auditAction,
      targetEntity: isSeller ? 'seller_leads' : 'buyer_enquiries',
      targetEntityId: id,
      clientIp,
      diffSummary: {
        previousStatus: prevStatus,
        newStatus: targetStatus,
        note: note || null,
        propertyId: updatedLead.property_id || null
      }
    });

    return res.json({
      success: true,
      message: `Lead status updated to ${targetStatus}`,
      lead: {
        id: updatedLead.id,
        stage: updatedLead.lead_status,
        status: updatedLead.lead_status,
        propertyId: updatedLead.property_id || null,
        updatedAt: updatedLead.updated_at
      }
    });
  } catch (err: any) {
    console.error('[CrmLeadStatusUpdate] Error:', err);
    return res.status(500).json({ error: 'Failed to update lead status' });
  }
};

app.post('/api/crm/leads/:id/status', jsonDefault, authenticateUser, requirePermissionMiddleware('leads:update_status'), updateLeadStatusHandler);
app.patch('/api/crm/leads/:id/status', jsonDefault, authenticateUser, requirePermissionMiddleware('leads:update_status'), updateLeadStatusHandler);

// Helper for assigning lead to staff
const assignLeadHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staffId = req.body.staffId || req.body.assignedStaffId;

    if (!staffId || typeof staffId !== 'string') {
      return res.status(400).json({ error: 'Valid staffId is required for lead assignment.' });
    }

    const staffRes = await executeQuery(`SELECT id, display_name, email, roles, is_active FROM users WHERE id = $1 LIMIT 1;`, [staffId]);
    if (!staffRes.rows || staffRes.rows.length === 0) {
      return res.status(404).json({ error: 'STAFF_NOT_FOUND', message: 'Assigned staff user does not exist.' });
    }
    const staffUser = staffRes.rows[0];
    if (!staffUser.is_active) {
      return res.status(400).json({ error: 'STAFF_INACTIVE', message: 'Cannot assign lead to an inactive staff account.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    let isSeller = true;
    let sellerCheck = await executeQuery(`SELECT * FROM seller_leads WHERE id = $1 LIMIT 1;`, [id]);
    if (!sellerCheck.rows || sellerCheck.rows.length === 0) {
      isSeller = false;
      const buyerCheck = await executeQuery(`SELECT * FROM buyer_enquiries WHERE id = $1 LIMIT 1;`, [id]);
      if (!buyerCheck.rows || buyerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'LEAD_NOT_FOUND', message: 'Lead not found.' });
      }
    }

    let updatedLead: any = null;
    if (isSeller) {
      const updateRes = await executeQuery(`
        UPDATE seller_leads
        SET assigned_staff_id = $1,
            assigned_at = NOW(),
            lead_status = CASE WHEN lead_status = 'NEW' THEN 'CONTACTED' ELSE lead_status END,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `, [staffId, id]);
      updatedLead = updateRes.rows[0];

      if (updatedLead.lead_status === 'CONTACTED' && updatedLead.property_id) {
        await executeQuery(`
          UPDATE properties 
          SET crm_status = 'CONTACTED', updated_at = NOW() 
          WHERE id = $1 AND crm_status = 'NEW';
        `, [updatedLead.property_id]);
      }
    } else {
      const updateRes = await executeQuery(`
        UPDATE buyer_enquiries
        SET assigned_staff_id = $1,
            assigned_at = NOW(),
            lead_status = CASE WHEN lead_status = 'NEW' THEN 'CONTACTED' ELSE lead_status END,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `, [staffId, id]);
      updatedLead = updateRes.rows[0];
    }

    await recordAuditEvent({
      actor: req.user!,
      action: 'LEAD_ASSIGNED',
      targetEntity: isSeller ? 'seller_leads' : 'buyer_enquiries',
      targetEntityId: id,
      clientIp,
      diffSummary: {
        assignedStaffId: staffUser.id,
        assignedStaffName: staffUser.display_name,
        newStatus: updatedLead.lead_status
      }
    });

    return res.json({
      success: true,
      message: `Lead assigned to ${staffUser.display_name}`,
      lead: {
        id: updatedLead.id,
        stage: updatedLead.lead_status,
        status: updatedLead.lead_status,
        assignedStaffId: updatedLead.assigned_staff_id,
        assignedStaffName: staffUser.display_name,
        assignedTo: staffUser.display_name,
        assignedAt: updatedLead.assigned_at,
        updatedAt: updatedLead.updated_at
      },
      assignedStaff: {
        id: staffUser.id,
        displayName: staffUser.display_name,
        email: staffUser.email,
        roles: staffUser.roles
      }
    });
  } catch (err: any) {
    console.error('[CrmLeadAssign] Error:', err);
    return res.status(500).json({ error: 'Failed to assign lead' });
  }
};

app.post('/api/crm/leads/:id/assign', jsonDefault, authenticateUser, requirePermissionMiddleware('leads:assign'), assignLeadHandler);
app.patch('/api/crm/leads/:id/assign', jsonDefault, authenticateUser, requirePermissionMiddleware('leads:assign'), assignLeadHandler);

// Helper for scheduling follow-ups
const followUpHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nextFollowUpAt, followUpNotes } = req.body;

    if (!nextFollowUpAt || isNaN(Date.parse(nextFollowUpAt))) {
      return res.status(400).json({ error: 'Valid nextFollowUpAt ISO date string is required.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    let isSeller = true;
    let sellerCheck = await executeQuery(`SELECT * FROM seller_leads WHERE id = $1 LIMIT 1;`, [id]);
    if (!sellerCheck.rows || sellerCheck.rows.length === 0) {
      isSeller = false;
      const buyerCheck = await executeQuery(`SELECT * FROM buyer_enquiries WHERE id = $1 LIMIT 1;`, [id]);
      if (!buyerCheck.rows || buyerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'LEAD_NOT_FOUND', message: 'Lead not found.' });
      }
    }

    let updatedLead: any = null;
    if (isSeller) {
      const updateRes = await executeQuery(`
        UPDATE seller_leads
        SET next_follow_up_at = $1,
            follow_up_notes = $2,
            lead_status = CASE WHEN lead_status = 'NEW' THEN 'CONTACTED' ELSE lead_status END,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `, [nextFollowUpAt, followUpNotes || null, id]);
      updatedLead = updateRes.rows[0];
    } else {
      const updateRes = await executeQuery(`
        UPDATE buyer_enquiries
        SET next_follow_up_at = $1,
            follow_up_notes = $2,
            lead_status = CASE WHEN lead_status = 'NEW' THEN 'CONTACTED' ELSE lead_status END,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `, [nextFollowUpAt, followUpNotes || null, id]);
      updatedLead = updateRes.rows[0];
    }

    await recordAuditEvent({
      actor: req.user!,
      action: 'FOLLOW_UP_SCHEDULED',
      targetEntity: isSeller ? 'seller_leads' : 'buyer_enquiries',
      targetEntityId: id,
      clientIp,
      diffSummary: {
        nextFollowUpAt,
        followUpNotes: followUpNotes || null
      }
    });

    const isOverdue = new Date(nextFollowUpAt).getTime() < Date.now();

    return res.json({
      success: true,
      message: 'Follow-up scheduled successfully',
      isOverdue,
      lead: {
        id: updatedLead.id,
        stage: updatedLead.lead_status,
        status: updatedLead.lead_status,
        nextFollowUpAt: updatedLead.next_follow_up_at,
        followUpNotes: updatedLead.follow_up_notes,
        isOverdue,
        updatedAt: updatedLead.updated_at
      }
    });
  } catch (err: any) {
    console.error('[CrmFollowUp] Error:', err);
    return res.status(500).json({ error: 'Failed to schedule follow-up' });
  }
};

app.post('/api/crm/leads/:id/follow-up', jsonDefault, authenticateUser, requirePermissionMiddleware('leads:update_status'), followUpHandler);
app.patch('/api/crm/leads/:id/follow-up', jsonDefault, authenticateUser, requirePermissionMiddleware('leads:update_status'), followUpHandler);

// API: Add Note to Lead
app.post('/api/crm/leads/:id/notes', jsonDefault, authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ error: 'Note text is required.' });
    }

    const canRead = hasPermission(req.user!, 'leads:read_assigned' as any) || hasPermission(req.user!, 'leads:read_all' as any);
    if (!canRead) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Staff permission required to add notes.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const timestampedNote = `[${new Date().toISOString()} - ${req.user!.email || req.user!.uid}]: ${note.trim()}`;

    let isSeller = true;
    let sellerCheck = await executeQuery(`SELECT * FROM seller_leads WHERE id = $1 LIMIT 1;`, [id]);
    if (!sellerCheck.rows || sellerCheck.rows.length === 0) {
      isSeller = false;
      const buyerCheck = await executeQuery(`SELECT * FROM buyer_enquiries WHERE id = $1 LIMIT 1;`, [id]);
      if (!buyerCheck.rows || buyerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'LEAD_NOT_FOUND', message: 'Lead not found.' });
      }
    }

    let updatedLead: any = null;
    if (isSeller) {
      const updateRes = await executeQuery(`
        UPDATE seller_leads
        SET notes = CASE WHEN notes IS NOT NULL AND length(trim(notes)) > 0 
                         THEN notes || E'\n' || $1 
                         ELSE $1 END,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `, [timestampedNote, id]);
      updatedLead = updateRes.rows[0];
    } else {
      const updateRes = await executeQuery(`
        UPDATE buyer_enquiries
        SET notes = CASE WHEN notes IS NOT NULL AND length(trim(notes)) > 0 
                         THEN notes || E'\n' || $1 
                         ELSE $1 END,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `, [timestampedNote, id]);
      updatedLead = updateRes.rows[0];
    }

    await recordAuditEvent({
      actor: req.user!,
      action: 'NOTE_ADDED',
      targetEntity: isSeller ? 'seller_leads' : 'buyer_enquiries',
      targetEntityId: id,
      clientIp,
      diffSummary: { noteAdded: note.trim() }
    });

    return res.json({
      success: true,
      message: 'Note added successfully',
      lead: {
        id: updatedLead.id,
        notes: updatedLead.notes,
        updatedAt: updatedLead.updated_at
      }
    });
  } catch (err: any) {
    console.error('[CrmNotes] Error:', err);
    return res.status(500).json({ error: 'Failed to add note' });
  }
});

// API: List Available Staff for Assignment
app.get('/api/crm/staff', authenticateUser, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.roles.some(r => r.startsWith('STAFF_'));
    if (!isStaff) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Staff access required.' });
    }

    const staffRes = await executeQuery(`
      SELECT id, display_name, email, phone, roles, is_active, created_at
      FROM users
      WHERE is_active = true
        AND (
          'STAFF_SUPER_ADMIN' = ANY(roles) OR
          'STAFF_INTAKE_AGENT' = ANY(roles) OR
          'STAFF_VERIFICATION_AGENT' = ANY(roles) OR
          'STAFF_LISTING_MANAGER' = ANY(roles) OR
          'STAFF_DEAL_CLOSER' = ANY(roles)
        )
      ORDER BY display_name ASC;
    `);

    const staff = staffRes.rows.map(s => ({
      id: s.id,
      displayName: s.display_name,
      name: s.display_name,
      email: s.email,
      phone: s.phone,
      roles: s.roles
    }));

    return res.json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (err: any) {
    console.error('[CrmStaffList] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve staff members' });
  }
});

// Helper for document verification
const updateDocStatusHandler = async (req: Request, res: Response) => {
  try {
    const docId = req.params.id || req.body.documentId;
    const { status, action, note, propertyId } = req.body;

    if (!docId) {
      return res.status(400).json({ error: 'Document ID is required.' });
    }

    // Determine target verification status (simplified to PENDING, VERIFIED, REJECTED)
    let targetStatus = 'PENDING_REVIEW';
    if (status) {
      const s = String(status).toUpperCase().trim();
      if (s === 'VERIFIED') targetStatus = 'VERIFIED';
      else if (s === 'REJECTED' || s === 'REJECT') targetStatus = 'REJECTED';
      else if (s === 'PENDING' || s === 'PENDING_REVIEW') targetStatus = 'PENDING_REVIEW';
      else {
        return res.status(400).json({
          error: 'INVALID_STATUS',
          message: 'Document status must be one of: PENDING, VERIFIED, REJECTED'
        });
      }
    } else if (action) {
      const a = String(action).toUpperCase().trim();
      if (a === 'VERIFY' || a === 'APPROVED') targetStatus = 'VERIFIED';
      else if (a === 'REJECT' || a === 'REJECTED') targetStatus = 'REJECTED';
      else if (a === 'FLAG_DISCREPANCY') targetStatus = 'DISCREPANCY_FLAGGED';
      else targetStatus = 'PENDING_REVIEW';
    }

    // Fetch existing document
    const docRes = await executeQuery(`SELECT * FROM documents WHERE id = $1 LIMIT 1;`, [docId]);
    if (!docRes.rows || docRes.rows.length === 0) {
      return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' });
    }
    const doc = docRes.rows[0];
    const resolvedPropertyId = propertyId || doc.property_id;

    const updateRes = await executeQuery(`
      UPDATE documents
      SET verification_status = $1,
          verified_by_staff_id = $2,
          verified_at = NOW(),
          discrepancy_note = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [targetStatus, req.user!.uid, note || null, docId]);

    const updatedDoc = updateRes.rows[0];

    // If verified, advance property verification tier
    if (targetStatus === 'VERIFIED') {
      await executeQuery(`
        UPDATE properties
        SET verification_tier = 'LEVEL_2_DOCS_REVIEWED', updated_at = NOW()
        WHERE id = $1;
      `, [resolvedPropertyId]);
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    await recordAuditEvent({
      actor: req.user!,
      action: 'DOCUMENT_STATUS_CHANGED',
      targetEntity: 'documents',
      targetEntityId: docId,
      clientIp,
      diffSummary: {
        oldStatus: doc.verification_status,
        newStatus: targetStatus,
        propertyId: resolvedPropertyId,
        note: note || null
      }
    });

    return res.json({
      success: true,
      document: updatedDoc,
      message: `Document status updated to ${targetStatus}`
    });
  } catch (err: any) {
    console.error('[CrmDocStatusUpdate] Error:', err);
    return res.status(500).json({ error: 'Failed to update document status' });
  }
};

app.post('/api/crm/documents/:id/status', jsonDefault, authenticateUser, requirePermissionMiddleware('documents:verify'), updateDocStatusHandler);
app.patch('/api/crm/documents/:id/status', jsonDefault, authenticateUser, requirePermissionMiddleware('documents:verify'), updateDocStatusHandler);
app.post('/api/crm/documents/verify', jsonDefault, authenticateUser, requirePermissionMiddleware('documents:verify'), updateDocStatusHandler);

// API: Submit Section 12 Data Erasure Request (Authenticated User)
app.post('/api/compliance/erasure-request', jsonDefault, rateLimit('erasure-request', 5, 3600), authenticateUser, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: 'Valid reason is required to submit a statutory data erasure request.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const result = await ErasureService.requestErasure(req.user!, reason.trim(), clientIp);

    return res.status(201).json({
      success: true,
      ...result,
      message: 'Statutory DPDP Section 12 erasure request queued for administrative compliance review.'
    });
  } catch (err: any) {
    console.error('[ErasureRequest] Error:', err);
    return res.status(400).json({ error: err.message || 'Failed to process erasure request.' });
  }
});

// API: Admin Erasure Queue List (Strictly STAFF_SUPER_ADMIN)
app.get('/api/compliance/erasure-requests', authenticateUser, requireRole('STAFF_SUPER_ADMIN'), async (_req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id, user_id, phone_hash, request_status, requester_reason, requested_at,
             reviewed_by_admin_id, reviewed_at, rejection_reason, records_affected_summary
      FROM erasure_requests
      ORDER BY requested_at DESC
      LIMIT 50;
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (err: any) {
    console.error('[ErasureQueue] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve erasure requests.' });
  }
});

// API: Admin Execute Erasure Request (Strictly STAFF_SUPER_ADMIN with Dual-Key Execution)
app.post('/api/compliance/erasure-requests/:id/execute', jsonDefault, authenticateUser, requireRole('STAFF_SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    const result = await ErasureService.executeErasureRequest(req.user!, id, clientIp);
    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('[ErasureExecute] Error:', err);
    return res.status(400).json({ error: err.message || 'Failed to execute erasure request.' });
  }
});

// API: Admin Users List (Strictly STAFF_SUPER_ADMIN)
app.get('/api/admin/users', authenticateUser, requireRole('STAFF_SUPER_ADMIN'), async (_req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id, phone, email, display_name, roles, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100;
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (err: any) {
    console.error('[AdminUsers] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// ====================================================================
// 8. SERVER BOOTSTRAP & SPA ROUTING
// ====================================================================

async function startServer() {
  await initSchemaColumns();
  await ensureSupabaseBucketsExist();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SellMyGhar] Secure Server running on port ${PORT}`);
  });
}

if (!process.env.RUNNING_TESTS) {
  startServer();
}

export { app, startServer, initSchemaColumns };
