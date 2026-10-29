import { app } from '../server';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import { NinetyNineAcresLeadService } from '../src/server/webhooks/ninety-nine-acres';
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
        },
      });
      return this;
    };

    expressApp.handle(req, res);

    if (payload) {
      req.emit('data', payload);
      req.emit('end');
    } else {
      req.emit('end');
    }
  });
}

export async function run99acresWebhookTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function recordPass(desc: string) {
    passed++;
    results.push(`[PASS] ${desc}`);
    console.log(`  [PASS] ${desc}`);
  }

  function recordFail(desc: string, err: any) {
    failed++;
    const errMsg = err?.message || String(err);
    results.push(`[FAIL] ${desc} -> ${errMsg}`);
    console.error(`  [FAIL] ${desc} -> ${errMsg}`);
  }

  console.log('\n--- Running 99acres Webhook Inbound Integration Suite ---');

  const TEST_SECRET = process.env.NINETYNINE_ACRES_WEBHOOK_SECRET || 'smg_99acres_webhook_dev_secret_2026';

  // Test 1: Missing authentication credentials rejects with 401
  try {
    const res = await dispatchRequest(app, '/api/webhooks/99acres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        enquiryId: '99AC-TEST-001',
        name: 'Aarav Sharma',
        phone: '9876543210',
        locality: 'Whitefield',
      },
    });
    assert(res.status === 401, `Expected 401 for missing auth, got ${res.status}`);
    const body = await res.json();
    assert(body.error === 'WEBHOOK_UNAUTHORIZED', 'Expected WEBHOOK_UNAUTHORIZED error code');
    recordPass('1. Missing auth credentials correctly rejects with 401 WEBHOOK_UNAUTHORIZED');
  } catch (err) {
    recordFail('1. Missing auth credentials rejection', err);
  }

  // Test 2: Invalid secret token rejects with 401
  try {
    const res = await dispatchRequest(app, '/api/webhooks/99acres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'completely-wrong-token-12345',
      },
      body: {
        enquiryId: '99AC-TEST-002',
        name: 'Aarav Sharma',
        phone: '9876543210',
        locality: 'Whitefield',
      },
    });
    assert(res.status === 401, `Expected 401 for wrong token, got ${res.status}`);
    const body = await res.json();
    assert(body.error === 'WEBHOOK_UNAUTHORIZED', 'Expected WEBHOOK_UNAUTHORIZED error code');
    recordPass('2. Invalid API key correctly rejects with 401 WEBHOOK_UNAUTHORIZED');
  } catch (err) {
    recordFail('2. Invalid API key rejection', err);
  }

  // Test 3: Valid x-api-key header creates lead (201 CREATED)
  const uniqueEnqId1 = `99AC-APIKEY-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, '/api/webhooks/99acres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        enquiryId: uniqueEnqId1,
        propertyId: 'PROP-99-9871',
        name: 'Rohan Mehra',
        mobile: '9876543211',
        email: 'rohan.mehra@example.com',
        locality: 'Sarjapur Road',
        society: 'Prestige Lakeside Habitat',
        bedroom: '3 BHK',
        budget: '18500000',
        query: 'Interested in resale flat on 12th floor with lake view.',
      },
    });
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Expected success: true');
    assert(body.status === 'CREATED', 'Expected status: CREATED');
    assert(body.externalEnquiryId === uniqueEnqId1, 'External enquiry ID preserved');
    assert(body.lead.phone === '+919876543211', 'Phone normalized to E.164 +91XXXXXXXXXX');
    assert(body.lead.source === '99acres', 'Lead source tagged as 99acres');
    recordPass('3. Ingestion via x-api-key header succeeds with 201 CREATED and normalized data');
  } catch (err) {
    recordFail('3. Ingestion via x-api-key header', err);
  }

  // Test 4: Valid Authorization: Bearer <key> header creates lead
  const uniqueEnqId2 = `99AC-BEARER-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, '/api/crm/webhooks/99acres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_SECRET}`,
      },
      body: {
        enquiry_id: uniqueEnqId2,
        client_name: 'Pooja Hegde',
        phone: '+91 9845012345',
        project_name: 'Godrej Air',
        city: 'Bengaluru',
        locality: 'Hoodi',
        bhk: '2 BHK',
        price_range: '1.2 Cr',
      },
    });
    assert(res.status === 201, `Expected 201 Created on crm alias, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Expected success: true');
    assert(body.status === 'CREATED', 'Expected status: CREATED');
    assert(body.externalEnquiryId === uniqueEnqId2, 'External enquiry ID preserved');
    assert(body.lead.phone === '+919845012345', 'Phone normalized correctly');
    recordPass('4. Ingestion via Bearer token on /api/crm/webhooks/99acres alias succeeds with 201');
  } catch (err) {
    recordFail('4. Ingestion via Bearer token', err);
  }

  // Test 5: Valid query parameter ?apiKey=<key> creates lead
  const uniqueEnqId3 = `99AC-QUERY-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, `/api/webhooks/99acres?apiKey=${encodeURIComponent(TEST_SECRET)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        leadId: uniqueEnqId3,
        buyerName: 'Vikram Seth',
        contactNumber: '9123456780',
        societyName: 'Brigade Meadows',
        locality: 'Kanakapura Road',
        bedrooms: '3',
      },
    });
    assert(res.status === 201, `Expected 201 Created via query param, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Expected success: true');
    assert(body.lead.name === 'Vikram Seth', 'Buyer name parsed');
    recordPass('5. Ingestion via URL query parameter (?apiKey=...) succeeds with 201');
  } catch (err) {
    recordFail('5. Ingestion via URL query parameter', err);
  }

  // Test 6: Nested JSON envelope (e.g., { data: { ... } } or { lead: { ... } })
  const uniqueEnqId4 = `99AC-NESTED-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, '/api/webhooks/99acres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        timestamp: '2026-10-29T12:00:00Z',
        data: {
          enquiryId: uniqueEnqId4,
          lead: {
            fullName: 'Ananya Deshmukh',
            phoneNumber: '9988776655',
            emailAddress: 'ananya.d@example.com',
            society: 'Sobha Dream Acres',
            microMarket: 'Panathur',
            unitType: '2 BHK',
          },
        },
      },
    });
    assert(res.status === 201, `Expected 201 Created with nested envelope, got ${res.status}`);
    const body = await res.json();
    assert(body.lead.name === 'Ananya Deshmukh', 'Nested name parsed correctly');
    assert(body.lead.society === 'Sobha Dream Acres', 'Nested society parsed correctly');
    recordPass('6. Nested JSON payload envelope correctly unpacked and ingested');
  } catch (err) {
    recordFail('6. Nested JSON payload envelope', err);
  }

  // Test 7: Form-urlencoded body ingestion
  const uniqueEnqId5 = `99AC-URLENC-${Date.now()}`;
  try {
    const formParams = new URLSearchParams({
      apiKey: TEST_SECRET,
      enquiryId: uniqueEnqId5,
      name: 'Sunil Gavaskar',
      phone: '9820011223',
      locality: 'Indiranagar',
      bhk: '4 BHK',
      remarks: 'Looking for urgent resale penthouse',
    }).toString();

    const res = await dispatchRequest(app, '/api/webhooks/99acres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams,
    });
    assert(res.status === 201, `Expected 201 for urlencoded payload, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Form body parsed successfully');
    assert(body.lead.phone === '+919820011223', 'Phone parsed from form data');
    recordPass('7. Form-urlencoded payload with body apiKey ingested successfully');
  } catch (err) {
    recordFail('7. Form-urlencoded payload ingestion', err);
  }

  // Test 8: Invalid Indian mobile number rejected with 400
  try {
    const res = await dispatchRequest(app, '/api/webhooks/99acres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        enquiryId: `99AC-INVALID-${Date.now()}`,
        name: 'Bad Phone User',
        phone: '12345', // Too short, invalid first digit
        locality: 'Koramangala',
      },
    });
    assert(res.status === 400, `Expected 400 for bad phone, got ${res.status}`);
    const body = await res.json();
    assert(body.error === 'INVALID_PAYLOAD', 'Expected INVALID_PAYLOAD');
    recordPass('8. Invalid Indian mobile number rejected with 400 INVALID_PAYLOAD');
  } catch (err) {
    recordFail('8. Invalid mobile number rejection', err);
  }

  // Test 9: Duplicate external enquiry ID returns 200 DUPLICATE_SUPPRESSED
  try {
    // Re-send uniqueEnqId1 from Test 3
    const res = await dispatchRequest(app, '/api/webhooks/99acres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        enquiryId: uniqueEnqId1,
        name: 'Rohan Mehra',
        phone: '9876543211',
        locality: 'Sarjapur Road',
      },
    });
    assert(res.status === 200, `Expected 200 OK on duplicate retry, got ${res.status}`);
    const body = await res.json();
    assert(body.status === 'DUPLICATE_SUPPRESSED', 'Expected DUPLICATE_SUPPRESSED status');
    assert(body.handled === true, 'Expected handled: true');
    recordPass('9. Retry with identical externalEnquiryId safely suppressed with 200 DUPLICATE_SUPPRESSED');
  } catch (err) {
    recordFail('9. Duplicate suppression', err);
  }

  // Test 10: Verify CRM query displays the ingested 99acres lead
  try {
    const dbRows = Array.from(devSandboxStore.buyerEnquiries.values()).filter((b: any) => {
      try {
        const attr = typeof b.attribution === 'string' ? JSON.parse(b.attribution) : b.attribution;
        return attr?.externalEnquiryId === uniqueEnqId1;
      } catch {
        return false;
      }
    });

    assert(dbRows.length === 1, `Expected exactly 1 buyer enquiry row for ${uniqueEnqId1}, found ${dbRows.length}`);
    const row = dbRows[0];
    assert(row.buyer_name === 'Rohan Mehra', 'Buyer name stored');
    assert(row.phone === '+919876543211', 'Phone stored in E.164');
    const attr = typeof row.attribution === 'string' ? JSON.parse(row.attribution) : row.attribution;
    assert(attr.source === '99acres', 'Lead source is 99acres in CRM schema');
    recordPass('10. Ingested lead verified in database with source=99acres and attribution preserved');
  } catch (err) {
    recordFail('10. Database verification of 99acres lead', err);
  }

  // Test 11: Inbound Lead Push API endpoint (/api/v1/leads/99acres) with 99acres native Push API fields
  const uniqueEnqId6 = `99AC-PUSHAPI-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, '/api/v1/leads/99acres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        Query_ID: uniqueEnqId6,
        Query_Name: 'Deepak Chawla',
        Mobile_No: '9811223344',
        Email_ID: 'deepak.c@example.com',
        Property_ID: '99AC-PROP-5544',
        Query_Info: 'Looking for 3 BHK flat ready to move in Whitefield Bangalore',
        City: 'Bangalore',
        Requirement_Type: 'Buy',
        Source: '99acres',
        RcvdOn: '2026-10-29T13:20:00+05:30',
      },
    });
    assert(res.status === 201, `Expected 201 Created on /api/v1/leads/99acres, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Push API returned success: true');
    assert(body.lead.name === 'Deepak Chawla', 'Buyer name parsed from Query_Name');
    assert(body.lead.phone === '+919811223344', 'Phone parsed from Mobile_No and normalized');
    assert(body.externalEnquiryId === uniqueEnqId6, 'Query_ID mapped to externalEnquiryId');
    recordPass('11. 99acres Push API endpoint (/api/v1/leads/99acres) succeeds with 201 using native 99acres parameters');
  } catch (err) {
    recordFail('11. 99acres Push API endpoint', err);
  }

  console.log(`\n99acres Webhook Inbound Integration Suite: ${passed} passed, ${failed} failed`);
  return { passed, failed, results };
}

import { fileURLToPath } from 'url';

// Standalone execution runner
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run99acresWebhookTests()
    .then((r) => {
      if (r.failed > 0) process.exit(1);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test execution crashed:', err);
      process.exit(1);
    });
}
