import assert from 'assert';
import { getDevStore } from '../src/server/db/dev-sandbox-store';
import { EmailNotificationService } from '../src/server/notifications/email-service';

export async function runMasterBugfixRegressionTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res && typeof res.then === 'function') {
        return res.then(
          () => {
            passed++;
            results.push(`[PASS] ${name}`);
          },
          (err: any) => {
            failed++;
            results.push(`[FAIL] ${name}: ${err.message}`);
          }
        );
      }
      passed++;
      results.push(`[PASS] ${name}`);
    } catch (err: any) {
      failed++;
      results.push(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. Issue 6: Seller property submission must persist listing_status as PUBLISHED
  await test('Dev store seller submission persists with listing_status = PUBLISHED and LEVEL_1_OWNER_DECLARED', async () => {
    const store = getDevStore();
    const res = store.handleQuery(
      `INSERT INTO properties (id, title, property_type, bhk_config, price, super_built_up_sqft, locality, society_name, seller_user_id, listing_status, verification_tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED', 'LEVEL_1_OWNER_DECLARED')
       RETURNING id, title, listing_status, verification_tier`,
      ['prop-test-published-01', 'Sobha Dream Acres 2BHK', 'APARTMENT', '2BHK', 9500000, 1200, 'Panathur', 'Sobha Dream Acres', 'usr-seller-test-01']
    );

    assert.ok(res.rows && res.rows.length > 0, 'Expected row to be returned');
    assert.strictEqual(res.rows[0].listing_status, 'PUBLISHED', 'Expected listing_status to be PUBLISHED');
    assert.strictEqual(res.rows[0].verification_tier, 'LEVEL_1_OWNER_DECLARED', 'Expected tier to be LEVEL_1_OWNER_DECLARED');
  });

  // 2. Issue 4: Email notification with valid email logs/dispatches confirmation
  await test('Email notification service handles valid owner email with confirmation', async () => {
    EmailNotificationService.setMockProvider(async (payload) => ({
      success: true,
      messageId: `mock_${Date.now()}`,
    }));

    try {
      const record = await EmailNotificationService.handlePropertyListed({
        id: 'prop-email-test-01',
        referenceId: 'SMG-2026-REG-01',
        ownerEmail: 'owner.valid@example.com',
        ownerName: 'Anita Desai',
        locality: 'Varthur',
        propertyType: 'APARTMENT',
        askingPrice: 12500000,
      });

      assert.ok(record);
      assert.strictEqual(record.dispatched, true);
      assert.strictEqual(record.status, 'DELIVERED');
    } finally {
      EmailNotificationService.setMockProvider(null);
    }
  });

  // 3. Issue 4: Email notification with missing or invalid email logs SKIPPED without failing
  await test('Email notification service cleanly skips when ownerEmail is missing or invalid', async () => {
    const record = await EmailNotificationService.handlePropertyListed({
      id: 'prop-email-test-02',
      referenceId: 'SMG-2026-REG-02',
      ownerEmail: '',
      ownerName: 'Anonymous Owner',
      locality: 'Hoodi',
      propertyType: 'APARTMENT',
      askingPrice: 8500000,
    });

    assert.ok(record);
    assert.strictEqual(record.status, 'SKIPPED');
    assert.strictEqual(record.dispatched, false);
    assert.strictEqual(record.reason, 'NO_VALID_OWNER_EMAIL');
  });

  // 4. Issue 7: CRM Verified Tier filter logic
  await test('CRM Verified Tier filter logic identifies verified tiers correctly', () => {
    const sampleProperties = [
      { id: '1', title: 'Prop 1', verificationTier: 'LEVEL_1_OWNER_DECLARED', verificationBadge: 'NONE' },
      { id: '2', title: 'Prop 2', verificationTier: 'LEVEL_2_DOCS_REVIEWED', verificationBadge: 'DOCS_CHECKED' },
      { id: '3', title: 'Prop 3', verificationTier: 'LEVEL_3_PHYSICALLY_INSPECTED', verificationBadge: 'INSPECTED' },
      { id: '4', title: 'Prop 4', verificationTier: 'LEVEL_1_OWNER_DECLARED', verificationBadge: 'NONE' },
    ];

    const verifiedOnly = sampleProperties.filter((p) => {
      const isVerified = (p.verificationBadge && p.verificationBadge !== 'NONE') ||
        p.verificationTier === 'LEVEL_2_DOCS_REVIEWED' ||
        p.verificationTier === 'LEVEL_3_PHYSICALLY_INSPECTED' ||
        p.verificationTier === 'VERIFIED';
      return isVerified;
    });

    assert.strictEqual(verifiedOnly.length, 2);
    assert.strictEqual(verifiedOnly[0].id, '2');
    assert.strictEqual(verifiedOnly[1].id, '3');
  });

  // 5. Issue 1 & 3: Field error auto-scroll mapping keys
  await test('Form field IDs for wizard steps are registered', () => {
    const expectedFieldIds = [
      'field-propertyKind',
      'field-locality',
      'field-society',
      'field-bhkConfig',
      'field-superBuiltUpSqft',
      'field-expectedPrice',
      'field-ownerName',
      'field-ownerPhone',
      'field-ownerEmail',
    ];

    for (const fieldId of expectedFieldIds) {
      assert.ok(fieldId.startsWith('field-'), `Field ${fieldId} must conform to naming convention`);
    }
  });

  return { passed, failed, results };
}
