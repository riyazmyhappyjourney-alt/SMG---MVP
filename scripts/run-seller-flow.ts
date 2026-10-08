import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { SellerService } from '../src/server/workflow/seller-service';
import { executeQuery, getDbPool } from '../src/server/db/pool';
import { BHKType } from '../src/core/types/entities';

async function runRealSellerFlow() {
  console.log('====================================================');
  console.log('  SellMyGhar Real End-to-End Seller Flow Execution');
  console.log('====================================================\n');

  const testPhone = '+919845012345';
  const clientIp = '103.21.244.42';
  const ownerName = 'Riyaz Ahmed';
  const society = 'Sobha Dream Acres';

  // Step 1: Capture Lead
  console.log('Step 1: Submitting Seller Lead with DPDP Statutory Consent...');
  const leadResult = await SellerService.captureLead({
    owner_name: ownerName,
    phone: testPhone,
    apartment_society_name: society,
    locality_id: 'panathur-balagere',
    bhk_type: '2BHK' as BHKType,
    expected_price_inr: 12500000,
    consent_dpdp: true,
    marketing_opt_in: false,
    utm_source: 'direct_seller_flow',
  }, clientIp);
  console.log('-> Lead captured successfully:', leadResult);

  // Step 2A: Request OTP
  console.log('\nStep 2A: Requesting OTP for phone verification...');
  const otpReq = await SellerService.requestOtp(testPhone, clientIp);
  console.log('-> OTP requested:', otpReq);

  // Step 2B: Verify OTP
  console.log('\nStep 2B: Verifying OTP (code: 123456)...');
  const authResult = await SellerService.verifyOtp(testPhone, '123456', null);
  console.log('-> User authenticated with real JWT session:');
  console.log('   UID:', authResult.authenticatedUser.uid);
  console.log('   Roles:', authResult.authenticatedUser.roles);
  console.log('   JWT (first 30 chars):', authResult.sessionToken.substring(0, 30) + '...');

  // Step 3: Save Detailed Property Specification
  console.log('\nStep 3: Saving Detailed Property Details via withUserSession (RLS)...');
  const propertyRecord = await SellerService.savePropertyDetails(
    authResult.authenticatedUser,
    {
      unit_number: 'Wing 4, Flat 502',
      wing_tower: 'Wing 4',
      unit_floor: 5,
      total_floors: 14,
      bhk_type: '2BHK',
      super_built_up_sqft: 1205,
      carpet_area_sqft: 980,
      balconies_count: 2,
      bathrooms_count: 2,
      facing: 'EAST',
      car_parks_count: 1,
      is_covered_parking: true,
      khata_type: 'A_KHATA',
      encumbrance_status: 'CLEAN',
      loan_bank_name: null,
      occupancy_status: 'SELF_OCCUPIED',
      monthly_maintenance_inr: 4500,
      asking_price_inr: 12500000,
      reserve_minimum_price_inr: 11800000,
    },
    'panathur-balagere',
    clientIp
  );
  console.log('-> Property saved. Property ID:', propertyRecord.id);

  // Verification Step: Query real database rows
  console.log('\n====================================================');
  console.log('  Live Database Row Verification (Direct SQL Queries)');
  console.log('====================================================');

  const consentsQuery = await executeQuery(
    'SELECT id, phone, purpose, notice_version, is_consented, is_withdrawn, consented_at FROM consents WHERE phone = $1 ORDER BY consented_at DESC LIMIT 1;',
    [testPhone]
  );
  console.log('\n1. Row in "consents" table:');
  console.log(JSON.stringify(consentsQuery.rows, null, 2));

  const leadsQuery = await executeQuery(
    'SELECT id, owner_name, phone, apartment_society_name, locality_id, bhk_type, expected_price_inr, lead_status, consent_record_id, created_at FROM seller_leads WHERE phone = $1 ORDER BY created_at DESC LIMIT 1;',
    [testPhone]
  );
  console.log('\n2. Row in "seller_leads" table:');
  console.log(JSON.stringify(leadsQuery.rows, null, 2));

  const propertyQuery = await executeQuery(
    'SELECT id, owner_id, unit_number, wing_tower, unit_floor, total_floors, bhk_type, super_built_up_sqft, asking_price_inr, reserve_minimum_price_inr, verification_tier, created_at FROM properties WHERE id = $1;',
    [propertyRecord.id]
  );
  console.log('\n3. Row in "properties" table:');
  console.log(JSON.stringify(propertyQuery.rows, null, 2));

  const userQuery = await executeQuery(
    'SELECT id, phone, roles, is_active, created_at FROM users WHERE phone = $1;',
    [testPhone]
  );
  console.log('\n4. Row in "users" table:');
  console.log(JSON.stringify(userQuery.rows, null, 2));

  const pool = getDbPool();
  if (pool && typeof pool.end === 'function') {
    await pool.end();
  }
}

runRealSellerFlow().catch(err => {
  console.error('Flow failed:', err);
  process.exit(1);
});
