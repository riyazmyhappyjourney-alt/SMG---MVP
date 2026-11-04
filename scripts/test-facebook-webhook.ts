import { app } from '../server';
import { FacebookLeadService, normalizeIndianPhone, getMetaWebhookVerifyToken } from '../src/server/webhooks/facebook';
import { executeQuery } from '../src/server/db/pool';
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

    res.end = function (chunk: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const resBody = Buffer.concat(chunks).toString('utf-8');
      const responseHeaders: Record<string, any> = {};
      const rawHeaderNames = res.getHeaderNames();
      for (const name of rawHeaderNames) {
        responseHeaders[name.toLowerCase()] = res.getHeader(name);
      }

      resolve({
        status: res.statusCode,
        headers: responseHeaders,
        body: resBody,
        json: async () => {
          try {
            return JSON.parse(resBody);
          } catch {
            return {};
          }
        },
      });
      return this;
    };

    expressApp(req, res);

    if (payload) {
      req.emit('data', payload);
      req.emit('end');
    } else {
      req.emit('end');
    }
  });
}

export async function runFacebookWebhookTests(): Promise<{ passed: number; failed: number; results: string[] }> {
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

  console.log('\n--- Running Meta (Facebook) Lead Ads Inbound Webhook Suite ---');

  // Test 1: Indian Phone Normalization
  try {
    assert(normalizeIndianPhone('9876543210') === '+919876543210', '10-digit number prefixed with +91');
    assert(normalizeIndianPhone('+91 98765 43210') === '+919876543210', 'Formatted string normalized');
    assert(normalizeIndianPhone('09876543210') === '+919876543210', 'Leading 0 stripped and prefixed with +91');
    assert(normalizeIndianPhone('919876543210') === '+919876543210', '12-digit 91XXXXXXXXXX normalized');
    recordPass('1. Indian mobile phone numbers normalized to E.164 (+91XXXXXXXXXX)');
  } catch (err) {
    recordFail('1. Phone normalization', err);
  }

  // Test 2: Invalid Indian mobile numbers rejected
  try {
    let threw = false;
    try {
      normalizeIndianPhone('1234567890'); // Starts with 1
    } catch {
      threw = true;
    }
    assert(threw, 'Invalid starting digit rejected');

    let threwShort = false;
    try {
      normalizeIndianPhone('98765');
    } catch {
      threwShort = true;
    }
    assert(threwShort, 'Short phone number rejected');
    recordPass('2. Invalid mobile numbers (<10 digits or invalid starting digit) rejected');
  } catch (err) {
    recordFail('2. Invalid phone rejection', err);
  }

  // Test 3: GET Handshake Verification (hub.mode=subscribe)
  try {
    const verifyToken = getMetaWebhookVerifyToken();
    const challenge = 'test_challenge_8829104';
    const res = await dispatchRequest(
      app,
      `/api/v1/leads/facebook?hub.mode=subscribe&hub.challenge=${challenge}&hub.verify_token=${verifyToken}`,
      { method: 'GET' }
    );
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    assert(res.body === challenge, `Expected challenge echo "${challenge}", got "${res.body}"`);
    recordPass('3. Meta Webhook subscription verification handshake succeeds with 200 and echoes challenge');
  } catch (err) {
    recordFail('3. Webhook verification handshake', err);
  }

  // Test 4: GET Handshake with Wrong Token Rejects 403
  try {
    const res = await dispatchRequest(
      app,
      `/api/v1/leads/facebook?hub.mode=subscribe&hub.challenge=123&hub.verify_token=wrong_token`,
      { method: 'GET' }
    );
    assert(res.status === 403, `Expected 403 FORBIDDEN, got ${res.status}`);
    recordPass('4. Meta Webhook handshake with invalid verify_token correctly rejects with 403');
  } catch (err) {
    recordFail('4. Invalid verify_token rejection', err);
  }

  // Test 5: GET Health Check without hub params returns ONLINE
  try {
    const res = await dispatchRequest(app, '/api/v1/leads/facebook', { method: 'GET' });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const json = await res.json();
    assert(json.status === 'ONLINE', 'Expected status ONLINE');
    recordPass('5. GET request on Facebook endpoint returns 200 OK with ONLINE status');
  } catch (err) {
    recordFail('5. GET health check', err);
  }

  // Test 6: Direct Lead Payload Ingestion
  const testLeadIdA = `FB-TEST-${Date.now()}-1`;
  try {
    const directPayload = {
      leadgen_id: testLeadIdA,
      full_name: 'Abraham Test',
      phone_number: '9876543210',
      email: 'abraham.test@example.com',
      form_name: 'SellMyGhar 2BHK Resale Form',
      campaign_name: 'Bangalore Resale Leads Nov 2026',
      city: 'Bangalore',
    };

    const res = await FacebookLeadService.handleWebhook(directPayload);
    assert(res.success === true, 'Success flag is true');
    assert(res.status === 'CREATED', 'Status is CREATED');
    assert(res.lead?.source === 'Facebook Ads', 'Source tagged as Facebook Ads');
    assert(res.lead?.phone === '+919876543210', 'Phone normalized');
    recordPass('6. Direct lead payload ingestion succeeds with 201 CREATED and normalized data');
  } catch (err) {
    recordFail('6. Direct payload ingestion', err);
  }

  // Test 7: Official Meta Webhook Envelope Ingestion
  const testLeadIdB = `FB-TEST-${Date.now()}-2`;
  try {
    const metaWebhookPayload = {
      object: 'page',
      entry: [
        {
          id: '1037956866071171',
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              field: 'leadgen',
              value: {
                created_time: Math.floor(Date.now() / 1000),
                leadgen_id: testLeadIdB,
                page_id: '1037956866071171',
                form_id: '9876543210987654',
              },
            },
          ],
        },
      ],
      field_data: [
        { name: 'full_name', values: ['Sudhindra S M'] },
        { name: 'phone_number', values: ['+91 98450 12345'] },
        { name: 'email', values: ['sudhindra@example.com'] },
        { name: 'city', values: ['Bengaluru'] },
      ],
    };

    const res = await FacebookLeadService.handleWebhook(metaWebhookPayload);
    assert(res.success === true, 'Envelope success: true');
    assert(res.status === 'CREATED', 'Status: CREATED');
    assert(res.lead?.name === 'Sudhindra S M', 'Name extracted');
    assert(res.lead?.phone === '+919845012345', 'Phone extracted & normalized');
    recordPass('7. Official Meta webhook envelope with field_data ingested successfully');
  } catch (err) {
    recordFail('7. Meta envelope ingestion', err);
  }

  // Test 8: End-to-End POST on /api/v1/leads/facebook
  const testLeadIdC = `FB-TEST-${Date.now()}-3`;
  try {
    const res = await dispatchRequest(app, '/api/v1/leads/facebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        leadgen_id: testLeadIdC,
        full_name: 'Devinder Sharma',
        phone_number: '9820011223',
        email: 'devinder@example.com',
        city: 'Indiranagar',
      },
    });
    assert(res.status === 201, `Expected 201 CREATED on /api/v1/leads/facebook, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Response marked success');
    assert(json.lead?.name === 'Devinder Sharma', 'Buyer name parsed');
    recordPass('8. End-to-End POST /api/v1/leads/facebook creates lead with HTTP 201');
  } catch (err) {
    recordFail('8. End-to-End POST route', err);
  }

  // Test 9: End-to-End POST on alias /api/crm/webhooks/facebook
  const testLeadIdD = `FB-TEST-${Date.now()}-4`;
  try {
    const res = await dispatchRequest(app, '/api/crm/webhooks/facebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        leadgen_id: testLeadIdD,
        full_name: 'Gopinath HS',
        phone_number: '9845099887',
        email: 'gopinath@example.com',
        city: 'Whitefield',
      },
    });
    assert(res.status === 201, `Expected 201 on alias, got ${res.status}`);
    recordPass('9. Alias endpoint /api/crm/webhooks/facebook functions seamlessly with 201');
  } catch (err) {
    recordFail('9. Alias endpoint test', err);
  }

  // Test 10: Idempotency & Duplicate Suppression
  try {
    const duplicatePayload = {
      leadgen_id: testLeadIdA,
      full_name: 'Abraham Test Duplicate',
      phone_number: '9876543210',
    };

    const res = await FacebookLeadService.handleWebhook(duplicatePayload);
    assert(res.success === true, 'Duplicate response success: true');
    assert(res.status === 'DUPLICATE_SUPPRESSED', 'Duplicate status is DUPLICATE_SUPPRESSED');
    assert(res.handled === true, 'Handled is true');
    recordPass('10. Duplicate lead with identical leadgen_id safely suppressed with DUPLICATE_SUPPRESSED');
  } catch (err) {
    recordFail('10. Duplicate suppression', err);
  }

  // Test 11: In-memory cache suppression
  try {
    const res = await FacebookLeadService.handleWebhook({
      leadgen_id: testLeadIdA,
      phone_number: '9876543210',
    });
    assert(res.status === 'DUPLICATE_SUPPRESSED', 'Cached replay suppressed');
    recordPass('11. Rapid in-memory replay guard intercepts bursts without DB load');
  } catch (err) {
    recordFail('11. In-memory replay guard', err);
  }

  // Test 12: Persistence in database verified
  try {
    const dbCheck = await executeQuery(
      `SELECT id, buyer_name, phone, email, notes, attribution FROM buyer_enquiries WHERE attribution->>'externalEnquiryId' = $1 LIMIT 1;`,
      [`FB-${testLeadIdA}`]
    );
    assert(dbCheck.rows.length === 1, 'Found exactly 1 row in database');
    assert(dbCheck.rows[0].buyer_name === 'Abraham Test', 'Buyer name preserved in DB');
    const attr = typeof dbCheck.rows[0].attribution === 'string' ? JSON.parse(dbCheck.rows[0].attribution) : dbCheck.rows[0].attribution;
    assert(attr.source === 'Facebook Ads', 'Source is Facebook Ads in DB attribution');
    recordPass('12. Ingested lead verified in database with source=Facebook Ads and attribution preserved');
  } catch (err) {
    recordFail('12. Database persistence', err);
  }

  console.log(`\nFacebook Lead Ads Webhook Suite Complete: ${passed} passed, ${failed} failed.`);
  return { passed, failed, results };
}

if (process.argv[1]?.endsWith('test-facebook-webhook.ts')) {
  runFacebookWebhookTests().then((res) => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
