process.env.RUNNING_TESTS = 'true';
import { app } from '../server';
import { signSessionToken } from '../src/server/auth/tokens';
import http from 'http';
import { Socket } from 'net';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  [FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  [PASS] ${msg}`);
}

let ipCounter = 1;
function dispatch(url: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<{ status: number; body: string; json: () => Promise<any> }> {
  return new Promise((resolve) => {
    const socket = new Socket();
    Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
    const req = new http.IncomingMessage(socket);
    req.method = options.method || 'GET';
    req.url = url;
    req.headers = {
      'x-forwarded-for': `127.0.0.${(ipCounter++ % 240) + 1}`,
      ...(options.headers || {})
    };

    let payload: Buffer | null = null;
    if (options.body !== undefined && options.body !== null) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      payload = Buffer.from(data);
      req.headers['content-length'] = payload.length.toString();
      if (!req.headers['content-type']) req.headers['content-type'] = 'application/json';
    }

    const res = new http.ServerResponse(req);
    const chunks: Buffer[] = [];
    res.write = (c: any) => { if (c) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); return true; };
    res.end = (c?: any) => {
      if (c) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
      const body = Buffer.concat(chunks).toString('utf8');
      resolve({
        status: res.statusCode,
        body,
        json: async () => { try { return JSON.parse(body); } catch { return null; } }
      });
      return res as any;
    };

    app(req, res);
    if (payload) req.push(payload);
    req.push(null);
  });
}

async function run() {
  console.log('=== Running Notifications & Module Permissions Test Suite ===\n');

  const csrfToken = 'test-csrf-secret-123';
  const adminToken = await signSessionToken({
    uid: 'usr-admin-compliance-01',
    phone: '9845000004',
    email: 'admin@sellmyghar.in',
    roles: ['STAFF_SUPER_ADMIN'],
    tokenVersion: 1
  });

  const staffToken = await signSessionToken({
    uid: 'usr-staff-intake-01',
    phone: '9845000001',
    email: 'intake@sellmyghar.in',
    roles: ['STAFF_INTAKE_AGENT'],
    tokenVersion: 1
  });

  // 1. GET /api/crm/notifications requires authentication
  console.log('--- 1. Notifications Endpoint Access Control ---');
  const unauthNotif = await dispatch('/api/crm/notifications');
  assert(unauthNotif.status === 401, 'Unauthenticated access to /api/crm/notifications is rejected with 401');

  // 2. Admin access to /api/crm/notifications
  const adminNotif = await dispatch('/api/crm/notifications', {
    headers: {
      cookie: `sellmyghar_staff_session=${adminToken}; sellmyghar_csrf=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  });
  assert(adminNotif.status === 200, 'Admin can access /api/crm/notifications (200 OK)');
  const adminData = await adminNotif.json();
  assert(adminData.success === true, 'Admin notifications response has success=true');
  assert(Array.isArray(adminData.notifications), 'Admin notifications returns an array of notifications');

  // 3. Staff access to /api/crm/notifications
  const staffNotif = await dispatch('/api/crm/notifications', {
    headers: {
      cookie: `sellmyghar_staff_session=${staffToken}; sellmyghar_csrf=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  });
  assert(staffNotif.status === 200, 'Staff user can access /api/crm/notifications (200 OK)');
  const staffData = await staffNotif.json();
  assert(staffData.success === true, 'Staff notifications response has success=true');
  assert(Array.isArray(staffData.notifications), 'Staff notifications returns an array');

  // 4. Update Staff User Modules via PATCH /api/crm/users/:id
  console.log('\n--- 2. Employee Module Permissions Updating ---');
  const patchRes = await dispatch('/api/crm/users/usr-staff-intake-01', {
    method: 'PATCH',
    headers: {
      cookie: `sellmyghar_staff_session=${adminToken}; sellmyghar_csrf=${csrfToken}`,
      'x-csrf-token': csrfToken,
      'content-type': 'application/json'
    },
    body: {
      displayName: 'Intake Specialist',
      phone: '9845000001',
      isActive: true,
      modules: ['LEADS', 'TASKS']
    }
  });
  assert(patchRes.status === 200, 'Admin can update user modules via PATCH /api/crm/users/:id (200 OK)');
  const patchData = await patchRes.json();
  assert(patchData.success === true, 'PATCH user returns success=true');

  console.log('\nAll Notifications & Module Permissions Tests Passed!\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
