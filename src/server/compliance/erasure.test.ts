import { ErasureService, hashForErasure } from './erasure-service';
import { AuthenticatedUser } from '../../core/types/auth';
import { setTestQueryHandler } from '../db/pool';

/**
 * DPDP Act Section 12 Data Erasure & Statutory Retention Test Suite
 * 
 * Verifies:
 * 1. Self-service request creates a PENDING_ADMIN_REVIEW record.
 * 2. Unauthorized role (STAFF_LISTING_MANAGER) is blocked from executing erasure.
 * 3. Statutory Legal Hold: Completed deal blocks erasure of user & linked records.
 * 4. Hash irreversibility: Phone number is converted to 64-char HMAC-SHA256 hex string.
 * 5. Super Admin dual-key review approves & executes atomic PostgreSQL erasure on eligible unconverted records.
 * 6. Idempotency: Finalized request cannot be re-executed.
 */

export async function runErasureTests(): Promise<{ passed: number; failed: number; results: string[] }> {
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

  // Mock Request Store strictly within the test suite (zero test code in production service)
  const testLedger = new Map<string, {
    id: string;
    user_id: string;
    phone_hash: string;
    request_status: string;
    hasCompletedDeal?: boolean;
  }>();

  // Install clean test double handler
  setTestQueryHandler(async (sql, params) => {
    // 1. Intercept INSERT into erasure_requests
    if (sql.includes('INSERT INTO erasure_requests')) {
      const [id, user_id, phone_hash, status] = params as [string, string, string, string];
      testLedger.set(id, {
        id,
        user_id,
        phone_hash,
        request_status: status,
      });
      return { rows: [{ id }] };
    }

    // 2. Intercept SELECT from erasure_requests
    if (sql.includes('FROM erasure_requests') && sql.includes('WHERE id = $1')) {
      const [id] = params as [string];
      const record = testLedger.get(id);
      return { rows: record ? [record] : [] };
    }

    // 3. Intercept Completed Deals Statutory Hold Check
    if (sql.includes('FROM deals') && sql.includes("deal_status = 'COMPLETED'")) {
      const [userId] = params as [string];
      if (userId === 'usr-completed-deal-owner') {
        return { rows: [{ id: 'deal-completed-999' }] };
      }
      return { rows: [] };
    }

    // 4. Intercept UPDATE erasure_requests
    if (sql.includes('UPDATE erasure_requests')) {
      if (sql.includes("request_status = 'APPROVED_EXECUTED'")) {
        const id = (params as any[])[3];
        const record = testLedger.get(id);
        if (record) record.request_status = 'APPROVED_EXECUTED';
        return { rows: [{ id }] };
      }
      if (sql.includes("request_status = 'REJECTED_STATUTORY_HOLD'")) {
        const id = (params as any[])[3];
        const record = testLedger.get(id);
        if (record) record.request_status = 'REJECTED_STATUTORY_HOLD';
        return { rows: [{ id }] };
      }
    }

    // 5. Intercept UPDATE seller_leads
    if (sql.includes('UPDATE seller_leads')) {
      return { rows: [{ id: 'lead-test-01' }] };
    }

    // 6. Intercept UPDATE properties
    if (sql.includes('UPDATE properties')) {
      return { rows: [{ id: 'prop-test-01' }] };
    }

    // 7. Intercept UPDATE users
    if (sql.includes('UPDATE users')) {
      return { rows: [{ id: 'usr-test-01' }] };
    }

    return null; // Fall through to standard pool interceptor
  });

  try {
    const customerUser: AuthenticatedUser = {
      uid: 'usr-customer-erasure-01',
      phone: '+919876543210',
      email: 'delete.me@example.com',
      roles: ['OWNER'],
      permissions: [],
    };

    const customerWithDeal: AuthenticatedUser = {
      uid: 'usr-completed-deal-owner',
      phone: '+919876543299',
      email: 'dealowner@example.com',
      roles: ['OWNER'],
      permissions: [],
    };

    const listingManager: AuthenticatedUser = {
      uid: 'usr-listing-mgr-01',
      phone: '+919876500001',
      email: 'listing@sellmyghar.com',
      roles: ['STAFF_LISTING_MANAGER'],
      permissions: [],
    };

    const superAdmin: AuthenticatedUser = {
      uid: 'usr-admin-01',
      phone: '+919876500000',
      email: 'admin@sellmyghar.com',
      roles: ['STAFF_SUPER_ADMIN'],
      permissions: [],
    };

    // TEST 1: Customer submits formal erasure request
    const reqRes = await ErasureService.requestErasure(
      customerUser,
      'I have relocated out of Bengaluru and withdraw all personal data.',
      '103.21.244.1'
    );
    assert(
      reqRes.status === 'PENDING_ADMIN_REVIEW' && Boolean(reqRes.requestId),
      'TEST 1: Customer request enters PENDING_ADMIN_REVIEW queue (no immediate self-service delete)'
    );

    // TEST 2: STAFF_LISTING_MANAGER cannot execute erasure (dual-key RBAC defense)
    try {
      await ErasureService.executeErasureRequest(listingManager, reqRes.requestId, '103.21.244.1');
      assert(false, 'TEST 2: Listing Manager was incorrectly allowed to execute erasure');
    } catch (err: any) {
      assert(
        err.message.includes('FORBIDDEN: User lacks required permission: compliance:execute_erasure'),
        'TEST 2: Non-super-admin execution attempt throws FORBIDDEN'
      );
    }

    // TEST 3: Statutory Legal Hold Active: Completed Deal blocks erasure of user & linked records
    const dealHoldReq = await ErasureService.requestErasure(
      customerWithDeal,
      'Please erase my account after property sale completed.',
      '103.21.244.1'
    );
    const dealHoldExecRes = await ErasureService.executeErasureRequest(
      superAdmin,
      dealHoldReq.requestId,
      '103.21.244.1'
    );
    assert(
      dealHoldExecRes.status === 'REJECTED_STATUTORY_HOLD' &&
      dealHoldExecRes.summary?.retentionHoldActive === true &&
      Boolean(dealHoldExecRes.rejectionReason?.includes('Statutory Legal Hold Active')),
      'TEST 3: Statutory Legal Hold blocks erasure of user & linked records tied to completed transaction'
    );

    // TEST 4: Irreversible hashing transforms phone number
    const originalPhone = '+919876543210';
    const hashed = hashForErasure(originalPhone);
    assert(
      hashed.length === 64 && !hashed.includes('9876543210'),
      'TEST 4: hashForErasure() generates irreversible 64-char HMAC-SHA256 hex string'
    );

    // TEST 5: Super Admin executes dual-key atomic erasure on eligible unconverted records
    const execRes = await ErasureService.executeErasureRequest(
      superAdmin,
      reqRes.requestId,
      '103.21.244.1'
    );
    assert(
      execRes.status === 'APPROVED_EXECUTED' &&
      execRes.summary?.userAccountAnonymized === true &&
      execRes.summary?.unconvertedLeadsAnonymized === 1,
      'TEST 5: Super Admin dual-key review approves & executes atomic PostgreSQL erasure (accurate affected counts)'
    );

    // TEST 6: Reprocessing an already executed request is rejected
    try {
      await ErasureService.executeErasureRequest(superAdmin, reqRes.requestId, '103.21.244.1');
      assert(false, 'TEST 6: Re-executing processed request should have failed');
    } catch (err: any) {
      assert(
        err.message.includes('has already been processed'),
        'TEST 6: Idempotency guard prevents duplicate re-execution of finalized erasure'
      );
    }
  } finally {
    // Reset test double hook
    setTestQueryHandler(null);
  }

  return { passed, failed, results };
}
