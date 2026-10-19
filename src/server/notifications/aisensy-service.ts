import { recordAuditEvent } from '../audit/logger';

/**
 * AiSensy WhatsApp Business API Integration Service
 *
 * Implements WhatsApp notification delivery via AiSensy Campaign API:
 * https://backend.aisensy.com/campaign/t1/api/v2
 *
 * Requirements:
 * 1. Environment variables:
 *    - AISENSY_API_KEY
 *    - AISENSY_CAMPAIGN_PROPERTY_LISTED
 *    - AISENSY_CAMPAIGN_PROPERTY_PUBLISHED
 *    - AISENSY_CAMPAIGN_PROPERTY_VERIFIED
 *    - AISENSY_CAMPAIGN_PROPERTY_ACTION_REQUIRED
 * 2. Non-blocking background dispatch (fails soft, does not block user requests)
 * 3. Idempotent delivery deduplication to prevent double-messaging
 * 4. Bounded exponential backoff retries (maximum 3 attempts)
 * 5. Indian mobile phone validation (91XXXXXXXXXX)
 * 6. Zero credential leakage to logs, frontend bundles, or browser APIs
 */

export interface AiSensyMessagePayload {
  apiKey: string;
  campaignName: string;
  destination: string;
  userName: string;
  templateParams: string[];
  source?: string;
  media?: Record<string, any>;
  buttons?: any[];
}

export interface DispatchedAiSensyRecord {
  id: string;
  campaignName: string;
  destination: string;
  userName: string;
  templateParams: string[];
  propertyId?: string;
  status: 'DELIVERED' | 'FAILED' | 'SIMULATED' | 'SKIPPED_UNCONFIGURED' | 'SKIPPED_INVALID_PHONE';
  attempts: number;
  providerResponse?: any;
  error?: string;
  timestamp: string;
}

export type AiSensyDispatcherFn = (payload: AiSensyMessagePayload) => Promise<{ success: boolean; data?: any; error?: string }>;

export class AiSensyNotificationService {
  private static readonly ENDPOINT = 'https://backend.aisensy.com/campaign/t1/api/v2';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_BASE_DELAY_MS = 500;

  // In-memory idempotency deduplication cache
  private static sentCampaignKeys = new Set<string>();

  // In-memory test dispatch ledger
  private static dispatchedLedger: DispatchedAiSensyRecord[] = [];

  // Custom dispatcher override for unit testing
  private static mockDispatcher: AiSensyDispatcherFn | null = null;

  public static setMockDispatcher(dispatcher: AiSensyDispatcherFn | null): void {
    this.mockDispatcher = dispatcher;
  }

  public static getDispatchedMessages(): DispatchedAiSensyRecord[] {
    return [...this.dispatchedLedger];
  }

  public static clearDispatchedMessages(): void {
    this.dispatchedLedger = [];
    this.sentCampaignKeys.clear();
  }

