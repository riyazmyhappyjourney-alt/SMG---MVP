import http from 'http';
import { Socket } from 'net';
import { app, initSchemaColumns } from '../server';
import { executeQuery } from '../src/server/db/pool';
import { signSessionToken } from '../src/server/auth/tokens';
import { AuthenticatedUser } from '../src/core/types/auth';

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
          } catch {
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

export async function runCrmPropertyManagementTests(): Promise<{ passed: number; failed: number; results: string[] }> {
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

  // Generate tokens for test roles
  const staffListingMgr: AuthenticatedUser = {
    uid: 'usr-staff-listing-mgr-01',
    phone: '+919800000010',
    email: 'manager@sellmyghar.in',
    roles: ['STAFF_LISTING_MANAGER'],
    permissions: ['properties:create', 'properties:read_details_all', 'listings:draft', 'listings:publish_approve', 'listings:archive'],
  };
  const staffToken = await signSessionToken(staffListingMgr);

  const customerUser: AuthenticatedUser = {
    uid: 'usr-customer-test-01',
    phone: '+919845012399',
    email: 'buyer@example.com',
    roles: ['BUYER'],
    permissions: [],
  };
  const customerToken = await signSessionToken(customerUser);

  try {
    // -------------------------------------------------------------
    // TEST 1: Property creation persists to DB in DRAFT status
    // -------------------------------------------------------------
    const createRes = await dispatchRequest(app, '/api/crm/properties', {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        title: 'Brigade Horizon - 3BHK Corner Unit',
        projectName: 'Brigade Horizon',
        locality: 'Kambipura, Mysore Road',
        propertyType: 'Apartment',
        bhkType: '3BHK',
        superBuiltUpSqft: 1540,
        carpetAreaSqft: 1200,
        askingPriceInr: 12500000,
        monthlyMaintenanceInr: 4500,
        facing: 'EAST',
        floorBand: 'Floor 7 of 14',
        publicAddress: 'Brigade Horizon, Mysore Road, Bengaluru',
        description: '', // Intentionally empty to test publish validation
        amenities: ['Clubhouse', 'Swimming Pool', '24/7 Security'],
        developerName: 'Brigade Group',
      },
    });

    const createJson = await createRes.json();
    assert(createRes.status === 201 && createJson.success, 'TEST 1: Property creation succeeds via POST /api/crm/properties');
    const createdPropId = createJson?.property?.id;
    assert(Boolean(createdPropId), 'TEST 1b: Property ID is returned upon creation');

    // -------------------------------------------------------------
    // TEST 2: Draft state verification
    // -------------------------------------------------------------
    const dbPropRes = await executeQuery(`SELECT id, listing_status, title FROM properties WHERE id = $1;`, [createdPropId]);
    assert(dbPropRes.rows.length > 0 && dbPropRes.rows[0].listing_status === 'DRAFT', 'TEST 2: Created property persists in PostgreSQL with status DRAFT');

    // -------------------------------------------------------------
    // TEST 3: Property editing via PUT /api/crm/properties/:id
    // -------------------------------------------------------------
    const updateRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        title: 'Brigade Horizon - Premium 3BHK Corner Garden View',
        description: 'Vastu compliant, 3 balconies overlooking landscaped lawns. Modular kitchen installed.',
        askingPriceInr: 12800000,
        superBuiltUpSqft: 1540,
        carpetAreaSqft: 1200,
      },
    });
    const updateJson = await updateRes.json();
    assert(updateRes.status === 200 && updateJson.success, 'TEST 3: Property editing succeeds via PUT /api/crm/properties/:id');

    // -------------------------------------------------------------
    // TEST 4: Publish validation failure (Missing primary image)
    // -------------------------------------------------------------
    const publishFailRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/publish`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    const publishFailJson = await publishFailRes.json();
    assert(
      publishFailRes.status === 422 &&
      publishFailJson.error === 'PUBLISH_VALIDATION_FAILED' &&
      Array.isArray(publishFailJson.missingFields) &&
      publishFailJson.missingFields.includes('primary_image'),
      'TEST 4: Publish rejected with 422 and missingFields when primary image is absent'
    );

    // -------------------------------------------------------------
    // TEST 5: Image addition via POST /api/crm/properties/:id/images
    // -------------------------------------------------------------
    const addImageRes1 = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        isFeatured: true,
      },
    });
    const addImageJson1 = await addImageRes1.json();
    assert(addImageRes1.status === 201 && addImageJson1.success, 'TEST 5: Image addition succeeds via POST /api/crm/properties/:id/images');
    const imageId1 = addImageJson1?.media?.id;

    // Add secondary image
    const addImageRes2 = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        isFeatured: false,
      },
    });
    const addImageJson2 = await addImageRes2.json();
    const imageId2 = addImageJson2?.media?.id;

    // -------------------------------------------------------------
    // TEST 6: Primary image mutation via POST /api/crm/properties/:id/images/:imageId/primary
    // -------------------------------------------------------------
    const setPrimaryRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images/${imageId2}/primary`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    const setPrimaryJson = await setPrimaryRes.json();
    assert(setPrimaryRes.status === 200 && setPrimaryJson.success, 'TEST 6: Primary image mutation succeeds and updates featured flag');

    // -------------------------------------------------------------
    // TEST 7: Successful publish (DRAFT -> PUBLISHED)
    // -------------------------------------------------------------
    const publishSuccessRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/publish`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    const publishSuccessJson = await publishSuccessRes.json();
    assert(
      publishSuccessRes.status === 200 &&
      publishSuccessJson.success &&
      publishSuccessJson?.property?.listing_status === 'PUBLISHED',
      'TEST 7: Successful publish succeeds and transitions status to PUBLISHED'
    );

    // -------------------------------------------------------------
    // TEST 8: Public visibility of PUBLISHED property
    // -------------------------------------------------------------
    const publicDetailRes = await dispatchRequest(app, `/api/listings/${createdPropId}`);
    const publicDetailJson = await publicDetailRes.json();
    assert(
      publicDetailRes.status === 200 &&
      publicDetailJson.success &&
      publicDetailJson?.listing?.projectName === 'Brigade Horizon',
      'TEST 8: Published property is immediately visible on GET /api/listings/:id'
    );

    const publicListingsRes = await dispatchRequest(app, '/api/listings');
    const publicListingsJson = await publicListingsRes.json();
    const foundInList = (publicListingsJson.listings || []).some((l: any) => l.id === createdPropId);
    assert(foundInList, 'TEST 8b: Published property appears in public inventory GET /api/listings');

    // -------------------------------------------------------------
    // TEST 9: Public privacy projection (Strict sanitization)
    // -------------------------------------------------------------
    const rawPublicBody = publicDetailRes.body;
    const pubListing = publicDetailJson?.listing || {};
    const privacyGuarantees = [
      !('owner_phone' in pubListing),
      !('ownerPhone' in pubListing),
      !('owner_email' in pubListing),
      !('ownerEmail' in pubListing),
      !('unit_number' in pubListing),
      !('unitNumber' in pubListing),
      !('reserve_minimum_price_inr' in pubListing),
      !rawPublicBody.includes('+919800000010'),
    ];
    assert(privacyGuarantees.every(Boolean), 'TEST 9: Public listing projection strictly hides owner contact, unit number, and reserve price');

    // -------------------------------------------------------------
    // TEST 10: CRM -> public API synchronization
    // -------------------------------------------------------------
    await dispatchRequest(app, `/api/crm/properties/${createdPropId}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        title: 'Brigade Horizon - Synchronized Price Update',
        askingPriceInr: 13200000,
      },
    });

    const syncCheckRes = await dispatchRequest(app, `/api/listings/${createdPropId}`);
    const syncCheckJson = await syncCheckRes.json();
    assert(
      syncCheckJson?.listing?.askingPriceInr === 13200000,
      'TEST 10: CRM property modifications synchronously reflect in GET /api/listings/:id'
    );

    // -------------------------------------------------------------
    // TEST 11: Pause transition (PUBLISHED -> PAUSED)
    // -------------------------------------------------------------
    const pauseRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/pause`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    const pauseJson = await pauseRes.json();
    assert(
      pauseRes.status === 200 &&
      pauseJson.success &&
      pauseJson?.property?.listing_status === 'PAUSED',
      'TEST 11: Pause transition succeeds (status PAUSED)'
    );

    // -------------------------------------------------------------
    // TEST 12: Paused property public invisibility (404 rejection)
    // -------------------------------------------------------------
    const pausedPublicRes = await dispatchRequest(app, `/api/listings/${createdPropId}`);
    assert(pausedPublicRes.status === 404, 'TEST 12: Paused property rejected with 404 on public detail route');

    const pausedListRes = await dispatchRequest(app, '/api/listings');
    const pausedListJson = await pausedListRes.json();
    const foundInPausedList = (pausedListJson.listings || []).some((l: any) => l.id === createdPropId);
    assert(!foundInPausedList, 'TEST 12b: Paused property omitted from public inventory list');

    // -------------------------------------------------------------
    // TEST 13: Republish from PAUSED (PAUSED -> PUBLISHED)
    // -------------------------------------------------------------
    const republishRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/publish`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    const republishJson = await republishRes.json();
    assert(
      republishRes.status === 200 &&
      republishJson.success &&
      republishJson?.property?.listing_status === 'PUBLISHED',
      'TEST 13: Republishing succeeds and transitions PAUSED -> PUBLISHED'
    );

    // -------------------------------------------------------------
    // TEST 14: Sold transition (PUBLISHED -> SOLD)
    // -------------------------------------------------------------
    const soldRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/sold`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    const soldJson = await soldRes.json();
    assert(
      soldRes.status === 200 &&
      soldJson.success &&
      soldJson?.property?.listing_status === 'SOLD',
      'TEST 14: Sold transition succeeds (status SOLD)'
    );

    // -------------------------------------------------------------
    // TEST 15: Sold property public invisibility (404 rejection)
    // -------------------------------------------------------------
    const soldPublicRes = await dispatchRequest(app, `/api/listings/${createdPropId}`);
    assert(soldPublicRes.status === 404, 'TEST 15: Sold property rejected with 404 on public detail route');

    // -------------------------------------------------------------
    // TEST 16: Sold property enquiry rejection (HTTP 400 PROPERTY_SOLD)
    // -------------------------------------------------------------
    const soldEnquiryRes = await dispatchRequest(app, '/api/leads', {
      method: 'POST',
      body: {
        fullName: 'Prospective Buyer',
        phone: '9845011223',
        intent: 'BUY',
        propertyId: createdPropId,
        societyName: 'Brigade Horizon',
        notes: 'Checking availability',
      },
    });
    const soldEnquiryJson = await soldEnquiryRes.json();
    assert(
      soldEnquiryRes.status === 400 &&
      soldEnquiryJson.error === 'PROPERTY_SOLD',
      'TEST 16: New buyer enquiry for SOLD property is rejected with 400 PROPERTY_SOLD'
    );

    // -------------------------------------------------------------
    // TEST 17: Archive transition (SOLD -> ARCHIVED)
    // -------------------------------------------------------------
    const archiveRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/archive`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    const archiveJson = await archiveRes.json();
    assert(
      archiveRes.status === 200 &&
      archiveJson.success &&
      archiveJson?.property?.listing_status === 'ARCHIVED',
      'TEST 17: Archive transition succeeds (status ARCHIVED)'
    );

    // -------------------------------------------------------------
    // TEST 18: Archive property public invisibility (404 rejection)
    // -------------------------------------------------------------
    const archivePublicRes = await dispatchRequest(app, `/api/listings/${createdPropId}`);
    assert(archivePublicRes.status === 404, 'TEST 18: Archived property rejected with 404 on public detail route');

    // -------------------------------------------------------------
    // TEST 19: Draft to Archive transition (DRAFT -> ARCHIVED)
    // -------------------------------------------------------------
    const draft2Res = await dispatchRequest(app, '/api/crm/properties', {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        title: 'Draft Property To Archive',
        projectName: 'Prestige Sanctuary',
        locality: 'Nandi Hills',
        askingPriceInr: 45000000,
        superBuiltUpSqft: 4000,
      },
    });
    const draft2Json = await draft2Res.json();
    const draft2Id = draft2Json?.property?.id;

    const draftArchiveRes = await dispatchRequest(app, `/api/crm/properties/${draft2Id}/archive`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    assert(draftArchiveRes.status === 200, 'TEST 19: DRAFT -> ARCHIVED transition directly succeeds');

    // -------------------------------------------------------------
    // TEST 20: Property activity logging
    // -------------------------------------------------------------
    const activityRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/activity`, {
      method: 'GET',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    const activityJson = await activityRes.json();
    assert(activityRes.status === 200 && Array.isArray(activityJson.activity), 'TEST 20: Property activity timeline is retrieved');
    const loggedActions = (activityJson.activity || []).map((a: any) => a.action);
    const hasAuditLifecycle =
      loggedActions.includes('PROPERTY_CREATED') &&
      loggedActions.includes('PROPERTY_PUBLISHED') &&
      loggedActions.includes('PROPERTY_PAUSED') &&
      loggedActions.includes('PROPERTY_SOLD') &&
      loggedActions.includes('IMAGE_ADDED');
    assert(hasAuditLifecycle, 'TEST 20b: Audit log records complete lifecycle: CREATED, PUBLISHED, PAUSED, SOLD, IMAGE_ADDED');

    // -------------------------------------------------------------
    // TEST 21: Unauthorized property mutation (401 unauthenticated)
    // -------------------------------------------------------------
    const unauthRes = await dispatchRequest(app, '/api/crm/properties', {
      method: 'POST',
      body: { title: 'Hacked Property' },
    });
    assert(unauthRes.status === 401, 'TEST 21: Unauthenticated property mutation rejected with 401 UNAUTHORIZED');

    // -------------------------------------------------------------
    // TEST 22: RBAC authorization (403 forbidden for non-staff)
    // -------------------------------------------------------------
    const rbacRes = await dispatchRequest(app, '/api/crm/properties', {
      method: 'POST',
      headers: { authorization: `Bearer ${customerToken}` },
      body: { title: 'Customer attempting staff action' },
    });
    assert(rbacRes.status === 403, 'TEST 22: Non-staff customer attempting CRM property mutation rejected with 403 FORBIDDEN');

    // -------------------------------------------------------------
    // TEST 23: Image removal via DELETE /api/crm/properties/:id/images/:imageId
    // -------------------------------------------------------------
    const deleteImgRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images/${imageId1}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    assert(deleteImgRes.status === 200, 'TEST 23: Image removal succeeds and audits IMAGE_REMOVED');

  } catch (err: any) {
    results.push(`[FATAL] Unhandled test exception: ${err.message}`);
    failed++;
  }

  return { passed, failed, results };
}
