import { app } from '../server';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';
import { setTestQueryHandler } from '../src/server/db/pool';
import { getLastDevOtp } from '../src/server/notifications/sms-provider';
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

export async function runPropertySubmissionFixTests() {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      results.push(`[PASS] ${desc}`);
      passed++;
    } else {
      results.push(`[FAIL] ${desc}`);
      failed++;
    }
  }

  console.log('--- 22. Seller Property Submission & Database Transaction Fix Suite ---');

  const testPhone = '+919876500111';
  const cleanPhone = '9876500111';
  const ownerName = 'Sunil Narang';

  // Verify feature flag guard when disabled
  delete process.env.CUSTOMER_MOBILE_LOGIN_ENABLED;
  const flagDisabledRes = await dispatchRequest(app, '/api/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { phone: cleanPhone }
  });
  const flagDisabledData = await flagDisabledRes.json();
  assert(
    flagDisabledRes.status === 403 && flagDisabledData.error === 'CUSTOMER_MOBILE_LOGIN_DISABLED',
    'Customer OTP request is rejected with 403 when CUSTOMER_MOBILE_LOGIN_ENABLED is unset'
  );

  // Enable flag for testing preserved seller submission flow
  process.env.CUSTOMER_MOBILE_LOGIN_ENABLED = 'true';

  // 1. Request OTP via /api/auth/otp/request
  const otpReqRes = await dispatchRequest(app, '/api/auth/otp/request', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Content-Type': 'application/json'
    },
    body: { phone: cleanPhone }
  });

  assert(otpReqRes.status === 200, 'OTP request succeeds with HTTP 200');
  const otpReqData = await otpReqRes.json();
  assert(otpReqData.success === true, 'OTP response indicates success');
  const devOtp = getLastDevOtp(testPhone) || otpReqData.devOtp;
  assert(typeof devOtp === 'string' && devOtp.length === 6, 'Dev OTP is a 6-digit code');

  // 2. Reject invalid OTP code
  const invalidOtpRes = await dispatchRequest(app, '/api/auth/otp/verify', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Content-Type': 'application/json'
    },
    body: {
      phone: testPhone,
      otp: '000000',
      name: ownerName
    }
  });

  assert(invalidOtpRes.status === 400, 'Invalid OTP code is rejected with HTTP 400');
  const invalidOtpData = await invalidOtpRes.json();
  assert(invalidOtpData.success === false, 'Invalid OTP response marks success as false');

  // 3. Verify valid OTP code
  const verifyRes = await dispatchRequest(app, '/api/auth/otp/verify', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Content-Type': 'application/json'
    },
    body: {
      phone: testPhone,
      otp: devOtp,
      name: ownerName
    }
  });

  assert(verifyRes.status === 200, 'Valid OTP verification succeeds with HTTP 200');
  const verifyData = await verifyRes.json();
  assert(verifyData.authenticated === true, 'Response marks user as authenticated');
  assert(verifyData.user && verifyData.user.phone === testPhone, 'Authenticated user phone matches');
  const setCookieHeader = verifyRes.headers['set-cookie'];
  assert(
    Boolean(setCookieHeader && String(setCookieHeader).includes('sellmyghar_session=')),
    'Verification sets HTTP-Only sellmyghar_session cookie'
  );

  let sessionCookie = '';
  let csrfToken = 'csrf-test-token-123';
  if (Array.isArray(setCookieHeader)) {
    const c = setCookieHeader.find((h: string) => h.includes('sellmyghar_session='));
    sessionCookie = c ? c.split(';')[0] : '';
    const csrfC = setCookieHeader.find((h: string) => h.includes('sellmyghar_csrf='));
    if (csrfC) {
      csrfToken = csrfC.split(';')[0].split('=')[1];
    }
  } else if (typeof setCookieHeader === 'string') {
    const matchSession = setCookieHeader.match(/sellmyghar_session=([^;]+)/);
    if (matchSession) sessionCookie = `sellmyghar_session=${matchSession[1]}`;
    const matchCsrf = setCookieHeader.match(/sellmyghar_csrf=([^;]+)/);
    if (matchCsrf) csrfToken = matchCsrf[1];
  }
  const fullCookie = `${sessionCookie}; sellmyghar_csrf=${csrfToken}`;

  // 4. Block cross-site mutating property submission via CSRF defense
  const crossSiteRes = await dispatchRequest(app, '/api/properties', {
    method: 'POST',
    headers: {
      'Sec-Fetch-Site': 'cross-site',
      'Origin': 'https://malicious-site.com',
      'Content-Type': 'application/json'
    },
    body: {
      intent: 'sell',
      ownerName,
      ownerPhone: cleanPhone,
      societyName: 'Godrej Woodsman Estate',
      locality: 'Hebbal',
      expectedPrice: 15000000
    }
  });

  assert(crossSiteRes.status === 403, 'Cross-site mutating property submission is blocked with HTTP 403');
  const crossSiteData = await crossSiteRes.json();
  assert(crossSiteData.error === 'CSRF_REJECTED', 'Error code specifies CSRF_REJECTED');

  // 5. Submit Property with verified session cookie and valid origin
  const validPropertyPayload = {
    intent: 'sell',
    listing_intent: 'SELL',
    propertyType: 'Residential',
    subType: 'Apartment',
    locality: 'Hebbal',
    subLocality: 'Hebbal Kempapura',
    societyName: 'Godrej Woodsman Estate',
    houseNo: 'Tower 4, Flat 1202',
    wingTower: 'Tower 4',
    bedrooms: 3,
    bathrooms: 3,
    balconies: 2,
    superBuiltUpSqft: 1850,
    carpetAreaSqft: 1443,
    furnishing: 'Semi-Furnished',
    floorNumber: 12,
    totalFloors: 16,
    facing: 'NORTH_EAST',
    propertyAge: '1 to 5 years',
    hasCoveredParking: true,
    parkingCount: 2,
    photos: ['https://sellmyghar.in/images/hebbal-sample.jpg'],
    videoUrl: '',
    expectedPrice: 16500000,
    isNegotiable: true,
    maintenanceCharges: 4500,
    bookingAmount: 100000,
    description: 'Corner 3BHK flat overlooking Hebbal Lake.',
    ownerName,
    ownerPhone: cleanPhone,
    ownerEmail: 'sunil.narang@example.com'
  };

  const propSubmitRes = await dispatchRequest(app, '/api/properties', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Cookie': fullCookie,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json'
    },
    body: validPropertyPayload
  });

  assert(propSubmitRes.status === 201, 'Property submission succeeds with HTTP 201 Created');
  const propSubmitData = await propSubmitRes.json();
  assert(propSubmitData.success === true, 'Property submission response indicates success');
  assert(Boolean(propSubmitData.propertyId), 'Submission returns valid propertyId');
  assert(Boolean(propSubmitData.referenceId), 'Submission returns valid referenceId');
  const createdPropertyId = propSubmitData.propertyId;

  // 6. Verify property is persisted in properties store
  const storedProperty = devSandboxStore.properties.get(createdPropertyId);
  assert(Boolean(storedProperty), 'Property is persisted in properties store');
  assert(storedProperty?.super_built_up_sqft === 1850, 'Property super built-up sqft matches submitted value');
  assert(storedProperty?.asking_price_inr === 16500000, 'Property asking price matches submitted value');

  // 7. Verify seller lead record is created and linked to propertyId
  const storedLead = Array.from(devSandboxStore.sellerLeads.values()).find((l: any) => l.property_id === createdPropertyId);
  assert(Boolean(storedLead), 'Seller lead record is linked to propertyId');
  assert(storedLead?.phone === testPhone, 'Seller lead phone matches normalized owner phone');

  // 8. Verify statutory DPDP consent was persisted
  const activeConsents = Array.from(devSandboxStore.consents.values()).filter((c: any) => c.phone === testPhone);
  const onboardingConsent = activeConsents.find((c: any) => c.purpose === 'SELLER_ONBOARDING' && c.is_consented);
  assert(Boolean(onboardingConsent), 'Statutory DPDP consent record is persisted for onboarding');

  // 9. Resubmit/Retry behavior: Submitting another property for the same phone succeeds idempotently
  const retrySubmitRes = await dispatchRequest(app, '/api/properties', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Cookie': fullCookie,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json'
    },
    body: {
      ...validPropertyPayload,
      houseNo: 'Tower 4, Flat 1204',
      expectedPrice: 17000000
    }
  });

  assert(retrySubmitRes.status === 201, 'Subsequent submission for same user succeeds with HTTP 201');
  const retryData = await retrySubmitRes.json();
  assert(retryData.success === true, 'Subsequent submission indicates success');
  assert(retryData.propertyId !== createdPropertyId, 'New property receives unique property ID');

  // 10. Rental Listing property submission
  const rentalPayload = {
    intent: 'rent',
    listing_intent: 'RENT',
    propertyType: 'Residential',
    subType: 'Apartment',
    locality: 'Whitefield',
    societyName: 'Prestige Boulevard',
    houseNo: 'Unit 302',
    bedrooms: 2,
    bathrooms: 2,
    superBuiltUpSqft: 1200,
    expectedPrice: 45000,
    ownerName: 'Sunil Narang',
    ownerPhone: cleanPhone,
    securityDeposit: 250000,
    preferredTenant: 'Family'
  };

  const rentalSubmitRes = await dispatchRequest(app, '/api/properties', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Cookie': fullCookie,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json'
    },
    body: rentalPayload
  });

  assert(rentalSubmitRes.status === 201, 'Rental property submission succeeds with HTTP 201');
  const rentalData = await rentalSubmitRes.json();
  assert(rentalData.success === true, 'Rental response indicates success');
  const storedRental = devSandboxStore.properties.get(rentalData.propertyId);
  assert(storedRental?.listing_intent === 'RENT', 'Stored rental listing_intent is RENT');

  // 11. Transaction rollback safety on database failure
  // Inject query failure test hook on INSERT INTO properties
  setTestQueryHandler((sql: string) => {
    if (sql.includes('INSERT INTO properties')) {
      throw new Error('Simulated database write error on properties table');
    }
    return null;
  });

  try {
    const failingSubmitRes = await dispatchRequest(app, '/api/properties', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Sec-Fetch-Site': 'same-origin',
        'Cookie': fullCookie,
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
      },
      body: {
        intent: 'sell',
        ownerName: 'Test Seller',
        ownerPhone: '9988776655',
        societyName: 'Test Complex',
        locality: 'Sarjapur Road',
        expectedPrice: 12000000
      }
    });

    assert(failingSubmitRes.status === 500, 'Database failure returns HTTP 500 status');
    const failingData = await failingSubmitRes.json();
    assert(
      failingData.error === 'Database error saving property. Please try again.',
      'Safe generic database error message is returned to client'
    );
  } finally {
    setTestQueryHandler(null);
  }

  // 12. Unauthenticated property submission strictly rejected with HTTP 401
  const unauthSubmitRes = await dispatchRequest(app, '/api/properties', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Content-Type': 'application/json'
    },
    body: {
      intent: 'sell',
      ownerName: 'Unauthenticated Attacker',
      ownerPhone: '9876543210',
      societyName: 'Prestige Lakeside Habitat',
      locality: 'Whitefield',
      expectedPrice: 14500000
    }
  });
  assert(unauthSubmitRes.status === 401, 'Unauthenticated submission strictly rejected with HTTP 401');
  const unauthData = await unauthSubmitRes.json();
  assert(unauthData.error === 'UNAUTHORIZED', 'Error code specifies UNAUTHORIZED');

  // 13. Authenticated Google customer can submit property without phone OTP
  const googleUser = {
    uid: 'usr-google-seller-01',
    email: 'google.seller@example.com',
    roles: ['BUYER'] as any,
    phone: '',
    permissions: []
  };
  devSandboxStore.users.set(googleUser.uid, {
    id: googleUser.uid,
    phone: null,
    email: googleUser.email,
    display_name: 'Ananya Sharma',
    password_hash: null,
    token_version: 1,
    roles: ['BUYER'],
    is_active: true,
    failed_login_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const googleSessionToken = await signSessionToken(googleUser, 1);

  const googleCsrf = 'google-seller-csrf-token';
  const googleSubmitRes = await dispatchRequest(app, '/api/properties', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Cookie': `sellmyghar_session=${googleSessionToken}; sellmyghar_csrf=${googleCsrf}`,
      'X-CSRF-Token': googleCsrf,
      'Content-Type': 'application/json'
    },
    body: {
      intent: 'sell',
      listing_intent: 'SELL',
      propertyType: 'Residential',
      subType: 'Flat / Apartment',
      locality: 'Indiranagar',
      societyName: 'Prestige Acropolis',
      houseNo: 'Tower B, Flat 401',
      bedrooms: 3,
      bathrooms: 3,
      balconies: 2,
      superBuiltUpSqft: 1950,
      carpetAreaSqft: 1520,
      furnishing: 'Semi-Furnished',
      floorNumber: 4,
      totalFloors: 12,
      facing: 'EAST',
      expectedPrice: 22000000,
      ownerName: 'Ananya Sharma',
      ownerPhone: '9845011223', // Contact callback number
      ownerEmail: 'google.seller@example.com',
      photos: ['https://sellmyghar.in/images/indiranagar-sample.jpg']
    }
  });

  assert(googleSubmitRes.status === 201, 'Google-authenticated seller submission succeeds with HTTP 201');
  const googleSubmitData = await googleSubmitRes.json();
  assert(googleSubmitData.success === true, 'Google submission response indicates success');
  const googlePropId = googleSubmitData.propertyId;
  assert(Boolean(googlePropId), 'Submission returns valid property ID');

  // Verify ownership bound strictly to Google user identity in database
  const createdProp = devSandboxStore.properties.get(googlePropId);
  assert(Boolean(createdProp), 'Google seller property is persisted in database store');
  assert(createdProp?.owner_id === googleUser.uid, 'Property ownership bound strictly to authenticated Google user ID');

  // Verify seller lead created with contact phone and linked to property
  const allLeads = Array.from(devSandboxStore.sellerLeads.values());
  const googleLead = allLeads.find((l: any) => l.property_id === googlePropId);
  assert(Boolean(googleLead), 'Seller lead record is linked to property in CRM');
  assert(googleLead?.phone === '+919845011223', 'Seller lead phone contains declared callback number');

  // 14. Spoofed client-supplied userId or owner_id is strictly ignored
  const spoofSubmitRes = await dispatchRequest(app, '/api/properties', {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
      'Cookie': `sellmyghar_session=${googleSessionToken}; sellmyghar_csrf=${googleCsrf}`,
      'X-CSRF-Token': googleCsrf,
      'Content-Type': 'application/json'
    },
    body: {
      intent: 'sell',
      listing_intent: 'SELL',
      userId: 'usr-spoofed-victim-999',
      owner_id: 'usr-spoofed-victim-999',
      phone_verified: true,
      locality: 'Whitefield',
      societyName: 'Sobha Dream Acres',
      houseNo: 'Wing 1, Flat 802',
      bedrooms: 2,
      bathrooms: 2,
      superBuiltUpSqft: 1200,
      expectedPrice: 9500000,
      ownerName: 'Ananya Sharma',
      ownerPhone: '9845011223',
      ownerEmail: 'google.seller@example.com'
    }
  });

  assert(spoofSubmitRes.status === 201, 'Submission with spoofed fields succeeds');
  const spoofData = await spoofSubmitRes.json();
  const spoofProp = devSandboxStore.properties.get(spoofData.propertyId);
  assert(Boolean(spoofProp), 'Spoofed property saved');
  assert(spoofProp?.owner_id === googleUser.uid, 'Server strictly binds owner_id to session identity, ignoring spoofed client IDs');
  assert(spoofProp?.owner_id !== 'usr-spoofed-victim-999', 'Spoofed owner_id is never persisted');

  // 15. Cross-tenant access: Another customer cannot view or access the property
  const otherCustomerToken = await signSessionToken({
    uid: 'usr-other-customer-99',
    roles: ['OWNER'],
    phone: '+919876543299',
    email: 'other.owner@example.com',
    permissions: []
  }, 1);

  const crossTenantDashboardRes = await dispatchRequest(app, '/api/properties?format=raw', {
    headers: {
      'Cookie': `sellmyghar_session=${otherCustomerToken}`
    }
  });
  const crossDashboardData = await crossTenantDashboardRes.json();
  const canSeeGoogleProp = (crossDashboardData.properties || []).some((p: any) => p.id === googlePropId);
  assert(!canSeeGoogleProp, 'Cross-tenant customer cannot see Google seller property in their dashboard');

  // 16. Staff CRM access: Authorized CRM staff can view the property in review workflow
  const staffToken = await signSessionToken({
    uid: 'usr-staff-intake-01',
    roles: ['STAFF_INTAKE_AGENT'],
    phone: '+919876500001',
    email: 'intake@sellmyghar.in',
    permissions: []
  }, 1);

  const staffCrmRes = await dispatchRequest(app, `/api/crm/leads/${googleLead?.id}/details`, {
    headers: {
      'Cookie': `sellmyghar_staff_session=${staffToken}`
    }
  });
  assert(staffCrmRes.status === 200, 'Staff intake agent can access submitted lead and property in CRM workflow');
  const staffCrmData = await staffCrmRes.json();
  assert(staffCrmData.lead && staffCrmData.lead.id === googleLead?.id, 'CRM returns full lead details for staff review');

  // 17. Post-test cleanup
  delete process.env.CUSTOMER_MOBILE_LOGIN_ENABLED;
  return { passed, failed, results };
}
