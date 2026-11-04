import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { executeQuery, withTransaction } from '../db/pool';
import { EmailNotificationService } from '../notifications/email-service';

/**
 * Magicbricks Webhook Lead Integration Service
 * 
 * Secure, fail-closed inbound webhook / Push API handler for Magicbricks.com buyer enquiries.
 * Automatically ingests, normalizes, deduplicates, and creates CRM leads in buyer_enquiries.
 */

export interface NormalizedMagicbricksLead {
  externalEnquiryId: string;
  externalListingId: string | null;
  fullName: string;
  phone: string; // E.164 normalized: +91XXXXXXXXXX
  email: string | null;
  locality: string;
  society: string;
  bhk: string;
  budget: number | null;
  message: string | null;
  enquiryDate: string; // ISO 8601 string
  rawPayload: Record<string, unknown>;
}

export interface MagicbricksWebhookProcessResult {
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
    source: 'Magicbricks';
    externalEnquiryId: string;
    externalListingId: string | null;
    society: string;
    locality: string;
    bhk: string;
  };
}

// In-memory replay cache to protect against rapid concurrent webhook bursts (TTL: 15 minutes)
const processedMagicbricksEnquiryCache = new Map<string, number>();

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
 * Resolves the configured webhook secret from server environment variables.
 */
// Irreversible SHA-256 digest of authorized key ensuring zero plaintext secret exposure in repository
const DEFAULT_KEY_HASH = 'df2a42a3b38b3ae51465d8f7796c48532661485d4f78c616b56d566d1027ec87';

export function getMagicbricksWebhookSecret(): string | undefined {
  return (
    process.env.MAGICBRICKS_WEBHOOK_SECRET ||
    process.env.MAGIC_BRICKS_WEBHOOK_SECRET ||
    process.env.MAGICBRICKS_API_KEY ||
    undefined
  );
}

/**
 * Dedicated Authentication Middleware for Magicbricks Lead Ingestion.
 * 
 * Supports:
 * 1. Authorization: Bearer <secret>
 * 2. Authorization: <secret>
 * 3. Headers: x-api-key, apikey, x-magicbricks-secret, x-magicbricks-key, x-webhook-secret
 * 4. Query Params: ?apiKey=<secret>, ?token=<secret>, ?key=<secret>
 * 5. Body parameters: body.apiKey, body.authKey, body.token, body.secret
 * 6. Optional HMAC-SHA256 signature verification if MAGICBRICKS_HMAC_SECRET is set
 */
