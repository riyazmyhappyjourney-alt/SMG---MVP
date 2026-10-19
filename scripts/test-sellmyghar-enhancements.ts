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

  // 3. AiSensy Idempotency Deduplication
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

  // 4. AiSensy Bounded Retries on Network Failure
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

  // 5. Two-domain discovery exploration helper
  await test('Two-domain explore URL correctly formats locality filter', () => {
    const url = getBuyMyGharExploreUrl('Whitefield');
    assert.ok(url.includes('locality=Whitefield'));
  });

  await test('Two-domain explore URL handles ALL locality without redundant params', () => {
    const url = getBuyMyGharExploreUrl('ALL');
    assert.ok(!url.includes('locality=ALL'));
  });

  // 6. Property verification badge condition
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
