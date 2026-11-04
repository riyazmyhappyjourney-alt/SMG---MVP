import crypto from 'crypto';

/**
 * Meta Conversions API (CAPI) & Conversion Leads CRM Integration Service
 * 
 * Complies with Meta Marketing API v21.0 / v26.0 specification for:
 * 1. Server-side event tracking (Lead, Contacted, Schedule, QualifiedLead, Conversion)
 * 2. Privacy-preserving SHA-256 hashing for customer information (em, ph)
 * 3. CRM Lead status synchronization with action_source: "system_generated"
 * 4. Test event validation with test_event_code support
 */

export interface MetaLeadEventOptions {
  eventName?: 'Lead' | 'Contacted' | 'Schedule' | 'QualifiedLead' | 'Conversion' | 'ClosedLost' | string;
  leadId?: string | number | null;
  phone?: string | null;
  email?: string | null;
  stage?: string | null;
  testEventCode?: string | null;
  customData?: Record<string, any>;
}

export function hashSha256(val: string): string {
  return crypto.createHash('sha256').update(val.trim()).digest('hex');
}

/**
 * Normalizes email: trim, lowercase, sha256
 */
export function hashEmail(email?: string | null): string | null {
  if (!email || typeof email !== 'string') return null;
  const clean = email.trim().toLowerCase();
  if (!clean.includes('@')) return null;
  return hashSha256(clean);
}

/**
 * Normalizes phone number: digits only, country code prefix (e.g. 919876543210), sha256
 */
export function hashPhone(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;
  // If 10 digits (Indian mobile), prefix with 91
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return hashSha256(normalized);
}

/**
 * Maps SellMyGhar CRM stages to Meta Conversion Leads standard event names
 */
export function mapCrmStageToMetaEvent(stage: string): string {
  const s = String(stage || '').toUpperCase();
  switch (s) {
    case 'NEW':
      return 'Lead';
    case 'CONTACTED':
    case 'FOLLOW_UP':
      return 'Contacted';
    case 'SITE_VISIT':
      return 'Schedule';
    case 'NEGOTIATION':
      return 'QualifiedLead';
    case 'CONVERTED':
    case 'WON':
      return 'Conversion';
    case 'LOST':
      return 'ClosedLost';
    default:
      return 'Lead';
  }
}

export class MetaConversionsApiService {
  static getDatasetId(): string {
    return (
      process.env.META_DATASET_ID ||
      process.env.META_PIXEL_ID ||
      '1501343261902642'
    );
  }

  static getAccessToken(): string | undefined {
    return (
      process.env.META_ACCESS_TOKEN ||
      process.env.META_CONVERSIONS_API_TOKEN ||
      undefined
    );
  }

  static getTestEventCode(): string | undefined {
    return process.env.META_TEST_EVENT_CODE || undefined;
  }

  /**
   * Dispatches a Lead or Lead Stage event to Meta Conversions API
   */
  static async sendLeadEvent(options: MetaLeadEventOptions): Promise<{
    success: boolean;
    eventsReceived?: number;
    fbtraceId?: string;
    error?: string;
    skipped?: boolean;
  }> {
    const accessToken = this.getAccessToken();
    const datasetId = this.getDatasetId();
    const testCode = options.testEventCode || this.getTestEventCode();

    if (!accessToken) {
      // Graceful no-op when token not yet configured in env
      return {
        success: false,
        skipped: true,
        error: 'META_ACCESS_TOKEN not configured in server environment.',
      };
    }

    try {
      const eventName = options.eventName || mapCrmStageToMetaEvent(options.stage || 'NEW');
      const hashedEm = hashEmail(options.email);
      const hashedPh = hashPhone(options.phone);

      const userData: Record<string, any> = {};
      if (hashedEm) userData.em = [hashedEm];
      if (hashedPh) userData.ph = [hashedPh];

      // Meta 15-17 digit Lead ID if available
      if (options.leadId) {
        const strId = String(options.leadId).trim();
        if (/^\d{15,18}$/.test(strId)) {
          userData.lead_id = strId;
        }
      }

      const payload: Record<string, any> = {
        data: [
          {
            action_source: 'system_generated',
            custom_data: {
              event_source: 'crm',
              lead_event_source: 'SellMyGhar CRM',
              ...(options.customData || {}),
            },
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            user_data: userData,
          },
        ],
      };

      if (testCode) {
        payload.test_event_code = testCode;
      }

      const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(datasetId)}/events?access_token=${encodeURIComponent(accessToken)}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.warn('[MetaCAPI] Dispatch error from Graph API:', data);
        return {
          success: false,
          error: data.error?.message || 'Meta Graph API returned an error',
          fbtraceId: data.error?.fbtrace_id,
        };
      }

      console.info(`[MetaCAPI] Successfully sent "${eventName}" event to Dataset ${datasetId} (trace: ${data.fbtrace_id || 'ok'})`);
      return {
        success: true,
        eventsReceived: data.events_received || 1,
        fbtraceId: data.fbtrace_id,
      };
    } catch (err: any) {
      console.warn('[MetaCAPI] Network dispatch exception:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}
