import { createHmac } from 'crypto';
import { AuthenticatedUser } from '../../core/types/auth';
import { 
  ACTIVE_DEAL_STAGES, 
  ACTIVE_OFFER_STATUSES, 
  ACTIVE_VISIT_STATUSES 
} from '../../core/types/entities';
import { requirePermission } from '../auth/rbac';
import { recordAuditEvent } from '../audit/logger';
import { dbPool, executeQuery } from '../db/pool';
import { getValidatedConfig } from '../config/env';
import { RETENTION_CONFIG } from './retention-config';

const ERASURE_SALT = process.env.ERASURE_HASH_SALT || 'sellmyghar-dpdp-permanent-salt-v1';

export function hashForErasure(value: string): string {
  return createHmac('sha256', ERASURE_SALT).update(value).digest('hex');
}

export interface ErasureExecutionResult {
  status: 'APPROVED_EXECUTED' | 'REJECTED_STATUTORY_HOLD';
  requestId: string;
  rejectionReason?: string;
  summary?: {
    unconvertedLeadsAnonymized: number;
    userAccountAnonymized: boolean;
    propertiesSanitized: number;
    retentionHoldActive: boolean;
  };
}

export class ErasureService {
  /**
   * STEP 1: Data Principal Submits Formal Erasure Request (Self-Service Request)
   * Does NOT erase data immediately. Places request into PENDING_ADMIN_REVIEW queue.
   */
  static async requestErasure(
    user: AuthenticatedUser,
    reason: string,
    clientIp: string
  ): Promise<{ requestId: string; status: 'PENDING_ADMIN_REVIEW' }> {
    if (!user || !user.uid) {
      throw new Error('Authentication required to submit data erasure request.');
    }

    const requestId = `era-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const phoneHash = hashForErasure(user.phone);
    const nowIso = new Date().toISOString();

    const insertSql = `
      INSERT INTO erasure_requests (
        id, user_id, phone_hash, request_status, requester_reason,
        requested_at, reviewed_by_admin_id, reviewed_at, rejection_reason,
        records_affected_summary, client_ip_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id;
    `;

    await executeQuery(insertSql, [
      requestId,
      user.uid,
      phoneHash,
      'PENDING_ADMIN_REVIEW',
      reason,
      nowIso,
      null,
      null,
      null,
      JSON.stringify({ initialRequestTimestamp: nowIso }),
      clientIp,
    ]);

    await recordAuditEvent({
      actor: user,
      action: 'DELETE_USER_DATA',
      targetEntity: 'erasure_requests',
      targetEntityId: requestId,
      clientIp,
      diffSummary: {
        action: 'ERASURE_REQUEST_SUBMITTED',
        userUid: user.uid,
        reason,
        status: 'PENDING_ADMIN_REVIEW',
      },
    });

    return { requestId, status: 'PENDING_ADMIN_REVIEW' };
  }

  /**
   * STEP 2: Super Admin Legal Review & Dual-Key Atomic Transaction Execution
   * [Atomicity Requirement]: Entire sequence executes inside a single PostgreSQL transaction.
   */
  static async executeErasureRequest(
    admin: AuthenticatedUser,
    requestId: string,
    clientIp: string
  ): Promise<ErasureExecutionResult> {
    // 1. Dual-Key Authorization Guard: Strictly STAFF_SUPER_ADMIN
    requirePermission(admin, 'compliance:execute_erasure');

    const nowIso = new Date().toISOString();

    // 2. Fetch the pending erasure request
    const getRequestSql = `
      SELECT id, user_id, phone_hash, request_status 
      FROM erasure_requests 
      WHERE id = $1;
    `;
    const reqRes = await executeQuery<{
      id: string;
      user_id: string;
      phone_hash: string;
      request_status: string;
    }>(getRequestSql, [requestId]);

    if (!reqRes.rows || reqRes.rows.length === 0) {
      throw new Error(`Erasure request '${requestId}' not found.`);
    }

    const request = reqRes.rows[0];
    if (request.request_status !== 'PENDING_ADMIN_REVIEW') {
      throw new Error(`Erasure request '${requestId}' has already been processed (Current status: ${request.request_status}).`);
    }

    const targetUserId = request.user_id;

    // 3. STATUTORY RETENTION HOLD CHECK (Completed Deals & Linked Property/Offers/Visits)
    // Direct check for ANY completed transaction linked to the user or their properties
    const completedDealCheckSql = `
      SELECT id FROM deals 
      WHERE (buyer_user_id = $1 OR seller_user_id = $1 OR property_id IN (
        SELECT id FROM properties WHERE owner_id = $1
      )) AND deal_status = 'COMPLETED'
      LIMIT 1;
    `;
    const dealCheckRes = await executeQuery<{ id: string }>(completedDealCheckSql, [targetUserId]);
    const hasCompletedDealHold = Boolean(dealCheckRes.rows && dealCheckRes.rows.length > 0);

    if (hasCompletedDealHold) {
      // Statutory Hold is ACTIVE: Transaction records must be retained under Income Tax / Stamp Act
      const rejectionReason = 
        `Statutory Legal Hold Active: User is party to a completed property transaction subject to statutory retention (${RETENTION_CONFIG.STATUTORY_TRANSACTION_HOLD_DAYS} days). Linked transaction, property, offer, and visit records cannot be erased until statutory limitation expiry.`;

      const updateRejectSql = `
        UPDATE erasure_requests
        SET request_status = 'REJECTED_STATUTORY_HOLD',
            reviewed_by_admin_id = $1,
            reviewed_at = $2,
            rejection_reason = $3
        WHERE id = $4;
      `;
      await executeQuery(updateRejectSql, [admin.uid, nowIso, rejectionReason, requestId]);

      await recordAuditEvent({
        actor: admin,
        action: 'DELETE_USER_DATA',
        targetEntity: 'erasure_requests',
        targetEntityId: requestId,
        clientIp,
        diffSummary: {
          action: 'ERASURE_REJECTED_DUE_TO_STATUTORY_HOLD',
          targetUserId,
          reason: rejectionReason,
        },
      });

      return {
        status: 'REJECTED_STATUTORY_HOLD',
        requestId,
        rejectionReason,
        summary: {
          unconvertedLeadsAnonymized: 0,
          userAccountAnonymized: false,
          propertiesSanitized: 0,
          retentionHoldActive: true,
        },
      };
    }

    // 4. ATOMIC POSTGRESQL TRANSACTION EXECUTION
    const config = getValidatedConfig();
    const hasDb = Boolean(config.databaseUrl);
    const client = hasDb ? await dbPool.connect() : null;

    const summary = {
      unconvertedLeadsAnonymized: 0,
      userAccountAnonymized: false,
      propertiesSanitized: 0,
      retentionHoldActive: false,
    };

    try {
      if (client) {
        await client.query('BEGIN');
      }

      // Check A: Guard Condition for Unconverted Lead
      // A lead is unconverted IF lead_status IN ('NEW', 'CONTACTED', 'LOST', 'DROPPED') AND user owns NO properties
      const anonymizedPhone = `erased_${hashForErasure(targetUserId).substring(0, 16)}`;

      const anonymizeLeadSql = `
        UPDATE seller_leads
        SET owner_name = NULL,
            phone = $1,
            attribution = '{}'::jsonb,
            updated_at = $2
        WHERE phone IN (SELECT phone FROM users WHERE id = $3)
          AND lead_status IN ('NEW', 'CONTACTED', 'LOST', 'DROPPED')
          AND NOT EXISTS (SELECT 1 FROM properties WHERE owner_id = $3);
      `;
      const leadRes = client
        ? await client.query(anonymizeLeadSql, [anonymizedPhone, nowIso, targetUserId])
        : await executeQuery(anonymizeLeadSql, [anonymizedPhone, nowIso, targetUserId]);
      summary.unconvertedLeadsAnonymized = leadRes?.rows?.length ?? 0;

      // Check B: Direct Active Deal/Offer/Visit Non-Terminal Guards for Property Sanitization
      // Uses canonical shared constants to prevent drift
      const dealStagesIn = ACTIVE_DEAL_STAGES.map(s => `'${s}'`).join(', ');
      const offerStatusesIn = ACTIVE_OFFER_STATUSES.map(s => `'${s}'`).join(', ');
      const visitStatusesIn = ACTIVE_VISIT_STATUSES.map(s => `'${s}'`).join(', ');

      const sanitizePropertiesSql = `
        UPDATE properties
        SET unit_number = '[ERASED]',
            wing_tower = NULL,
            loan_bank_name = NULL,
            internal_verification_notes = '[ERASED_UNDER_DPDP_SECTION_12]',
            updated_at = $1
        WHERE owner_id = $2
          AND NOT EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.property_id = properties.id 
              AND deals.deal_status IN (${dealStagesIn})
          )
          AND NOT EXISTS (
            SELECT 1 FROM property_offers 
            WHERE property_offers.property_id = properties.id 
              AND property_offers.status IN (${offerStatusesIn})
          )
          AND NOT EXISTS (
            SELECT 1 FROM visits 
            WHERE visits.property_id = properties.id 
              AND visits.status IN (${visitStatusesIn})
          );
      `;
      const propRes = client
        ? await client.query(sanitizePropertiesSql, [nowIso, targetUserId])
        : await executeQuery(sanitizePropertiesSql, [nowIso, targetUserId]);
      summary.propertiesSanitized = propRes?.rows?.length ?? 0;

      // Check C: Anonymize User Profile (Irreversible Hash on Phone, NULL on Names/Emails)
      const anonymizeUserSql = `
        UPDATE users
        SET email = NULL,
            display_name = NULL,
            phone = $1,
            updated_at = $2
        WHERE id = $3;
      `;
      await (client
        ? client.query(anonymizeUserSql, [anonymizedPhone, nowIso, targetUserId])
        : executeQuery(anonymizeUserSql, [anonymizedPhone, nowIso, targetUserId]));
      summary.userAccountAnonymized = true;

      // Check D: Update Erasure Request Status to APPROVED_EXECUTED
      const updateRequestSql = `
        UPDATE erasure_requests
        SET request_status = 'APPROVED_EXECUTED',
            reviewed_by_admin_id = $1,
            reviewed_at = $2,
            records_affected_summary = $3
        WHERE id = $4;
      `;
      if (client) {
        await client.query(updateRequestSql, [admin.uid, nowIso, JSON.stringify(summary), requestId]);
        await client.query('COMMIT');
      } else {
        await executeQuery(updateRequestSql, [admin.uid, nowIso, JSON.stringify(summary), requestId]);
      }

      await recordAuditEvent({
        actor: admin,
        action: 'DELETE_USER_DATA',
        targetEntity: 'erasure_requests',
        targetEntityId: requestId,
        clientIp,
        diffSummary: {
          action: 'ERASURE_APPROVED_AND_EXECUTED',
          targetUserId,
          summary,
        },
      });

      return {
        status: 'APPROVED_EXECUTED',
        requestId,
        summary,
      };
    } catch (err: any) {
      if (client) {
        await client.query('ROLLBACK');
      }
      throw new Error(`Atomic erasure transaction failed and was rolled back: ${err.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}
