import http from 'http';
import { Socket } from 'net';
import { app, initSchemaColumns } from '../server';
import { signSessionToken } from '../src/server/auth/tokens';
import { hashPassword } from '../src/server/auth/passwords';
import { getLastDevOtp, clearDevOtps } from '../src/server/notifications/sms-provider';
import { hashOtp } from '../src/server/auth/otp-service';
import { executeQuery } from '../src/server/db/pool';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import { DistributedRateLimiter } from '../src/server/ratelimit/limiter';

interface DispatchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cookies?: Record<string, string>;
}

interface DispatchResponse {
  status: number;
  headers: Record<string, any>;
  body: string;
  json: () => Promise<any>;
}

function dispatchRequest(
  expressApp: any,
  path: string,
  options: DispatchOptions = {}
): Promise<DispatchResponse> {
  return new Promise((resolve) => {
    const method = options.method || 'GET';
    const socket = new Socket();
    Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = path;
    req.headers = { host: '127.0.0.1:3000' };

    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        req.headers[k.toLowerCase()] = v;
      }
    }

    if (options.cookies) {
      const cookieStr = Object.entries(options.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      req.headers['cookie'] = cookieStr;
    }

    let payload: Buffer | null = null;
    if (options.body !== undefined && options.body !== null) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      payload = Buffer.from(data);
      req.headers['content-length'] = payload.length.toString();
      if (!req.headers['content-type']) {
        req.headers['content-type'] = 'application/json';
      }
    }

    const res = new http.ServerResponse(req);
    const chunks: Buffer[] = [];
    res.write = function (chunk: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };
    res.end = function (chunk?: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const resBody = Buffer.concat(chunks).toString('utf8');
      resolve({
        status: res.statusCode,
        headers: res.getHeaders ? res.getHeaders() : {},
        body: resBody,
        json: async () => {
          try {
            return JSON.parse(resBody);
          } catch {
            return null;
          }
        },
      });
      return this;
    };

    expressApp.handle(req, res, (err: any) => {
      if (!res.headersSent) {
        res.statusCode = err ? 500 : 404;
        res.end(err ? err.message : 'Not Found');
      }
    });

    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

function extractCookie(headers: Record<string, any>, cookieName: string): string | null {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieList = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of cookieList) {
    if (c.startsWith(`${cookieName}=`)) {
      return c.split(';')[0].replace(`${cookieName}=`, '');
    }
  }
  return null;
}

