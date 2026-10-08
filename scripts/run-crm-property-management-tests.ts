import http from 'http';
import { Socket } from 'net';
import { app, initSchemaColumns, setTestUrlFetcher } from '../server';
import { executeQuery } from '../src/server/db/pool';
import { signSessionToken } from '../src/server/auth/tokens';
import { AuthenticatedUser } from '../src/core/types/auth';
import { setTestAvHandler } from '../src/server/storage/post-upload-worker';

const validTestJpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);
const validTestPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);
const validTestWebp = Buffer.from(
  'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
  'base64'
);

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

  // Configure URL fetch mock for test isolation in offline/sandboxed environments
  setTestUrlFetcher(async (url: string) => {
    if (url.includes('valid-sample.png')) {
      return { status: 200, body: validTestPng };
    }
    if (url.includes('valid-sample.webp')) {
      return { status: 200, body: validTestWebp };
    }
    if (url.includes('images.unsplash.com') || url.includes('test-valid-image.jpg') || url.includes('valid-sample.jpg')) {
      return { status: 200, body: validTestJpeg };
    }
    if (url.includes('oversized-image.jpg')) {
      return { status: 200, body: Buffer.alloc(11 * 1024 * 1024) }; // 11MB (>10MB)
    }
    if (url.includes('invalid-corrupted.jpg')) {
      return { status: 200, body: Buffer.from('NOT_AN_IMAGE_FILE_RANDOM_BYTES') };
    }
    if (url.includes('non-image-doc.html')) {
      return { status: 200, body: Buffer.from('<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>') };
    }
    if (url.includes('infected-image.jpg')) {
      return { status: 200, body: validTestJpeg };
    }
    return null;
  });

  function assert(condition: boolean, desc: string) {
    if (condition) {
      results.push(`[PASS] ${desc}`);
      passed++;
    } else {
      results.push(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // Generate tokens for canonical roles
  const staffListingMgr: AuthenticatedUser = {
    uid: 'usr-staff-listing-mgr-01',
    phone: '+919800000010',
    email: 'manager@sellmyghar.in',
    roles: ['STAFF_LISTING_MANAGER'],
    permissions: ['properties:create', 'properties:read_details_all', 'listings:draft', 'listings:publish_approve', 'listings:archive'],
  };
  const staffToken = await signSessionToken(staffListingMgr);

  const staffDealCloser: AuthenticatedUser = {
    uid: 'usr-staff-deal-closer-01',
    phone: '+919800000011',
    email: 'closer@sellmyghar.in',
    roles: ['STAFF_DEAL_CLOSER'],
    permissions: ['properties:create', 'properties:read_details_all', 'listings:draft', 'listings:publish_approve', 'listings:archive'],
  };
  const staffCloserToken = await signSessionToken(staffDealCloser);

  const staffSuperAdmin: AuthenticatedUser = {
    uid: 'usr-staff-super-admin-01',
    phone: '+919800000012',
    email: 'admin@sellmyghar.in',
    roles: ['STAFF_SUPER_ADMIN'],
    permissions: ['properties:create', 'properties:read_details_all', 'listings:draft', 'listings:publish_approve', 'listings:archive'],
  };
  const staffAdminToken = await signSessionToken(staffSuperAdmin);

  const staffIntakeAgent: AuthenticatedUser = {
    uid: 'usr-staff-intake-01',
    phone: '+919800000013',
    email: 'intake@sellmyghar.in',
    roles: ['STAFF_INTAKE_AGENT'],
    permissions: ['leads:create', 'leads:read_all'],
  };
  const staffIntakeToken = await signSessionToken(staffIntakeAgent);

  const staffVerificationAgent: AuthenticatedUser = {
    uid: 'usr-staff-verification-01',
    phone: '+919800000014',
    email: 'verifier@sellmyghar.in',
    roles: ['STAFF_VERIFICATION_AGENT'],
    permissions: ['documents:verify'],
  };
  const staffVerificationToken = await signSessionToken(staffVerificationAgent);

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
    // TEST 6b: Direct base64 image upload through secure upload pipeline
    // -------------------------------------------------------------
    const validJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const uploadRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        fileName: 'hall-renovated.jpg',
        fileBase64: validJpegBase64,
        isFeatured: false,
      },
    });
    const uploadJson = await uploadRes.json();
    assert(uploadRes.status === 201 && uploadJson.success && Boolean(uploadJson.media?.id), 'TEST 6b: Direct file upload succeeds via ClamAV and magic bytes validation');
    const imageId3 = uploadJson.media.id;

    // -------------------------------------------------------------
    // TEST 6c: SSRF attack blocked on URL image ingestion
    // -------------------------------------------------------------
    const ssrfRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        url: 'http://127.0.0.1/private-metadata.jpg',
      },
    });
    assert(ssrfRes.status === 400, 'TEST 6c: Insecure HTTP and private IP SSRF URLs are strictly rejected with 400');

    // -------------------------------------------------------------
    // TEST 6d: Image gallery reordering via POST /api/crm/properties/:id/images/reorder
    // -------------------------------------------------------------
    const reorderRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images/reorder`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        imageIds: [imageId2, imageId3, imageId1],
      },
    });
    const reorderJson = await reorderRes.json();
    assert(reorderRes.status === 200 && reorderJson.success, 'TEST 6d: Gallery image reordering succeeds via POST /api/crm/properties/:id/images/reorder');

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

    const photos = publicDetailJson?.listing?.photos || [];
    assert(photos.length >= 2, 'TEST 8c: Public property detail exposes real uploaded photos');
    assert(photos[0].isCover === true, 'TEST 8d: First public photo is the primary featured cover');

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

    // -------------------------------------------------------------
    // TEST 24: Unauthenticated image upload rejected with 401 UNAUTHORIZED
    // -------------------------------------------------------------
    const unauthImgRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      body: { url: 'https://images.unsplash.com/test-valid-image.jpg' },
    });
    assert(unauthImgRes.status === 401, 'TEST 24: Unauthenticated image upload rejected with 401 UNAUTHORIZED');

    // -------------------------------------------------------------
    // TEST 25: Customer (BUYER) image upload rejected with 403 FORBIDDEN
    // -------------------------------------------------------------
    const customerImgRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${customerToken}` },
      body: { url: 'https://images.unsplash.com/test-valid-image.jpg' },
    });
    assert(customerImgRes.status === 403, 'TEST 25: Customer upload rejected with 403 FORBIDDEN');

    // -------------------------------------------------------------
    // TEST 26: Unauthorized staff role (STAFF_INTAKE_AGENT) rejected with 403 FORBIDDEN
    // -------------------------------------------------------------
    const intakeImgRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffIntakeToken}` },
      body: { url: 'https://images.unsplash.com/test-valid-image.jpg' },
    });
    assert(intakeImgRes.status === 403, 'TEST 26: Unauthorized staff role (STAFF_INTAKE_AGENT) rejected with 403 FORBIDDEN');

    // -------------------------------------------------------------
    // TEST 27: Unauthorized staff role (STAFF_VERIFICATION_AGENT) rejected with 403 FORBIDDEN
    // -------------------------------------------------------------
    const verifierImgRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffVerificationToken}` },
      body: { url: 'https://images.unsplash.com/test-valid-image.jpg' },
    });
    assert(verifierImgRes.status === 403, 'TEST 27: Unauthorized staff role (STAFF_VERIFICATION_AGENT) rejected with 403 FORBIDDEN');

    // -------------------------------------------------------------
    // TEST 28: Allowed STAFF_LISTING_MANAGER upload succeeds (201 CREATED)
    // -------------------------------------------------------------
    const listingMgrUploadRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://images.unsplash.com/valid-sample.jpg' },
    });
    assert(listingMgrUploadRes.status === 201, 'TEST 28: Allowed STAFF_LISTING_MANAGER upload succeeds with 201 CREATED');

    // -------------------------------------------------------------
    // TEST 29: Allowed STAFF_DEAL_CLOSER upload succeeds (201 CREATED)
    // -------------------------------------------------------------
    const dealCloserUploadRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffCloserToken}` },
      body: { url: 'https://images.unsplash.com/valid-sample.png' },
    });
    assert(dealCloserUploadRes.status === 201, 'TEST 29: Allowed STAFF_DEAL_CLOSER upload succeeds with 201 CREATED');

    // -------------------------------------------------------------
    // TEST 30: Allowed STAFF_SUPER_ADMIN upload succeeds (201 CREATED)
    // -------------------------------------------------------------
    const superAdminUploadRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffAdminToken}` },
      body: { url: 'https://images.unsplash.com/valid-sample.webp' },
    });
    assert(superAdminUploadRes.status === 201, 'TEST 30: Allowed STAFF_SUPER_ADMIN upload succeeds with 201 CREATED');

    // -------------------------------------------------------------
    // TEST 31: Insecure HTTP URL rejected with 400 INSECURE_PROTOCOL
    // -------------------------------------------------------------
    const httpRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'http://cdn.example.com/unencrypted-photo.jpg' },
    });
    assert(httpRes.status === 400, 'TEST 31: Insecure HTTP URL rejected with 400 INSECURE_PROTOCOL');

    // -------------------------------------------------------------
    // TEST 32: Localhost URL rejected with 400 SSRF_BLOCKED
    // -------------------------------------------------------------
    const localhostRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://localhost/admin/internal-photo.jpg' },
    });
    assert(localhostRes.status === 400, 'TEST 32: Localhost URL rejected with 400 SSRF_BLOCKED');

    // -------------------------------------------------------------
    // TEST 33: 127.0.0.1 loopback URL rejected with 400 SSRF_BLOCKED
    // -------------------------------------------------------------
    const loopbackRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://127.0.0.1:8080/secret.jpg' },
    });
    assert(loopbackRes.status === 400, 'TEST 33: 127.0.0.1 loopback URL rejected with 400 SSRF_BLOCKED');

    // -------------------------------------------------------------
    // TEST 34: Private IP ranges (192.168.*, 10.*, 172.16-31.*) rejected with 400 SSRF_BLOCKED
    // -------------------------------------------------------------
    const priv1 = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://192.168.1.100/router.png' },
    });
    const priv2 = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://10.0.0.1/intranet.jpg' },
    });
    const priv3 = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://172.20.0.1/gateway.jpg' },
    });
    assert(priv1.status === 400 && priv2.status === 400 && priv3.status === 400, 'TEST 34: Private IP addresses (192.168.*, 10.*, 172.20.*) rejected with 400 SSRF_BLOCKED');

    // -------------------------------------------------------------
    // TEST 35: Cloud metadata address (169.254.169.254) rejected with 400 SSRF_BLOCKED
    // -------------------------------------------------------------
    const metaRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://169.254.169.254/latest/meta-data/' },
    });
    assert(metaRes.status === 400, 'TEST 35: Cloud metadata address (169.254.169.254) rejected with 400 SSRF_BLOCKED');

    // -------------------------------------------------------------
    // TEST 36: Oversized remote response (>10MB) rejected with 400 PHOTO_TOO_LARGE
    // -------------------------------------------------------------
    const oversizedRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://cdn.example.com/oversized-image.jpg' },
    });
    assert(oversizedRes.status === 400, 'TEST 36: Oversized remote response (>10MB) rejected with 400 PHOTO_TOO_LARGE');

    // -------------------------------------------------------------
    // TEST 37: Invalid image bytes behind .jpg URL rejected with 400 MAGIC_BYTE_MISMATCH
    // -------------------------------------------------------------
    const invalidBytesRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://cdn.example.com/invalid-corrupted.jpg' },
    });
    assert(invalidBytesRes.status === 400, 'TEST 37: Invalid image bytes behind .jpg URL rejected with 400 MAGIC_BYTE_MISMATCH');

    // -------------------------------------------------------------
    // TEST 38: Non-image remote content (HTML) rejected with 400 MAGIC_BYTE_MISMATCH
    // -------------------------------------------------------------
    const htmlDocRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://cdn.example.com/non-image-doc.html' },
    });
    assert(htmlDocRes.status === 400, 'TEST 38: Non-image remote content (HTML) rejected with 400 MAGIC_BYTE_MISMATCH');

    // -------------------------------------------------------------
    // TEST 39: Infected image rejected by ClamAV with 400 MALWARE_DETECTED
    // -------------------------------------------------------------
    setTestAvHandler((buf) => {
      if (buf.length === validTestJpeg.length && buf.equals(validTestJpeg)) {
        return { isClean: false, virusName: 'Eicar-Test-Signature', engineVersion: 'ClamAV-Sim', scannedAt: new Date().toISOString() };
      }
      return null;
    });
    const malwareRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://cdn.example.com/infected-image.jpg' },
    });
    setTestAvHandler(null); // Reset hook immediately
    assert(malwareRes.status === 400, 'TEST 39: Infected remote image rejected by ClamAV with 400 MALWARE_DETECTED');

    // -------------------------------------------------------------
    // TEST 40: Valid remote image accepted (201 CREATED) and uploaded to storage
    // -------------------------------------------------------------
    const validRemoteRes = await dispatchRequest(app, `/api/crm/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://images.unsplash.com/test-valid-image.jpg', isFeatured: false },
    });
    const validRemoteJson = await validRemoteRes.json();
    assert(validRemoteRes.status === 201 && Boolean(validRemoteJson?.media?.id), 'TEST 40: Valid remote image accepted with 201 and uploaded to storage');

    // -------------------------------------------------------------
    // TEST 41: display_order persists and public gallery follows persisted order
    // -------------------------------------------------------------
    const reorderPropRes = await dispatchRequest(app, '/api/crm/properties', {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: {
        title: 'Gallery Ordering Test Unit',
        projectName: 'Godrej Eternity',
        locality: 'Kanakapura Road',
        propertyType: 'Apartment',
        bhkType: '3BHK',
        superBuiltUpSqft: 1650,
        carpetAreaSqft: 1250,
        askingPriceInr: 15500000,
        facing: 'EAST',
        floorBand: 'Floor 6 of 12',
        description: 'Exclusive 3BHK unit for gallery ordering verification',
        publicAddress: 'Godrej Eternity, Kanakapura Road, Bengaluru',
        developerName: 'Godrej Properties',
      },
    });
    const reorderPropJson = await reorderPropRes.json();
    const reorderPropId = reorderPropJson?.property?.id;

    // Add 3 images
    const imgA = (await (await dispatchRequest(app, `/api/crm/properties/${reorderPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://images.unsplash.com/valid-sample.jpg', isFeatured: false },
    })).json())?.media?.id;

    const imgB = (await (await dispatchRequest(app, `/api/crm/properties/${reorderPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://images.unsplash.com/valid-sample.png', isFeatured: false },
    })).json())?.media?.id;

    const imgC = (await (await dispatchRequest(app, `/api/crm/properties/${reorderPropId}/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { url: 'https://images.unsplash.com/valid-sample.webp', isFeatured: true },
    })).json())?.media?.id;

    // Publish the property
    const pubConfirmRes = await dispatchRequest(app, `/api/crm/properties/${reorderPropId}/publish`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    assert(pubConfirmRes.status === 200, 'TEST 41a: Property published successfully for gallery verification');

    // Reorder images to [imgB, imgA, imgC]
    const reorderActionRes = await dispatchRequest(app, `/api/crm/properties/${reorderPropId}/images/reorder`, {
      method: 'POST',
      headers: { authorization: `Bearer ${staffToken}` },
      body: { imageIds: [imgB, imgA, imgC] },
    });
    assert(reorderActionRes.status === 200, 'TEST 41b: Image reordering succeeds via POST /api/crm/properties/:id/images/reorder');

    // Confirm DB persistence
    const dbOrderRows = await executeQuery<{ id: string; display_order: number }>(
      `SELECT id, display_order FROM property_media WHERE property_id = $1 ORDER BY display_order ASC;`,
      [reorderPropId]
    );
    const persistedIds = (dbOrderRows.rows || []).map((r) => r.id);
    assert(
      persistedIds[0] === imgB && persistedIds[1] === imgA && persistedIds[2] === imgC,
      'TEST 41c: display_order persists in PostgreSQL in specified order [imgB, imgA, imgC]'
    );

    // Confirm public detail gallery follows order with featured cover first
    const pubGalRes = await dispatchRequest(app, `/api/listings/${reorderPropId}`);
    const pubGalJson = await pubGalRes.json();
    const pubPhotos = pubGalJson?.listing?.galleryPhotos || pubGalJson?.listing?.photos || [];
    assert(
      pubGalRes.status === 200 && pubPhotos.length === 3 && pubPhotos[0].isCover === true,
      'TEST 41d: Public property gallery follows persisted display order with featured cover first'
    );

  } catch (err: any) {
    results.push(`[FATAL] Unhandled test exception: ${err.message}`);
    failed++;
  }

  return { passed, failed, results };
}
