import { app } from '../server';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import { MagicbricksLeadService } from '../src/server/webhooks/magicbricks';
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

export async function runMagicbricksWebhookTests(): Promise<{ passed: number; failed: number; results: string[] }> {
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

  console.log('\n--- Running Magicbricks Webhook Inbound Integration Suite ---');

  const TEST_SECRET = process.env.MAGICBRICKS_WEBHOOK_SECRET || 'test-magicbricks-secret';

  // Test 1: Missing authentication credentials rejects with 401
  try {
    const res = await dispatchRequest(app, '/api/webhooks/magicbricks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        LeadId: 'MB-TEST-001',
        Name: 'Suresh Raina',
        Mobile: '9876543210',
        Locality: 'Whitefield',
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
    const res = await dispatchRequest(app, '/api/webhooks/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'completely-wrong-token-12345',
      },
      body: {
        LeadId: 'MB-TEST-002',
        Name: 'Suresh Raina',
        Mobile: '9876543210',
        Locality: 'Whitefield',
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
  const uniqueEnqId1 = `MB-APIKEY-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, '/api/webhooks/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        LeadId: uniqueEnqId1,
        Name: 'Kavita Iyer',
        Mobile: '9876543222',
        Email: 'kavita.iyer@example.com',
        ProjectName: 'Brigade Cornerstone Utopia',
        Locality: 'Varthur',
        BHK: '3 BHK',
        Budget: '16000000',
        Remarks: 'Looking for high-floor flat in Serene tower.',
      },
    });
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Expected success: true');
    assert(body.status === 'CREATED', 'Expected status: CREATED');
    assert(body.externalEnquiryId === uniqueEnqId1, 'External enquiry ID preserved');
    assert(body.lead.phone === '+919876543222', 'Phone normalized to E.164 +91XXXXXXXXXX');
    assert(body.lead.source === 'Magicbricks', 'Lead source tagged as Magicbricks');
    recordPass('3. Ingestion via x-api-key header succeeds with 201 CREATED and normalized data');
  } catch (err) {
    recordFail('3. Ingestion via x-api-key header', err);
  }

  // Test 4: Valid Authorization: Bearer <key> header creates lead
  const uniqueEnqId2 = `MB-BEARER-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, '/api/crm/webhooks/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_SECRET}`,
      },
      body: {
        lead_id: uniqueEnqId2,
        client_name: 'Prakash Padukone',
        phone: '+91 9845099887',
        project_name: 'Total Environment Learning to Fly',
        city: 'Bengaluru',
        locality: 'JP Nagar',
        bhk: '4 BHK',
        budget: '4.5 Cr',
      },
    });
    assert(res.status === 201, `Expected 201 Created on crm alias, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Expected success: true');
    assert(body.status === 'CREATED', 'Expected status: CREATED');
    assert(body.externalEnquiryId === uniqueEnqId2, 'External enquiry ID preserved');
    assert(body.lead.phone === '+919845099887', 'Phone normalized correctly');
    recordPass('4. Ingestion via Bearer token on /api/crm/webhooks/magicbricks alias succeeds with 201');
  } catch (err) {
    recordFail('4. Ingestion via Bearer token', err);
  }

  // Test 5: Valid query parameter ?apiKey=<key> creates lead
  const uniqueEnqId3 = `MB-QUERY-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, `/api/webhooks/magicbricks?apiKey=${encodeURIComponent(TEST_SECRET)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        leadId: uniqueEnqId3,
        buyerName: 'Naveen Jindal',
        contactNumber: '9123456781',
        projectName: 'Purva Palm Beach',
        locality: 'Hennur Road',
        bedrooms: '3',
      },
    });
    assert(res.status === 201, `Expected 201 Created via query param, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Expected success: true');
    assert(body.lead.name === 'Naveen Jindal', 'Buyer name parsed');
    recordPass('5. Ingestion via URL query parameter (?apiKey=...) succeeds with 201');
  } catch (err) {
    recordFail('5. Ingestion via URL query parameter', err);
  }

  // Test 6: Nested JSON envelope (e.g. { data: { ... } } or { lead: { ... } })
  const uniqueEnqId4 = `MB-NESTED-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, '/api/webhooks/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        timestamp: '2026-11-04T12:00:00Z',
        data: {
          leadId: uniqueEnqId4,
          lead: {
            fullName: 'Tanvi Shah',
            mobile: '9880011223',
            email: 'tanvi.shah@example.com',
            locality: 'Bellandur',
            projectName: 'Assetz Marq',
            bhk: '2 BHK',
          },
        },
      },
    });
    assert(res.status === 201, `Expected 201 Created with nested envelope, got ${res.status}`);
    const body = await res.json();
    assert(body.lead.name === 'Tanvi Shah', 'Nested name parsed correctly');
    assert(body.lead.society === 'Assetz Marq', 'Nested society parsed correctly');
    recordPass('6. Nested JSON payload envelope correctly unpacked and ingested');
  } catch (err) {
    recordFail('6. Nested JSON payload envelope', err);
  }

  // Test 7: Form-urlencoded body ingestion
  const uniqueEnqId5 = `MB-URLENC-${Date.now()}`;
  try {
    const formParams = new URLSearchParams({
      apiKey: TEST_SECRET,
      LeadId: uniqueEnqId5,
      Name: 'Harish Kumar',
      Mobile: '9820099887',
      Locality: 'Indiranagar',
      BHK: '3 BHK',
      Remarks: 'Interested in immediate site visit this weekend',
    }).toString();

    const res = await dispatchRequest(app, '/api/webhooks/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams,
    });
    assert(res.status === 201, `Expected 201 for urlencoded payload, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Form body parsed successfully');
    assert(body.lead.phone === '+919820099887', 'Phone parsed from form data');
    recordPass('7. Form-urlencoded payload with body apiKey ingested successfully');
  } catch (err) {
    recordFail('7. Form-urlencoded payload ingestion', err);
  }

  // Test 8: XML format payload ingestion
  const uniqueEnqId6 = `MB-XML-${Date.now()}`;
  try {
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
    <LeadDetails>
      <LeadId>${uniqueEnqId6}</LeadId>
      <Name>Raghavendra Rao</Name>
      <Mobile>9845012399</Mobile>
      <Email>raghav.rao@example.com</Email>
      <ProjectName>Sobha Windsor</ProjectName>
      <Locality>Whitefield</Locality>
      <BHK>3 BHK</BHK>
      <Budget>2 Cr</Budget>
      <Remarks>Enquiry from Magicbricks developer campaign</Remarks>
    </LeadDetails>`;

    const res = await dispatchRequest(app, '/api/webhooks/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'x-api-key': TEST_SECRET,
      },
      body: xmlBody,
    });
    assert(res.status === 201, `Expected 201 for XML payload, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'XML payload processed successfully');
    assert(body.lead.name === 'Raghavendra Rao', 'Name extracted from XML');
    assert(body.lead.phone === '+919845012399', 'Phone extracted from XML');
    recordPass('8. Magicbricks XML format payload successfully ingested with 201 CREATED');
  } catch (err) {
    recordFail('8. XML format ingestion', err);
  }

  // Test 9: Invalid Indian mobile number rejected with 400
  try {
    const res = await dispatchRequest(app, '/api/webhooks/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        LeadId: `MB-INVALID-${Date.now()}`,
        Name: 'Invalid Phone Person',
        Mobile: '12345',
        Locality: 'Koramangala',
      },
    });
    assert(res.status === 400, `Expected 400 for bad phone, got ${res.status}`);
    const body = await res.json();
    assert(body.error === 'INVALID_PAYLOAD', 'Expected INVALID_PAYLOAD');
    recordPass('9. Invalid Indian mobile number rejected with 400 INVALID_PAYLOAD');
  } catch (err) {
    recordFail('9. Invalid mobile number rejection', err);
  }

  // Test 10: Duplicate external enquiry ID returns 200 DUPLICATE_SUPPRESSED
  try {
    const res = await dispatchRequest(app, '/api/webhooks/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        LeadId: uniqueEnqId1,
        Name: 'Kavita Iyer',
        Mobile: '9876543222',
        Locality: 'Varthur',
      },
    });
    assert(res.status === 200, `Expected 200 OK on duplicate retry, got ${res.status}`);
    const body = await res.json();
    assert(body.status === 'DUPLICATE_SUPPRESSED', 'Expected DUPLICATE_SUPPRESSED status');
    assert(body.handled === true, 'Expected handled: true');
    recordPass('10. Retry with identical externalEnquiryId safely suppressed with 200 DUPLICATE_SUPPRESSED');
  } catch (err) {
    recordFail('10. Duplicate suppression', err);
  }

  // Test 11: GET health check returns 200 OK with service ONLINE status
  try {
    const res = await dispatchRequest(app, '/api/v1/leads/magicbricks', {
      method: 'GET',
    });
    assert(res.status === 200, `Expected 200 OK for GET check, got ${res.status}`);
    const body = await res.json();
    assert(body.status === 'ONLINE', 'Expected service status ONLINE');
    assert(body.acceptedMethod === 'POST', 'Expected acceptedMethod POST');
    recordPass('11. GET request on Magicbricks endpoint returns 200 OK with ONLINE status');
  } catch (err) {
    recordFail('11. GET request on Magicbricks endpoint', err);
  }

  // Test 12: Inbound Lead Push API endpoint (/api/v1/leads/magicbricks) with native parameters
  const uniqueEnqId7 = `MB-PUSHAPI-${Date.now()}`;
  try {
    const res = await dispatchRequest(app, '/api/v1/leads/magicbricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_SECRET,
      },
      body: {
        lead_id: uniqueEnqId7,
        name: 'Gaurav Singhal',
        phone: '9820011999',
        email: 'gaurav.s@example.com',
        locality: 'Sarjapur Road',
        project_name: 'Prestige Evergreen',
        bhk: '3 BHK',
        budget: '2.2 Cr',
        remarks: 'Direct push enquiry from Magicbricks campaign',
      },
    });
    assert(res.status === 201, `Expected 201 Created on /api/v1/leads/magicbricks, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Push API returned success: true');
    assert(body.lead.name === 'Gaurav Singhal', 'Buyer name parsed');
    assert(body.lead.phone === '+919820011999', 'Phone parsed and normalized');
    assert(body.externalEnquiryId === uniqueEnqId7, 'External ID mapped');
    recordPass('12. Magicbricks Push API endpoint (/api/v1/leads/magicbricks) succeeds with 201');
  } catch (err) {
    recordFail('12. Magicbricks Push API endpoint', err);
  }

  // Test 13: Verify Database storage & source tagging
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
    assert(row.buyer_name === 'Kavita Iyer', 'Buyer name stored');
    assert(row.phone === '+919876543222', 'Phone stored in E.164');
    const attr = typeof row.attribution === 'string' ? JSON.parse(row.attribution) : row.attribution;
    assert(attr.source === 'Magicbricks', 'Lead source is Magicbricks in CRM schema');
    recordPass('13. Ingested lead verified in database with source=Magicbricks and attribution preserved');
  } catch (err) {
    recordFail('13. Database verification of Magicbricks lead', err);
  }

  console.log(`\nMagicbricks Suite Complete: ${passed} passed, ${failed} failed.`);
  return { passed, failed, results };
}

if (process.argv[1]?.endsWith('test-magicbricks-webhook.ts')) {
  runMagicbricksWebhookTests().then((res) => {
    if (res.failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  });
}
