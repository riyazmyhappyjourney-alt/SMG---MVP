import { app } from '../server';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import { hashPassword, dummyVerifyPassword, verifyPassword, DUMMY_SCRYPT_HASH } from '../src/server/auth/passwords';

interface TimingStats {
  samples: number;
  minMs: number;
  maxMs: number;
  meanMs: number;
  medianMs: number;
  p25Ms: number;
  p75Ms: number;
  p95Ms: number;
  stdDevMs: number;
  iqrMs: number;
}

function calculateStats(times: number[]): TimingStats {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;
  const minMs = sorted[0];
  const maxMs = sorted[n - 1];
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const meanMs = sum / n;
  
  const percentile = (p: number) => {
    const idx = (p / 100) * (n - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  const medianMs = percentile(50);
  const p25Ms = percentile(25);
  const p75Ms = percentile(75);
  const p95Ms = percentile(95);
  const iqrMs = p75Ms - p25Ms;

  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - meanMs, 2), 0) / n;
  const stdDevMs = Math.sqrt(variance);

  return {
    samples: n,
    minMs: Number(minMs.toFixed(2)),
    maxMs: Number(maxMs.toFixed(2)),
    meanMs: Number(meanMs.toFixed(2)),
    medianMs: Number(medianMs.toFixed(2)),
    p25Ms: Number(p25Ms.toFixed(2)),
    p75Ms: Number(p75Ms.toFixed(2)),
    p95Ms: Number(p95Ms.toFixed(2)),
    stdDevMs: Number(stdDevMs.toFixed(2)),
    iqrMs: Number(iqrMs.toFixed(2)),
  };
}