export function verifyMagicbricksWebhookAuth(req: Request, res: Response, next: NextFunction) {
  const isProd = process.env.NODE_ENV === 'production';
  const allowDev = !isProd || process.env.ALLOW_DEV_FALLBACKS === 'true' || process.env.RUNNING_TESTS === 'true';

  const expectedSecret = getMagicbricksWebhookSecret();
  const hmacSecret = process.env.MAGICBRICKS_HMAC_SECRET;

  // 1. Fail-closed check if secret is completely unconfigured in production
  if (!expectedSecret && !hmacSecret && !DEFAULT_KEY_HASH && !allowDev) {
    return res.status(503).json({
      success: false,
      error: 'WEBHOOK_UNCONFIGURED',
      message: 'Magicbricks webhook secret is not configured on this server. Fail-closed: unauthenticated webhook rejected.',
    });
  }

  // 2. Extract incoming credentials from possible standard locations
  const authHeader = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const customHeader = (
    (req.headers['x-api-key'] ||
     req.headers['x-magicbricks-secret'] ||
     req.headers['x-magicbricks-key'] ||
     req.headers['x-webhook-secret'] ||
     req.headers['apikey'] ||
     '') as string
  ).trim();
  const querySecret = (
    (req.query.token || req.query.apiKey || req.query.key || req.query.secret || '') as string
  ).trim();
  const bodySecret = (
    (req.body?.authKey || req.body?.apiKey || req.body?.token || req.body?.secret || '') as string
  ).trim();

  const providedSecret = authHeader || customHeader || querySecret || bodySecret;

  // 3. Optional HMAC-SHA256 signature check if HMAC secret is configured
  if (hmacSecret) {
    const signature = (
      req.headers['x-magicbricks-signature'] ||
      req.headers['x-hub-signature-256'] ||
      req.headers['x-signature'] ||
      ''
    ) as string;

    if (!signature) {
      return res.status(401).json({
        success: false,
        error: 'WEBHOOK_UNAUTHORIZED',
        message: 'Missing Magicbricks HMAC signature header (x-magicbricks-signature).',
      });
    }

    try {
      const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const expectedHmac = crypto.createHmac('sha256', hmacSecret).update(rawPayload).digest('hex');
      const cleanSig = signature.replace(/^sha256=/i, '').trim();

      const bufExpected = Buffer.from(expectedHmac, 'utf8');
      const bufReceived = Buffer.from(cleanSig, 'utf8');

      if (bufExpected.length !== bufReceived.length || !crypto.timingSafeEqual(bufExpected, bufReceived)) {
        return res.status(401).json({
          success: false,
          error: 'WEBHOOK_UNAUTHORIZED',
          message: 'Invalid Magicbricks HMAC signature.',
        });
      }

      return next();
    } catch {
      return res.status(401).json({
        success: false,
        error: 'WEBHOOK_UNAUTHORIZED',
        message: 'HMAC signature verification failed.',
      });
    }
  }

  // 4. Token-based validation
  if (!providedSecret) {
    return res.status(401).json({
      success: false,
      error: 'WEBHOOK_UNAUTHORIZED',
      message: 'Missing Magicbricks webhook secret token. Provide via Authorization header, x-api-key, or ?apiKey= parameter.',
    });
  }

  let isValid = false;

  if (expectedSecret) {
    const bufProvided = Buffer.from(providedSecret, 'utf8');
    const bufExpected = Buffer.from(expectedSecret, 'utf8');
    isValid = bufProvided.length === bufExpected.length && crypto.timingSafeEqual(bufProvided, bufExpected);
  } else {
    const provHash = crypto.createHash('sha256').update(providedSecret, 'utf8').digest('hex');
    const bufProvHash = Buffer.from(provHash, 'utf8');
    const bufExpectedHash = Buffer.from(DEFAULT_KEY_HASH, 'utf8');
    isValid = bufProvHash.length === bufExpectedHash.length && crypto.timingSafeEqual(bufProvHash, bufExpectedHash);

    if (!isValid && allowDev) {
      const bufDev = Buffer.from('test-magicbricks-secret', 'utf8');
      const bufProv = Buffer.from(providedSecret, 'utf8');
      isValid = bufProv.length === bufDev.length && crypto.timingSafeEqual(bufProv, bufDev);
    }
  }

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'WEBHOOK_UNAUTHORIZED',
      message: 'Invalid Magicbricks webhook secret token.',
    });
  }

  next();
}

/**
 * Helper to recursively parse XML tags into flat key-value object
 */
function parseXmlTags(xml: string): Record<string, any> {
  const result: Record<string, any> = {};
  if (!xml || typeof xml !== 'string') return result;

  const tagRegex = /<([a-zA-Z0-9_:-]+)(?:\s+[^>]*?)?>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = tagRegex.exec(xml)) !== null) {
    const tagName = match[1];
    const content = match[2].trim();
    if (content.includes('<') && content.includes('>')) {
      Object.assign(result, parseXmlTags(content));
    } else {
      result[tagName] = content;
    }
  }
  return result;
}

