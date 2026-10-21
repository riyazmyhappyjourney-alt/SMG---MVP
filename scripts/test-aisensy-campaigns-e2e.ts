import assert from 'node:assert';
import { AiSensyNotificationService } from '../src/server/notifications/aisensy-service';

async function runAiSensyE2ETests() {
  console.log('\n======================================================');
  console.log('--- AiSensy Two-Campaign End-to-End Verification ---');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}:`, err.message || err);
      failed++;
    }
  }

  // 1. Phone Normalization & Validation for Test Recipient
  await test('Validates and normalizes user test number 8971262423 to 918971262423', () => {
    const rawNumber = '8971262423';
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber(rawNumber), true);
    assert.strictEqual(AiSensyNotificationService.normalizePhoneNumber(rawNumber), '918971262423');
  });

  // 2. Canonical URL Builder Verification
  await test('Builds canonical public property detail URL and dynamic CTA button suffix', () => {
    const propertyId = 'prop-e2e-kanakapura-001';
    const { fullUrl, urlSuffix } = AiSensyNotificationService.buildPropertyUrl(propertyId);
    assert.strictEqual(fullUrl, 'https://sellmyghar.in/property/prop-e2e-kanakapura-001');
    assert.strictEqual(urlSuffix, 'property/prop-e2e-kanakapura-001');
  });

  // 3. Campaign 1: SMG_Property_Submitted2
  await test('Campaign 1: SMG_Property_Submitted2 dispatches exact 4 templateParams and dynamic button', async () => {
    AiSensyNotificationService.clearDispatchedMessages();
    let capturedPayload: any = null;

    AiSensyNotificationService.setMockDispatcher(async (payload) => {
      capturedPayload = payload;
      return { success: true, data: { status: 'submitted', messageId: 'msg-sub-e2e-01' } };
    });

    const origKey = process.env.AISENSY_API_KEY;
    process.env.AISENSY_API_KEY = 'test-e2e-aisensy-jwt-token';

    try {
      const record = await AiSensyNotificationService.handlePropertyListed({
        ownerName: 'Riyaz Ahmed',
        ownerPhone: '8971262423',
        referenceId: 'SMG-FALCON-99',
        societyName: 'Prestige Falcon City',
        locality: 'Kanakapura Road',
        propertyId: 'prop-falcon-99',
      });

      assert.strictEqual(record.status, 'DELIVERED');
      assert.strictEqual(record.destination, '918971262423');
      assert.ok(capturedPayload, 'Payload must be dispatched to provider');
      assert.strictEqual(capturedPayload.campaignName, 'SMG_Property_Submitted2');
      assert.strictEqual(capturedPayload.userName, 'Riyaz Ahmed');
      assert.deepStrictEqual(capturedPayload.templateParams, [
        'Riyaz Ahmed',
        'SMG-FALCON-99',
        'Prestige Falcon City, Kanakapura Road',
        'property/prop-falcon-99',
      ]);
      assert.ok(Array.isArray(capturedPayload.buttons), 'buttons array must be populated');
      assert.strictEqual(capturedPayload.buttons[0].type, 'button');
      assert.strictEqual(capturedPayload.buttons[0].sub_type, 'url');
      assert.strictEqual(capturedPayload.buttons[0].parameters[0].text, 'property/prop-falcon-99');
    } finally {
      process.env.AISENSY_API_KEY = origKey;
      AiSensyNotificationService.setMockDispatcher(null);
    }
  });

  // 4. Initial Submission DOES NOT trigger Campaign 2 (Property Verified)
  await test('Initial property submission never triggers SMG_Property_verfied', async () => {
    AiSensyNotificationService.clearDispatchedMessages();
    const capturedCampaigns: string[] = [];

    AiSensyNotificationService.setMockDispatcher(async (payload) => {
      capturedCampaigns.push(payload.campaignName);
      return { success: true, data: { status: 'ok' } };
    });

    const origKey = process.env.AISENSY_API_KEY;
    process.env.AISENSY_API_KEY = 'test-e2e-aisensy-jwt-token';

    try {
      await AiSensyNotificationService.handlePropertyListed({
        ownerName: 'Riyaz Ahmed',
        ownerPhone: '8971262423',
        referenceId: 'SMG-FALCON-99',
        societyName: 'Prestige Falcon City',
        locality: 'Kanakapura Road',
        propertyId: 'prop-falcon-99',
      });

      assert.strictEqual(capturedCampaigns.includes('SMG_Property_verfied'), false);
      assert.strictEqual(capturedCampaigns.length, 1);
      assert.strictEqual(capturedCampaigns[0], 'SMG_Property_Submitted2');
    } finally {
      process.env.AISENSY_API_KEY = origKey;
      AiSensyNotificationService.setMockDispatcher(null);
    }
  });

  // 5. Campaign 2: SMG_Property_verfied
  await test('Campaign 2: SMG_Property_verfied dispatches exact 4 templateParams and dynamic button', async () => {
    AiSensyNotificationService.clearDispatchedMessages();
    let capturedVerifiedPayload: any = null;

    AiSensyNotificationService.setMockDispatcher(async (payload) => {
      capturedVerifiedPayload = payload;
      return { success: true, data: { status: 'submitted', messageId: 'msg-ver-e2e-01' } };
    });

    const origKey = process.env.AISENSY_API_KEY;
    process.env.AISENSY_API_KEY = 'test-e2e-aisensy-jwt-token';

    try {
      const record = await AiSensyNotificationService.handlePropertyVerified({
        ownerName: 'Riyaz Ahmed',
        ownerPhone: '8971262423',
        title: 'Prestige Falcon City - 3BHK Luxury',
        locality: 'Kanakapura Road',
        propertyId: 'prop-falcon-99',
      });

      assert.strictEqual(record.status, 'DELIVERED');
      assert.strictEqual(record.destination, '918971262423');
      assert.ok(capturedVerifiedPayload, 'Verified payload must be dispatched');
      assert.strictEqual(capturedVerifiedPayload.campaignName, 'SMG_Property_verfied');
      assert.strictEqual(capturedVerifiedPayload.userName, 'Riyaz Ahmed');
      assert.deepStrictEqual(capturedVerifiedPayload.templateParams, [
        'Riyaz Ahmed',
        'Prestige Falcon City - 3BHK Luxury',
        'Kanakapura Road',
        'property/prop-falcon-99',
      ]);
      assert.ok(Array.isArray(capturedVerifiedPayload.buttons), 'buttons array must be populated');
      assert.strictEqual(capturedVerifiedPayload.buttons[0].parameters[0].text, 'property/prop-falcon-99');
    } finally {
      process.env.AISENSY_API_KEY = origKey;
      AiSensyNotificationService.setMockDispatcher(null);
    }
  });

  // 6. Duplicate Verification Prevention (Idempotency)
  await test('Repeated verification attempts for same property do not trigger duplicate WhatsApp messages', async () => {
    AiSensyNotificationService.clearDispatchedMessages();
    let callCount = 0;

    AiSensyNotificationService.setMockDispatcher(async () => {
      callCount++;
      return { success: true, data: { status: 'ok' } };
    });

    const origKey = process.env.AISENSY_API_KEY;
    process.env.AISENSY_API_KEY = 'test-e2e-aisensy-jwt-token';

    try {
      await AiSensyNotificationService.handlePropertyVerified({
        ownerName: 'Riyaz Ahmed',
        ownerPhone: '8971262423',
        title: 'Prestige Falcon City - 3BHK Luxury',
        locality: 'Kanakapura Road',
        propertyId: 'prop-falcon-99',
      });

      assert.strictEqual(callCount, 1);

      // Repeat identical call
      const dupRecord = await AiSensyNotificationService.handlePropertyVerified({
        ownerName: 'Riyaz Ahmed',
        ownerPhone: '8971262423',
        title: 'Prestige Falcon City - 3BHK Luxury',
        locality: 'Kanakapura Road',
        propertyId: 'prop-falcon-99',
      });

      assert.strictEqual(callCount, 1, 'Provider dispatcher must NOT be called twice');
      assert.strictEqual(dupRecord.status, 'SIMULATED');
    } finally {
      process.env.AISENSY_API_KEY = origKey;
      AiSensyNotificationService.setMockDispatcher(null);
    }
  });

  // 7. Truthful Provider Status
  await test('AiSensy getProviderStatus truthfully reports exact campaign names', () => {
    const origKey = process.env.AISENSY_API_KEY;
    try {
      process.env.AISENSY_API_KEY = 'test-key-xyz-123456';
      const status = AiSensyNotificationService.getProviderStatus();
      assert.strictEqual(status.configured, true);
      assert.strictEqual(status.endpoint, 'https://backend.aisensy.com/campaign/t1/api/v2');
      assert.strictEqual(status.campaigns.propertyListed, 'SMG_Property_Submitted2');
      assert.strictEqual(status.campaigns.propertyVerified, 'SMG_Property_verfied');
      assert.strictEqual('apiKey' in (status as any), false);
    } finally {
      process.env.AISENSY_API_KEY = origKey;
    }
  });

  console.log(`\n======================================================`);
  console.log(`AiSensy E2E Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAiSensyE2ETests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
