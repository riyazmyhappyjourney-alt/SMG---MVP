import { app } from '../server';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import { signSessionToken } from '../src/server/auth/tokens';
import http from 'http';
import { Socket } from 'net';

function assert(condition: any, msg: string) {
  if (!condition) {
    console.error(`  [FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`  [PASS] ${msg}`);
}

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
        }
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

export async function runManual99acresLeadTests() {
  console.log('\n--- 26. Manual 99acres Lead Entry & Duplicate Detection Suite ---');

  const staffUser = {
    uid: 'usr-admin-compliance-01',
    roles: ['STAFF_SUPER_ADMIN'],
    email: 'admin@sellmyghar.in',
    display_name: 'Compliance Super Admin'
  };
  const staffToken = await signSessionToken(staffUser as any, 1);
  const csrfToken = 'test-csrf-token-smg-99acres';
  const staffCookie = `sellmyghar_staff_session=${staffToken}; sellmyghar_csrf=${csrfToken}`;
  const staffHeaders = {
    'Cookie': staffCookie,
    'x-csrf-token': csrfToken
  };

  const nonStaffUser = {
    uid: 'usr-customer-buyer-01',
    roles: ['BUYER'],
    email: 'buyer@example.com'
  };
  const buyerToken = await signSessionToken(nonStaffUser as any, 1);
  const buyerCookie = `sellmyghar_session=${buyerToken}; sellmyghar_csrf=${csrfToken}`;
  const buyerHeaders = {
    'Cookie': buyerCookie,
    'x-csrf-token': csrfToken
  };

  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function record(fn: () => void, testDesc: string) {
    try {
      fn();
      passed++;
      results.push(`[PASS] ${testDesc}`);
    } catch (e: any) {
      failed++;
      results.push(`[FAIL] ${testDesc}`);
    }
  }

  // 1. Unauthenticated request to POST /api/crm/leads is rejected
  const unauthRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'POST',
    body: { fullName: 'Test Name', phone: '9876543210' }
  });
  record(() => {
    assert(unauthRes.status === 401, 'Unauthenticated POST /api/crm/leads rejected with 401');
  }, 'Unauthenticated POST /api/crm/leads rejected with 401');

  // 2. Non-staff caller is rejected with 403
  const forbiddenRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'POST',
    headers: buyerHeaders,
    body: { fullName: 'Test Name', phone: '9876543210' }
  });
  record(() => {
    assert(forbiddenRes.status === 403, 'Non-staff caller rejected with 403 FORBIDDEN');
  }, 'Non-staff caller rejected with 403 FORBIDDEN');

  // 3. Validation: Missing full name rejected with 400
  const missingNameRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'POST',
    headers: staffHeaders,
    body: { fullName: '', phone: '9876543210' }
  });
  record(() => {
    assert(missingNameRes.status === 400, 'Empty full name rejected with 400');
  }, 'Empty full name rejected with 400');

  // 4. Validation: Invalid phone number rejected with 400
  const invalidPhoneRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'POST',
    headers: staffHeaders,
    body: { fullName: 'Rajesh Verma', phone: '12345' }
  });
  record(() => {
    assert(invalidPhoneRes.status === 400, 'Invalid phone number rejected with 400');
  }, 'Invalid phone number rejected with 400');

  // 5. Successful creation of 99acres Buyer Lead
  const testPhone = '9871100222';
  const testExtEnqId = '99A-ENQ-OCT26-001';
  const createBuyerRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'POST',
    headers: staffHeaders,
    body: {
      fullName: 'Vikramaditya Rao',
      phone: testPhone,
      email: 'vikram.rao@example.com',
      leadType: 'BUYER',
      source: '99acres',
      externalEnquiryId: testExtEnqId,
      externalListingId: '99A-P-88219',
      message: 'Looking for high-floor 3BHK flat in Whitefield near ITPL.',
      society: 'Prestige Shantiniketan',
      locality: 'Whitefield',
      budget: 18500000,
      bhk: '3 BHK',
      additionalRequirements: 'East facing, 2 covered car parking',
      assignedStaffId: 'usr-admin-compliance-01',
      initialStage: 'NEW',
      nextFollowUpAt: new Date(Date.now() + 86400000).toISOString(),
      followUpNotes: 'Call tomorrow 11:30 AM to share inventory floor plans'
    }
  });

  const createBuyerData = await createBuyerRes.json();
  record(() => {
    assert(createBuyerRes.status === 201, 'Manual 99acres buyer lead created with HTTP 201');
    assert(createBuyerData.success === true, 'Response marks success as true');
    assert(Boolean(createBuyerData.leadId), 'Response returns valid leadId');
  }, 'Manual 99acres buyer lead created with HTTP 201');

  const buyerLeadId = createBuyerData.leadId;

  // 6. Duplicate check flags the phone number
  const checkPhoneRes = await dispatchRequest(app, `/api/crm/leads/check-duplicate?phone=${testPhone}`, {
    method: 'GET',
    headers: staffHeaders
  });
  const checkPhoneData = await checkPhoneRes.json();
  record(() => {
    assert(checkPhoneRes.status === 200, 'Duplicate check endpoint returns 200');
    assert(checkPhoneData.exists === true, 'Duplicate check flags existing contact');
    assert(checkPhoneData.matches.length >= 1, 'Returns at least one match for phone');
    assert(checkPhoneData.matches[0].name === 'Vikramaditya Rao', 'Matched contact name is accurate');
  }, 'Duplicate check flags existing contact by phone');

  // 7. Duplicate check flags the external enquiry ID
  const checkExtIdRes = await dispatchRequest(app, `/api/crm/leads/check-duplicate?externalEnquiryId=${testExtEnqId}`, {
    method: 'GET',
    headers: staffHeaders
  });
  const checkExtIdData = await checkExtIdRes.json();
  record(() => {
    assert(checkExtIdRes.status === 200, 'Check by external enquiry ID returns 200');
    assert(checkExtIdData.exists === true, 'Flags match for external enquiry ID');
  }, 'Check by external enquiry ID flags match');

  // 8. Successful creation of 99acres Seller Lead
  const sellerPhone = '9871100333';
  const createSellerRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'POST',
    headers: staffHeaders,
    body: {
      fullName: 'Anita Deshmukh',
      phone: sellerPhone,
      email: 'anita.d@example.com',
      leadType: 'SELLER',
      source: '99acres',
      externalEnquiryId: '99A-SELL-9921',
      society: 'Sobha Dream Acres',
      locality: 'Panathur Road',
      budget: 12500000,
      bhk: '2 BHK',
      additionalRequirements: 'Ready to sign sale agreement within 30 days',
      assignedStaffId: 'usr-admin-compliance-01',
      initialStage: 'NEW'
    }
  });

  const createSellerData = await createSellerRes.json();
  record(() => {
    assert(createSellerRes.status === 201, 'Manual 99acres seller lead created with HTTP 201');
    assert(createSellerData.success === true, 'Seller creation marks success');
    assert(Boolean(createSellerData.leadId), 'Returns seller lead ID');
  }, 'Manual 99acres seller lead created with HTTP 201');

  // 9. Details endpoint exposes created lead with full attributes
  const detailsRes = await dispatchRequest(app, `/api/crm/leads/${buyerLeadId}/details`, {
    method: 'GET',
    headers: { 'Cookie': staffCookie }
  });
  const detailsData = await detailsRes.json();
  record(() => {
    assert(detailsRes.status === 200, 'Lead details endpoint returns 200');
    assert(detailsData.success === true, 'Lead details response success is true');
    assert(detailsData.lead.buyer_name === 'Vikramaditya Rao' || detailsData.lead.name === 'Vikramaditya Rao', 'Lead name matches');
  }, 'Lead details endpoint exposes created lead');

  console.log(`Subtotal: ${passed} passed, ${failed} failed`);
  return { passed, failed, results };
}

if (process.argv[1]?.endsWith('test-manual-99acres-lead.ts')) {
  runManual99acresLeadTests()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