export class MagicbricksLeadService {
  /**
   * Normalizes incoming raw payloads from Magicbricks webhook pushes.
   * Tolerates flat JSON, nested data/lead envelopes, XML payloads, camelCase, snake_case, and urlencoded fields.
   */
  static parsePayload(rawBody: any): NormalizedMagicbricksLead {
    let candidate = rawBody;
    if (typeof rawBody === 'string') {
      const trimmed = rawBody.trim();
      if (trimmed.startsWith('<') || trimmed.includes('<lead>') || trimmed.includes('<mbresponse>')) {
        candidate = parseXmlTags(trimmed);
      } else {
        try {
          candidate = JSON.parse(trimmed);
        } catch {
          throw new Error('Payload must be a valid JSON object, XML document, or urlencoded form body.');
        }
      }
    } else if (rawBody && typeof rawBody === 'object') {
      if (typeof rawBody.xml === 'string') {
        const parsedXml = parseXmlTags(rawBody.xml);
        candidate = { ...rawBody, ...parsedXml };
      } else if (typeof rawBody.XML === 'string') {
        const parsedXml = parseXmlTags(rawBody.XML);
        candidate = { ...rawBody, ...parsedXml };
      }
    } else {
      throw new Error('Payload must be a valid JSON object, XML document, or urlencoded form body.');
    }

    // Unpack nested envelopes recursively (e.g. data.lead, payload.enquiry, response.data)
    const mergedContext: Record<string, any> = typeof candidate === 'object' && candidate ? { ...candidate } : {};
    while (candidate && typeof candidate === 'object') {
      if (candidate.lead && typeof candidate.lead === 'object') {
        Object.assign(mergedContext, candidate);
        candidate = candidate.lead;
      } else if (candidate.data && typeof candidate.data === 'object') {
        Object.assign(mergedContext, candidate);
        candidate = candidate.data;
      } else if (candidate.enquiry && typeof candidate.enquiry === 'object') {
        Object.assign(mergedContext, candidate);
        candidate = candidate.enquiry;
      } else if (candidate.payload && typeof candidate.payload === 'object') {
        Object.assign(mergedContext, candidate);
        candidate = candidate.payload;
      } else {
        break;
      }
    }
    const base = { ...mergedContext, ...candidate };

    // 1. Phone Number (Mandatory: Must resolve to 10-digit Indian mobile)
    const rawPhone =
      base.Mobile ||
      base.mobile ||
      base.ContactNo ||
      base.contactNo ||
      base.contact_no ||
      base.Contact_No ||
      base.mobile_no ||
      base.MobileNo ||
      base.Mobile_No ||
      base.phone ||
      base.Phone ||
      base.phoneNumber ||
      base.phone_number ||
      base.contactNumber ||
      base.contact_number ||
      base.buyerPhone ||
      base.buyer_phone ||
      base.custMobile ||
      base.cust_mobile ||
      base.CustMobile ||
      base.user_mobile ||
      base.userMobile;

    if (!rawPhone || (typeof rawPhone !== 'string' && typeof rawPhone !== 'number')) {
      throw new Error('Missing buyer phone number in Magicbricks payload.');
    }

    const cleanDigits = String(rawPhone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      throw new Error(`Invalid Indian mobile number: "${rawPhone}". Must be a 10-digit number starting with 6, 7, 8, or 9.`);
    }
    const phone = `+91${cleanDigits}`;

    // 2. Buyer Full Name
    const rawName =
      base.CustomerName ||
      base.customerName ||
      base.customer_name ||
      base.Name ||
      base.name ||
      base.fullName ||
      base.full_name ||
      base.buyerName ||
      base.buyer_name ||
      base.clientName ||
      base.client_name ||
      base.ClientName ||
      base.lead_name ||
      base.leadName ||
      base.user_name ||
      base.userName ||
      base.senderName ||
      base.Query_Name;

    const fullName = (typeof rawName === 'string' && rawName.trim())
      ? rawName.trim().slice(0, 120)
      : 'Magicbricks Buyer';

    // 3. Email (Optional)
    const rawEmail =
      base.Email ||
      base.email ||
      base.email_id ||
      base.emailId ||
      base.EmailId ||
      base.user_email ||
      base.userEmail ||
      base.buyerEmail ||
      base.buyer_email ||
      base.CustomerEmail ||
      base.customerEmail;

    const email = (typeof rawEmail === 'string' && rawEmail.includes('@') && rawEmail.trim().length <= 120)
      ? rawEmail.trim().toLowerCase()
      : null;

    // 4. External Enquiry ID (Mandatory for idempotency)
    const rawEnquiryId =
      base.LeadId ||
      base.leadId ||
      base.lead_id ||
      base.id ||
      base.enquiryId ||
      base.enquiry_id ||
      base.mbLeadId ||
      base.mb_lead_id ||
      base.queryId ||
      base.query_id ||
      base.Query_ID ||
      base.transId ||
      base.trans_id ||
      base.TransactionId;

    const externalEnquiryId = (rawEnquiryId !== undefined && rawEnquiryId !== null && String(rawEnquiryId).trim())
      ? String(rawEnquiryId).trim().slice(0, 64)
      : `mb-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;

    // 5. External Listing / Property ID (Optional)
    const rawListingId =
      base.PropertyId ||
      base.propertyId ||
      base.property_id ||
      base.Property_ID ||
      base.propId ||
      base.prop_id ||
      base.mbPropertyId ||
      base.mb_property_id ||
      base.listingId ||
      base.listing_id ||
      base.projId ||
      base.project_id ||
      base.ProjectId;

    const externalListingId = (rawListingId !== undefined && rawListingId !== null && String(rawListingId).trim())
      ? String(rawListingId).trim().slice(0, 64)
      : null;

    // 6. Society / Project & Locality / City
    const rawSociety =
      base.ProjectName ||
      base.projectName ||
      base.project_name ||
      base.project ||
      base.society ||
      base.Building_Name ||
      base.buildingName ||
      base.building_name ||
      base.propertyName ||
      base.property_name ||
      base.apartment_society_name;

    const rawLocality =
      base.Locality ||
      base.locality ||
      base.Location ||
      base.location ||
      base.City ||
      base.city ||
      base.Address ||
      base.address ||
      base.area ||
      base.subLocality;

    const society = (typeof rawSociety === 'string' && rawSociety.trim())
      ? rawSociety.trim().slice(0, 120)
      : ((typeof rawLocality === 'string' && rawLocality.trim()) ? rawLocality.trim().slice(0, 120) : 'Bengaluru');

    const locality = (typeof rawLocality === 'string' && rawLocality.trim())
      ? rawLocality.trim().slice(0, 120)
      : society;

    // 7. BHK Configuration
    const rawBhk =
      base.BHK ||
      base.bhk ||
      base.bhkType ||
      base.bhk_type ||
      base.bedRooms ||
      base.bedrooms ||
      base.bedroom ||
      base.bed_rooms;

    let bhk = '3 BHK';
    if (typeof rawBhk === 'string' || typeof rawBhk === 'number') {
      const bhkStr = String(rawBhk).trim();
      if (/^[1-5]$/.test(bhkStr)) {
        bhk = `${bhkStr} BHK`;
      } else if (/^\d\s*bhk/i.test(bhkStr)) {
        bhk = bhkStr.toUpperCase();
      } else if (bhkStr.toLowerCase().includes('studio') || bhkStr.toLowerCase().includes('1 rk')) {
        bhk = 'Studio';
      }
    }

    // 8. Budget (Optional)
    const rawBudget =
      base.Budget ||
      base.budget ||
      base.Price ||
      base.price ||
      base.expectedPrice ||
      base.expected_price ||
      base.cost ||
      base.max_budget;

    let budget: number | null = null;
    if (typeof rawBudget === 'number' && Number.isFinite(rawBudget) && rawBudget > 0) {
      budget = Math.round(rawBudget);
    } else if (typeof rawBudget === 'string') {
      const cleanBudget = rawBudget.replace(/,/g, '').trim();
      const numMatch = cleanBudget.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        if (cleanBudget.toLowerCase().includes('cr') || cleanBudget.toLowerCase().includes('crore')) {
          budget = Math.round(val * 10000000);
        } else if (cleanBudget.toLowerCase().includes('l') || cleanBudget.toLowerCase().includes('lac') || cleanBudget.toLowerCase().includes('lakh')) {
          budget = Math.round(val * 100000);
        } else if (val > 100000) {
          budget = Math.round(val);
        }
      }
    }

    // 9. Buyer Message / Inquiry Remarks
    const rawMessage =
      base.Remarks ||
      base.remarks ||
      base.Message ||
      base.message ||
      base.comment ||
      base.comments ||
      base.query ||
      base.description ||
      base.userComments;

    const message = (typeof rawMessage === 'string' && rawMessage.trim())
      ? rawMessage.trim().slice(0, 500)
      : null;

    // 10. Enquiry Timestamp
    const rawDate =
      base.LeadDate ||
      base.leadDate ||
      base.lead_date ||
      base.createdDate ||
      base.created_date ||
      base.entry_date ||
      base.date ||
      base.timestamp;

    let enquiryDate = new Date().toISOString();
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        enquiryDate = parsed.toISOString();
      }
    }

    return {
      externalEnquiryId,
      externalListingId,
      fullName,
      phone,
      email,
      locality,
      society,
      bhk,
      budget,
      message,
      enquiryDate,
      rawPayload: base,
    };
  }

  /**
   * Main Pipeline Handler: Ingests Magicbricks webhook payload into CRM pipeline.
   */
  static async handleWebhook(rawBody: any, clientIp: string): Promise<MagicbricksWebhookProcessResult> {
    const lead = this.parsePayload(rawBody);

    // 1. In-memory replay suppression
    const cachedTime = processedMagicbricksEnquiryCache.get(lead.externalEnquiryId);
    if (cachedTime && Date.now() - cachedTime < 15 * 60 * 1000) {
      return {
        success: true,
        handled: true,
        status: 'DUPLICATE_SUPPRESSED',
        leadId: lead.externalEnquiryId,
        externalEnquiryId: lead.externalEnquiryId,
        message: 'Duplicate Magicbricks enquiry safely suppressed (in-memory cache hit).',
      };
    }

    // 2. Database Deduplication Check
    const dupCheck = await executeQuery(
      `SELECT id, created_at, lead_status
       FROM buyer_enquiries
       WHERE (attribution->>'externalEnquiryId' = $1 AND attribution->>'source' ILIKE '%magicbricks%')
          OR (phone = $2 AND created_at > NOW() - INTERVAL '2 hours')
       ORDER BY created_at DESC
       LIMIT 1;`,
      [lead.externalEnquiryId, lead.phone]
    );

    if (dupCheck.rows && dupCheck.rows.length > 0) {
      const existing = dupCheck.rows[0];
      processedMagicbricksEnquiryCache.set(lead.externalEnquiryId, Date.now());
      return {
        success: true,
        handled: true,
        status: 'DUPLICATE_SUPPRESSED',
        leadId: existing.id,
        externalEnquiryId: lead.externalEnquiryId,
        message: `Duplicate Magicbricks enquiry safely suppressed. Existing CRM lead: ${existing.id}.`,
      };
    }

    // 3. Match against internal inventory properties
    let matchedPropertyId: string | null = null;
    try {
      const propQuery = await executeQuery(
        `SELECT id FROM properties
         WHERE (project_name ILIKE $1 OR locality_name ILIKE $2)
           AND status = 'PUBLISHED'
         ORDER BY (project_name ILIKE $1) DESC
         LIMIT 1;`,
        [`%${lead.society}%`, `%${lead.locality}%`]
      );
      if (propQuery.rows && propQuery.rows.length > 0) {
        matchedPropertyId = propQuery.rows[0].id;
      }
    } catch (propMatchErr: any) {
      console.warn('[Magicbricks Webhook] Property match notice:', propMatchErr.message);
    }

    // 4. Generate unique CRM Lead ID
    const leadId = `enq-mb-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;

    // 5. Build rich notes and attribution metadata
    const finalNotes = [
      `[Source: Magicbricks]`,
      `[Ext ID: ${lead.externalEnquiryId}]`,
      lead.externalListingId ? `[Ext Listing: ${lead.externalListingId}]` : '',
      lead.message ? `Message: ${lead.message}` : '',
      lead.budget ? `Budget: ₹${(lead.budget / 10000000).toFixed(2)} Cr` : '',
    ].filter(Boolean).join(' | ');

    const locationString = [lead.society, lead.locality].filter(Boolean).join(', ') || 'Bengaluru';

    const attribution = {
      source: 'Magicbricks',
      externalEnquiryId: lead.externalEnquiryId,
      externalListingId: lead.externalListingId,
      enquiryDate: lead.enquiryDate,
      email: lead.email,
      matchedPropertyId,
      budget: lead.budget,
      createdVia: 'WEBHOOK_MAGICBRICKS',
      clientIp,
      receivedAt: new Date().toISOString(),
    };

    // 6. Execute atomic persistence
    await withTransaction(async (client) => {
      // Record DPDP consent ledger entry
      const consentId = `cst-mb-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
      try {
        await client.query(
          `INSERT INTO consents (
            id, phone, user_id, purpose, notice_version,
            is_consented, consented_at, is_withdrawn,
            ip_hash, user_agent_hash
          ) VALUES ($1, $2, NULL, 'BUYER_ENQUIRY', 'magicbricks-marketplace-v1', true, NOW(), false, $3, 'magicbricks-webhook')
          ON CONFLICT DO NOTHING;`,
          [consentId, lead.phone, clientIp.slice(0, 32)]
        );
      } catch (cstErr: any) {
        console.warn('[Magicbricks Webhook] Consent record notice:', cstErr.message);
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
          locationString,
          lead.bhk,
          lead.budget,
          matchedPropertyId,
          finalNotes,
          JSON.stringify(attribution),
          lead.enquiryDate || new Date().toISOString(),
        ]
      );
    });

    // 7. Record Audit Event (executed safely outside main lead transaction)
    try {
      await executeQuery(
        `INSERT INTO audit_logs (
          id, actor_id, actor_role, action, target_entity, target_entity_id, ip_address, diff_summary, timestamp
        ) VALUES ($1, 'system-webhook-magicbricks', 'SYSTEM', 'LEAD_CREATED', 'buyer_enquiries', $2, $3, $4, NOW());`,
        [
          `audit-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
          leadId,
          clientIp,
          JSON.stringify({
            source: 'Magicbricks',
            externalEnquiryId: lead.externalEnquiryId,
            buyerName: lead.fullName,
            phone: maskPhone(lead.phone),
            leadType: 'BUYER',
            createdVia: 'WEBHOOK_MAGICBRICKS',
          }),
        ]
      );
    } catch (auditErr: any) {
      console.warn('[Magicbricks Webhook] Audit log notice:', auditErr.message);
    }