  /**
   * Normalize an Indian phone number to 91XXXXXXXXXX format required by AiSensy
   */
  public static normalizePhoneNumber(rawPhone: string): string {
    const cleaned = String(rawPhone || '').replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned;
    }
    if (cleaned.length > 10) {
      return cleaned.slice(-12);
    }
    return cleaned;
  }

  /**
   * Validate whether a normalized phone number is a valid Indian mobile number (91 + 10 digits starting with 6-9)
   */
  public static isValidPhoneNumber(rawPhone: string): boolean {
    const normalized = this.normalizePhoneNumber(rawPhone);
    return /^91[6-9]\d{9}$/.test(normalized);
  }

  /**
   * Return truthful provider status without exposing the secret API key
   */
  public static getProviderStatus(): {
    configured: boolean;
    provider: string;
    endpoint: string;
    campaigns: {
      propertyListed: string;
      propertyPublished: string;
      propertyVerified: string;
      propertyActionRequired: string;
    };
  } {
    const apiKey = process.env.AISENSY_API_KEY;
    return {
      configured: Boolean(apiKey && apiKey.trim().length > 5),
      provider: 'AiSensy WhatsApp Business API',
      endpoint: this.ENDPOINT,
      campaigns: {
        propertyListed: process.env.AISENSY_CAMPAIGN_PROPERTY_LISTED || 'property_listed',
        propertyPublished: process.env.AISENSY_CAMPAIGN_PROPERTY_PUBLISHED || 'property_published',
        propertyVerified: process.env.AISENSY_CAMPAIGN_PROPERTY_VERIFIED || 'property_verified',
        propertyActionRequired: process.env.AISENSY_CAMPAIGN_PROPERTY_ACTION_REQUIRED || 'property_action_required',
      },
    };
  }

  /**
   * Process incoming AiSensy delivery/read status webhooks
   */
  public static async handleWebhookCallback(payload: any): Promise<{ handled: boolean; status?: string; messageId?: string }> {
    if (!payload || typeof payload !== 'object') {
      return { handled: false };
    }

    const messageId = payload.messageId || payload.id || payload.data?.messageId;
    const status = payload.status || payload.event || payload.data?.status;
    const destination = payload.destination || payload.mobile || payload.data?.destination;

    if (!messageId && !status) {
      return { handled: false };
    }

    const existing = this.dispatchedLedger.find(
      (r) => r.providerResponse?.messageId === messageId || r.providerResponse?.data?.messageId === messageId
    );
    if (existing && status) {
      existing.providerResponse = {
        ...existing.providerResponse,
        deliveryStatus: status,
        webhookPayload: payload,
      };
    }

    try {
      await recordAuditEvent({
        actor: { uid: 'aisensy-webhook', roles: ['SYSTEM'], permissions: [] },
        action: 'WHATSAPP_NOTIFICATION_SENT',
        targetEntity: 'notifications',
        targetEntityId: messageId || 'unknown',
        clientIp: '127.0.0.1',
        diffSummary: {
          channel: 'WHATSAPP_AISENSY_CALLBACK',
          status,
          destination: destination ? `${String(destination).slice(0, 4)}****` : undefined,
        },
      });
    } catch {}

    return { handled: true, status, messageId };
  }

  /**
   * Internal sender with bounded exponential backoff retries and non-blocking safety
   */
  private static async sendCampaignWithRetry(
    campaignName: string,
    phone: string,
    userName: string,
    templateParams: string[],
    propertyId?: string,
    idempotencyKey?: string
  ): Promise<DispatchedAiSensyRecord> {
    // 1. Recipient Phone Validation Guard
    if (!this.isValidPhoneNumber(phone)) {
      console.warn(`[AiSensy] Invalid recipient phone number "${phone}" for campaign "${campaignName}". Expected 10-digit Indian mobile.`);
      const invalidRecord: DispatchedAiSensyRecord = {
        id: `skip-invalid-phone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        campaignName,
        destination: phone,
        userName,
        templateParams,
        propertyId,
        status: 'SKIPPED_INVALID_PHONE',
        attempts: 0,
        error: `Invalid Indian mobile number: "${phone}". Expected 10 digits starting with 6-9.`,
        timestamp: new Date().toISOString(),
      };
      this.dispatchedLedger.push(invalidRecord);
      return invalidRecord;
    }

    const destination = this.normalizePhoneNumber(phone);
    const key = idempotencyKey || `${campaignName}:${propertyId || 'global'}:${destination}`;

    // 2. Idempotency Guard (Deduplication)
    if (this.sentCampaignKeys.has(key)) {
      const skipRecord: DispatchedAiSensyRecord = {
        id: `skip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        campaignName,
        destination,
        userName,
        templateParams,
        propertyId,
        status: 'SIMULATED',
        attempts: 0,
        providerResponse: { message: 'Duplicate campaign dispatch skipped via idempotency guard' },
        timestamp: new Date().toISOString(),
      };
      this.dispatchedLedger.push(skipRecord);
      return skipRecord;
    }

    const apiKey = process.env.AISENSY_API_KEY;
    const isDevOrTest =
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_DEV_FALLBACKS === 'true' ||
      process.env.RUNNING_TESTS === 'true';

    // 3. Unconfigured Fail-Soft Check
    if (!apiKey) {
      if (isDevOrTest) {
        this.sentCampaignKeys.add(key);
        const simRecord: DispatchedAiSensyRecord = {
          id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          campaignName,
          destination,
          userName,
          templateParams,
          propertyId,
          status: 'SIMULATED',
          attempts: 1,
          providerResponse: { simulated: true, note: 'Simulated AiSensy message in dev/test' },
          timestamp: new Date().toISOString(),
        };
        this.dispatchedLedger.push(simRecord);
        return simRecord;
      }

      console.warn(`[AiSensy] AISENSY_API_KEY is not configured; skipping WhatsApp campaign: ${campaignName} to ${destination}`);
      const unconfRecord: DispatchedAiSensyRecord = {
        id: `unconf-${Date.now()}`,
        campaignName,
        destination,
        userName,
        templateParams,
        propertyId,
        status: 'SKIPPED_UNCONFIGURED',
        attempts: 0,
        error: 'AISENSY_API_KEY environment variable is not configured',
        timestamp: new Date().toISOString(),
      };
      this.dispatchedLedger.push(unconfRecord);
      return unconfRecord;
    }

    const payload: AiSensyMessagePayload = {
      apiKey,
      campaignName,
      destination,
      userName: userName || 'Customer',
      templateParams,
      source: 'sellmyghar-backend',
    };

    let lastError: string | null = null;
    let attempts = 0;
    let providerData: any = null;

    // 4. Bounded Retry Loop with Exponential Backoff
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      attempts = attempt;
      try {
        if (this.mockDispatcher) {
          const res = await this.mockDispatcher(payload);
          if (res.success) {
            providerData = res.data || { ok: true };
            lastError = null;
            break;
          } else {
            throw new Error(res.error || 'Mock dispatcher failed');
          }
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(this.ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          providerData = await response.json().catch(() => ({ status: 'ok' }));
          lastError = null;
          break;
        } else {
          const errText = await response.text().catch(() => 'Unknown network error');
          lastError = `HTTP ${response.status}: ${errText}`;
          // 4xx client errors are deterministic; do not retry unless 429 rate limit
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            break;
          }
        }
      } catch (networkErr: any) {
        lastError = networkErr.name === 'AbortError' ? 'AiSensy HTTP request timed out after 8000ms' : networkErr.message;
      }

      // Exponential backoff wait before next attempt
      if (attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    const isSuccess = !lastError;
    if (isSuccess) {
      this.sentCampaignKeys.add(key);
    }

    const record: DispatchedAiSensyRecord = {
      id: `aisensy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      campaignName,
      destination,
      userName,
      templateParams,
      propertyId,
      status: isSuccess ? 'DELIVERED' : 'FAILED',
      attempts,
      providerResponse: providerData,
      error: lastError || undefined,
      timestamp: new Date().toISOString(),
    };

    this.dispatchedLedger.push(record);

    // Record statutory audit event (non-blocking, masked destination)
    try {
      await recordAuditEvent({
        actor: {
          uid: 'system-aisensy-worker',
          roles: ['SYSTEM'],
          permissions: [],
        },
        action: isSuccess ? 'WHATSAPP_NOTIFICATION_SENT' : 'WHATSAPP_NOTIFICATION_FAILED',
        targetEntity: 'properties',
        targetEntityId: propertyId || destination,
        clientIp: '127.0.0.1',
        diffSummary: {
          channel: 'WHATSAPP_AISENSY',
          campaign: campaignName,
          destination: `${destination.slice(0, 4)}****${destination.slice(-3)}`,
          status: record.status,
          attempts,
        },
      });
    } catch {}

    return record;
  }

  /**
   * 1. Triggered on successful Property Submission
   * Campaign: AISENSY_CAMPAIGN_PROPERTY_LISTED (default: "property_listed")
   * Params: [userName, referenceId, societyName, locality]
   */
  public static async handlePropertyListed(data: {
    ownerName: string;
    ownerPhone: string;
    referenceId: string;
    societyName: string;
    locality: string;
    propertyId: string;
    listingStatus?: string;
  }): Promise<DispatchedAiSensyRecord> {
    const campaignName = process.env.AISENSY_CAMPAIGN_PROPERTY_LISTED || 'property_listed';
    const params = [
      data.ownerName || 'Homeowner',
      data.referenceId || 'SMG-PENDING',
      data.societyName || 'Bengaluru Apartment',
      data.locality || 'Bengaluru',
    ];

    return this.sendCampaignWithRetry(
      campaignName,
      data.ownerPhone,
      data.ownerName,
      params,
      data.propertyId,
      `listed:${data.propertyId}:${data.ownerPhone}`
    );
  }

  /**
   * 2. Triggered on Property Publication (when listing becomes live)
   * Campaign: AISENSY_CAMPAIGN_PROPERTY_PUBLISHED (default: "property_published")
   * Params: [userName, propertyTitle, locality, referenceId]
   */
  public static async handlePropertyPublished(data: {
    ownerName: string;
    ownerPhone: string;
    title: string;
    locality: string;
    propertyId: string;
    referenceId?: string;
  }): Promise<DispatchedAiSensyRecord> {
    const campaignName = process.env.AISENSY_CAMPAIGN_PROPERTY_PUBLISHED || 'property_published';
    const params = [
      data.ownerName || 'Homeowner',
      data.title || 'Bengaluru Apartment',
      data.locality || 'Bengaluru',
      data.referenceId || `SMG-${data.propertyId.slice(-4).toUpperCase()}`,
    ];

    return this.sendCampaignWithRetry(
      campaignName,
      data.ownerPhone,
      data.ownerName,
      params,
      data.propertyId,
      `published:${data.propertyId}:${data.ownerPhone}`
    );
  }

  /**
   * 3. Triggered on CRM Staff Verification Approval
   * Campaign: AISENSY_CAMPAIGN_PROPERTY_VERIFIED (default: "property_verified")
   * Params: [userName, propertyTitle, locality]
   */
  public static async handlePropertyVerified(data: {
    ownerName: string;
    ownerPhone: string;
    title: string;
    locality: string;
    propertyId: string;
  }): Promise<DispatchedAiSensyRecord> {
    const campaignName = process.env.AISENSY_CAMPAIGN_PROPERTY_VERIFIED || 'property_verified';
    const params = [
      data.ownerName || 'Homeowner',
      data.title || 'Your Property',
      data.locality || 'Bengaluru',
    ];

    return this.sendCampaignWithRetry(
      campaignName,
      data.ownerPhone,
      data.ownerName,
      params,
      data.propertyId,
      `verified:${data.propertyId}:${data.ownerPhone}`
    );
  }

  /**
   * 4. Triggered on CRM Staff Action Required / Document Request
   * Campaign: AISENSY_CAMPAIGN_PROPERTY_ACTION_REQUIRED (default: "property_action_required")
   * Params: [userName, propertyTitle, actionRequiredText]
   */
  public static async handlePropertyActionRequired(data: {
    ownerName: string;
    ownerPhone: string;
    title: string;
    actionRequiredText: string;
    propertyId: string;
  }): Promise<DispatchedAiSensyRecord> {
    const campaignName = process.env.AISENSY_CAMPAIGN_PROPERTY_ACTION_REQUIRED || 'property_action_required';
    const params = [
      data.ownerName || 'Homeowner',
      data.title || 'Your Property',
      data.actionRequiredText || 'Additional documentation requested by relationship manager',
    ];

    return this.sendCampaignWithRetry(
      campaignName,
      data.ownerPhone,
      data.ownerName,
      params,
      data.propertyId,
      `action_req:${data.propertyId}:${data.ownerPhone}:${Date.now().toString(36).slice(0, 5)}`
    );
  }
}
