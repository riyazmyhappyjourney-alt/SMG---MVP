import { AuthenticatedUser } from '../../core/types/auth';
import { PropertyPrivateRecord, DocumentPrivateRecord } from '../../core/types/entities';
import { requirePermission, hasPermission } from './rbac';
import { assertCanAccessProperty, assertCanAccessDocument, sanitizePropertyForStaff, AuthorizationError } from './ownership';

/**
 * Concrete Access Control & RBAC Test Suite
 * Validates that authorization checks actively block unauthorized roles and prevent IDOR.
 */

export function runAuthorizationTests(): { passed: number; failed: number; results: string[] } {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
      results.push(`[PASS] ${testName}`);
    } else {
      failed++;
      results.push(`[FAIL] ${testName}`);
      console.error(`Assertion failed: ${testName}`);
    }
  };

  // Mock Users
  const listingManager: AuthenticatedUser = {
    uid: 'usr-listing-mgr-01',
    phone: '+919876500001',
    email: 'listing@sellmyghar.com',
    roles: ['STAFF_LISTING_MANAGER'],
    permissions: [],
  };

  const verificationAgent: AuthenticatedUser = {
    uid: 'usr-verifier-01',
    phone: '+919876500002',
    email: 'verifier@sellmyghar.com',
    roles: ['STAFF_VERIFICATION_AGENT'],
    permissions: [],
  };

  const ownerAlice: AuthenticatedUser = {
    uid: 'usr-alice-owner',
    phone: '+919876511111',
    email: 'alice@gmail.com',
    roles: ['OWNER'],
    permissions: [],
  };

  const ownerBob: AuthenticatedUser = {
    uid: 'usr-bob-owner',
    phone: '+919876522222',
    email: 'bob@gmail.com',
    roles: ['OWNER'],
    permissions: [],
  };

  // Mock Canonical Property
  const sampleProperty: PropertyPrivateRecord = {
    id: 'prop-alice-101',
    owner_id: 'usr-alice-owner',
    project_locality_id: 'proj-prestige-falcon',
    unit_number: 'Tower 4, Flat 1102',
    wing_tower: 'Tower 4',
    unit_floor: 11,
    total_floors: 18,
    bhk_type: '3BHK',
    super_built_up_sqft: 1850,
    carpet_area_sqft: 1420,
    balconies_count: 2,
    bathrooms_count: 3,
    facing: 'EAST',
    car_parks_count: 1,
    is_covered_parking: true,
    khata_type: 'A_KHATA',
    encumbrance_status: 'CLEAN',
    loan_bank_name: 'HDFC Bank',
    occupancy_status: 'VACANT',
    monthly_maintenance_inr: 4500,
    asking_price_inr: 16500000,
    reserve_minimum_price_inr: 15800000, // Bottom line
    verification_tier: 'LEVEL_1_OWNER_DECLARED',
    internal_verification_notes: 'Owner declared.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Mock Private Document
  const sampleDeed: DocumentPrivateRecord = {
    id: 'doc-sale-deed-01',
    property_id: 'prop-alice-101',
    uploader_user_id: 'usr-alice-owner',
    doc_type: 'SALE_DEED',
    storage_bucket_path: 'properties/prop-alice-101/private_docs/deed.pdf',
    file_name: 'sale_deed.pdf',
    file_size_bytes: 4000000,
    mime_type: 'application/pdf',
    sha256_checksum: 'a'.repeat(64),
    verification_status: 'PENDING_REVIEW',
    verified_by_staff_id: null,
    verified_at: null,
    rejection_reason: null,
    created_at: new Date().toISOString(),
  };

  // TEST 1: STAFF_LISTING_MANAGER is REJECTED from reading reserve_minimum_price
  try {
    requirePermission(listingManager, 'properties:read_reserve_price');
    assert(false, 'TEST 1: Listing Manager was incorrectly allowed to read reserve price');
  } catch (err: any) {
    assert(
      err.message.includes('FORBIDDEN: User lacks required permission: properties:read_reserve_price'),
      'TEST 1: Listing Manager is actively BLOCKED from reading reserve_minimum_price'
    );
  }

  // TEST 2: STAFF_LISTING_MANAGER is REJECTED from reading raw legal deeds
  try {
    requirePermission(listingManager, 'documents:read_all_secure');
    assert(false, 'TEST 2: Listing Manager was incorrectly allowed to read raw documents');
  } catch (err: any) {
    assert(
      err.message.includes('FORBIDDEN: User lacks required permission: documents:read_all_secure'),
      'TEST 2: Listing Manager is actively BLOCKED from reading raw legal documents'
    );
  }

  // TEST 3: STAFF_VERIFICATION_AGENT is REJECTED from managing buyer offers
  try {
    requirePermission(verificationAgent, 'offers:manage_all');
    assert(false, 'TEST 3: Verification Agent was incorrectly allowed to manage offers');
  } catch (err: any) {
    assert(
      err.message.includes('FORBIDDEN: User lacks required permission: offers:manage_all'),
      'TEST 3: Verification Agent is actively BLOCKED from buyer offer negotiations'
    );
  }

  // TEST 4: IDOR Defense — Owner Bob CANNOT access Owner Alice's private property
  try {
    assertCanAccessProperty(ownerBob, sampleProperty, 'READ');
    assert(false, 'TEST 4: Owner Bob was incorrectly allowed to read Alice property');
  } catch (err: any) {
    assert(
      err instanceof AuthorizationError && err.message.includes('ACCESS_DENIED'),
      'TEST 4: IDOR Defense actively BLOCKS cross-customer access to private property records'
    );
  }

  // TEST 5: IDOR Defense — Owner Bob CANNOT read Owner Alice's raw sale deed
  try {
    assertCanAccessDocument(ownerBob, sampleDeed);
    assert(false, 'TEST 5: Owner Bob was incorrectly allowed to read Alice sale deed');
  } catch (err: any) {
    assert(
      err instanceof AuthorizationError && err.message.includes('ACCESS_DENIED'),
      'TEST 5: IDOR Defense actively BLOCKS cross-customer access to raw legal title deeds'
    );
  }

  // TEST 6: Field-Level Masking for STAFF_LISTING_MANAGER
  const sanitizedForListing = sanitizePropertyForStaff(listingManager, sampleProperty);
  assert(
    sanitizedForListing.unit_number === '[MASKED_FOR_LISTING_MANAGER]' &&
    sanitizedForListing.reserve_minimum_price_inr === 0 &&
    sanitizedForListing.loan_bank_name === null,
    'TEST 6: sanitizePropertyForStaff() masks exact flat number and zeroes out reserve price for Listing Manager'
  );

  return { passed, failed, results };
}