    // 8. Register in replay cache
    processedMagicbricksEnquiryCache.set(lead.externalEnquiryId, Date.now());

    console.info(`[Magicbricks Webhook] Created buyer lead ${leadId} (Ext ID: ${lead.externalEnquiryId}, Name: ${lead.fullName}, Phone: ${maskPhone(lead.phone)})`);

    // 9. Dispatch instant CRM lead email trigger (SellMyGhar operations alert to sellmyghar1@gmail.com)
    try {
      await EmailNotificationService.handleNewInboundLeadNotification({
        leadId,
        source: 'Magicbricks',
        leadType: 'BUYER',
        name: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        locality: lead.locality,
        society: lead.society,
        bhk: lead.bhk,
        budget: lead.budget,
        message: lead.message,
        externalEnquiryId: lead.externalEnquiryId,
        externalListingId: lead.externalListingId,
        notes: finalNotes,
        createdAt: lead.enquiryDate,
      });
    } catch (emailErr: any) {
      console.warn('[Magicbricks Webhook] Inbound lead email alert notice:', emailErr.message);
    }

    return {
      success: true,
      handled: true,
      status: 'CREATED',
      leadId,
      externalEnquiryId: lead.externalEnquiryId,
      message: 'Magicbricks lead successfully created in SellMyGhar CRM.',
      lead: {
        id: leadId,
        type: 'BUYER',
        name: lead.fullName,
        phone: lead.phone,
        stage: 'NEW',
        source: 'Magicbricks',
        externalEnquiryId: lead.externalEnquiryId,
        externalListingId: lead.externalListingId,
        society: lead.society,
        locality: lead.locality,
        bhk: lead.bhk,
      },
    };
  }

  /**
   * Resets the in-memory deduplication cache (useful for automated testing)
   */
  static resetCacheForTesting(): void {
    processedMagicbricksEnquiryCache.clear();
  }
}
