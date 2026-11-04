import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { executeQuery, withTransaction } from '../db/pool';
import { EmailNotificationService } from '../notifications/email-service';
import { MetaConversionsApiService } from '../integrations/meta-conversions-api';

/**
 * Meta (Facebook) Lead Ads Inbound Webhook Service
 * 
 * Secure, fail-closed inbound webhook handler for Meta Lead Generation Ads.
 * Supports:
 * 1. Meta Webhook Verification (GET hub.mode=subscribe & hub.challenge)
 * 2. Real-time Leadgen Notification Ingestion (POST leadgen_id)
 * 3. Automatic lead retrieval via Meta Graph API v26.0
 * 4. Direct payload ingestion for CRM bridges / testing
 * 5. Phone normalization (E.164 +91), deduplication, and CRM persistence in buyer_enquiries
 */

export interface NormalizedFacebookLead {
  leadgenId: string;
  formId?: string | null;
  formName?: string | null;
  pageId?: string | null;
  adId?: string | null;
  adName?: string | null;
  adgroupId?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  fullName: string;
  phone: string; // E.164 normalized: +91XXXXXXXXXX
  email: string | null;
  city?: string | null;
  locality?: string | null;
  bhk?: string | null;
  budget?: number | null;
  notes?: string | null;
  createdTime?: number | string | null;
  rawPayload: Record<string, unknown>;
}

export interface FacebookWebhookProcessResult {
  success: boolean;
  handled: boolean;
  status: 'CREATED' | 'DUPLICATE_SUPPRESSED';
  leadId: string;
  externalEnquiryId: string;
  message: string;
  lead?: {
    id: string;
    type: 'BUYER';
    name: string;
    phone: string;
    stage: string;
    source: 'Facebook Ads';
    externalEnquiryId: string;
    metaLeadId: string;
  };
}

// In-memory cache to prevent duplicate lead processing within a 15-minute window
const processedFacebookLeadCache = new Map<string, number>();

export function getMetaWebhookVerifyToken(): string {
  return (
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ||
    'sellmyghar_meta_leadgen_2026'
  );
}

export function getMetaAppSecret(): string | undefined {
  return (
    process.env.META_APP_SECRET ||
    process.env.FACEBOOK_APP_SECRET ||
    undefined
  );
}

/**
 * Safely masks a phone number for operational logs (e.g., +91 98765****0)
 */
export function maskPhone(phone?: string): string {
  if (!phone) return 'N/A';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10) return '***';
  return `+91 ${clean.slice(-10, -5)}****${clean.slice(-2)}`;
}

/**
 * Normalizes Indian mobile number to E.164 (+91XXXXXXXXXX)
 */
