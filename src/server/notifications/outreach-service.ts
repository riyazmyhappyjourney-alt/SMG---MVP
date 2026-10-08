import { SellerWorkflowService } from '../workflow/seller-service';
import { recordAuditEvent } from '../audit/logger';
import { AuthenticatedUser } from '../../core/types/auth';

/**
 * DPDP-Gated Customer Outreach & Messaging Dispatcher
 * 
 * [Statutory Compliance Requirement]:
 * Every communication channel (SMS, WhatsApp, transactional email, phone calls)
 * MUST call isEligibleForOutreach(phone, purpose) before dispatching messages.
 * If consent is missing, expired, or withdrawn, dispatch is strictly blocked.
 */

export interface OutreachPayload {
  recipientPhone: string;
  purpose: 'SELLER_ONBOARDING' | 'MARKETING_OPT_IN' | 'VISIT_COORDINATION';
  messageType: 'SMS' | 'WHATSAPP' | 'SYSTEM_NOTICE';
  templateId: string;
  templateVariables?: Record<string, string>;
}

export interface OutreachDispatchResult {
  dispatched: boolean;
  status: 'DELIVERED' | 'BLOCKED_BY_DPDP_CONSENT_POLICY' | 'DISPATCH_ERROR';
  blockedReason?: string;
  messageId?: string;
}

export class OutreachService {
  /**
   * Dispatches a customer notification strictly if permitted by DPDP statutory consent.
   */
  static async sendNotification(
    payload: OutreachPayload,
    actor?: AuthenticatedUser
  ): Promise<OutreachDispatchResult> {
    // 1. Mandatory DPDP Gatekeeper Check
    const isAllowed = await SellerWorkflowService.isEligibleForOutreach(
      payload.recipientPhone,
      payload.purpose
    );

    if (!isAllowed) {
      console.warn(
        `[DPDP OUTREACH BLOCKED] Contact to ${payload.recipientPhone} blocked for purpose '${payload.purpose}'. No active, unwithdrawn consent on record.`
      );

      // Audit the blocked outreach attempt
      if (actor) {
        await recordAuditEvent({
          actor,
          action: 'DELETE_USER_DATA',
          targetEntity: 'consents',
          targetEntityId: 'outreach-blocked',
          clientIp: '127.0.0.1',
          diffSummary: {
            action: 'OUTREACH_BLOCKED_DUE_TO_WITHDRAWN_CONSENT',
            phone: payload.recipientPhone,
            purpose: payload.purpose,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return {
        dispatched: false,
        status: 'BLOCKED_BY_DPDP_CONSENT_POLICY',
        blockedReason: `Customer has not provided or has withdrawn consent for purpose: ${payload.purpose}. Communication aborted.`,
      };
    }

    // 2. Dispatch simulated notification (DLT approved gateway in prod)
    const messageId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    console.info(`[OUTREACH DISPATCHED] Type: ${payload.messageType}, Recipient: ${payload.recipientPhone}, MsgId: ${messageId}`);

    return {
      dispatched: true,
      status: 'DELIVERED',
      messageId,
    };
  }
}
