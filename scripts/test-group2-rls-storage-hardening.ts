import { app } from '../server';
import { executeUserQuery, getDbPool } from '../src/server/db/pool';
import { withUserSession } from '../src/server/db/session';
import { getDocumentSignedUrl, BUCKET_PROPERTY_DOCUMENTS } from '../src/server/storage/supabase-client';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import { AuthenticatedUser } from '../src/core/types/auth';
import { signSessionToken } from '../src/server/auth/tokens';
import http from 'http';
import { Socket } from 'net';

interface DispatchResponse {
  status: number;
  headers: Record<string, any>;
  body: string;
  json: () => Promise<any>;
}

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
    (res as any).write = function (chunk: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };
    (res as any).end = function (chunk?: any) {
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
    };

    expressApp.handle(req, res);
    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

export async function runGroup2RlsAndStorageTests() {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, extra?: string) {
    if (condition) {
      results.push(`[PASS] ${desc}`);
      passed++;
    } else {
      results.push(`[FAIL] ${desc}${extra ? ` - ${extra}` : ''}`);
      failed++;
    }
  }

  console.log('\n--- 19. Group 2: Database RLS & Storage Hardening Suite ---');

  // ====================================================================
  // TEST SECTION 1: PostgreSQL RLS Session Context Wrapper
  // ====================================================================
  try {
    const testUser: AuthenticatedUser = {
      uid: 'usr-rls-owner-01',
      phone: '+919876543210',
      email: 'owner1@sellmyghar.in',
      roles: ['OWNER'],
      permissions: ['properties:read_own', 'documents:read_own'],
    };

    // 1.1 executeUserQuery sets transaction-scoped session config
    let observedUserId: string | null = null;
    let observedRoles: string | null = null;

    await executeUserQuery(testUser, async (client) => {
      const userRes = await client.query("SELECT current_setting('app.current_user_id')");
      observedUserId = (userRes.rows[0] as any)?.current_user_id || null;

      const rolesRes = await client.query("SELECT current_setting('app.current_user_roles')");
      observedRoles = (rolesRes.rows[0] as any)?.current_user_roles || null;
    });

    assert('withUserSession binds app.current_user_id to authenticated user UID', observedUserId === testUser.uid);
    assert('withUserSession binds app.current_user_roles to user roles', observedRoles === 'OWNER');

    // 1.2 Automatic reset after transaction commit
    assert('Session variables reset automatically after transaction commit', devSandboxStore.currentUserId === null);

    // 1.3 Automatic rollback and cleanup on transaction error
    let rollbackThrew = false;
    try {
      await executeUserQuery(testUser, async (client) => {
        throw new Error('Simulated query failure inside RLS transaction');
      });
    } catch {
      rollbackThrew = true;
    }
    assert('withUserSession properly rolls back on error', rollbackThrew);
    assert('Session variables reset automatically after rollback', devSandboxStore.currentUserId === null);
  } catch (err: any) {
    assert('RLS context section encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 2: Statutory Document Signed URL Security
  // ====================================================================
  try {
    const testPath = 'vault/prop-group2-test/sale-deed-101.pdf';

    // 2.1 Generating 1-hour signed URL
    const { success, signedUrl, expiresAt } = await getDocumentSignedUrl(testPath, 3600);
    assert('getDocumentSignedUrl succeeds for valid statutory document path', success === true);
    assert('Signed URL references private property-documents bucket', signedUrl.includes(BUCKET_PROPERTY_DOCUMENTS));
    assert('Signed URL contains expiration token parameter', signedUrl.includes('token='));
    assert('Signed URL expiration timestamp is set ~1 hour in future', expiresAt.getTime() > Date.now() + 3500 * 1000);

    // 2.2 Bounded expiration enforcement (min 60s, max 7200s)
    const tooLong = await getDocumentSignedUrl(testPath, 999999);
    const maxExpiryMs = Date.now() + 7205 * 1000;
    assert('Signed URL expiration is strictly capped at maximum 2 hours (7200s)', tooLong.expiresAt.getTime() <= maxExpiryMs);
  } catch (err: any) {
    assert('Signed URL test section encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 3: HTTP Document Access & IDOR Verification
  // ====================================================================
  try {
    // Seed test users & property in sandbox store
    const ownerBob: AuthenticatedUser = {
      uid: 'usr-bob-owner',
      phone: '+919111122222',
      email: 'bob@example.com',
      roles: ['OWNER'],
      permissions: ['properties:read_own', 'documents:read_own'],
    };
    const ownerCharlie: AuthenticatedUser = {
      uid: 'usr-charlie-owner',
      phone: '+919333344444',
      email: 'charlie@example.com',
      roles: ['OWNER'],
      permissions: ['properties:read_own', 'documents:read_own'],
    };
    const staffAlice: AuthenticatedUser = {
      uid: 'usr-alice-staff',
      phone: '+919555566666',
      email: 'alice.staff@sellmyghar.in',
      roles: ['STAFF_SUPER_ADMIN'],
      permissions: ['documents:read_all_secure', 'properties:read_details_all'],
    };

    const propId = 'prop-group2-sec-01';
    devSandboxStore.properties.set(propId, {
      id: propId,
      owner_id: ownerBob.uid,
      project_locality_id: 'hebbal',
      unit_number: '1201',
      wing_tower: 'Tower A',
      unit_floor: 12,
      total_floors: 14,
      bhk_type: '3BHK',
      super_built_up_sqft: 1850,
      carpet_area_sqft: 1400,
      asking_price_inr: 18500000,
      listing_intent: 'SELL',
      verification_tier: 'LEVEL_1_VERIFIED',
      crm_status: 'IN_REVIEW',
      listing_status: 'DRAFT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    const docId = 'doc-group2-deed-01';
    devSandboxStore.documents.set(docId, {
      id: docId,
      property_id: propId,
      uploader_user_id: ownerBob.uid,
      document_type: 'SALE_DEED',
      file_name: 'registered_sale_deed.pdf',
      file_size_bytes: 3500000,
      mime_type: 'application/pdf',
      storage_path: `vault/${propId}/sale_deed.pdf`,
      sha256_checksum: 'a1b2c3d4e5f6',
      verification_status: 'IN_REVIEW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    const bobToken = await signSessionToken(ownerBob, 1);
    const charlieToken = await signSessionToken(ownerCharlie, 1);
    const staffToken = await signSessionToken(staffAlice, 1);

    // 3.1 Unauthenticated access to property documents is rejected
    const unauthRes = await dispatchRequest(app, `/api/properties/${propId}/documents`, { method: 'GET' });
    assert('Unauthenticated access to property documents returns 401 Unauthorized', unauthRes.status === 401);

    // 3.2 Property Owner (Bob) can list their property documents
    const bobRes = await dispatchRequest(app, `/api/properties/${propId}/documents`, {
      method: 'GET',
      headers: { cookie: `sellmyghar_session=${bobToken}` },
    });
    assert('Authenticated property owner can access their property documents (status 200)', bobRes.status === 200);
    const bobJson = await bobRes.json();
    assert('Returned documents list contains document with fresh signedUrl', Array.isArray(bobJson?.documents) && bobJson.documents.length > 0 && !!bobJson.documents[0].signedUrl);

    // 3.3 IDOR Defense: Cross-customer owner (Charlie) cannot access Bob's property documents
    const charlieRes = await dispatchRequest(app, `/api/properties/${propId}/documents`, {
      method: 'GET',
      headers: { cookie: `sellmyghar_session=${charlieToken}` },
    });
    assert('Unauthorized cross-customer owner is blocked from accessing documents (status 403 ACCESS_DENIED)', charlieRes.status === 403);

    // 3.4 Authorized Staff (Alice) can access property documents
    const staffRes = await dispatchRequest(app, `/api/properties/${propId}/documents`, {
      method: 'GET',
      headers: { cookie: `sellmyghar_session=${staffToken}` },
    });
    assert('Authorized staff member can access property documents for title diligence (status 200)', staffRes.status === 200);

    // 3.5 Single document signed URL endpoint IDOR check
    const charlieDocRes = await dispatchRequest(app, `/api/documents/${docId}/signed-url`, {
      method: 'GET',
      headers: { cookie: `sellmyghar_session=${charlieToken}` },
    });
    assert('Unauthorized user cannot generate signed URL for another user document (status 403)', charlieDocRes.status === 403);

    const bobDocRes = await dispatchRequest(app, `/api/documents/${docId}/signed-url`, {
      method: 'GET',
      headers: { cookie: `sellmyghar_session=${bobToken}` },
    });
    assert('Owner can generate fresh signed URL for their statutory document (status 200)', bobDocRes.status === 200);
    const bobDocJson = await bobDocRes.json();
    assert('Owner signed URL response contains signedUrl and expiresAt', !!bobDocJson?.signedUrl && !!bobDocJson?.expiresAt);
  } catch (err: any) {
    assert('HTTP document IDOR test section encountered exception', false, err.message);
  }

  return { passed, failed, results };
}