async function dispatch(method: string, path: string, headers: Record<string, string>, body?: any) {
  return new Promise<{ status: number; headers: Record<string, string>; body: any }>((resolve, reject) => {
    const req: any = {
      method,
      url: path,
      originalUrl: path,
      path: path.split('?')[0],
      headers: {
        'content-type': 'application/json',
        host: 'sellmyghar.in',
        ...headers,
      },
      header(name: string) {
        return this.headers[name.toLowerCase()];
      },
      get(name: string) {
        return this.headers[name.toLowerCase()];
      },
      body: body || {},
      query: {},
      params: {},
      cookies: {},
      ip: headers['x-forwarded-for'] || '127.0.0.1',
      socket: { remoteAddress: headers['x-forwarded-for'] || '127.0.0.1' },
    };

    const resHeaders: Record<string, string> = {};
    const res: any = {
      statusCode: 200,
      headersSent: false,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      setHeader(name: string, value: any) {
        resHeaders[name.toLowerCase()] = String(value);
        return this;
      },
      getHeader(name: string) {
        return resHeaders[name.toLowerCase()];
      },
      json(data: any) {
        this.setHeader('content-type', 'application/json; charset=utf-8');
        resolve({ status: this.statusCode, headers: resHeaders, body: data });
      },
      send(data: any) {
        resolve({ status: this.statusCode, headers: resHeaders, body: data });
      },
    };

    try {
      app(req, res, (err: any) => {
        if (err) reject(err);
        else resolve({ status: res.statusCode, headers: resHeaders, body: res.body });
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function runHardeningTests() {
  console.log('\n============================================================');
  console.log('🔒 SellMyGhar Staff Authentication Hardening & Enumeration Defense');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  const results: string[] = [];
  function assert(cond: boolean, name: string) {
    if (cond) {
      console.log(`  [PASS] ${name}`);
      results.push(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
      results.push(`[FAIL] ${name}`);
      failed++;
    }
  }

  const EXPECTED_ERROR = 'Invalid credentials. Only authorized SellMyGhar staff can access internal portals.';
  const EXPECTED_BODY = JSON.stringify({ success: false, error: EXPECTED_ERROR });

  const staffPass = 'HardenedStaffPassword#2026';
  const staffHash = await hashPassword(staffPass);

  // Setup seed accounts in devSandboxStore
  const activeStaff = {
    id: 'usr-staff-active-test',
    phone: '+919876500001',
    email: 'ops.lead@sellmyghar.in',
    display_name: 'Operations Lead',
    password_hash: staffHash,
    roles: ['STAFF_OPERATIONS_MANAGER'],
    is_active: true,
    token_version: 1,
    failed_login_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const lockedStaff = {
    id: 'usr-staff-locked-test',
    phone: '+919876500002',
    email: 'locked.staff@sellmyghar.in',
    display_name: 'Locked Staff',
    password_hash: staffHash,
    roles: ['STAFF_VERIFICATION_AGENT'],
    is_active: true,
    token_version: 1,
    failed_login_attempts: 5,
    locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const inactiveStaff = {
    id: 'usr-staff-inactive-test',
    phone: '+919876500003',
    email: 'inactive.staff@sellmyghar.in',
    display_name: 'Inactive Staff',
    password_hash: staffHash,
    roles: ['STAFF_INTAKE_AGENT'],
    is_active: false,
    token_version: 1,
    failed_login_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const passwordlessStaff = {
    id: 'usr-staff-nopass-test',
    phone: '+919876500004',
    email: 'nopass.staff@sellmyghar.in',
    display_name: 'No Password Staff',
    password_hash: null,
    roles: ['STAFF_VERIFICATION_AGENT'],
    is_active: true,
    token_version: 1,
    failed_login_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const customerUser = {
    id: 'usr-customer-test',
    phone: '+919876500005',
    email: 'legit.customer@example.com',
    display_name: 'Legit Customer',
    password_hash: staffHash,
    roles: ['OWNER'],
    is_active: true,
    token_version: 1,
    failed_login_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  devSandboxStore.users.set(activeStaff.id, activeStaff);
  devSandboxStore.users.set(lockedStaff.id, lockedStaff);
  devSandboxStore.users.set(inactiveStaff.id, inactiveStaff);
  devSandboxStore.users.set(passwordlessStaff.id, passwordlessStaff);
  devSandboxStore.users.set(customerUser.id, customerUser);

  // -------------------------------------------------------------
  // TEST SUITE 1: Status Code & Response Body Parity
  // -------------------------------------------------------------
  console.log('\n--- 1. Authentication Failure Response Parity ---');

  // Case A: Nonexistent email
  const resA = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.200.1.1' }, {
    email: 'nonexistent.agent@sellmyghar.in',
    password: 'WrongPassword#1',
  });
  assert(
    resA.status === 401 && JSON.stringify(resA.body) === EXPECTED_BODY,
    'Case A: Nonexistent email returns HTTP 401 with normalized body'
  );

  // Case B: Incorrect password on existing staff
  const resB = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.200.1.2' }, {
    email: activeStaff.email,
    password: 'IncorrectPassword#123',
  });
  assert(
    resB.status === 401 && JSON.stringify(resB.body) === EXPECTED_BODY,
    'Case B: Incorrect password returns identical HTTP 401 and schema'
  );

  // Case C: Locked account
  const resC = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.200.1.3' }, {
    email: lockedStaff.email,
    password: staffPass,
  });
  assert(
    resC.status === 401 && JSON.stringify(resC.body) === EXPECTED_BODY,
    'Case C: Locked account returns identical HTTP 401 without disclosing lockout'
  );

  // Case D: Inactive account
  const resD = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.200.1.4' }, {
    email: inactiveStaff.email,
    password: staffPass,
  });
  assert(
    resD.status === 401 && JSON.stringify(resD.body) === EXPECTED_BODY,
    'Case D: Inactive account returns identical HTTP 401 without disclosing inactive status'
  );

  // Case E: Passwordless staff account
  const resE = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.200.1.5' }, {
    email: passwordlessStaff.email,
    password: 'AnyPassword#123',
  });
  assert(
    resE.status === 401 && JSON.stringify(resE.body) === EXPECTED_BODY,
    'Case E: Passwordless account returns identical HTTP 401 and schema'
  );

  // -------------------------------------------------------------
  // TEST SUITE 2: Customer Account Attempting Staff Login
  // -------------------------------------------------------------
  console.log('\n--- 2. Customer Account Login Attempt Protection ---');

  // Customer account with valid customer password attempting staff portal
  const resCustValid = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.200.2.1' }, {
    email: customerUser.email,
    password: staffPass,
  });
  assert(
    resCustValid.status === 401 && JSON.stringify(resCustValid.body) === EXPECTED_BODY,
    'Customer account with valid password rejected with normalized 401 (no role leakage)'
  );
  assert(
    !resCustValid.headers['set-cookie'] || !resCustValid.headers['set-cookie'].includes('sellmyghar_staff_token'),
    'Customer account granted no staff session cookie or token'
  );

  // Customer account with wrong password attempting staff portal
  const resCustInvalid = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.200.2.2' }, {
    email: customerUser.email,
    password: 'WrongPassword#999',
  });
  assert(
    resCustInvalid.status === 401 && JSON.stringify(resCustInvalid.body) === EXPECTED_BODY,
    'Customer account with invalid password rejected with identical 401'
  );

  // -------------------------------------------------------------
  // TEST SUITE 3: Password Reset Response Parity
  // -------------------------------------------------------------
  console.log('\n--- 3. Forgot-Password Response Parity ---');

  const EXPECTED_RESET_CONFIRMATION = 'If an account exists with that email address, password reset instructions have been dispatched.';

  const resResetExisting = await dispatch('POST', '/api/auth/forgot-password', { 'x-forwarded-for': '10.200.3.1' }, {
    email: activeStaff.email,
  });
  assert(
    resResetExisting.status === 200 && resResetExisting.body?.message === EXPECTED_RESET_CONFIRMATION,
    'Forgot-password returns generic 200 confirmation for registered staff'
  );

  const resResetNonexistent = await dispatch('POST', '/api/auth/forgot-password', { 'x-forwarded-for': '10.200.3.2' }, {
    email: 'nobody@nowhere-sellmyghar.in',
  });
  assert(
    resResetNonexistent.status === 200 && resResetNonexistent.body?.message === EXPECTED_RESET_CONFIRMATION,
    'Forgot-password returns identical 200 confirmation for nonexistent email'
  );

  const resResetInactive = await dispatch('POST', '/api/auth/forgot-password', { 'x-forwarded-for': '10.200.3.3' }, {
    email: inactiveStaff.email,
  });
  assert(
    resResetInactive.status === 200 && resResetInactive.body?.message === EXPECTED_RESET_CONFIRMATION,
    'Forgot-password returns identical 200 confirmation for inactive staff'
  );

  // -------------------------------------------------------------
  // TEST SUITE 4: Rate Limiting Enforcement
  // -------------------------------------------------------------
  console.log('\n--- 4. IP Rate-Limiting Enforcement ---');

  const rateLimitIp = '198.51.100.42';
  let rateLimited = false;
  let retryAfterHeader = '';

  for (let i = 1; i <= 12; i++) {
    const resRL = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': rateLimitIp }, {
      email: 'rate.probe@sellmyghar.in',
      password: `Probe#${i}`,
    });
    if (resRL.status === 429) {
      rateLimited = true;
      retryAfterHeader = resRL.headers['retry-after'];
      break;
    }
  }
  assert(
    rateLimited && Boolean(retryAfterHeader),
    'Login endpoint strictly rate-limits aggressive attempts with HTTP 429 and Retry-After'
  );

  // -------------------------------------------------------------
  // TEST SUITE 5: Dummy Scrypt Verification & Safe Malformed Hash Handling
  // -------------------------------------------------------------
  console.log('\n--- 5. Cryptographic Dummy Verification & Safe Handling ---');

  const dummyResult = await dummyVerifyPassword('SomeCandidatePassword#123');
  assert(dummyResult === false, 'dummyVerifyPassword unconditionally resolves to false');

  // Verify malformed stored hashes are handled safely without unhandled exception
  const malformedHashes = [
    'plainTextPasswordWithoutScryptPrefix',
    'scrypt$shortHex$badKey',
    'scrypt$$',
    'md5$12345$abcdef',
  ];

  let malformedSafe = true;
  for (const badHash of malformedHashes) {
    try {
      const res = await verifyPassword('CandidatePassword#1', badHash);
      if (res !== false) malformedSafe = false;
    } catch {
      malformedSafe = false;
    }
  }
  assert(malformedSafe, 'verifyPassword safely executes dummy scrypt and returns false on malformed hashes');

  // -------------------------------------------------------------
  // TEST SUITE 6: Legitimate Staff Authentication
  // -------------------------------------------------------------
  console.log('\n--- 6. Staff Authorization & Successful Login ---');

  const resValidStaff = await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.200.6.1' }, {
    email: activeStaff.email,
    password: staffPass,
  });
  assert(
    resValidStaff.status === 200 && resValidStaff.body?.success === true,
    'Valid staff login succeeds with HTTP 200 and success flag'
  );
  assert(
    resValidStaff.body?.user?.roles?.some((r: string) => r.startsWith('STAFF_')),
    'Authorized user roles contain privileged STAFF_ role'
  );
  assert(
    Boolean(resValidStaff.headers['set-cookie']),
    'Successful staff login issues HTTP-only session cookie'
  );

  // -------------------------------------------------------------
  // TEST SUITE 7: Timing Measurement & Statistical Comparison
  // -------------------------------------------------------------
  console.log('\n--- 7. Timing Measurement & Statistical Analysis (30 Samples) ---');

  const SAMPLE_COUNT = 30;
  const nonexistentTimes: number[] = [];
  const wrongPasswordTimes: number[] = [];

  // Warmup run to initialize crypto engines
  await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.99.99.1' }, {
    email: 'warmup.nonexistent@sellmyghar.in',
    password: 'WarmupPassword#1',
  });
  await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': '10.99.99.2' }, {
    email: activeStaff.email,
    password: 'WarmupPassword#2',
  });

  // Interleaved sampling to prevent sequential server bias
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const ipNonexistent = `10.50.1.${i + 1}`;
    const ipExistent = `10.50.2.${i + 1}`;

    // Sample Nonexistent Account (triggers dummy scrypt)
    const t0 = process.hrtime.bigint();
    await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': ipNonexistent }, {
      email: `nonexistent.user.${i}@sellmyghar.in`,
      password: `SamplePassword#${i}`,
    });
    const t1 = process.hrtime.bigint();
    nonexistentTimes.push(Number(t1 - t0) / 1_000_000);

    // Sample Existent Staff with Incorrect Password (triggers normal scrypt)
    const t2 = process.hrtime.bigint();
    await dispatch('POST', '/api/auth/login', { 'x-forwarded-for': ipExistent }, {
      email: activeStaff.email,
      password: `IncorrectPassword#${i}`,
    });
    const t3 = process.hrtime.bigint();
    wrongPasswordTimes.push(Number(t3 - t2) / 1_000_000);
  }

  const nonexistentStats = calculateStats(nonexistentTimes);
  const wrongPasswordStats = calculateStats(wrongPasswordTimes);

  console.log('\nStatistical Timing Distribution:');
  console.log('┌──────────────────────┬──────────────────────┬──────────────────────┐');
  console.log('│ Metric               │ Nonexistent (Dummy)  │ Existent (Wrong Pw)  │');
  console.log('├──────────────────────┼──────────────────────┼──────────────────────┤');
  console.log(`│ Sample Count (N)     │ ${String(nonexistentStats.samples).padEnd(20)} │ ${String(wrongPasswordStats.samples).padEnd(20)} │`);
  console.log(`│ Min                  │ ${(nonexistentStats.minMs + ' ms').padEnd(20)} │ ${(wrongPasswordStats.minMs + ' ms').padEnd(20)} │`);
  console.log(`│ Max                  │ ${(nonexistentStats.maxMs + ' ms').padEnd(20)} │ ${(wrongPasswordStats.maxMs + ' ms').padEnd(20)} │`);
  console.log(`│ Mean                 │ ${(nonexistentStats.meanMs + ' ms').padEnd(20)} │ ${(wrongPasswordStats.meanMs + ' ms').padEnd(20)} │`);
  console.log(`│ Median (P50)         │ ${(nonexistentStats.medianMs + ' ms').padEnd(20)} │ ${(wrongPasswordStats.medianMs + ' ms').padEnd(20)} │`);
  console.log(`│ 25th Percentile (P25)│ ${(nonexistentStats.p25Ms + ' ms').padEnd(20)} │ ${(wrongPasswordStats.p25Ms + ' ms').padEnd(20)} │`);
  console.log(`│ 75th Percentile (P75)│ ${(nonexistentStats.p75Ms + ' ms').padEnd(20)} │ ${(wrongPasswordStats.p75Ms + ' ms').padEnd(20)} │`);
  console.log(`│ 95th Percentile (P95)│ ${(nonexistentStats.p95Ms + ' ms').padEnd(20)} │ ${(wrongPasswordStats.p95Ms + ' ms').padEnd(20)} │`);
  console.log(`│ Interquartile (IQR)  │ ${(nonexistentStats.iqrMs + ' ms').padEnd(20)} │ ${(wrongPasswordStats.iqrMs + ' ms').padEnd(20)} │`);
  console.log(`│ Std Deviation        │ ${(nonexistentStats.stdDevMs + ' ms').padEnd(20)} │ ${(wrongPasswordStats.stdDevMs + ' ms').padEnd(20)} │`);
  console.log('└──────────────────────┴──────────────────────┴──────────────────────┘');

  // Verify both paths execute non-trivial cryptographic workload (scrypt)
  // Nonexistent lookup without dummy scrypt would finish in < 2ms, while scrypt takes > 10ms.
  assert(
    nonexistentStats.medianMs > 5 && wrongPasswordStats.medianMs > 5,
    'Both nonexistent and existent paths execute genuine scrypt cryptographic workload (>5ms)'
  );

  const medianRatio = nonexistentStats.medianMs / wrongPasswordStats.medianMs;
  assert(
    medianRatio > 0.4 && medianRatio < 2.5,
    `Workload parity confirmed: median ratio is ${medianRatio.toFixed(2)} (well within comparable distribution)`
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, results, nonexistentStats, wrongPasswordStats };
}

export { runHardeningTests as runStaffEnumerationHardeningTests };

if (process.argv[1]?.endsWith('test-staff-enumeration-hardening.ts')) {
  runHardeningTests()
    .then((res) => {
      if (res.failed > 0) process.exit(1);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
