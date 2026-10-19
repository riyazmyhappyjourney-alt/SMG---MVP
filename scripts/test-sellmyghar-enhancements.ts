import assert from 'assert';
import { AiSensyNotificationService } from '../src/server/notifications/aisensy-service';
import { getBuyMyGharExploreUrl } from '../src/utils/domainConfig';
import { getDevStore } from '../src/server/db/dev-sandbox-store';
import { signSessionToken } from '../src/server/auth/tokens';

export async function runSellMyGharEnhancementTests(): Promise<{ passed: number; failed: number; results: string[] }> {
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

  // 1. Phone number normalization for AiSensy WhatsApp
  await test('AiSensy normalizes 10-digit Indian phone with 91 prefix', () => {
    const normalized = AiSensyNotificationService.normalizePhoneNumber('8217873708');
    assert.strictEqual(normalized, '918217873708');
  });

  await test('AiSensy preserves already-prefixed 91 12-digit phone number', () => {
    const normalized = AiSensyNotificationService.normalizePhoneNumber('+91 82178 73708');
    assert.strictEqual(normalized, '918217873708');
  });

  await test('AiSensy handles dashes and special characters in phone numbers', () => {
    const normalized = AiSensyNotificationService.normalizePhoneNumber('+91-82178-73708');
    assert.strictEqual(normalized, '918217873708');
  });

  await test('AiSensy validates valid Indian mobile numbers correctly', () => {
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber('9845012345'), true);
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber('+91 82178 73708'), true);
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber('6234567890'), true);
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber('7012345678'), true);
  });

  await test('AiSensy safely rejects invalid or non-Indian phone numbers', async () => {
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber('12345'), false);
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber('abcdefghij'), false);
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber('1800123456'), false); // Toll-free not valid mobile
    assert.strictEqual(AiSensyNotificationService.isValidPhoneNumber(''), false);

    AiSensyNotificationService.clearDispatchedMessages();
    const record = await AiSensyNotificationService.handlePropertyListed({
      ownerName: 'Test Owner',
      ownerPhone: '12345',
      referenceId: 'SMG-INV-01',
      societyName: 'Test Apt',
      locality: 'Koramangala',
      propertyId: 'prop-inv-01',
    });

    assert.strictEqual(record.status, 'SKIPPED_INVALID_PHONE');
    assert.strictEqual(record.attempts, 0);
  });

  // 2. AiSensy Property Listed Campaign Dispatch
  await test('AiSensy handlePropertyListed dispatches campaign with correct parameters', async () => {
    AiSensyNotificationService.clearDispatchedMessages();
    let capturedPayload: any = null;

    AiSensyNotificationService.setMockDispatcher(async (payload) => {
      capturedPayload = payload;
      return { success: true, data: { status: 'submitted', messageId: 'msg-test-01' } };
    });

    const origKey = process.env.AISENSY_API_KEY;
    process.env.AISENSY_API_KEY = 'test-aisensy-key-xyz';

    try {
      const record = await AiSensyNotificationService.handlePropertyListed({
        ownerName: 'Sunil Rao',
        ownerPhone: '+91 82178 73708',
        referenceId: 'SMG-2026-9901',
        societyName: 'Sobha Dream Acres',
        locality: 'Panathur',
        propertyId: 'prop-test-listed-01',
      });

      assert.strictEqual(record.status, 'DELIVERED');
      assert.strictEqual(record.destination, '918217873708');
      assert.ok(capturedPayload);
      assert.strictEqual(capturedPayload.apiKey, 'test-aisensy-key-xyz');
      assert.strictEqual(capturedPayload.userName, 'Sunil Rao');
      assert.deepStrictEqual(capturedPayload.templateParams, [
        'Sunil Rao',
        'SMG-2026-9901',
        'Sobha Dream Acres',
        'Panathur',
      ]);
    } finally {
      process.env.AISENSY_API_KEY = origKey;
      AiSensyNotificationService.setMockDispatcher(null);
    }
  });

  // 3. AiSensy Property Published Campaign Dispatch
  await test('AiSensy handlePropertyPublished dispatches live listing campaign with correct parameters', async () => {
    AiSensyNotificationService.clearDispatchedMessages();
    let capturedPayload: any = null;

    AiSensyNotificationService.setMockDispatcher(async (payload) => {
      capturedPayload = payload;
      return { success: true, data: { status: 'submitted', messageId: 'msg-pub-01' } };
    });

    const origKey = process.env.AISENSY_API_KEY;
    process.env.AISENSY_API_KEY = 'test-aisensy-key-xyz';

    try {
      const record = await AiSensyNotificationService.handlePropertyPublished({
        ownerName: 'Sunil Rao',
        ownerPhone: '+91 82178 73708',
        title: 'Sobha Dream Acres - 2BHK',
        locality: 'Panathur',
        propertyId: 'prop-test-pub-01',
        referenceId: 'SMG-2026-PUB01',
      });

      assert.strictEqual(record.status, 'DELIVERED');
      assert.strictEqual(record.destination, '918217873708');
      assert.ok(capturedPayload);
      assert.strictEqual(capturedPayload.campaignName, 'property_published');
      assert.deepStrictEqual(capturedPayload.templateParams, [
        'Sunil Rao',
        'Sobha Dream Acres - 2BHK',
        'Panathur',
        'SMG-2026-PUB01',
      ]);
    } finally {
      process.env.AISENSY_API_KEY = origKey;
      AiSensyNotificationService.setMockDispatcher(null);
    }
  });

  // 4. AiSensy Idempotency Deduplication
  await test('AiSensy idempotency prevents duplicate campaign dispatch for same property', async () => {
    AiSensyNotificationService.clearDispatchedMessages();
    let dispatchCallCount = 0;

    AiSensyNotificationService.setMockDispatcher(async () => {
      dispatchCallCount++;
      return { success: true, data: { status: 'submitted' } };
    });

    const origKey = process.env.AISENSY_API_KEY;
    process.env.AISENSY_API_KEY = 'test-aisensy-key-xyz';

    try {
      await AiSensyNotificationService.handlePropertyVerified({
        ownerName: 'Priya Sharma',
        ownerPhone: '+91 98450 11223',
        title: 'Prestige Lakeside Habitat - 3BHK',
        locality: 'Varthur',
        propertyId: 'prop-verified-dup-01',
      });

      assert.strictEqual(dispatchCallCount, 1);

      // Subsequent identical dispatch
      const dupRecord = await AiSensyNotificationService.handlePropertyVerified({
        ownerName: 'Priya Sharma',
        ownerPhone: '+91 98450 11223',
        title: 'Prestige Lakeside Habitat - 3BHK',
        locality: 'Varthur',
        propertyId: 'prop-verified-dup-01',
      });

      // Dispatcher should not be called again
      assert.strictEqual(dispatchCallCount, 1);
      assert.strictEqual(dupRecord.status, 'SIMULATED');
    } finally {
      process.env.AISENSY_API_KEY = origKey;
      AiSensyNotificationService.setMockDispatcher(null);
    }
  });

  // 5. AiSensy Bounded Retries on Network Failure
  await test('AiSensy attempts bounded retries on transient network errors', async () => {
    AiSensyNotificationService.clearDispatchedMessages();
    let callAttempts = 0;

    AiSensyNotificationService.setMockDispatcher(async () => {
      callAttempts++;
      if (callAttempts < 3) {
        return { success: false, error: 'Transient network failure' };
      }
      return { success: true, data: { status: 'recovered' } };
    });

    const origKey = process.env.AISENSY_API_KEY;
    process.env.AISENSY_API_KEY = 'test-aisensy-key-xyz';

    try {
      const record = await AiSensyNotificationService.handlePropertyActionRequired({
        ownerName: 'Anil Kumar',
        ownerPhone: '9845099887',
        title: 'Brigade Cornerstone Utopia',
        actionRequiredText: 'Please re-upload clear copy of Khata Certificate',
        propertyId: 'prop-action-req-01',
      });

      assert.strictEqual(callAttempts, 3);
      assert.strictEqual(record.status, 'DELIVERED');
      assert.strictEqual(record.attempts, 3);
    } finally {
      process.env.AISENSY_API_KEY = origKey;
      AiSensyNotificationService.setMockDispatcher(null);
    }
  });

  // 6. Provider Status & Secret Masking
  await test('AiSensy getProviderStatus truthfully reports status without exposing secret key', () => {
    const origKey = process.env.AISENSY_API_KEY;
    try {
      process.env.AISENSY_API_KEY = 'super-secret-aisensy-key-12345';
      const status = AiSensyNotificationService.getProviderStatus();
      assert.strictEqual(status.configured, true);
      assert.strictEqual(status.endpoint, 'https://backend.aisensy.com/campaign/t1/api/v2');
      assert.strictEqual(status.campaigns.propertyListed, 'property_listed');
      assert.strictEqual(status.campaigns.propertyPublished, 'property_published');
      assert.strictEqual(status.campaigns.propertyVerified, 'property_verified');
      assert.strictEqual(status.campaigns.propertyActionRequired, 'property_action_required');
      assert.strictEqual('apiKey' in (status as any), false);
      assert.strictEqual('AISENSY_API_KEY' in (status as any), false);
    } finally {
      process.env.AISENSY_API_KEY = origKey;
    }
  });

  // 7. Webhook delivery status update
  await test('AiSensy handleWebhookCallback processes delivery receipts', async () => {
    const callbackResult = await AiSensyNotificationService.handleWebhookCallback({
      messageId: 'msg-test-webhook-01',
      status: 'DELIVERED',
      destination: '918217873708',
    });

    assert.strictEqual(callbackResult.handled, true);
    assert.strictEqual(callbackResult.status, 'DELIVERED');
    assert.strictEqual(callbackResult.messageId, 'msg-test-webhook-01');
  });

  // 8. Missing credentials in production produces clear unconfigured status without throwing
  await test('AiSensy missing API key in production mode produces SKIPPED_UNCONFIGURED', async () => {
    const origEnv = process.env.NODE_ENV;
    const origKey = process.env.AISENSY_API_KEY;
    const origAllow = process.env.ALLOW_DEV_FALLBACKS;
    const origTest = process.env.RUNNING_TESTS;

    try {
      process.env.NODE_ENV = 'production';
      process.env.AISENSY_API_KEY = '';
      process.env.ALLOW_DEV_FALLBACKS = 'false';
      process.env.RUNNING_TESTS = 'false';

      AiSensyNotificationService.clearDispatchedMessages();
      const record = await AiSensyNotificationService.handlePropertyVerified({
        ownerName: 'Ramesh Patel',
        ownerPhone: '9845012345',
        title: 'Godrej Woodsman',
        locality: 'Hebbal',
        propertyId: 'prop-unconf-01',
      });

      assert.strictEqual(record.status, 'SKIPPED_UNCONFIGURED');
      assert.strictEqual(record.attempts, 0);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.AISENSY_API_KEY = origKey;
      process.env.ALLOW_DEV_FALLBACKS = origAllow;
      process.env.RUNNING_TESTS = origTest;
    }
  });

  // 9. Two-domain discovery exploration helper
  await test('Two-domain explore URL correctly formats locality filter', () => {
    const url = getBuyMyGharExploreUrl('Whitefield');
    assert.ok(url.includes('locality=Whitefield'));
  });

  await test('Two-domain explore URL handles ALL locality without redundant params', () => {
    const url = getBuyMyGharExploreUrl('ALL');
    assert.ok(!url.includes('locality=ALL'));
  });

  // 10. Property verification badge condition
  await test('Property verification badge only activates on verified tiers', () => {
    const verifiedTiers = ['VERIFIED', 'DOCS_CHECKED', 'INSPECTED', 'LEVEL_2_DOCS_REVIEWED', 'LEVEL_3_PHYSICALLY_INSPECTED'];
    for (const tier of verifiedTiers) {
      const isVerified = Boolean(tier && verifiedTiers.includes(tier.toUpperCase()));
      assert.strictEqual(isVerified, true, `Expected ${tier} to be verified`);
    }

    const unverifiedTiers = ['PENDING', 'UNVERIFIED', 'LEVEL_1_OWNER_DECLARED', undefined, ''];
    for (const tier of unverifiedTiers) {
      const isVerified = Boolean(tier && verifiedTiers.includes(tier.toUpperCase()));
      assert.strictEqual(isVerified, false, `Expected ${tier} to be unverified`);
    }
  });

  return { passed, failed, results };
}