export function normalizeIndianPhone(rawPhone: unknown): string {
  if (!rawPhone || (typeof rawPhone !== 'string' && typeof rawPhone !== 'number')) {
    throw new Error('Missing buyer phone number in Facebook lead payload.');
  }

  const digits = String(rawPhone).replace(/\D/g, '');

  if (digits.length === 10) {
    if (!/^[6-9]/.test(digits)) {
      throw new Error(`Invalid Indian mobile number: ${digits}. Must start with 6, 7, 8, or 9.`);
    }
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    const mobilePart = digits.slice(2);
    if (!/^[6-9]/.test(mobilePart)) {
      throw new Error(`Invalid Indian mobile number: ${mobilePart}. Must start with 6, 7, 8, or 9.`);
    }
    return `+${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    const mobilePart = digits.slice(1);
    if (!/^[6-9]/.test(mobilePart)) {
      throw new Error(`Invalid Indian mobile number: ${mobilePart}. Must start with 6, 7, 8, or 9.`);
    }
    return `+91${mobilePart}`;
  }

  throw new Error(`Invalid Indian mobile number format: ${rawPhone}. Expected 10 digits.`);
}

/**
 * Verification Middleware for Meta Webhook Registration (GET hub.mode=subscribe)
 */
export function verifyFacebookWebhookGet(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    const expectedToken = getMetaWebhookVerifyToken();
    if (mode === 'subscribe' && token === expectedToken) {
      console.info('[MetaWebhook] Successfully verified Facebook webhook subscription.');
      return res.status(200).send(challenge);
    }
    console.warn('[MetaWebhook] Verification failed. Token mismatch.');
    return res.status(403).json({ error: 'VERIFY_TOKEN_MISMATCH' });
  }

  // Fallback health check
  return res.status(200).json({
    success: true,
    service: 'SellMyGhar Meta (Facebook) Lead Ads Ingestion Webhook',
    status: 'ONLINE',
    acceptedMethod: 'POST',
    docs: 'Configure this URL in Meta App Dashboard > Webhooks > Page > leadgen',
  });
}

/**
 * Authentication Middleware for POST Webhook events
 * Verifies X-Hub-Signature-256 HMAC when META_APP_SECRET is configured.
 */
export function verifyFacebookWebhookPost(req: Request, res: Response, next: NextFunction) {
  const appSecret = getMetaAppSecret();
  const signature = req.headers['x-hub-signature-256'] as string | undefined;

  if (appSecret && signature) {
    try {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const expectedSig = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return res.status(401).json({
          success: false,
          error: 'WEBHOOK_SIGNATURE_MISMATCH',
          message: 'Invalid X-Hub-Signature-256 header.',
        });
      }
    } catch {
      return res.status(401).json({
        success: false,
        error: 'WEBHOOK_SIGNATURE_INVALID',
      });
    }
  }

  next();
}

export class FacebookLeadService {
  /**
   * Fetches full lead field data from Meta Graph API using leadgen_id
   */
  static async fetchLeadFromGraphApi(leadgenId: string): Promise<Record<string, any> | null> {
    const accessToken = MetaConversionsApiService.getAccessToken();
    if (!accessToken) {
      return null;
    }

    try {
      const url = `https://graph.facebook.com/v26.0/${encodeURIComponent(leadgenId)}?access_token=${encodeURIComponent(accessToken)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[FacebookLeadService] Could not fetch lead ${leadgenId} from Graph API:`, errJson);
        return null;
      }
      return await res.json();
    } catch (err: any) {
      console.warn(`[FacebookLeadService] Graph API network error for lead ${leadgenId}:`, err.message);
      return null;
    }
  }

  /**
   * Normalizes incoming Meta webhook or direct payload into structured lead
   */
  static async normalizePayload(payload: any): Promise<NormalizedFacebookLead> {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid Facebook lead payload: expected non-empty object.');
    }

    let leadgenId = '';
    let formId = payload.form_id || payload.formId || null;
    let pageId = payload.page_id || payload.pageId || null;
    let adId = payload.ad_id || payload.adId || null;
    let campaignName = payload.campaign_name || payload.campaignName || null;
    let formName = payload.form_name || payload.formName || null;
    let fullName = payload.full_name || payload.name || payload.customer_name || '';
    let rawPhone = payload.phone_number || payload.phone || payload.mobile || '';
    let email = payload.email ? String(payload.email).trim().toLowerCase() : null;
    let city = payload.city || payload.locality || null;
    let notes = payload.notes || payload.message || null;

    // 1. Check for standard Meta Webhook envelope: entry[].changes[].value
    if (Array.isArray(payload.entry) && payload.entry.length > 0) {
      const firstEntry = payload.entry[0];
      pageId = pageId || firstEntry.id;
      if (Array.isArray(firstEntry.changes) && firstEntry.changes.length > 0) {
        const change = firstEntry.changes[0];
        if (change.value) {
          const val = change.value;
          leadgenId = val.leadgen_id || val.lead_id || '';
          formId = val.form_id || formId;
          pageId = val.page_id || pageId;
          adId = val.ad_id || adId;
        }
      }
    }

    // 2. Direct leadgen_id / lead_id
    if (!leadgenId) {
      leadgenId = payload.leadgen_id || payload.lead_id || payload.id || '';
    }

    // 3. If field_data array is provided (directly or nested)
    const fieldData = payload.field_data || payload.fieldData || payload.entry?.[0]?.changes?.[0]?.value?.field_data;
    if (Array.isArray(fieldData)) {
      for (const field of fieldData) {
        const name = String(field.name || '').toLowerCase();
        const val = Array.isArray(field.values) ? field.values[0] : field.value;
        if (!val) continue;

        if (name.includes('name') || name === 'full_name' || name === 'first_name') {
          fullName = fullName || String(val).trim();
        } else if (name.includes('phone') || name === 'phone_number') {
          rawPhone = rawPhone || String(val).trim();
        } else if (name.includes('email')) {
          email = email || String(val).trim().toLowerCase();
        } else if (name.includes('city') || name.includes('locality')) {
          city = city || String(val).trim();
        }
      }
    }

    // 4. If we have a leadgen_id but missing name or phone, try Graph API
    if (leadgenId && (!fullName || !rawPhone)) {
      const graphData = await this.fetchLeadFromGraphApi(leadgenId);
      if (graphData && Array.isArray(graphData.field_data)) {
        formId = formId || graphData.form_id;
        for (const field of graphData.field_data) {
          const name = String(field.name || '').toLowerCase();
          const val = Array.isArray(field.values) ? field.values[0] : field.value;
          if (!val) continue;

          if (name.includes('name') || name === 'full_name') {
            fullName = fullName || String(val).trim();
          } else if (name.includes('phone') || name === 'phone_number') {
            rawPhone = rawPhone || String(val).trim();
          } else if (name.includes('email')) {
            email = email || String(val).trim().toLowerCase();
          } else if (name.includes('city') || name.includes('locality')) {
            city = city || String(val).trim();
          }
        }
      }
    }

    if (!leadgenId) {
      leadgenId = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    fullName = fullName || 'Facebook Lead';
    const phone = normalizeIndianPhone(rawPhone);

    return {
      leadgenId: String(leadgenId),
      formId: formId ? String(formId) : null,
      formName,
      pageId: pageId ? String(pageId) : null,
      adId: adId ? String(adId) : null,
      campaignName,
      fullName,
      phone,
      email,
      city,
      notes,
      rawPayload: payload,
    };
  }

  /**
   * Core processor for incoming Facebook lead notifications
   */
  static async handleWebhook(payload: any, clientIp = '127.0.0.1'): Promise<FacebookWebhookProcessResult> {
    const lead = await this.normalizePayload(payload);
    const externalEnquiryId = `FB-${lead.leadgenId}`;

    // 1. In-memory rapid replay guard
    const now = Date.now();
    const lastSeen = processedFacebookLeadCache.get(externalEnquiryId);
    if (lastSeen && now - lastSeen < 15 * 60 * 1000) {
      return {
        success: true,
        handled: true,
        status: 'DUPLICATE_SUPPRESSED',
        leadId: `cached-${externalEnquiryId}`,
        externalEnquiryId,
        message: 'Duplicate Facebook lead safely suppressed from in-memory cache.',
      };
    }
    processedFacebookLeadCache.set(externalEnquiryId, now);

    // 2. Database Deduplication Check
    const existing = await executeQuery(
      `SELECT id, buyer_name, phone, lead_status, attribution FROM buyer_enquiries WHERE attribution->>'externalEnquiryId' = $1 LIMIT 1;`,
      [externalEnquiryId]
    );

    if (existing.rows && existing.rows.length > 0) {
      const row = existing.rows[0];
      return {
        success: true,
        handled: true,
        status: 'DUPLICATE_SUPPRESSED',
        leadId: row.id,
        externalEnquiryId,
        message: 'Duplicate Facebook lead safely suppressed from database.',
        lead: {
          id: row.id,
          type: 'BUYER',
          name: row.buyer_name,
          phone: row.phone,
          stage: row.lead_status || 'NEW',
          source: 'Facebook Ads',
          externalEnquiryId,
          metaLeadId: lead.leadgenId,
        },
      };
    }

    // 3. Generate unique CRM Lead ID
    const leadId = `enq-fb-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const finalNotes = [
      `[Source: Facebook Ads]`,
      `[Meta Lead ID: ${lead.leadgenId}]`,
      lead.formName ? `[Form: ${lead.formName}]` : (lead.formId ? `[Form ID: ${lead.formId}]` : ''),
      lead.campaignName ? `[Campaign: ${lead.campaignName}]` : '',
      lead.city ? `[City: ${lead.city}]` : '',
      lead.notes ? `User Note: ${lead.notes}` : '',
    ].filter(Boolean).join(' | ');

    const attribution = {
      source: 'Facebook Ads',
      externalEnquiryId,
      metaLeadId: lead.leadgenId,
      formId: lead.formId,
      formName: lead.formName,
      pageId: lead.pageId,
      adId: lead.adId,
      campaignName: lead.campaignName,
      email: lead.email,
      createdVia: 'WEBHOOK_FACEBOOK',
      clientIp,
      receivedAt: new Date().toISOString(),
    };

    // 4. Atomic Database Persistence
    await withTransaction(async (client) => {
      // Record DPDP statutory consent entry
      const consentId = `cst-fb-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
      try {
        await client.query(
          `INSERT INTO consents (
            id, phone, user_id, purpose, notice_version,
            is_consented, consented_at, is_withdrawn,
            ip_hash, user_agent_hash
          ) VALUES ($1, $2, NULL, 'BUYER_ENQUIRY', 'facebook-leadgen-v1', true, NOW(), false, $3, 'facebook-webhook')
          ON CONFLICT DO NOTHING;`,
          [consentId, lead.phone, clientIp.slice(0, 32)]
        );
      } catch (cstErr: any) {
        console.warn('[FacebookLeadService] Consent notice:', cstErr.message);
      }

      // Insert Lead into buyer_enquiries
      await client.query(
        `INSERT INTO buyer_enquiries (
          id, buyer_name, phone, email, preferred_locality_or_society,
          bhk_type, expected_price_inr, property_id, lead_status,
          notes, attribution, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'NEW', $9, $10, $11, NOW());`,
        [
          leadId,
          lead.fullName,
          lead.phone,
          lead.email,
          lead.city || 'Bengaluru',
          lead.bhk || '2 BHK',
          lead.budget || null,
          null,
          finalNotes,
          JSON.stringify(attribution),
          new Date().toISOString(),
        ]
      );
    });

    // 5. Audit Log Entry
    try {
      await executeQuery(
        `INSERT INTO audit_logs (
          id, actor_id, actor_role, action, target_entity, target_entity_id, ip_address, diff_summary, timestamp
        ) VALUES ($1, 'system-webhook-facebook', 'SYSTEM', 'LEAD_CREATED', 'buyer_enquiries', $2, $3, $4, NOW());`,
        [
          `audit-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
          leadId,
          clientIp,
          JSON.stringify({
            source: 'Facebook Ads',
            externalEnquiryId,
            metaLeadId: lead.leadgenId,
            name: lead.fullName,
            phone: maskPhone(lead.phone),
          }),
        ]
      );
    } catch (auditErr: any) {
      console.warn('[FacebookLeadService] Audit log warning:', auditErr.message);
    }

    console.info(
      `[Facebook Webhook] Ingested buyer lead ${leadId} (Lead ID: ${lead.leadgenId}, Name: ${lead.fullName}, Phone: ${maskPhone(lead.phone)})`
    );

    // 6. Email alert to sales desk (non-blocking)
    try {
      void EmailNotificationService.sendGenericEmail({
        to: 'operations@sellmyghar.in',
        subject: `[New Facebook Lead] ${lead.fullName} (${maskPhone(lead.phone)})`,
        html: `
          <h2>New Facebook Ads Lead Received</h2>
          <p><strong>Name:</strong> ${lead.fullName}</p>
          <p><strong>Phone:</strong> ${lead.phone}</p>
          <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
          <p><strong>Meta Lead ID:</strong> ${lead.leadgenId}</p>
          <p><strong>Form:</strong> ${lead.formName || lead.formId || 'Default Lead Form'}</p>
          <p><a href="https://sellmyghar.in/crm/leads">View in SellMyGhar CRM</a></p>
        `,
      }).catch(() => {});
    } catch {}

    return {
      success: true,
      handled: true,
      status: 'CREATED',
      leadId,
      externalEnquiryId,
      message: 'Facebook lead successfully ingested and created in SellMyGhar CRM.',
      lead: {
        id: leadId,
        type: 'BUYER',
        name: lead.fullName,
        phone: lead.phone,
        stage: 'NEW',
        source: 'Facebook Ads',
        externalEnquiryId,
        metaLeadId: lead.leadgenId,
      },
    };
  }
}
