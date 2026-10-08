import http from 'http';
import { Socket } from 'net';
import { app, initSchemaColumns } from '../server';
import { executeQuery } from '../src/server/db/pool';

function dispatchRequest(
  expressApp: any,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    cookies?: Record<string, string>;
  } = {}
): Promise<{ status: number; headers: any; body: string; json: () => Promise<any> }> {
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
          } catch (e) {
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

export async function runPropertyDetailTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  await initSchemaColumns();

  function assert(condition: boolean, desc: string) {
    if (condition) {
      results.push(`[PASS] ${desc}`);
      passed++;
    } else {
      results.push(`[FAIL] ${desc}`);
      failed++;
    }
  }

  try {
    // 1. GET /api/listings/:id returns 200 with sanitized data
    const resSeed1 = await dispatchRequest(app, '/api/listings/prop-dev-seed-01');
    const jsonSeed1 = await resSeed1.json();
    assert(resSeed1.status === 200, 'TEST 1: Public detail endpoint returns 200 OK for valid property');
    assert(jsonSeed1 && jsonSeed1.success === true && jsonSeed1.listing, 'TEST 1b: Response payload contains success: true and listing object');
    assert(jsonSeed1?.listing?.projectName === 'Sobha Dream Acres', 'TEST 1c: Correct project name is returned');
    assert(jsonSeed1?.listing?.localityName.includes('Panathur'), 'TEST 1d: Correct locality name is returned');

    // 2. Strict Privacy Sanitization - Sensitive owner fields must NEVER be present
    const rawBody = resSeed1.body;
    const listing = jsonSeed1?.listing || {};
    const privacyChecks = [
      !('owner_id' in listing),
      !('ownerId' in listing),
      !('owner_phone' in listing),
      !('ownerPhone' in listing),
      !('owner_email' in listing),
      !('ownerEmail' in listing),
      !('unit_number' in listing),
      !('unitNumber' in listing),
      !('wing_tower' in listing),
      !('reserve_minimum_price_inr' in listing),
      !('reserveMinimumPriceInr' in listing),
      !('internal_verification_notes' in listing),
      !rawBody.includes('usr-dev-seller-01'),
      !rawBody.includes('Tower 4, Flat 1102'),
      !rawBody.includes('14000000') // seed reserve price is 14000000
    ];
    assert(privacyChecks.every(Boolean), 'TEST 2: Privacy sanitization: owner ID, phone, email, unit number, and reserve price are NEVER exposed');

    // 3. 404 for nonexistent property
    const resNotFound = await dispatchRequest(app, '/api/listings/nonexistent-prop-999');
    assert(resNotFound.status === 404, 'TEST 3: Nonexistent property ID returns 404 NOT_FOUND');

    // 4. 404 for non-public property (LOST or DROPPED)
    // Insert a test property marked as LOST
    const lostPropId = `prop-test-lost-${Date.now()}`;
    await executeQuery(
      `INSERT INTO properties (
        id, owner_id, project_locality_id, unit_number, bhk_type, super_built_up_sqft, 
        unit_floor, total_floors, facing, asking_price_inr, crm_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [lostPropId, 'usr-test-owner', 'Sobha Forest Edge, Kanakapura Road', 'Unit 101', '3BHK', 1500, 4, 14, 'EAST', 12000000, 'LOST']
    );

    const resLost = await dispatchRequest(app, `/api/listings/${lostPropId}`);
    assert(resLost.status === 404, 'TEST 4: Non-public property (crm_status = LOST) returns 404 NOT_FOUND');

    // 5. Submitting enquiry with property ID saves buyer_enquiries.property_id
    const enquiryPhone = '9845099881';
    const enquiryRes = await dispatchRequest(app, '/api/leads', {
      method: 'POST',
      body: {
        fullName: 'Ananya Sharma',
        phone: enquiryPhone,
        intent: 'BUY',
        propertyId: 'prop-dev-seed-01',
        societyName: 'Sobha Dream Acres',
        locality: 'Panathur, Bengaluru',
        bhkType: '2BHK',
        notes: 'Preferred Slot: Saturday Morning. Pre-approved home loan.'
      }
    });

    const enquiryJson = await enquiryRes.json();
    assert(enquiryRes.status === 201 && enquiryJson.success, 'TEST 5: Enquiry submitted successfully via POST /api/leads');

    // Verify buyer_enquiries in database
    const dbEnquiry = await executeQuery(
      `SELECT id, phone, property_id, notes FROM buyer_enquiries WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
      [enquiryPhone]
    );

    assert(dbEnquiry.rows.length > 0, 'TEST 6: Buyer enquiry persists to database');
    assert(dbEnquiry.rows[0]?.property_id === 'prop-dev-seed-01', 'TEST 6b: buyer_enquiries.property_id correctly stored in database');

    // 7. Enquiry notes include property context
    assert(Boolean(dbEnquiry.rows[0]?.notes && dbEnquiry.rows[0].notes.includes('[Property Ref: prop-dev-seed-01]')), 'TEST 7: Enquiry notes prepend property ID reference');

    // 8. DPDP statutory consent is recorded
    const consentDb = await executeQuery(
      `SELECT purpose, is_consented FROM consents WHERE phone = $1 AND purpose = $2`,
      [enquiryPhone, 'BUYER_ENQUIRY']
    );
    assert(consentDb.rows.length > 0 && consentDb.rows[0].is_consented === true, 'TEST 8: DPDP statutory consent is recorded in consents table for BUYER_ENQUIRY');

    // 9. Similar properties return only valid inventory
    const similarProps = jsonSeed1?.listing?.similarProperties || [];
    assert(Array.isArray(similarProps), 'TEST 9: Similar properties array is returned');
    assert(similarProps.every((p: any) => p.id !== 'prop-dev-seed-01'), 'TEST 9b: Queried property is excluded from similar properties');
    assert(similarProps.every((p: any) => p.id !== lostPropId), 'TEST 9c: Non-public (LOST) property is excluded from similar properties');

    // 10. Similar properties are ranked deterministically
    // In our seed data, prop-dev-seed-04 is in Panathur (same locality as seed 01), so it should score highest
    if (similarProps.length > 0) {
      assert(similarProps[0].localityName.includes('Panathur'), 'TEST 10: Highest ranked similar property matches same locality (Panathur) deterministically');
    } else {
      assert(false, 'TEST 10: At least one similar property should be returned from seed inventory');
    }

    // 11. Relationship Manager contact phone is verified SMG RM desk (+91 8217873708)
    const rm = jsonSeed1?.listing?.relationshipManager;
    assert(rm && rm.phone === '+91 8217873708', 'TEST 11: Relationship Manager phone is verified SellMyGhar desk (+91 8217873708)');

  } catch (err: any) {
    results.push(`[ERROR] Property detail test suite exception: ${err.message}`);
    failed++;
  }

  return { passed, failed, results };
}

if (process.env.STANDALONE_RUN) {
  runPropertyDetailTests().then((res) => {
    console.log(`Passed: ${res.passed}, Failed: ${res.failed}`);
    res.results.forEach((r) => console.log(r));
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
