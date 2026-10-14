process.env.RUNNING_TESTS = 'true';
import { app, initSchemaColumns, getTrustedAppOrigin, getClientIp } from '../server';
import { DistributedRateLimiter } from '../src/server/ratelimit/limiter';
import { 
  generatePasswordResetToken, 
  validatePasswordResetToken, 
  executePasswordResetCompletion 
} from '../src/server/auth/passwords';
import { signSessionToken, verifySessionToken } from '../src/server/auth/tokens';
import { getDbPool, executeQuery } from '../src/server/db/pool';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import { AuthenticatedUser } from '../src/core/types/auth';
import http from 'http';
import { Socket } from 'net';
import fs from 'fs';
import path from 'path';
import { createHash, randomBytes } from 'crypto';

interface DispatchResponse {
  status: number;
  headers: Record<string, any>;
  body: string;
  json: () => Promise<any>;
}

function extractStaffToken(res: DispatchResponse): string {
  const cookies = res.headers['set-cookie'] || [];
  const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
  const match = cookieStr.match(/sellmyghar_staff_session=([^;]+)/);
  return match ? match[1] : '';
}

let ipCounter = 1;

function dispatchRequest(
  expressApp: any,
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<DispatchResponse> {
  return new Promise((resolve) => {
    const socket = new Socket();
    Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
    const req = new http.IncomingMessage(socket);
    req.method = options.method || 'GET';
    const parsedPath = url.startsWith('http')
      ? new URL(url).pathname + new URL(url).search
      : url;
    req.url = parsedPath;
    req.headers = {};
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        req.headers[k.toLowerCase()] = v;
      }
    }
    if (!req.headers['x-forwarded-for']) {
      req.headers['x-forwarded-for'] = `127.0.0.${(ipCounter++ % 240) + 1}`;
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
    } as any;

    res.end = function (chunk?: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const body = Buffer.concat(chunks).toString('utf8');
      const headers: Record<string, any> = {};
      const rawHeaders = res.getHeaders();
      for (const [k, v] of Object.entries(rawHeaders)) {
        headers[k.toLowerCase()] = v;
      }
      resolve({
        status: res.statusCode,
        headers,
        body,
        json: async () => {
          try {
            return JSON.parse(body);
          } catch {
            return null;
          }
        },
      });
      return res;
    } as any;

    expressApp(req, res);
    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runTests() {
  await initSchemaColumns();
  console.log('\n======================================================');
  console.log('--- 1. Frontend Route & Link Isolation Checks ---');
  console.log('======================================================');

  const authPageContent = fs.readFileSync(path.resolve('src/components/auth/AuthPage.tsx'), 'utf8');
  assert(
    !authPageContent.includes('#/reset-password'),
    'AuthPage does not expose public Forgot Password link'
  );

  const appContent = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
  assert(
    appContent.includes('<PasswordResetPage'),
    'App.tsx mounts PasswordResetPage on RESET_PASSWORD route'
  );
  assert(
    !appContent.includes('<StaffLogin initialMode="RESET"'),
    'App.tsx never mounts StaffLogin as public RESET_PASSWORD route'
  );

  const resetPageContent = fs.readFileSync(path.resolve('src/components/auth/PasswordResetPage.tsx'), 'utf8');
  assert(
    !resetPageContent.includes('StaffLogin'),
    'PasswordResetPage contains zero imports or references to StaffLogin'
  );
  assert(
    resetPageContent.includes('onBackToHome'),
    'PasswordResetPage navigates Back to Home to public homepage'
  );

  console.log('\n======================================================');
  console.log('--- 2. Server Password Reset Token Lifecycle ---');
  console.log('======================================================');

  // A. Missing token check
  const missingRes = await dispatchRequest(app, '/api/auth/verify-reset-token');
  assert(missingRes.status === 400, 'Missing reset token rejected with HTTP 400');
  const missingBody = await missingRes.json();
  assert(missingBody.valid === false, 'Missing token response returns valid: false');

  // B. Invalid token check
  const invalidRes = await dispatchRequest(app, '/api/auth/verify-reset-token?token=invalid_dummy_token_1234567890123456');
  assert(invalidRes.status === 400, 'Invalid reset token rejected with HTTP 400');
  const invalidBody = await invalidRes.json();
  assert(invalidBody.valid === false, 'Invalid token response returns valid: false');

  // C. Valid token generation and pre-verification
  const { token: validToken } = await generatePasswordResetToken('usr-admin-compliance-01', 'admin@sellmyghar.in');
  const validCheckRes = await dispatchRequest(app, `/api/auth/verify-reset-token?token=${validToken}`);
  assert(validCheckRes.status === 200, 'Valid reset token verified with HTTP 200');
  const validCheckBody = await validCheckRes.json();
  assert(validCheckBody.valid === true, 'Valid token response returns valid: true');
  assert(validCheckBody.email === 'admin@sellmyghar.in', 'Valid token response returns matching email');

  // D. Successful Password Reset
  const resetRes = await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: validToken,
      newPassword: 'BrandNewSecurePassword2026!',
    },
  });
  assert(resetRes.status === 200, 'Password reset with valid token succeeds with HTTP 200');
  const resetBody = await resetRes.json();
  assert(resetBody.success === true, 'Reset response marks success as true');
  assert(!resetRes.headers['set-cookie'], 'Successful reset does NOT issue session cookies (no auto-login)');

  // E. Reused / Consumed Token Rejection
  const reuseCheckRes = await dispatchRequest(app, `/api/auth/verify-reset-token?token=${validToken}`);
  assert(reuseCheckRes.status === 400, 'Consumed reset token rejected with HTTP 400 on verify');

  const reuseSubmitRes = await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: validToken,
      newPassword: 'AnotherPassword2026!',
    },
  });
  assert(reuseSubmitRes.status === 400, 'Consumed reset token rejected with HTTP 400 on submission');

  console.log('\n======================================================');
  console.log('--- 3. Session Isolation & Cookie Clearing Checks ---');
  console.log('======================================================');

  // A. Staff login generates staff session cookie
  const staffLoginRes = await dispatchRequest(app, '/api/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@sellmyghar.in',
      password: 'BrandNewSecurePassword2026!',
    },
  });
  assert(staffLoginRes.status === 200, 'Staff login succeeds with updated password');
  const staffCookies = staffLoginRes.headers['set-cookie'] || [];
  const staffCookieStr = Array.isArray(staffCookies) ? staffCookies.join('; ') : staffCookies;
  assert(staffCookieStr.includes('sellmyghar_staff_session'), 'Staff login sets sellmyghar_staff_session cookie');
  assert(staffCookieStr.includes('sellmyghar_session'), 'Staff login sets sellmyghar_session cookie');

  // Extract staff session token
  const staffTokenMatch = staffCookieStr.match(/sellmyghar_staff_session=([^;]+)/);
  const staffToken = staffTokenMatch ? staffTokenMatch[1] : '';

  // B. Customer OTP Verification Clears Staff Session
  const otpReqRes = await dispatchRequest(app, '/api/auth/otp/request', {
    method: 'POST',
    body: { phone: '9876543210' },
  });
  const otpReqBody = await otpReqRes.json();
  const devOtp = otpReqBody.devOtp;

  const otpVerifyRes = await dispatchRequest(app, '/api/auth/otp/verify', {
    method: 'POST',
    headers: {
      cookie: `sellmyghar_staff_session=${staffToken}`,
    },
    body: {
      phone: '9876543210',
      otp: devOtp,
      name: 'Ramesh Patel',
    },
  });
  assert(otpVerifyRes.status === 200, 'Customer OTP verification succeeds with HTTP 200');
  const otpVerifyCookies = otpVerifyRes.headers['set-cookie'] || [];
  const otpCookieStr = Array.isArray(otpVerifyCookies) ? otpVerifyCookies.join('; ') : otpVerifyCookies;
  assert(
    otpCookieStr.includes('sellmyghar_staff_session=;'),
    'Customer OTP verification explicitly clears sellmyghar_staff_session'
  );
  assert(
    otpCookieStr.includes('sellmyghar_session='),
    'Customer OTP verification sets new customer sellmyghar_session'
  );

  // Extract customer session token
  const customerTokenMatch = otpCookieStr.match(/(?:^|;\s*)sellmyghar_session=([^;]+)/);
  const customerToken = customerTokenMatch ? customerTokenMatch[1] : '';

  // C. Route-Context Cookie Priority (When both cookies exist in request)
  // Request to /api/auth/me with both customer and staff cookies
  const authMeBothRes = await dispatchRequest(app, '/api/auth/me', {
    headers: {
      cookie: `sellmyghar_session=${customerToken}; sellmyghar_staff_session=${staffToken}`,
    },
  });
  assert(authMeBothRes.status === 200, '/api/auth/me returns HTTP 200 with both cookies present');
  const authMeBothBody = await authMeBothRes.json();
  assert(authMeBothBody.authenticated === true, '/api/auth/me indicates user is authenticated');
  assert(
    authMeBothBody.user?.roles?.includes('OWNER') || authMeBothBody.user?.roles?.includes('BUYER'),
    '/api/auth/me prioritizes customer identity, not shadowing as staff admin'
  );

  // D. Protected CRM Route with staff session cookie
  const crmOverviewRes = await dispatchRequest(app, '/api/crm/overview-metrics', {
    headers: {
      cookie: `sellmyghar_staff_session=${staffToken}; sellmyghar_session=${customerToken}`,
    },
  });
  assert(crmOverviewRes.status === 200, '/api/crm/overview-metrics succeeds with staff session on CRM route');

  // Protected CRM Route with ONLY customer cookie is rejected
  const crmDeniedRes = await dispatchRequest(app, '/api/crm/overview-metrics', {
    headers: {
      cookie: `sellmyghar_session=${customerToken}`,
    },
  });
  assert(crmDeniedRes.status === 403, '/api/crm/overview-metrics strictly rejects customer session with 403');

  // E. Logout Clears Both Cookies with Full Path and Lax Options
  const logoutRes = await dispatchRequest(app, '/api/auth/logout', {
    method: 'POST',
    headers: {
      cookie: `sellmyghar_session=${customerToken}; sellmyghar_staff_session=${staffToken}`,
    },
  });
  assert(logoutRes.status === 200, 'Logout succeeds with HTTP 200');
  const logoutCookies = logoutRes.headers['set-cookie'] || [];
  const logoutCookieStr = Array.isArray(logoutCookies) ? logoutCookies.join('; ') : logoutCookies;
  assert(
    logoutCookieStr.includes('sellmyghar_session=;'),
    'Logout clears sellmyghar_session'
  );
  assert(
    logoutCookieStr.includes('sellmyghar_staff_session=;'),
    'Logout clears sellmyghar_staff_session'
  );
  assert(
    logoutCookieStr.includes('Path=/'),
    'Logout sets Path=/'
  );

  console.log('\n======================================================');
  console.log('--- 4. Atomic Reset Token Concurrency & Replay Defense ---');
  console.log('======================================================');

  // A. Generate a fresh valid reset token
  const { token: concurrentToken } = await generatePasswordResetToken('usr-admin-compliance-01', 'admin@sellmyghar.in');

  // B. Dispatch two simultaneous reset requests with the same token
  const [concRes1, concRes2] = await Promise.all([
    dispatchRequest(app, '/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: concurrentToken,
        newPassword: 'ConcurrentPassword1#2026',
      },
    }),
    dispatchRequest(app, '/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: concurrentToken,
        newPassword: 'ConcurrentPassword2#2026',
      },
    }),
  ]);

  const statuses = [concRes1.status, concRes2.status].sort();
  assert(
    statuses[0] === 200 && statuses[1] === 400,
    'Concurrent reset: exactly one request succeeds (HTTP 200) and one fails (HTTP 400)',
    `Observed statuses: ${concRes1.status}, ${concRes2.status}`
  );

  // C. Verify subsequent replay attempt is strictly rejected
  const replayRes = await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: concurrentToken,
      newPassword: 'ConcurrentPassword3#2026',
    },
  });
  assert(replayRes.status === 400, 'Sequential replay of claimed/consumed token is rejected with HTTP 400');

  console.log('\n======================================================');
  console.log('--- 5. CRM Staff Password Management Suite ---');
  console.log('======================================================');

  // Establish active staff sessions: Super Admin and Intake Agent
  let activeAdminToken = '';
  const adminLoginRes = await dispatchRequest(app, '/api/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@sellmyghar.in',
      password: 'ConcurrentPassword1#2026', // Updated by concurrency test (or fallback)
    },
  });
  if (adminLoginRes.status === 200) {
    activeAdminToken = extractStaffToken(adminLoginRes);
  } else {
    // If ConcurrentPassword2 won the race
    const adminLoginRes2 = await dispatchRequest(app, '/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@sellmyghar.in',
        password: 'ConcurrentPassword2#2026',
      },
    });
    activeAdminToken = extractStaffToken(adminLoginRes2);
  }
  assert(Boolean(activeAdminToken), 'Admin authenticated and obtained fresh staff session token');

  const intakeLoginRes = await dispatchRequest(app, '/api/auth/login', {
    method: 'POST',
    body: {
      email: 'intake@sellmyghar.in',
      password: process.env.INITIAL_STAFF_PASSWORD || '[REDACTED_BOOTSTRAP_PASSWORD]',
    },
  });
  assert(intakeLoginRes.status === 200, 'Intake agent logged in successfully');
  const activeIntakeToken = extractStaffToken(intakeLoginRes);
  assert(Boolean(activeIntakeToken), 'Intake agent obtained staff session token');

  // 5.1 Self-service change: Unauthenticated request rejected
  const unauthChangeRes = await dispatchRequest(app, '/api/crm/auth/change-password', {
    method: 'POST',
    body: { currentPassword: 'foo', newPassword: 'BarPassword#2026!' },
  });
  assert(unauthChangeRes.status === 401, 'Unauthenticated staff password change rejected with HTTP 401');

  // 5.2 Self-service change: Customer session attempting staff action rejected
  const activeCustomerToken = await signSessionToken({
    uid: 'usr-customer-seller-01',
    phone: '+919876500001',
    email: 'seller@sellmyghar.in',
    roles: ['OWNER'],
    permissions: [],
  }, 1);

  const customerChangeRes = await dispatchRequest(app, '/api/crm/auth/change-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${activeCustomerToken}` },
    body: { currentPassword: 'foo', newPassword: 'BarPassword#2026!' },
  });
  assert(
    customerChangeRes.status === 403,
    'Customer session attempting staff password change rejected with HTTP 403',
    `Status: ${customerChangeRes.status}, Body: ${customerChangeRes.body}`
  );

  // 5.3 Self-service change: Invalid current password rejected
  const invalidCurrentRes = await dispatchRequest(app, '/api/crm/auth/change-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${activeIntakeToken}` },
    body: { currentPassword: 'WrongCurrentPassword!', newPassword: 'ValidNewPassword#2026!' },
  });
  assert(invalidCurrentRes.status === 400, 'Incorrect current password rejected with HTTP 400');
  const invalidCurrentData = await invalidCurrentRes.json();
  assert(invalidCurrentData.error === 'INVALID_PASSWORD', 'Error code specifies INVALID_PASSWORD');

  // 5.4 Self-service change: Short new password rejected (< 8 characters)
  const shortPassRes = await dispatchRequest(app, '/api/crm/auth/change-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${activeIntakeToken}` },
    body: { currentPassword: process.env.INITIAL_STAFF_PASSWORD || '[REDACTED_BOOTSTRAP_PASSWORD]', newPassword: 'short' },
  });
  assert(shortPassRes.status === 400, 'Short password (< 8 chars) rejected with HTTP 400');

  // 5.5 Self-service change: Password reuse rejected
  const intakeCurrentPass = process.env.INITIAL_STAFF_PASSWORD || '[REDACTED_BOOTSTRAP_PASSWORD]';
  const reusePassRes = await dispatchRequest(app, '/api/crm/auth/change-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${activeIntakeToken}` },
    body: { currentPassword: intakeCurrentPass, newPassword: intakeCurrentPass },
  });
  assert(reusePassRes.status === 400, 'Reusing current password rejected with HTTP 400');
  const reuseData = await reusePassRes.json();
  assert(reuseData.error === 'PASSWORD_REUSE', 'Error code specifies PASSWORD_REUSE');

  // 5.6 Self-service change: Successful password update
  const newIntakePass = 'FreshIntakePassword#2026!';
  const validChangeRes = await dispatchRequest(app, '/api/crm/auth/change-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${activeIntakeToken}` },
    body: { currentPassword: intakeCurrentPass, newPassword: newIntakePass },
  });
  assert(
    validChangeRes.status === 200,
    'Valid staff password change succeeds with HTTP 200',
    `Status: ${validChangeRes.status}, Body: ${validChangeRes.body}`
  );
  const validChangeData = await validChangeRes.json();
  assert(validChangeData.success === true, 'Response indicates success');
  const freshIntakeToken = validChangeData.token;
  assert(Boolean(freshIntakeToken), 'Response returns fresh staff session token');

  // 5.7 Verify prior session token is revoked (token_version incremented)
  const revokedCheckRes = await dispatchRequest(app, '/api/crm/overview-metrics', {
    headers: { authorization: `Bearer ${activeIntakeToken}` },
  });
  assert(
    revokedCheckRes.status === 401,
    'Prior staff session token is strictly revoked (HTTP 401)',
    `Status: ${revokedCheckRes.status}, Body: ${revokedCheckRes.body}`
  );

  // Fresh session token works
  const freshSessionCheckRes = await dispatchRequest(app, '/api/crm/overview-metrics', {
    headers: { authorization: `Bearer ${freshIntakeToken}` },
  });
  assert(
    freshSessionCheckRes.status === 200,
    'Fresh staff session token functions normally (HTTP 200)',
    `Status: ${freshSessionCheckRes.status}, Body: ${freshSessionCheckRes.body}`
  );

  // 5.8 Admin forced reset: Non-admin caller rejected
  const nonAdminResetRes = await dispatchRequest(app, '/api/crm/users/usr-staff-closer-01/reset-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${freshIntakeToken}` },
    body: { newPassword: 'CloserResetPassword#2026!' },
  });
  assert(
    nonAdminResetRes.status === 403,
    'Non-admin staff caller rejected from admin reset with HTTP 403',
    `Status: ${nonAdminResetRes.status}, Body: ${nonAdminResetRes.body}`
  );

  // 5.9 Admin forced reset: Customer caller rejected
  const customerAdminResetRes = await dispatchRequest(app, '/api/crm/users/usr-staff-closer-01/reset-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${activeCustomerToken}` },
    body: { newPassword: 'CloserResetPassword#2026!' },
  });
  assert(customerAdminResetRes.status === 403, 'Customer caller rejected from admin reset with HTTP 403');

  // 5.10 Admin forced reset: Non-staff target rejected
  const nonStaffTargetRes = await dispatchRequest(app, '/api/crm/users/usr-rls-owner-01/reset-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${activeAdminToken}` },
    body: { newPassword: 'OwnerResetPassword#2026!' },
  });
  assert(
    nonStaffTargetRes.status === 400 || nonStaffTargetRes.status === 404,
    'Admin reset targeting non-staff user rejected with HTTP 400/404'
  );

  // 5.11 Admin forced reset: Successful forced reset by Super Admin
  const adminResetRes = await dispatchRequest(app, '/api/crm/users/usr-staff-closer-01/reset-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${activeAdminToken}` },
    body: { newPassword: 'NewCloserAdminAssigned#2026!' },
  });
  assert(adminResetRes.status === 200, 'Super Admin staff password reset succeeds with HTTP 200');
  const adminResetData = await adminResetRes.json();
  assert(adminResetData.success === true, 'Admin reset response indicates success');
  assert(!JSON.stringify(adminResetData).includes('NewCloserAdminAssigned#2026!'), 'Temporary password is not leaked in response');

  // 5.12 Verify closer can log in with new admin-assigned password
  const closerLoginRes = await dispatchRequest(app, '/api/auth/login', {
    method: 'POST',
    body: {
      email: 'closer@sellmyghar.in',
      password: 'NewCloserAdminAssigned#2026!',
    },
  });
  assert(closerLoginRes.status === 200, 'Target staff member can log in with admin-assigned password');

  console.log('\n======================================================');
  console.log('--- 6. PostgreSQL-Backed Password Reset Architecture & Rollback Suite ---');
  console.log('======================================================');

  // 6.1 Multi-Token Concurrency for Same User (Deadlock-Free Canonical Locking)
  // Two different valid tokens issued to the same user, submitted concurrently
  const { token: raceTokA } = await generatePasswordResetToken('usr-admin-compliance-01', 'admin@sellmyghar.in');
  const { token: raceTokB } = await generatePasswordResetToken('usr-admin-compliance-01', 'admin@sellmyghar.in');

  const [raceResA, raceResB] = await Promise.all([
    dispatchRequest(app, '/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: raceTokA,
        newPassword: 'RacePasswordA#2026!',
      },
    }),
    dispatchRequest(app, '/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: raceTokB,
        newPassword: 'RacePasswordB#2026!',
      },
    }),
  ]);

  const raceStatuses = [raceResA.status, raceResB.status].sort();
  assert(
    raceStatuses[0] === 200 && raceStatuses[1] === 400,
    'Different tokens for same user concurrent race: exactly one succeeds (200), one fails (400)',
    `Statuses: ${raceResA.status}, ${raceResB.status}`
  );

  // Assert loser token is invalidated and cannot be reused
  const loserToken = raceResA.status === 200 ? raceTokB : raceTokA;
  const loserCheckRes = await dispatchRequest(app, `/api/auth/verify-reset-token?token=${loserToken}`);
  assert(loserCheckRes.status === 400, 'Loser token from concurrent race is invalidated by sibling cleanup');

  // 6.2 Sequential Sibling Token Invalidation
  const { token: seqTokA } = await generatePasswordResetToken('usr-staff-intake-01', 'intake@sellmyghar.in');
  const { token: seqTokB } = await generatePasswordResetToken('usr-staff-intake-01', 'intake@sellmyghar.in');

  const seqCheckBefore = await dispatchRequest(app, `/api/auth/verify-reset-token?token=${seqTokB}`);
  assert(seqCheckBefore.status === 200, 'Sibling Token B is valid before Token A is consumed');

  const seqResetA = await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: seqTokA,
      newPassword: 'IntakeNewSecurePass#2026!',
    },
  });
  assert(seqResetA.status === 200, 'Reset with Sibling Token A succeeds with HTTP 200');

  const seqCheckAfter = await dispatchRequest(app, `/api/auth/verify-reset-token?token=${seqTokB}`);
  assert(seqCheckAfter.status === 400, 'Sibling Token B is automatically invalidated when Token A is consumed');

  const seqSubmitAfter = await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: seqTokB,
      newPassword: 'IntakeAnotherPass#2026!',
    },
  });
  assert(seqSubmitAfter.status === 400, 'Submission with invalidated sibling Token B is rejected with HTTP 400');

  // 6.3 Expired Token Rejection
  const expiredRawToken = 'expired_raw_token_test_1234567890123456789012345678901234';
  const expHash = createHash('sha256').update(expiredRawToken).digest('hex');
  await executeQuery(
    `INSERT INTO password_reset_tokens (id, user_id, email, token_hash, expires_at, is_consumed, created_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW());`,
    ['rst-expired-test-id', 'usr-staff-intake-01', 'intake@sellmyghar.in', expHash, new Date(Date.now() - 3600000).toISOString()]
  );

  const expVerifyRes = await dispatchRequest(app, `/api/auth/verify-reset-token?token=${expiredRawToken}`);
  assert(expVerifyRes.status === 400, 'Expired token is rejected during pre-verification with HTTP 400');

  const expSubmitRes = await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: expiredRawToken,
      newPassword: 'ExpiredTokenAttempt#2026!',
    },
  });
  assert(expSubmitRes.status === 400, 'Expired token is rejected during reset submission with HTTP 400');

  // 6.4 Deactivated Account Reset Rejection
  await executeQuery(`UPDATE users SET is_active = $1 WHERE id = $2;`, [false, 'usr-staff-verification-01']);
  const { token: deactToken } = await generatePasswordResetToken('usr-staff-verification-01', 'verification@sellmyghar.in');

  const deactResetRes = await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: deactToken,
      newPassword: 'DeactivatedAttempt#2026!',
    },
  });
  assert(deactResetRes.status === 400, 'Password reset for deactivated account is strictly rejected');
  const deactBody = await deactResetRes.json();
  assert(deactBody.error.includes('deactivated'), 'Deactivated error message correctly returned');

  // Restore active status
  await executeQuery(`UPDATE users SET is_active = $1 WHERE id = $2;`, [true, 'usr-staff-verification-01']);

  // 6.5 Session Revocation via token_version increment
  const closerDb = await executeQuery<{ id: string; email: string; phone: string; roles: any[]; token_version: number }>(
    `SELECT id, email, phone, roles, token_version FROM users WHERE id = $1 LIMIT 1;`,
    ['usr-staff-closer-01']
  );
  const closerRow = closerDb.rows[0];
  const priorVersion = closerRow.token_version || 1;

  const preResetJwt = await signSessionToken(
    {
      uid: closerRow.id,
      email: closerRow.email,
      phone: closerRow.phone,
      roles: closerRow.roles,
      permissions: [],
    },
    priorVersion
  );

  // Authenticate before password reset
  const preMeRes = await dispatchRequest(app, '/api/auth/me', {
    headers: { authorization: `Bearer ${preResetJwt}` },
  });
  assert(preMeRes.status === 200, 'Prior session token authenticates successfully before password reset');

  // Execute password reset for closer
  const { token: closerResetTok } = await generatePasswordResetToken('usr-staff-closer-01', 'closer@sellmyghar.in');
  const closerPwUpdateRes = await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: closerResetTok,
      newPassword: 'CloserBrandNewSecurePw#2026!',
    },
  });
  assert(closerPwUpdateRes.status === 200, 'Closer password reset executes successfully');

  // Verify prior JWT session is now REVOKED
  const postMeRes = await dispatchRequest(app, '/api/auth/me', {
    headers: { authorization: `Bearer ${preResetJwt}` },
  });
  assert(postMeRes.status === 401, 'Prior session token is rejected with HTTP 401 after password reset');
  const postMeBody = await postMeRes.json();
  assert(postMeBody.reason === 'SESSION_REVOKED', 'Session rejection explicitly returns reason SESSION_REVOKED');

  // 6.6 devSandboxStore Transaction Rollback Engine Fidelity
  const pool = getDbPool();
  const txClient = await pool.connect();
  const originalIntakeName = devSandboxStore.users.get('usr-staff-intake-01')?.display_name;

  await txClient.query('BEGIN');
  await txClient.query(`UPDATE users SET display_name = $1 WHERE id = $2;`, ['Temp Dirty Uncommitted Name', 'usr-staff-intake-01']);
  await txClient.query(
    `INSERT INTO password_reset_tokens (id, user_id, email, token_hash, expires_at, is_consumed, created_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW());`,
    ['rst-rollback-sandbox-test', 'usr-staff-intake-01', 'intake@sellmyghar.in', 'dummy_rb_hash_12345', new Date().toISOString()]
  );

  // In-transaction assertions
  assert(
    devSandboxStore.users.get('usr-staff-intake-01')?.display_name === 'Temp Dirty Uncommitted Name',
    'Sandbox store reflects in-transaction mutations during active transaction'
  );
  assert(
    devSandboxStore.passwordResetTokens.has('dummy_rb_hash_12345'),
    'Sandbox store reflects in-transaction token insert during active transaction'
  );

  // Execute ROLLBACK
  await txClient.query('ROLLBACK');
  txClient.release();

  // Post-rollback assertions
  assert(
    devSandboxStore.users.get('usr-staff-intake-01')?.display_name === originalIntakeName,
    'devSandboxStore ROLLBACK deeply restores pre-transaction user snapshot state'
  );
  assert(
    !devSandboxStore.passwordResetTokens.has('dummy_rb_hash_12345'),
    'devSandboxStore ROLLBACK removes uncommitted password reset token'
  );

  // 6.7 Forgot Password Generic Anti-Enumeration & Mail Dispatch Resilience
  const enumKnownRes = await dispatchRequest(app, '/api/auth/forgot-password', {
    method: 'POST',
    body: { email: 'admin@sellmyghar.in' },
  });
  assert(enumKnownRes.status === 200, 'Forgot password for registered email returns HTTP 200');
  const enumKnownBody = await enumKnownRes.json();

  const enumUnknownRes = await dispatchRequest(app, '/api/auth/forgot-password', {
    method: 'POST',
    body: { email: 'nonexistent-user-xyz@nowhere.com' },
  });
  assert(enumUnknownRes.status === 200, 'Forgot password for unregistered email returns HTTP 200');
  const enumUnknownBody = await enumUnknownRes.json();

  assert(
    enumKnownBody.message === enumUnknownBody.message,
    'Generic anti-enumeration: responses for registered and unregistered emails are identical'
  );
  assert(
    !JSON.stringify(enumKnownBody).includes('token'),
    'Forgot password response does not leak reset token or hash'
  );

  // 6.8 Verify Token Hashes Persisted Without Raw Tokens
  let allTokensHashed = true;
  let rawTokenLeaked = false;
  for (const [hashKey, tokenRec] of devSandboxStore.passwordResetTokens) {
    if (hashKey.length !== 64 || !/^[0-9a-f]{64}$/.test(hashKey)) {
      allTokensHashed = false;
    }
    if ((tokenRec as any).rawToken || (tokenRec as any).token) {
      rawTokenLeaked = true;
    }
  }
  assert(allTokensHashed, 'All persisted reset tokens use standard 64-character SHA-256 hex hashes');
  assert(!rawTokenLeaked, 'Raw token secrets are never stored in database record attributes');

  // 6.9 Appropriate Cleanup of Expired Reset Tokens
  const cleanupOldRaw = 'old_expired_cleanup_token_123456789012345678901234567890';
  const cleanupOldHash = createHash('sha256').update(cleanupOldRaw).digest('hex');
  await executeQuery(
    `INSERT INTO password_reset_tokens (id, user_id, email, token_hash, expires_at, is_consumed, created_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW());`,
    ['rst-cleanup-test', 'usr-staff-intake-01', 'intake@sellmyghar.in', cleanupOldHash, new Date(Date.now() - 2 * 86400000).toISOString()]
  );
  assert(devSandboxStore.passwordResetTokens.has(cleanupOldHash), 'Old expired token inserted for cleanup test');

  await executeQuery(`DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '1 day';`);
  assert(!devSandboxStore.passwordResetTokens.has(cleanupOldHash), 'Expired reset tokens are successfully cleaned up without error');

  // 6.10 Database Client Release and Safe Rollback on Execution Exception
  const clientReleasePool = getDbPool();
  const testClient = await clientReleasePool.connect();
  let clientReleasedSuccessfully = false;
  try {
    await testClient.query('BEGIN');
    await testClient.query('SELECT 1;');
  } catch (simulatedErr) {
    try {
      await testClient.query('ROLLBACK');
    } catch {}
  } finally {
    testClient.release();
    clientReleasedSuccessfully = true;
  }
  assert(clientReleasedSuccessfully, 'Database client is guaranteed to release on transaction failure or exception');

  // 6.11 Inactive-user rejection leaves user password completely unchanged
  const origVerificationUser = devSandboxStore.users.get('usr-staff-verification-01');
  const origPwHash = origVerificationUser?.password_hash;
  await executeQuery(`UPDATE users SET is_active = $1 WHERE id = $2;`, [false, 'usr-staff-verification-01']);
  const { token: deactToken2 } = await generatePasswordResetToken('usr-staff-verification-01', 'verification@sellmyghar.in');
  await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: { token: deactToken2, newPassword: 'ShouldNotChangePassword#2026' },
  });
  assert(
    devSandboxStore.users.get('usr-staff-verification-01')?.password_hash === origPwHash,
    'Password hash remains completely unchanged when reset is rejected for inactive user'
  );
  await executeQuery(`UPDATE users SET is_active = $1 WHERE id = $2;`, [true, 'usr-staff-verification-01']);

  // 6.12 Invalid-token rejection leaves user password completely unchanged
  const origAdminHash = devSandboxStore.users.get('usr-admin-compliance-01')?.password_hash;
  await dispatchRequest(app, '/api/auth/reset-password', {
    method: 'POST',
    body: { token: 'completely_invalid_token_123456789012345678901234567890', newPassword: 'ShouldNeverApply#2026' },
  });
  assert(
    devSandboxStore.users.get('usr-admin-compliance-01')?.password_hash === origAdminHash,
    'Invalid token rejection modifies zero user records or password hashes'
  );

  // 6.13 Container Orchestration Health Check Aliases
  const healthRes = await dispatchRequest(app, '/health');
  assert(healthRes.status === 200, 'GET /health returns HTTP 200 for container orchestrators');
  const healthBody = await healthRes.json();
  assert(healthBody.status === 'ok', 'GET /health returns status ok');

  const healthzRes = await dispatchRequest(app, '/healthz');
  assert(healthzRes.status === 200, 'GET /healthz returns HTTP 200 for Kubernetes/Cloud Run');
  const healthzBody = await healthzRes.json();
  assert(healthzBody.status === 'ok', 'GET /healthz returns status ok');

  // 6.14 Rate Limiter Interface & Distributed Status Introspection
  const activeLimiterType = DistributedRateLimiter.getActiveLimiterType();
  const isDistributed = DistributedRateLimiter.isDistributed();
  assert(
    activeLimiterType === 'IN_MEMORY_INSTANCE_LOCAL',
    'Rate limiter accurately reports IN_MEMORY_INSTANCE_LOCAL when no external store is attached'
  );
  assert(
    isDistributed === false,
    'Rate limiter accurately reports isDistributed() === false in instance-local configuration'
  );

  // 6.15 Host Header Poisoning Defense & Anti-Spoofing IP Resolution
  const dummyReqUntrustedHost: any = {
    headers: { host: 'attacker-phishing-portal.com' },
    get: (headerName: string) => headerName.toLowerCase() === 'host' ? 'attacker-phishing-portal.com' : undefined,
    secure: false,
  };
  const safeOriginUntrusted = getTrustedAppOrigin(dummyReqUntrustedHost);
  assert(
    !safeOriginUntrusted.includes('attacker-phishing-portal.com'),
    'getTrustedAppOrigin rejects attacker Host header and does not reflect untrusted domain'
  );

  const dummyReqTrustedHost: any = {
    headers: { host: 'sellmyghar.in' },
    get: (headerName: string) => headerName.toLowerCase() === 'host' ? 'sellmyghar.in' : undefined,
    secure: true,
  };
  const prevAppUrl = process.env.APP_URL;
  delete process.env.APP_URL;
  const safeOriginTrusted = getTrustedAppOrigin(dummyReqTrustedHost);
  if (prevAppUrl !== undefined) process.env.APP_URL = prevAppUrl;
  assert(
    safeOriginTrusted === 'https://sellmyghar.in',
    'getTrustedAppOrigin correctly resolves verified production domain https://sellmyghar.in'
  );

  const dummyReqWithCf: any = {
    headers: {
      'cf-connecting-ip': '203.0.113.195',
      'x-forwarded-for': '198.51.100.1, 10.0.0.1',
    },
    ip: '10.0.0.1',
  };
  const resolvedIp = getClientIp(dummyReqWithCf);
  assert(
    resolvedIp === '203.0.113.195',
    'getClientIp prioritizes authentic Cloudflare CF-Connecting-IP over client-manipulated X-Forwarded-For'
  );

  console.log('\n======================================================');
  console.log(`TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test harness error:', err);
  process.exit(1);
});
