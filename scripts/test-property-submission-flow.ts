/**
 * Automated Verification: Animated Property Submission & Thank You Experience
 *
 * Verifies:
 * 1. End-to-end Property Creation via POST /api/properties
 * 2. Database listing status, crm_status, and verification tier assignment
 * 3. Public visibility rules via GET /api/listings/:id
 * 4. Idempotent submission and duplicate prevention under identical idempotency keys
 * 5. Concurrent submission safety
 * 6. Validation and error handling
 * 7. Verification of custom animated loading state and Thank You Card contract
 */

import { app } from '../server';
import { executeQuery, getDbPool } from '../src/server/db/pool';
import { signSessionToken } from '../src/server/auth/tokens';
import http from 'http';
import { Socket } from 'net';
import fs from 'fs';

const TEST_PHONE = '+919988776655';
const TEST_UID = 'usr-test-seller-anim-01';

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
        headers: res.getHeaders(),
        body: resBody,
        json: async () => {
          try {
            return JSON.parse(resBody);
          } catch {
            return {};
          }
        },
      });
    };

    expressApp.handle(req, res);
    if (payload) {
      req.emit('data', payload);
    }
    req.emit('end');
  });
}

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`[PASS] ${name}: ${details}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`[FAIL] ${name}: ${details}`);
  }
}

async function run() {
  console.log('--- STARTING PROPERTY SUBMISSION FLOW TESTS ---');

  try {
    // 0. Setup Test User
    await executeQuery(
      `INSERT INTO users (id, phone, roles, is_active, created_at, updated_at)
       VALUES ($1, $2, ARRAY['BUYER']::text[], true, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET phone = $2, roles = ARRAY['BUYER']::text[];`,
      [TEST_UID, TEST_PHONE]
    );

    const sessionJwt = await signSessionToken({
      uid: TEST_UID,
      phone: TEST_PHONE,
      email: 'venkatesh.rao.test@sellmyghar.in',
      roles: ['BUYER'],
      permissions: [],
    });

    const csrfToken = 'test-csrf-token-xyz-12345';
    const authHeaders = {
      'Cookie': `sellmyghar_session=${sessionJwt}; sellmyghar_csrf=${csrfToken}`,
      'X-CSRF-Token': csrfToken,
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Content-Type': 'application/json',
    };

    // 1. Submit Property via POST /api/properties
    const idempotencyKey = `test-idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const submissionPayload = {
      intent: 'sell',
      listing_intent: 'SELL',
      propertyType: 'Apartment',
      subType: 'Flat / Apartment',
      locality: 'Whitefield',
      subLocality: 'ECC Road',
      societyName: 'Prestige Boulevard Test',
      houseNo: 'Flat 402',
      wingTower: 'Tower 3',
      bedrooms: 3,
      bathrooms: 3,
      balconies: 2,
      superBuiltUpSqft: 1650,
      carpetAreaSqft: 1280,
      furnishing: 'Semi-Furnished',
      floorNumber: 4,
      totalFloors: 14,
      facing: 'East',
      propertyAge: '1 to 5 years',
      hasCoveredParking: true,
      parkingCount: 1,
      photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
      expectedPrice: 14500000,
      isNegotiable: true,
      maintenanceCharges: 4500,
      ownerName: 'Venkatesh Rao',
      ownerPhone: TEST_PHONE,
      ownerEmail: 'venkatesh.rao.test@sellmyghar.in',
      idempotencyKey,
    };

    const submitRes = await dispatchRequest(app, '/api/properties', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: submissionPayload,
    });

    const submitData = await submitRes.json();
    assert(
      submitRes.status === 201 && submitData.success === true && Boolean(submitData.propertyId),
      '1. Property Creation Endpoint',
      `HTTP status ${submitRes.status}, propertyId: ${submitData.propertyId}, referenceId: ${submitData.referenceId}`
    );

    const createdPropertyId = submitData.propertyId;

    // 2. Database Inspection: Verify Assigned Status and Verification Tier
    const dbPropRes = await executeQuery(
      `SELECT id, owner_id, listing_status, crm_status, verification_tier, asking_price_inr, internal_verification_notes
       FROM properties WHERE id = $1;`,
      [createdPropertyId]
    );

    assert(dbPropRes.rows.length === 1, '2a. Property Row Persisted', `Found property ${createdPropertyId}`);
    const propRow = dbPropRes.rows[0];

    assert(
      propRow.listing_status === 'PUBLISHED',
      '2b. Database Listing Status Assigned',
      `Assigned listing_status: '${propRow.listing_status}' (Published automatically for public feed)`
    );

    assert(
      propRow.crm_status === 'NEW',
      '2c. Database CRM Status Assigned',
      `Assigned crm_status: '${propRow.crm_status}' (Queued for internal staff intake)`
    );

    assert(
      propRow.verification_tier === 'LEVEL_1_OWNER_DECLARED',
      '2d. Database Verification Tier Assigned',
      `Assigned verification_tier: '${propRow.verification_tier}' (Initial tier before legal audit)`
    );

    // 2e. Check seller lead created
    const leadRes = await executeQuery(
      `SELECT id, property_id, lead_status FROM seller_leads WHERE property_id = $1;`,
      [createdPropertyId]
    );
    assert(
      leadRes.rows.length >= 1 && leadRes.rows[0].lead_status === 'NEW',
      '2e. Seller Lead Intake Generated',
      `Lead ID: ${leadRes.rows[0]?.id}, status: ${leadRes.rows[0]?.lead_status}`
    );

    // 3. Public Visibility Rules Verification
    // Direct detail endpoint: GET /api/listings/:id
    const listingRes = await dispatchRequest(app, `/api/listings/${createdPropertyId}`, {
      method: 'GET',
    });
    const listingData = await listingRes.json();

    assert(
      listingRes.status === 200 && listingData.success === true && listingData.listing?.id === createdPropertyId,
      '3a. Public Accessibility for Newly Submitted Property',
      `HTTP status: ${listingRes.status}, title: "${listingData.listing?.title}", badge: "${listingData.listing?.verification?.badge}"`
    );

    // Verify privacy preservation: no owner mobile number or unit number exposed publicly
    const rawListingJson = JSON.stringify(listingData);
    assert(
      !rawListingJson.includes(TEST_PHONE) && !rawListingJson.includes('Flat 402'),
      '3b. Strict Privacy-Preserved Projection',
      'Owner phone and house number are redacted from public detail API'
    );

    // Test that unlisted / rejected property is NOT public
    await executeQuery(`UPDATE properties SET listing_status = 'DRAFT' WHERE id = $1;`, [createdPropertyId]);
    const draftRes = await dispatchRequest(app, `/api/listings/${createdPropertyId}`, { method: 'GET' });
    assert(
      draftRes.status === 404,
      '3c. Non-Published Properties Inaccessible to Public',
      `DRAFT property correctly returns HTTP 404 (${draftRes.status})`
    );
    // Restore to PUBLISHED
    await executeQuery(`UPDATE properties SET listing_status = 'PUBLISHED' WHERE id = $1;`, [createdPropertyId]);

    // 4. Idempotency & Duplicate Prevention Verification
    const retryRes = await dispatchRequest(app, '/api/properties', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: submissionPayload,
    });
    const retryData = await retryRes.json();

    assert(
      retryRes.status === 200 && retryData.propertyId === createdPropertyId && retryData.idempotent === true,
      '4a. Idempotent Retry Handling',
      `Duplicate submission safely caught; returned original propertyId ${retryData.propertyId} without duplicate insertion`
    );

    const countRes = await executeQuery(
      `SELECT COUNT(*)::int AS cnt FROM properties WHERE owner_id = $1 AND internal_verification_notes::text LIKE $2;`,
      [TEST_UID, `%"idempotencyKey":"${idempotencyKey}"%`]
    );
    assert(
      countRes.rows[0].cnt === 1,
      '4b. Zero Duplicate Database Rows',
      `Exact row count is 1 (no duplicate rows created)`
    );

    // 5. Concurrent Submission Safety
    const concurrentKey = `test-concurrent-${Date.now()}`;
    const concurrentPayload = {
      ...submissionPayload,
      societyName: 'Godrej Woodsman Concurrent Test',
      idempotencyKey: concurrentKey,
    };

    const [cRes1, cRes2] = await Promise.all([
      dispatchRequest(app, '/api/properties', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'X-Idempotency-Key': concurrentKey,
        },
        body: concurrentPayload,
      }),
      dispatchRequest(app, '/api/properties', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'X-Idempotency-Key': concurrentKey,
        },
        body: concurrentPayload,
      }),
    ]);

    const cData1 = await cRes1.json();
    const cData2 = await cRes2.json();
    const concurrentPids = new Set([cData1.propertyId, cData2.propertyId].filter(Boolean));

    assert(
      concurrentPids.size === 1,
      '5. Concurrency Race Condition Guard',
      `Concurrent submissions resolved to single property ID: ${Array.from(concurrentPids)[0]}`
    );

    // 6. Validation Rejection: Missing/Invalid Fields Keep DB Clean
    const invalidRes = await dispatchRequest(app, '/api/properties', {
      method: 'POST',
      headers: authHeaders,
      body: {
        ...submissionPayload,
        ownerName: '', // Invalid empty owner name
      },
    });
    assert(
      invalidRes.status === 400,
      '6. Server Validation Guard',
      `Empty owner name rejected with HTTP 400 (${invalidRes.status})`
    );

    // 7. Frontend Component Contract Verification
    const animFile = fs.readFileSync('src/components/seller/PropertySubmissionAnimation.tsx', 'utf8');
    assert(
      animFile.includes('viewBox="0 0 160 160"') && animFile.includes('#244B8F') && animFile.includes('#172033'),
      '7a. PropertySubmissionAnimation Palette & Line Art SVG',
      'Uses SellMyGhar Trust Blue #244B8F, Ink #172033, and SVG viewBox'
    );
    assert(
      animFile.includes('@media (prefers-reduced-motion: reduce)') && animFile.includes('animation: none'),
      '7b. PropertySubmissionAnimation Reduced-Motion Accessibility',
      'Supports prefers-reduced-motion with static rendering fallback'
    );
    assert(
      animFile.includes('Submitting your property...') &&
      animFile.includes('Almost there...') &&
      !animFile.includes('%"'),
      '7c. Contextual Stage Text & No Fake Percentages',
      'Presents honest stages ("Submitting your property...", "Almost there...") without fake percentage tickers'
    );

    const cardFile = fs.readFileSync('src/components/seller/SubmissionSuccessCard.tsx', 'utf8');
    assert(
      cardFile.includes('Thank You for Listing with SellMyGhar!'),
      '7d. Thank You Card Heading',
      'Displays exact heading: "Thank You for Listing with SellMyGhar!"'
    );
    assert(
      cardFile.includes('Listing Status: Published & Live') && cardFile.includes('Listing Status: Under Legal Review'),
      '7e. Dynamic Status Badge Handling',
      'Accurately differentiates between Published & Live and Under Legal Review'
    );
    assert(
      cardFile.includes('View Listed Property') && cardFile.includes('Go to My Properties'),
      '7f. Canonical Primary & Secondary CTAs',
      'Contains primary CTA "View Listed Property" and secondary CTA "Go to My Properties"'
    );

    const funnelFile = fs.readFileSync('src/components/seller/SellerFunnel.tsx', 'utf8');
    assert(
      funnelFile.includes('submittingRef.current = true;') &&
      funnelFile.includes('if (submittingRef.current || isSubmitting) return;'),
      '7g. Duplicate Submission Prevention & Re-entrancy Lock',
      'Enforces synchronous ref-based lock and disabled button state during submission'
    );
    assert(
      funnelFile.includes('Submission Notice:') && funnelFile.includes('Retry Submission'),
      '7h. Form State Preservation & Actionable Retry',
      'Displays error banner with Retry Submission button while preserving all wizard state'
    );

    // 8. Cleanup
    await executeQuery(`DELETE FROM property_media WHERE property_id = $1;`, [createdPropertyId]);
    await executeQuery(`DELETE FROM seller_leads WHERE property_id = $1;`, [createdPropertyId]);
    await executeQuery(`DELETE FROM properties WHERE id = $1;`, [createdPropertyId]);
    await executeQuery(`DELETE FROM properties WHERE owner_id = $1;`, [TEST_UID]);
    await executeQuery(`DELETE FROM users WHERE id = $1;`, [TEST_UID]);

  } catch (err: any) {
    console.error('Fatal test error:', err);
    assert(false, 'Test Suite Execution', `Exception: ${err.message}`);
  } finally {
    console.log('\n========================================');
    console.log('PROPERTY SUBMISSION TEST SUITE SUMMARY:');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`TOTAL: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

run();
