process.env.RUNNING_TESTS = 'true';
import { app, initSchemaColumns } from '../server';
import { signSessionToken, verifySessionToken } from '../src/server/auth/tokens';
import { executeQuery } from '../src/server/db/pool';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import http from 'http';
import { Socket } from 'net';

interface DispatchResponse {
  status: number;
  headers: Record<string, any>;
  body: string;
  json: () => Promise<any>;
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
      return res as any;
    } as any;

    expressApp(req, res);
    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  [FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  [PASS] ${msg}`);
}

async function run() {
  console.log('================================================================');
  console.log('CRM STRICT EMPLOYEE-ONLY ACCESS & RBAC REMOVAL VERIFICATION');
  console.log('================================================================\n');

  await initSchemaColumns();

  // Create test tokens:
  // 1. Customer Token (BUYER/OWNER)
  const customerToken = await signSessionToken({
    uid: 'usr-customer-test-01',
    phone: '9876543210',
    email: 'customer@gmail.com',
    roles: ['BUYER'],
    tokenVersion: 1
  });

  // 2. Staff Tokens with various roles (all should have equal access)
  const intakeToken = await signSessionToken({
    uid: 'usr-staff-intake-01',
    phone: '9845000001',
    email: 'intake@sellmyghar.in',
    roles: ['STAFF_INTAKE_AGENT'],
    tokenVersion: 1
  });

  const verificationToken = await signSessionToken({
    uid: 'usr-staff-verify-01',
    phone: '9845000002',
    email: 'verify@sellmyghar.in',
    roles: ['STAFF_VERIFICATION_AGENT'],
    tokenVersion: 1
  });

  const closerToken = await signSessionToken({
    uid: 'usr-staff-closer-01',
    phone: '9845000003',
    email: 'closer@sellmyghar.in',
    roles: ['STAFF_DEAL_CLOSER'],
    tokenVersion: 1
  });

  const adminToken = await signSessionToken({
    uid: 'usr-admin-compliance-01',
    phone: '9845000004',
    email: 'admin@sellmyghar.in',
    roles: ['STAFF_SUPER_ADMIN'],
    tokenVersion: 1
  });

  console.log('--- 1. Strict Employee-Only Access Guard ---');
  // A. Unauthenticated access is rejected with 401
  const unauthLeads = await dispatchRequest(app, '/api/crm/leads');
  assert(unauthLeads.status === 401, 'Unauthenticated access to /api/crm/leads returns 401');

  const unauthUsers = await dispatchRequest(app, '/api/crm/users');
  assert(unauthUsers.status === 401, 'Unauthenticated access to /api/crm/users returns 401');

  const unauthOffers = await dispatchRequest(app, '/api/crm/offers');
  assert(unauthOffers.status === 401, 'Unauthenticated access to /api/crm/offers returns 401');

  // B. Customer accounts (BUYER/OWNER) receive 403 FORBIDDEN
  const customerLeads = await dispatchRequest(app, '/api/crm/leads', {
    headers: { cookie: `sellmyghar_session=${customerToken}` }
  });
  assert(customerLeads.status === 403, 'Customer account access to /api/crm/leads returns 403 FORBIDDEN');

  const customerUsers = await dispatchRequest(app, '/api/crm/users', {
    headers: { cookie: `sellmyghar_session=${customerToken}` }
  });
  assert(customerUsers.status === 403, 'Customer account access to /api/crm/users returns 403 FORBIDDEN');

  const customerOffers = await dispatchRequest(app, '/api/crm/offers', {
    headers: { cookie: `sellmyghar_session=${customerToken}` }
  });
  assert(customerOffers.status === 403, 'Customer account access to /api/crm/offers returns 403 FORBIDDEN');

  console.log('\n--- 2. Equal Standard Access for All CRM Employees ---');
  // Any approved employee can access leads, properties, offers, reserve prices, and users
  const staffTokens = [
    { name: 'Intake Agent', token: intakeToken },
    { name: 'Verification Agent', token: verificationToken },
    { name: 'Deal Closer', token: closerToken },
    { name: 'Super Admin', token: adminToken }
  ];

  for (const staff of staffTokens) {
    const leadsRes = await dispatchRequest(app, '/api/crm/leads', {
      headers: { cookie: `sellmyghar_staff_session=${staff.token}` }
    });
    assert(leadsRes.status === 200, `${staff.name} can access /api/crm/leads (200 OK)`);

    const usersRes = await dispatchRequest(app, '/api/crm/users', {
      headers: { cookie: `sellmyghar_staff_session=${staff.token}` }
    });
    assert(usersRes.status === 200, `${staff.name} can access /api/crm/users (200 OK)`);

    const offersRes = await dispatchRequest(app, '/api/crm/offers', {
      headers: { cookie: `sellmyghar_staff_session=${staff.token}` }
    });
    assert(offersRes.status === 200, `${staff.name} can access /api/crm/offers (200 OK)`);
    const offersJson = await offersRes.json();
    assert(offersJson.success === true, `${staff.name} receives valid offers response`);

    // Reserve price access check: all staff see reserve price
    const propDetailsRes = await dispatchRequest(app, '/api/crm/properties/prop-mv5l-001/details', {
      headers: { cookie: `sellmyghar_staff_session=${staff.token}` }
    });
    assert(propDetailsRes.status === 200, `${staff.name} can access property details (200 OK)`);
  }

  console.log('\n--- 3. Employee Provisioning & Validation Rules ---');
  // A. Reject email outside @sellmyghar.in domain
  const nonDomainRes = await dispatchRequest(app, '/api/crm/users', {
    method: 'POST',
    headers: { cookie: `sellmyghar_staff_session=${adminToken}` },
    body: {
      fullName: 'External Person',
      email: 'external@gmail.com',
      phone: '9845011111',
      initialPassword: 'ValidPassword123!'
    }
  });
  assert(nonDomainRes.status === 400, 'Non-@sellmyghar.in email is rejected with HTTP 400');
  const nonDomainJson = await nonDomainRes.json();
  assert(nonDomainJson.error === 'INVALID_DOMAIN', 'Error code is INVALID_DOMAIN');

  // B. Reject password under 8 characters
  const shortPwRes = await dispatchRequest(app, '/api/crm/users', {
    method: 'POST',
    headers: { cookie: `sellmyghar_staff_session=${adminToken}` },
    body: {
      fullName: 'Test Short',
      email: 'shortpw@sellmyghar.in',
      phone: '9845011112',
      initialPassword: 'short'
    }
  });
  assert(shortPwRes.status === 400, 'Password < 8 characters is rejected with HTTP 400');
  const shortPwJson = await shortPwRes.json();
  assert(shortPwJson.error === 'WEAK_PASSWORD', 'Error code is WEAK_PASSWORD');

  // C. Successfully create a new employee account
  const createEmpRes = await dispatchRequest(app, '/api/crm/users', {
    method: 'POST',
    headers: { cookie: `sellmyghar_staff_session=${intakeToken}` }, // Any staff can provision
    body: {
      fullName: 'Kavitha Sharma',
      email: 'kavitha@sellmyghar.in',
      phone: '9845099887',
      initialPassword: 'SecurePassword2026!'
    }
  });
  assert(createEmpRes.status === 201, 'Valid employee account creation returns HTTP 201');
  const createEmpJson = await createEmpRes.json();
  assert(createEmpJson.success === true, 'Response marks success true');
  const newEmpId = createEmpJson.user.id;
  assert(!!newEmpId, `Created employee ID: ${newEmpId}`);
  assert(createEmpJson.user.email === 'kavitha@sellmyghar.in', 'Created user has correct email');
  assert(createEmpJson.user.modules.length === 11, 'Created employee is granted all 11 CRM modules');

  console.log('\n--- 4. Employee Editing & Immediate Session Revocation ---');
  // Issue a valid session token for Kavitha
  const kavithaToken = await signSessionToken({
    uid: newEmpId,
    phone: '9845099887',
    email: 'kavitha@sellmyghar.in',
    roles: ['STAFF_MEMBER'],
    tokenVersion: 1
  });

  // Verify Kavitha can access CRM before deactivation
  const kavithaActiveRes = await dispatchRequest(app, '/api/crm/leads', {
    headers: { cookie: `sellmyghar_staff_session=${kavithaToken}` }
  });
  assert(kavithaActiveRes.status === 200, 'Kavitha session is initially active and valid (200 OK)');

  // Edit Kavitha: update display name and phone
  const editEmpRes = await dispatchRequest(app, `/api/crm/users/${newEmpId}`, {
    method: 'PATCH',
    headers: { cookie: `sellmyghar_staff_session=${closerToken}` },
    body: {
      displayName: 'Kavitha S. Lead',
      phone: '9845099880'
    }
  });
  assert(editEmpRes.status === 200, 'Editing employee details returns 200 OK');

  // Deactivate Kavitha (isActive: false) -> must increment token_version and revoke sessions
  const deactivateRes = await dispatchRequest(app, `/api/crm/users/${newEmpId}`, {
    method: 'PATCH',
    headers: { cookie: `sellmyghar_staff_session=${closerToken}` },
    body: {
      isActive: false
    }
  });
  assert(deactivateRes.status === 200, 'Deactivating employee returns 200 OK');

  // Verify Kavitha's previous session token is IMMEDIATELY REVOKED
  const kavithaRevokedRes = await dispatchRequest(app, '/api/crm/leads', {
    headers: { cookie: `sellmyghar_staff_session=${kavithaToken}` }
  });
  assert(kavithaRevokedRes.status === 401, 'Kavitha prior session token is rejected with 401 UNAUTHORIZED after deactivation');

  console.log('\n--- 5. Employee Safeguards & Lockout Prevention ---');
  // A. Self-deactivation prevention
  const selfDeactivateRes = await dispatchRequest(app, `/api/crm/users/usr-admin-compliance-01`, {
    method: 'PATCH',
    headers: { cookie: `sellmyghar_staff_session=${adminToken}` },
    body: { isActive: false }
  });
  assert(selfDeactivateRes.status === 400, 'Self-deactivation is rejected with HTTP 400');
  const selfDeactJson = await selfDeactivateRes.json();
  assert(selfDeactJson.error === 'CANNOT_DEACTIVATE_SELF', 'Error code is CANNOT_DEACTIVATE_SELF');

  // B. Self-removal prevention
  const selfRemoveRes = await dispatchRequest(app, `/api/crm/users/usr-admin-compliance-01`, {
    method: 'DELETE',
    headers: { cookie: `sellmyghar_staff_session=${adminToken}` }
  });
  assert(selfRemoveRes.status === 400, 'Self-removal is rejected with HTTP 400');
  const selfRemoveJson = await selfRemoveRes.json();
  assert(selfRemoveJson.error === 'CANNOT_REMOVE_SELF', 'Error code is CANNOT_REMOVE_SELF');

  console.log('\n--- 6. Operational Continuity on Employee Removal ---');
  // Reactivate Kavitha, assign a lead and visit to her, then remove her
  await dispatchRequest(app, `/api/crm/users/${newEmpId}`, {
    method: 'PATCH',
    headers: { cookie: `sellmyghar_staff_session=${adminToken}` },
    body: { isActive: true }
  });

  // Create a lead assigned to Kavitha
  const leadId = `lead_test_continuity_${Date.now()}`;
  await executeQuery(`
    INSERT INTO seller_leads (id, phone, full_name, lead_status, assigned_staff_id, created_at, updated_at)
    VALUES ($1, '9999988888', 'Continuity Seller', 'NEW', $2, NOW(), NOW());
  `, [leadId, newEmpId]);

  // Remove Kavitha from CRM
  const removeRes = await dispatchRequest(app, `/api/crm/users/${newEmpId}`, {
    method: 'DELETE',
    headers: { cookie: `sellmyghar_staff_session=${adminToken}` }
  });
  assert(removeRes.status === 200, 'Employee removal succeeds with 200 OK');

  // Verify lead was NOT deleted, but cleanly unassigned (assigned_staff_id IS NULL)
  const leadCheck = await executeQuery(`SELECT * FROM seller_leads WHERE id = $1;`, [leadId]);
  assert(leadCheck.rows.length === 1, 'Assigned seller lead was PRESERVED (not deleted)');
  assert(leadCheck.rows[0].assigned_staff_id === null, 'Lead assigned_staff_id was cleanly reset to NULL');

  console.log('\n================================================================');
  console.log('ALL CRM EMPLOYEE-ONLY & RBAC REMOVAL CHECKS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