export async function runAuthIntegrationTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  const assert = (condition: boolean, testName: string, extra?: string) => {
    if (condition) {
      passed++;
      results.push(`[PASS] ${testName}`);
    } else {
      failed++;
      const msg = `[FAIL] ${testName}${extra ? ` (${extra})` : ''}`;
      results.push(msg);
      console.error(msg);
    }
  };

  try {
    // 0. Bootstrap test environment
    process.env.INITIAL_STAFF_PASSWORD = 'StaffBootstrapPassword#2026!';
    process.env.INITIAL_ADMIN_PASSWORD = 'AdminBootstrapPassword#2026!';
    await initSchemaColumns();

    const staffPass = 'StaffBootstrapPassword#2026!';
    const staffHash = await hashPassword(staffPass);

    // Setup staff user in dev store
    const staffEmail = 'staff.qa@sellmyghar.in';
    const staffPhone = '+919800000099';
    await executeQuery(
      `INSERT INTO users (id, phone, email, display_name, password_hash, roles, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, '{STAFF_VERIFICATION_AGENT}', true, NOW(), NOW())
       ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash;`,
      ['usr-staff-qa-01', staffPhone, staffEmail, 'QA Staff Agent', staffHash]
    );

    // ====================================================================
    // PART 1: STAFF AUTHENTICATION
    // ====================================================================

    // TEST 1: Valid staff credentials -> 200, role returned, session cookie set, no raw JWT in body
    const res1 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.1' },
      body: { email: staffEmail, password: staffPass },
    });
    const body1 = await res1.json();
    const cookie1 = extractCookie(res1.headers, 'sellmyghar_session');
    assert(
      res1.status === 200 &&
      body1.success === true &&
      body1.user.role === 'STAFF_VERIFICATION_AGENT' &&
      body1.token === undefined &&
      cookie1 !== null && cookie1.length > 20,
      'TEST 1: Valid staff credentials returns 200, role, HTTP-only cookie, and omits raw JWT in body'
    );

    // TEST 2: Invalid staff password -> 401, generic error, failed attempts incremented
    const res2 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.2' },
      body: { email: staffEmail, password: 'WrongPassword#1' },
    });
    const body2 = await res2.json();
    const userRow2 = devSandboxStore.users.get('usr-staff-qa-01');
    assert(
      res2.status === 401 &&
      body2.error?.includes('Only authorized SellMyGhar staff can access internal portals') &&
      userRow2?.failed_login_attempts === 1,
      'TEST 2: Invalid staff password returns 401 generic error and increments failed_login_attempts'
    );

    // TEST 3: 5 consecutive invalid staff password attempts -> account lockout for 15 minutes, 401
    for (let i = 2; i <= 5; i++) {
      await dispatchRequest(app, '/api/auth/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': `192.168.1.${i + 2}` },
        body: { email: staffEmail, password: `WrongPassword#${i}` },
      });
    }
    const userRow3 = devSandboxStore.users.get('usr-staff-qa-01');
    const isLocked3 = Boolean(userRow3?.locked_until && new Date(userRow3.locked_until).getTime() > Date.now());
    assert(
      userRow3?.failed_login_attempts! >= 5 && isLocked3,
      'TEST 3: 5 consecutive invalid staff password attempts triggers 15-minute account lockout'
    );

    // TEST 4: Locked staff account rejects valid password until lock expires -> 401
    const res4 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.10' },
      body: { email: staffEmail, password: staffPass },
    });
    const body4 = await res4.json();
    assert(
      res4.status === 401 &&
      body4.error?.includes('Only authorized SellMyGhar staff can access internal portals'),
      'TEST 4: Locked staff account rejects valid password until lock expires (generic 401)'
    );

    // TEST 5: Successful staff login resets failed_login_attempts to 0
    // Fast-forward lockout expiration
    if (userRow3) {
      userRow3.locked_until = null;
    }
    const res5 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.11' },
      body: { email: staffEmail, password: staffPass },
    });
    const userRow5 = devSandboxStore.users.get('usr-staff-qa-01');
    assert(
      res5.status === 200 && userRow5?.failed_login_attempts === 0 && userRow5?.locked_until === null,
      'TEST 5: Successful staff login resets failed_login_attempts and locked_until to initial state'
    );

    // TEST 6: Non-existent staff email -> generic 401, does not leak account existence
    const res6 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.12' },
      body: { email: 'nonexistent@sellmyghar.in', password: 'SomePassword#123' },
    });
    const body6 = await res6.json();
    assert(
      res6.status === 401 &&
      body6.error === 'Invalid credentials. Only authorized SellMyGhar staff can access internal portals.',
      'TEST 6: Non-existent staff email returns generic 401 without leaking user existence'
    );

    // TEST 7: Case-insensitive staff email login
    const res7 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.13' },
      body: { email: 'STAFF.QA@SELLMYGHAR.IN', password: staffPass },
    });
    assert(
      res7.status === 200,
      'TEST 7: Case-insensitive staff email login (STAFF.QA@SELLMYGHAR.IN) succeeds with 200'
    );

    // TEST 8: Inactive staff account -> 401
    const inactiveStaff: any = {
      id: 'usr-staff-inactive-01',
      phone: '+919800000088',
      email: 'inactive@sellmyghar.in',
      display_name: 'Inactive Staff',
      password_hash: staffHash,
      roles: ['STAFF_VERIFICATION_AGENT'],
      is_active: false,
      token_version: 1,
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    devSandboxStore.users.set(inactiveStaff.id, inactiveStaff);

    const res8 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.14' },
      body: { email: 'inactive@sellmyghar.in', password: staffPass },
    });
    const body8 = await res8.json();
    assert(
      res8.status === 401 && body8.error === 'Staff account is inactive.',
      'TEST 8: Inactive staff account is rejected with 401 and descriptive error'
    );

    // TEST 9: Customer account attempting staff login -> 403 ACCESS_DENIED
    const customerWithPass: any = {
      id: 'usr-customer-with-pass-01',
      phone: '+919845099999',
      email: 'cust.pass@example.com',
      display_name: 'Customer With Password',
      password_hash: staffHash,
      roles: ['OWNER'],
      is_active: true,
      token_version: 1,
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    devSandboxStore.users.set(customerWithPass.id, customerWithPass);

    const res9 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.15' },
      body: { email: 'cust.pass@example.com', password: staffPass },
    });
    const body9 = await res9.json();
    assert(
      res9.status === 403 && body9.error?.includes('account lacks staff privileges'),
      'TEST 9: Customer account attempting staff login is rejected with 403 ACCESS_DENIED'
    );

    // TEST 10: Passwordless account attempting password login -> 401
    const passwordlessStaff: any = {
      id: 'usr-staff-nopass-01',
      phone: '+919800000077',
      email: 'nopass@sellmyghar.in',
      display_name: 'No Pass Staff',
      password_hash: null,
      roles: ['STAFF_VERIFICATION_AGENT'],
      is_active: true,
      token_version: 1,
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    devSandboxStore.users.set(passwordlessStaff.id, passwordlessStaff);

    const res10 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.16' },
      body: { email: 'nopass@sellmyghar.in', password: 'AnyPassword#123' },
    });
    assert(
      res10.status === 401,
      'TEST 10: Passwordless account attempting password login is rejected with 401'
    );

    // ====================================================================
    // PART 2: CUSTOMER OTP AUTHENTICATION
    // ====================================================================

    // TEST 11: Valid phone OTP request -> 200, cooldown returned, SMS dispatched via provider
    const testPhone11 = '+919876543210';
    clearDevOtps();
    const res11 = await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.1.1' },
      body: { phone: testPhone11 },
    });
    const body11 = await res11.json();
    const otp11 = getLastDevOtp(testPhone11);
    assert(
      res11.status === 200 &&
      body11.success === true &&
      body11.cooldownSeconds === 60 &&
      otp11 !== undefined &&
      /^\d{6}$/.test(otp11),
      'TEST 11: Valid phone OTP request returns 200, cooldown, and delivers 6-digit OTP'
    );

    // TEST 12: Invalid phone format (<10 digits, non-Indian prefix, letters) -> 400
    const res12a = await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.1.2' },
      body: { phone: '12345' },
    });
    const res12b = await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.1.3' },
      body: { phone: '+12025550199' },
    });
    const res12c = await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.1.4' },
      body: { phone: 'not-a-number' },
    });
    assert(
      res12a.status === 400 && res12b.status === 400 && res12c.status === 400,
      'TEST 12: Malformed phone numbers (<10 digits, non-Indian, alphanumeric) are rejected with 400'
    );

    // TEST 13: OTP request invalidates prior active OTP for that phone
    const testPhone13 = '+919876543211';
    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.1.5' },
      body: { phone: testPhone13 },
    });
    const firstOtp13 = getLastDevOtp(testPhone13);

    // Second request
    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.1.6' },
      body: { phone: testPhone13 },
    });
    const secondOtp13 = getLastDevOtp(testPhone13);

    const oldOtpRecord = Array.from(devSandboxStore.otpVerifications.values()).find(
      x => x.phone === testPhone13 && x.is_consumed === true
    );
    assert(
      firstOtp13 !== undefined &&
      secondOtp13 !== undefined &&
      firstOtp13 !== secondOtp13 &&
      oldOtpRecord !== undefined &&
      oldOtpRecord.is_consumed === true,
      'TEST 13: New OTP request generates unique code and automatically consumes/invalidates prior active OTP'
    );

    // TEST 14: OTP stored as salted HMAC hash, never plaintext
    const activeOtpRec = Array.from(devSandboxStore.otpVerifications.values()).find(
      x => x.phone === testPhone13 && !x.is_consumed
    );
    const expectedHmac = hashOtp(testPhone13, secondOtp13!);
    assert(
      activeOtpRec !== undefined &&
      activeOtpRec.otp_hash !== secondOtp13 &&
      activeOtpRec.otp_hash === expectedHmac &&
      activeOtpRec.otp_hash.length === 64,
      'TEST 14: OTP is persisted strictly as salted HMAC-SHA256 (64 hex characters), never plaintext'
    );

    // TEST 15: Valid OTP verification -> 200, session cookie set, strictly OWNER role
    const res15 = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.1.7' },
      body: { phone: testPhone13, otp: secondOtp13! },
    });
    const body15 = await res15.json();
    const cookie15 = extractCookie(res15.headers, 'sellmyghar_session');
    assert(
      res15.status === 200 &&
      body15.success === true &&
      body15.authenticated === true &&
      Array.isArray(body15.user.roles) &&
      body15.user.roles.includes('OWNER') &&
      !body15.user.roles.some((r: string) => r.startsWith('STAFF_')) &&
      body15.token === undefined &&
      cookie15 !== null,
      'TEST 15: Valid OTP verification succeeds with 200, sets HTTP-only cookie, and strictly assigns OWNER role'
    );

    // TEST 16: Invalid OTP code -> 400, attempts count incremented
    const testPhone16 = '+919876543212';
    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.2.1' },
      body: { phone: testPhone16 },
    });
    const res16 = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.2.2' },
      body: { phone: testPhone16, otp: '000000' },
    });
    const body16 = await res16.json();
    const otpRec16 = Array.from(devSandboxStore.otpVerifications.values()).find(
      x => x.phone === testPhone16 && !x.is_consumed
    );
    assert(
      res16.status === 400 &&
      body16.error?.includes('Invalid OTP') &&
      otpRec16?.attempts_count === 1,
      'TEST 16: Invalid OTP code rejected with 400 and increments attempts_count in database'
    );

    // TEST 17: 5 invalid OTP attempts -> account locked for 30 minutes
    for (let i = 2; i <= 5; i++) {
      await dispatchRequest(app, '/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'x-forwarded-for': `10.10.2.${i + 2}` },
        body: { phone: testPhone16, otp: `00000${i}` },
      });
    }
    const res17Locked = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.2.10' },
      body: { phone: testPhone16, otp: '111111' },
    });
    const body17 = await res17Locked.json();
    assert(
      res17Locked.status === 400 &&
      body17.error?.includes('temporarily locked'),
      'TEST 17: 5 invalid OTP verification attempts triggers 30-minute lockout defense'
    );

    // TEST 18: Expired OTP (>5 minutes) -> rejected with 400
    const testPhone18 = '+919876543213';
    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.3.1' },
      body: { phone: testPhone18 },
    });
    const otp18 = getLastDevOtp(testPhone18);
    const rec18 = Array.from(devSandboxStore.otpVerifications.values()).find(
      x => x.phone === testPhone18 && !x.is_consumed
    );
    if (rec18) {
      rec18.expires_at = new Date(Date.now() - 10000).toISOString(); // 10s in past
    }
    const res18 = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.3.2' },
      body: { phone: testPhone18, otp: otp18! },
    });
    const body18 = await res18.json();
    assert(
      res18.status === 400 && body18.error?.includes('expired'),
      'TEST 18: Expired OTP code (>5 minutes) is rejected with 400 code expired error'
    );

    // TEST 19: Replay attack: already-consumed OTP rejected with 400
    const res19Replay = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.3.3' },
      body: { phone: testPhone13, otp: secondOtp13! }, // testPhone13 was already verified in test 15
    });
    const body19 = await res19Replay.json();
    assert(
      res19Replay.status === 400 && body19.error?.includes('No active verification code found'),
      'TEST 19: Replay attack (reusing consumed OTP) is strictly rejected with 400 single-use error'
    );

    // TEST 20: New OTP request generates different code and supersedes previous
    const testPhone20 = '+919876543214';
    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.4.1' },
      body: { phone: testPhone20 },
    });
    const codeA = getLastDevOtp(testPhone20);

    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.4.2' },
      body: { phone: testPhone20 },
    });
    const codeB = getLastDevOtp(testPhone20);

    // Attempt verifying with superseded codeA
    const res20A = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.4.3' },
      body: { phone: testPhone20, otp: codeA! },
    });
    // Attempt verifying with active codeB
    const res20B = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.4.4' },
      body: { phone: testPhone20, otp: codeB! },
    });
    assert(
      res20A.status === 400 && res20B.status === 200,
      'TEST 20: Superseded OTP codeA is rejected while current OTP codeB verifies successfully'
    );

    // TEST 21: Successful OTP verification creates user_identities record with provider='PHONE'
    const testPhone21 = '+919876543215';
    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.5.1' },
      body: { phone: testPhone21 },
    });
    const otp21 = getLastDevOtp(testPhone21);
    const res21 = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.5.2' },
      body: { phone: testPhone21, otp: otp21! },
    });
    const body21 = await res21.json();
    const ident21 = Array.from(devSandboxStore.userIdentities.values()).find(
      x => x.provider === 'PHONE' && x.provider_user_id === testPhone21
    );
    assert(
      res21.status === 200 &&
      ident21 !== undefined &&
      ident21.user_id === body21.user.id &&
      ident21.provider === 'PHONE',
      'TEST 21: OTP verification registers user identity in user_identities table linked to user ID'
    );

    // TEST 22: Customer OTP login into staff phone number -> strictly rejected (staff hijack prevention)
    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.6.1' },
      body: { phone: staffPhone },
    });
    const staffOtp = getLastDevOtp(staffPhone);
    const res22Hijack = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.6.2' },
      body: { phone: staffPhone, otp: staffOtp! },
    });
    const body22 = await res22Hijack.json();
    assert(
      res22Hijack.status === 400 &&
      body22.error?.includes('Staff accounts must authenticate via enterprise corporate credentials'),
      'TEST 22: Customer OTP verification for staff phone is strictly blocked (staff account hijack prevention)'
    );

    // TEST 23: Customer display name updated on verification if provided
    const testPhone23 = '+919876543216';
    await dispatchRequest(app, '/api/auth/otp/request', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.7.1' },
      body: { phone: testPhone23 },
    });
    const otp23 = getLastDevOtp(testPhone23);
    const res23 = await dispatchRequest(app, '/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.10.7.2' },
      body: { phone: testPhone23, otp: otp23!, name: 'Sunil Gavaskar' },
    });
    const body23 = await res23.json();
    const user23 = devSandboxStore.users.get(body23.user.id);
    assert(
      res23.status === 200 &&
      body23.user.name === 'Sunil Gavaskar' &&
      user23?.display_name === 'Sunil Gavaskar',
      'TEST 23: Display name provided during OTP verification persists to database user profile'
    );

    // ====================================================================
    // PART 3: SESSION & TOKEN SECURITY
    // ====================================================================

    // TEST 24: GET /api/auth/me with valid session cookie returns authenticated user
    const userSessionToken24 = await signSessionToken(
      {
        uid: 'usr-staff-qa-01',
        phone: staffPhone,
        email: staffEmail,
        roles: ['STAFF_VERIFICATION_AGENT'],
        permissions: [],
      },
      1
    );
    const res24 = await dispatchRequest(app, '/api/auth/me', {
      method: 'GET',
      cookies: { sellmyghar_session: userSessionToken24 },
    });
    const body24 = await res24.json();
    assert(
      res24.status === 200 &&
      body24.authenticated === true &&
      body24.user.id === 'usr-staff-qa-01' &&
      body24.user.roles.includes('STAFF_VERIFICATION_AGENT'),
      'TEST 24: GET /api/auth/me with valid session cookie validates user and returns authenticated state'
    );

    // TEST 25: GET /api/auth/me validates token_version and rejects revoked sessions with 401
    // Increment token_version in DB to invalidate previous tokens
    const staffRow25 = devSandboxStore.users.get('usr-staff-qa-01');
    if (staffRow25) {
      staffRow25.token_version = 2;
    }
    const res25 = await dispatchRequest(app, '/api/auth/me', {
      method: 'GET',
      cookies: { sellmyghar_session: userSessionToken24 }, // tokenVersion is 1
    });
    const body25 = await res25.json();
    assert(
      res25.status === 401 &&
      body25.authenticated === false &&
      body25.reason === 'SESSION_REVOKED',
      'TEST 25: GET /api/auth/me verifies token_version and rejects revoked session with 401 SESSION_REVOKED'
    );

    // TEST 26: POST /api/auth/logout invalidates session (increments token_version) and clears cookie
    const activeStaffToken26 = await signSessionToken(
      {
        uid: 'usr-staff-qa-01',
        phone: staffPhone,
        email: staffEmail,
        roles: ['STAFF_VERIFICATION_AGENT'],
        permissions: [],
      },
      2
    );
    const res26 = await dispatchRequest(app, '/api/auth/logout', {
      method: 'POST',
      cookies: { sellmyghar_session: activeStaffToken26 },
    });
    const body26 = await res26.json();
    const clearedCookie = res26.headers['set-cookie'];
    const staffRow26 = devSandboxStore.users.get('usr-staff-qa-01');
    assert(
      res26.status === 200 &&
      body26.success === true &&
      staffRow26?.token_version === 3 &&
      Boolean(clearedCookie),
      'TEST 26: POST /api/auth/logout increments token_version in database and clears session cookie'
    );

    // TEST 27: GET /api/auth/me after logout returns 401
    const res27 = await dispatchRequest(app, '/api/auth/me', {
      method: 'GET',
      cookies: { sellmyghar_session: activeStaffToken26 },
    });
    assert(
      res27.status === 401,
      'TEST 27: GET /api/auth/me with logged-out session cookie is rejected with 401'
    );

    // TEST 28: GET /api/auth/me rejects deactivated users with 401
    const deactivatedToken28 = await signSessionToken(
      {
        uid: inactiveStaff.id,
        phone: inactiveStaff.phone,
        email: inactiveStaff.email,
        roles: ['STAFF_VERIFICATION_AGENT'],
        permissions: [],
      },
      1
    );
    const res28 = await dispatchRequest(app, '/api/auth/me', {
      method: 'GET',
      cookies: { sellmyghar_session: deactivatedToken28 },
    });
    const body28 = await res28.json();
    assert(
      res28.status === 401 &&
      body28.authenticated === false &&
      body28.reason === 'ACCOUNT_DEACTIVATED',
      'TEST 28: GET /api/auth/me rejects deactivated account with 401 ACCOUNT_DEACTIVATED'
    );

    // TEST 29: GET /api/auth/me without cookie or token returns 401
    const res29 = await dispatchRequest(app, '/api/auth/me', {
      method: 'GET',
    });
    const body29 = await res29.json();
    assert(
      res29.status === 401 && body29.authenticated === false,
      'TEST 29: GET /api/auth/me without cookie or Authorization header returns 401 unauthenticated'
    );

    // TEST 30: Session cookie has httpOnly, sameSite, path attributes
    const res30 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.50' },
      body: { email: staffEmail, password: staffPass },
    });
    const setCookieHeader30 = String(res30.headers['set-cookie'] || '');
    assert(
      setCookieHeader30.toLowerCase().includes('httponly') &&
      setCookieHeader30.toLowerCase().includes('samesite=lax') &&
      setCookieHeader30.toLowerCase().includes('path=/'),
      'TEST 30: Session cookie is set with HttpOnly, SameSite=Lax, and Path=/ security flags'
    );

    // ====================================================================
    // PART 4: SOCIAL & DEPRECATED AUTH HARDENING
    // ====================================================================

    // TEST 31: POST /api/auth/customer-login returns 400 CUSTOMER_PASSWORD_AUTH_UNAVAILABLE
    const res31 = await dispatchRequest(app, '/api/auth/customer-login', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'password123' },
    });
    const body31 = await res31.json();
    assert(
      res31.status === 400 &&
      body31.error === 'CUSTOMER_PASSWORD_AUTH_UNAVAILABLE' &&
      body31.message?.includes('Please authenticate via Mobile OTP'),
      'TEST 31: POST /api/auth/customer-login returns 400 CUSTOMER_PASSWORD_AUTH_UNAVAILABLE'
    );

    // TEST 32: POST /api/auth/google returns 503 PROVIDER_NOT_CONFIGURED (fail-closed)
    const res32 = await dispatchRequest(app, '/api/auth/google', {
      method: 'POST',
      body: { idToken: 'fake-token' },
    });
    const body32 = await res32.json();
    assert(
      res32.status === 503 &&
      body32.error === 'PROVIDER_NOT_CONFIGURED' &&
      body32.message?.includes('Please authenticate via Mobile Number + OTP'),
      'TEST 32: POST /api/auth/google fails closed with 503 PROVIDER_NOT_CONFIGURED'
    );

    // TEST 33: POST /api/auth/apple returns 503 PROVIDER_NOT_CONFIGURED (fail-closed)
    const res33 = await dispatchRequest(app, '/api/auth/apple', {
      method: 'POST',
      body: { idToken: 'fake-token' },
    });
    const body33 = await res33.json();
    assert(
      res33.status === 503 &&
      body33.error === 'PROVIDER_NOT_CONFIGURED' &&
      body33.message?.includes('Please authenticate via Mobile Number + OTP'),
      'TEST 33: POST /api/auth/apple fails closed with 503 PROVIDER_NOT_CONFIGURED'
    );

    // TEST 34: Client-supplied identity in POST /api/auth/session rejected with 400 PROHIBITED
    const res34 = await dispatchRequest(app, '/api/auth/session', {
      method: 'POST',
      body: { user: { id: 'admin', roles: ['STAFF_SUPER_ADMIN'] } },
    });
    const body34 = await res34.json();
    assert(
      res34.status === 400 && body34.error === 'PROHIBITED',
      'TEST 34: Client-supplied user identity objects in POST /api/auth/session rejected with 400 PROHIBITED'
    );

    // TEST 35: Audit log records authentication events
    const auditEvents = devSandboxStore.auditLogs.map(l => l.action);
    const hasStaffLoginSuccess = auditEvents.includes('STAFF_LOGIN_SUCCESS');
    const hasStaffLoginFailed = auditEvents.includes('STAFF_LOGIN_FAILED');
    const hasStaffLoginLocked = auditEvents.includes('STAFF_LOGIN_LOCKED');
    const hasOtpRequested = auditEvents.includes('OTP_REQUESTED');
    const hasOtpVerified = auditEvents.includes('OTP_VERIFIED');
    assert(
      hasStaffLoginSuccess && hasStaffLoginFailed && hasStaffLoginLocked && hasOtpRequested && hasOtpVerified,
      'TEST 35: Security audit log records STAFF_LOGIN_SUCCESS, STAFF_LOGIN_FAILED, STAFF_LOGIN_LOCKED, OTP_REQUESTED, OTP_VERIFIED'
    );

  } catch (err: any) {
    console.error('Unexpected error in auth integration tests:', err);
    failed++;
    results.push(`[FATAL] Suite crashed: ${err.message}`);
  }

  return { passed, failed, results };
}

if (process.argv[1]?.endsWith('run-auth-integration-tests.ts')) {
  runAuthIntegrationTests().then(({ passed, failed, results }) => {
    results.forEach(r => console.log(' ', r));
    console.log(`\nSubtotal: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  });
}
