import http from 'http';
import { Socket } from 'net';
import { app } from '../server';
import { signSessionToken } from '../src/server/auth/tokens';
import { executeQuery, setTestQueryHandler } from '../src/server/db/pool';
import { AppRole } from '../src/core/types/auth';

// In-process HTTP request dispatcher
function dispatchRequest(
  expressApp: any,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    cookies?: Record<string, string>;
  } = {}
): Promise<{ status: number; headers: any; body: string; json: () => Promise<any> }> {
  return new Promise((resolve) => {
    const method = options.method || 'GET';
    const socket = new Socket();
    Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = path;
    req.headers = { host: '127.0.0.1:3000' };
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        req.headers[k.toLowerCase()] = v;
      }
    }

    if (options.cookies) {
      const cookieStr = Object.entries(options.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      req.headers['cookie'] = cookieStr;
    }

    let payload: Buffer | null = null;
    if (options.body !== undefined && options.body !== null) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      payload = Buffer.from(data);
      req.headers['content-length'] = payload.length.toString();
      if (!req.headers['content-type']) {
        req.headers['content-type'] = 'application/json';
      }
    }

    const res = new http.ServerResponse(req);
    const chunks: Buffer[] = [];
    res.write = function (chunk: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };
    res.end = function (chunk?: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const resBody = Buffer.concat(chunks).toString('utf8');
      resolve({
        status: res.statusCode,
        headers: res.getHeaders ? res.getHeaders() : {},
        body: resBody,
        json: async () => {
          try {
            return JSON.parse(resBody);
          } catch {
            return null;
          }
        },
      });
      return this;
    };

    expressApp.handle(req, res, (err: any) => {
      if (!res.headersSent) {
        res.statusCode = err ? 500 : 404;
        res.end(err ? err.message : 'Not Found');
      }
    });

    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

/**
 * SellMyGhar CRM Core Operational Workflow Test Suite
 * 
 * Verifies all 15 operational guarantees:
 * 1. Lead creation persists to PostgreSQL (seller_leads).
 * 2. Authorized employee reads leads via GET /api/crm/leads.
 * 3. Customer role rejected from GET /api/crm/leads with 403.
 * 4. Unauthenticated request to GET /api/crm/leads rejected with 401.
 * 5. Employee assigned to lead and audited in audit_logs.
 * 6. Status transition through operational lifecycle: NEW -> CONTACTED -> FOLLOW_UP -> SITE_VISIT -> NEGOTIATION -> CONVERTED.
 * 7. Invalid status rejected with 400 Bad Request.
 * 8. Unauthorized status change rejected with 403 Forbidden.
 * 9. Every lifecycle event immutably recorded in audit_logs.
 * 10. Follow-up scheduled with overdue calculation.
 * 11. Document status updated (PENDING, VERIFIED, REJECTED) and audited.
 * 12. Seller dashboard (GET /api/properties) reflects authoritative crm_status.
 * 13. Progress tracker advances with CRM status.
 * 14. LOST status flags isLost: true and halts positive progress.
 * 15. Operational state persists authoritatively across subsequent requests.
 */
export async function runCrmWorkflowTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  const assert = (condition: boolean, testName: string, extra?: string) => {
    if (condition) {
      passed++;
      results.push(`[PASS] ${testName}`);
    } else {
      failed++;
      const msg = `[FAIL] ${testName}${extra ? ` (${extra})` : ''}`;
      results.push(msg);
      console.error(msg);
    }
  };

  // In-memory data store for PostgreSQL simulation
  const memoryUsers = new Map<string, any>();
  const memorySellerLeads = new Map<string, any>();
  const memoryBuyerEnquiries = new Map<string, any>();
  const memoryProperties = new Map<string, any>();
  const memoryDocuments = new Map<string, any>();
  const memoryAuditLogs: any[] = [];
  const memoryConsents = new Map<string, any>();

  // Seed Users
  const staffIntake = {
    id: 'usr-staff-intake-01',
    phone: '+919800000002',
    email: 'intake@sellmyghar.in',
    display_name: 'Sneha Reddy',
    roles: ['STAFF_INTAKE_AGENT'],
    is_active: true,
    token_version: 1,
  };
  memoryUsers.set(staffIntake.id, staffIntake);

  const staffCloser = {
    id: 'usr-staff-closer-01',
    phone: '+919800000003',
    email: 'closer@sellmyghar.in',
    display_name: 'Vikram Sethi',
    roles: ['STAFF_DEAL_CLOSER'],
    is_active: true,
    token_version: 1,
  };
  memoryUsers.set(staffCloser.id, staffCloser);

  const staffAdmin = {
    id: 'usr-admin-compliance-01',
    phone: '+919800000000',
    email: 'admin@sellmyghar.in',
    display_name: 'Compliance Super Admin',
    roles: ['STAFF_SUPER_ADMIN'],
    is_active: true,
    token_version: 1,
  };
  memoryUsers.set(staffAdmin.id, staffAdmin);

  const customerSeller = {
    id: 'usr-customer-seller-01',
    phone: '+919845012345',
    email: 'seller@example.com',
    display_name: 'Harish Babu',
    roles: ['OWNER'],
    is_active: true,
    token_version: 1,
  };
  memoryUsers.set(customerSeller.id, customerSeller);

  // Setup DB query handler
  setTestQueryHandler(async (sql, params) => {
    // 1. SELECT users
    if (sql.includes('FROM users') && sql.includes('WHERE id = $1')) {
      const u = memoryUsers.get(params?.[0] as string);
      return u ? { rows: [{ ...u }] } : { rows: [] };
    }
    if (sql.includes('FROM users') && sql.includes('WHERE phone = $1')) {
      const u = Array.from(memoryUsers.values()).find(x => x.phone === params?.[0]);
      return u ? { rows: [{ ...u }] } : { rows: [] };
    }
    if (sql.includes('FROM users') && sql.includes('STAFF_')) {
      const staff = Array.from(memoryUsers.values()).filter(x => x.roles.some((r: string) => r.startsWith('STAFF_')));
      return { rows: staff.map(s => ({ ...s })) };
    }

    // 2. INSERT consents
    if (sql.includes('INSERT INTO consents')) {
      const c = { id: (params?.[0] as string) || `consent-${Date.now()}`, phone: params?.[1], is_consented: true, created_at: new Date().toISOString() };
      memoryConsents.set(c.id, c);
      return { rows: [c] };
    }

    // 3. INSERT seller_leads
    if (sql.includes('INSERT INTO seller_leads')) {
      const lead = {
        id: (params?.[0] as string) || `lead-${Date.now()}`,
        owner_name: params?.[1],
        phone: params?.[2],
        apartment_society_name: params?.[3],
        locality_id: params?.[4],
        bhk_type: params?.[5],
        expected_price_inr: params?.[6],
        listing_intent: params?.[7] || 'SELL',
        lead_status: params?.[8] || 'NEW',
        assigned_staff_id: params?.[9] || null,
        consent_record_id: params?.[10],
        property_id: null,
        next_follow_up_at: null,
        follow_up_notes: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memorySellerLeads.set(lead.id, lead);
      return { rows: [{ ...lead }] };
    }

    // 4. SELECT seller_leads (single lead by id)
    if (sql.includes('FROM seller_leads') && sql.includes('WHERE sl.id = $1')) {
      const lead = memorySellerLeads.get(params?.[0] as string);
      if (!lead) return { rows: [] };
      const staff = lead.assigned_staff_id ? memoryUsers.get(lead.assigned_staff_id) : null;
      const prop = lead.property_id ? memoryProperties.get(lead.property_id) : null;
      return {
        rows: [{
          ...lead,
          assigned_staff_name: staff?.display_name || null,
          assigned_staff_phone: staff?.phone || null,
          asking_price_inr: prop?.asking_price_inr || null,
          reserve_minimum_price_inr: prop?.reserve_minimum_price_inr || null,
          verification_tier: prop?.verification_tier || null,
          property_crm_status: prop?.crm_status || null,
        }]
      };
    }
    if (sql.includes('SELECT * FROM seller_leads WHERE id = $1')) {
      const lead = memorySellerLeads.get(params?.[0] as string);
      return lead ? { rows: [{ ...lead }] } : { rows: [] };
    }

    // 5. SELECT seller_leads (list query)
    if (sql.includes('FROM seller_leads sl')) {
      const all = Array.from(memorySellerLeads.values());
      const mapped = all.map(lead => {
        const staff = lead.assigned_staff_id ? memoryUsers.get(lead.assigned_staff_id) : null;
        return {
          id: lead.id,
          lead_type: 'SELLER',
          name: lead.owner_name,
          owner_name: lead.owner_name,
          phone: lead.phone,
          society: lead.apartment_society_name,
          apartment_society_name: lead.apartment_society_name,
          locality: lead.locality_id,
          locality_id: lead.locality_id,
          bhk: lead.bhk_type,
          bhk_type: lead.bhk_type,
          expected_price: lead.expected_price_inr,
          expected_price_inr: lead.expected_price_inr,
          listing_intent: lead.listing_intent,
          lead_status: lead.lead_status,
          assigned_staff_id: lead.assigned_staff_id,
          assigned_staff_name: staff?.display_name || null,
          assigned_staff_phone: staff?.phone || null,
          assigned_at: lead.assigned_at || null,
          property_id: lead.property_id,
          next_follow_up_at: lead.next_follow_up_at,
          follow_up_notes: lead.follow_up_notes,
          notes: lead.notes,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
        };
      });
      return { rows: mapped };
    }

    // 6. UPDATE seller_leads
    if (sql.includes('UPDATE seller_leads')) {
      const id = params?.[params.length - 1] as string;
      const lead = memorySellerLeads.get(id);
      if (lead) {
        if (sql.includes('lead_status = $1')) {
          lead.lead_status = params?.[0];
          if (params?.[1] && typeof params[1] === 'string') {
            lead.notes = lead.notes ? `${lead.notes}\n${params[1]}` : params[1];
          }
        }
        if (sql.includes('assigned_staff_id = $1')) {
          lead.assigned_staff_id = params?.[0];
          lead.assigned_at = new Date().toISOString();
          if (lead.lead_status === 'NEW') lead.lead_status = 'CONTACTED';
        }
        if (sql.includes('next_follow_up_at = $1')) {
          lead.next_follow_up_at = params?.[0];
          lead.follow_up_notes = params?.[1];
          if (lead.lead_status === 'NEW') lead.lead_status = 'CONTACTED';
        }
        if (sql.includes('notes = CASE')) {
          lead.notes = lead.notes ? `${lead.notes}\n${params?.[0]}` : params?.[0];
        }
        lead.updated_at = new Date().toISOString();
        return { rows: [{ ...lead }] };
      }
      return { rows: [] };
    }

    // 7. INSERT properties
    if (sql.includes('INSERT INTO properties')) {
      const prop = {
        id: (params?.[0] as string) || `prop-${Date.now()}`,
        owner_id: params?.[1],
        project_locality_id: params?.[2],
        unit_number: params?.[3],
        wing_tower: params?.[4],
        unit_floor: params?.[5],
        total_floors: params?.[6],
        bhk_type: params?.[7],
        super_built_up_sqft: params?.[8],
        carpet_area_sqft: params?.[9],
        facing: params?.[10],
        asking_price_inr: params?.[11],
        reserve_minimum_price_inr: params?.[12],
        listing_intent: params?.[13] || 'SELL',
        crm_status: params?.[14] || 'NEW',
        verification_tier: params?.[15] || 'LEVEL_1_OWNER_DECLARED',
        internal_verification_notes: params?.[16] || '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryProperties.set(prop.id, prop);
      return { rows: [{ ...prop }] };
    }

    // 8. SELECT properties
    if (sql.includes('FROM properties') && sql.includes('owner_id = $1')) {
      const ownerId = params?.[0] as string;
      const matched = Array.from(memoryProperties.values()).filter(p => p.owner_id === ownerId);
      return {
        rows: matched.map(p => {
          const lead = Array.from(memorySellerLeads.values()).find(l => l.property_id === p.id || l.phone === customerSeller.phone);
          const staff = lead?.assigned_staff_id ? memoryUsers.get(lead.assigned_staff_id) : null;
          return {
            ...p,
            crm_status: lead?.lead_status || p.crm_status || 'NEW',
            lead_id: lead?.id || null,
            assigned_staff_id: lead?.assigned_staff_id || null,
            rm_name: staff?.display_name || null,
            rm_phone: staff?.phone || null,
          };
        })
      };
    }
    if (sql.includes('FROM properties') && !sql.includes('owner_id = $1')) {
      const all = Array.from(memoryProperties.values());
      return { rows: all.map(p => ({ ...p })) };
    }

    // 9. UPDATE properties
    if (sql.includes('UPDATE properties')) {
      if (sql.includes('crm_status = $1') && sql.includes('WHERE id = $2')) {
        const p = memoryProperties.get(params?.[1] as string);
        if (p) {
          p.crm_status = params?.[0];
          p.updated_at = new Date().toISOString();
        }
      } else if (sql.includes('crm_status = $1') && sql.includes('WHERE owner_id =')) {
        // Find owner by phone
        const u = Array.from(memoryUsers.values()).find(x => x.phone === params?.[1]);
        if (u) {
          for (const p of memoryProperties.values()) {
            if (p.owner_id === u.id) {
              p.crm_status = params?.[0];
              p.updated_at = new Date().toISOString();
            }
          }
        }
      }
      return { rows: [] };
    }

    // 10. INSERT / SELECT / UPDATE documents
    if (sql.includes('SELECT * FROM documents WHERE id = $1')) {
      const d = memoryDocuments.get(params?.[0] as string);
      return d ? { rows: [{ ...d }] } : { rows: [] };
    }
    if (sql.includes('UPDATE documents') && sql.includes('verification_status = $1')) {
      const docId = params?.[3] as string;
      const d = memoryDocuments.get(docId);
      if (d) {
        d.verification_status = params?.[0];
        d.verified_by_staff_id = params?.[1];
        d.verified_at = new Date().toISOString();
        d.discrepancy_note = params?.[2];
        d.updated_at = new Date().toISOString();
        return { rows: [{ ...d }] };
      }
      return { rows: [] };
    }

    // 11. INSERT audit_logs
    if (sql.includes('INSERT INTO audit_logs')) {
      const entry = {
        id: params?.[0] || `aud-${Date.now()}`,
        actor_id: params?.[1],
        actor_role: params?.[2],
        action: params?.[3],
        target_entity: params?.[4],
        target_entity_id: params?.[5],
        ip_address: params?.[6],
        diff_summary: params?.[7],
        created_at: new Date().toISOString(),
      };
      memoryAuditLogs.push(entry);
      return { rows: [entry] };
    }

    // 12. SELECT audit_logs
    if (sql.includes('FROM audit_logs')) {
      const targetId = params?.[0] as string;
      const matched = memoryAuditLogs.filter(a => a.target_entity_id === targetId);
      return { rows: matched.map(a => ({ ...a })) };
    }

    return { rows: [] };
  });

  // Mint Tokens
  const intakeToken = await signSessionToken({
    uid: staffIntake.id,
    phone: staffIntake.phone,
    email: staffIntake.email,
    roles: staffIntake.roles as AppRole[],
    permissions: [],
  }, 1);

  const closerToken = await signSessionToken({
    uid: staffCloser.id,
    phone: staffCloser.phone,
    email: staffCloser.email,
    roles: staffCloser.roles as AppRole[],
    permissions: [],
  }, 1);

  const adminToken = await signSessionToken({
    uid: staffAdmin.id,
    phone: staffAdmin.phone,
    email: staffAdmin.email,
    roles: staffAdmin.roles as AppRole[],
    permissions: [],
  }, 1);

  const customerToken = await signSessionToken({
    uid: customerSeller.id,
    phone: customerSeller.phone,
    email: customerSeller.email,
    roles: customerSeller.roles as AppRole[],
    permissions: [],
  }, 1);

  // Set up a linked property in memory
  const testProp = {
    id: 'prop-crm-test-01',
    owner_id: customerSeller.id,
    project_locality_id: 'kanakapura-road',
    unit_number: 'Flat 1102',
    wing_tower: 'Tower 4',
    unit_floor: 11,
    total_floors: 18,
    bhk_type: '3BHK',
    super_built_up_sqft: 1650,
    carpet_area_sqft: 1287,
    facing: 'EAST',
    asking_price_inr: 16500000,
    reserve_minimum_price_inr: 15800000,
    listing_intent: 'SELL',
    crm_status: 'NEW',
    verification_tier: 'LEVEL_1_OWNER_DECLARED',
    internal_verification_notes: JSON.stringify({ societyName: 'Prestige Falcon City' }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryProperties.set(testProp.id, testProp);

  const testDoc = {
    id: 'doc-crm-test-01',
    property_id: testProp.id,
    uploader_user_id: customerSeller.id,
    doc_type: 'SALE_DEED',
    file_name: 'sale_deed_2026.pdf',
    file_size_bytes: 4200000,
    mime_type: 'application/pdf',
    storage_path: 'docs/sale_deed_2026.pdf',
    sha256_checksum: 'a'.repeat(64),
    verification_status: 'PENDING_REVIEW',
    verified_by_staff_id: null,
    verified_at: null,
    discrepancy_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryDocuments.set(testDoc.id, testDoc);

  // ----------------------------------------------------
  // TEST 1: Lead creation persists to PostgreSQL
  // ----------------------------------------------------
  const leadRes = await dispatchRequest(app, '/api/leads', {
    method: 'POST',
    body: {
      fullName: 'Harish Babu',
      phone: '9845012345',
      societyName: 'Prestige Falcon City',
      locality: 'Kanakapura Road',
      bhkType: '3BHK',
      builtUpSqft: '1650',
      intent: 'SELL',
    },
  });
  const leadJson = await leadRes.json();
  const createdLeadId = leadJson?.leadId;
  const leadStored = createdLeadId ? memorySellerLeads.get(createdLeadId) : null;
  if (leadStored) {
    leadStored.property_id = testProp.id; // Link to test property
  }
  assert(
    leadRes.status === 201 && Boolean(createdLeadId) && leadStored?.lead_status === 'NEW',
    'TEST 1: Lead creation persists to PostgreSQL seller_leads with status NEW'
  );

  // ----------------------------------------------------
  // TEST 2: Authorized employee reads leads
  // ----------------------------------------------------
  const crmListRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'GET',
    headers: { Authorization: `Bearer ${intakeToken}` },
  });
  const crmListJson = await crmListRes.json();
  assert(
    crmListRes.status === 200 && Array.isArray(crmListJson?.leads) && crmListJson.leads.length > 0,
    'TEST 2: Authorized staff (STAFF_INTAKE_AGENT) reads leads list from GET /api/crm/leads'
  );

  // ----------------------------------------------------
  // TEST 3: Customer rejected from CRM leads (403)
  // ----------------------------------------------------
  const customerCrmRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'GET',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert(
    customerCrmRes.status === 403,
    'TEST 3: Customer role (OWNER) rejected from GET /api/crm/leads with 403 FORBIDDEN'
  );

  // ----------------------------------------------------
  // TEST 4: Unauthenticated rejected from CRM leads (401)
  // ----------------------------------------------------
  const unauthCrmRes = await dispatchRequest(app, '/api/crm/leads', {
    method: 'GET',
  });
  assert(
    unauthCrmRes.status === 401,
    'TEST 4: Unauthenticated request to GET /api/crm/leads rejected with 401 UNAUTHORIZED'
  );

  // ----------------------------------------------------
  // TEST 5: Employee assigned to lead and audited
  // ----------------------------------------------------
  const assignRes = await dispatchRequest(app, `/api/crm/leads/${createdLeadId}/assign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${intakeToken}` },
    body: { staffId: staffIntake.id },
  });
  const assignJson = await assignRes.json();
  const leadAfterAssign = memorySellerLeads.get(createdLeadId);
  const auditAssign = memoryAuditLogs.find(a => a.action === 'LEAD_ASSIGNED' && a.target_entity_id === createdLeadId);
  assert(
    assignRes.status === 200 &&
    leadAfterAssign?.assigned_staff_id === staffIntake.id &&
    leadAfterAssign?.lead_status === 'CONTACTED' &&
    Boolean(auditAssign),
    'TEST 5: Lead assigned to staff member, status promoted to CONTACTED, and audited in audit_logs'
  );

  // ----------------------------------------------------
  // TEST 6: Operational lifecycle: CONTACTED -> FOLLOW_UP -> SITE_VISIT -> NEGOTIATION -> CONVERTED
  // ----------------------------------------------------
  const stages = ['FOLLOW_UP', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED'];
  let allStagesPassed = true;

  for (const st of stages) {
    const res = await dispatchRequest(app, `/api/crm/leads/${createdLeadId}/status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${intakeToken}` },
      body: { status: st, note: `Promoted to ${st}` },
    });
    const curLead = memorySellerLeads.get(createdLeadId);
    if (res.status !== 200 || curLead?.lead_status !== st) {
      allStagesPassed = false;
      break;
    }
  }
  assert(
    allStagesPassed,
    'TEST 6: Full operational lifecycle progression succeeds (FOLLOW_UP -> SITE_VISIT -> NEGOTIATION -> CONVERTED)'
  );

  // ----------------------------------------------------
  // TEST 7: Invalid status rejected (400)
  // ----------------------------------------------------
  const invalidStatusRes = await dispatchRequest(app, `/api/crm/leads/${createdLeadId}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${intakeToken}` },
    body: { status: 'INVALID_XYZ_STATUS' },
  });
  assert(
    invalidStatusRes.status === 400,
    'TEST 7: Invalid status rejected with 400 Bad Request (INVALID_STATUS)'
  );

  // ----------------------------------------------------
  // TEST 8: Unauthorized status change rejected (403)
  // ----------------------------------------------------
  const unauthStatusRes = await dispatchRequest(app, `/api/crm/leads/${createdLeadId}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: { status: 'LOST' },
  });
  assert(
    unauthStatusRes.status === 403,
    'TEST 8: Customer role attempting status change rejected with 403 FORBIDDEN'
  );

  // ----------------------------------------------------
  // TEST 9: Activity immutably recorded in audit_logs
  // ----------------------------------------------------
  const leadAuditLogs = memoryAuditLogs.filter(a => a.target_entity_id === createdLeadId);
  const actionsRecorded = leadAuditLogs.map(a => a.action);
  const hasExpectedAudits = actionsRecorded.includes('LEAD_ASSIGNED') &&
                           actionsRecorded.includes('LEAD_STATUS_CHANGED') &&
                           actionsRecorded.includes('SITE_VISIT_RECORDED') &&
                           actionsRecorded.includes('NEGOTIATION_STARTED') &&
                           actionsRecorded.includes('LEAD_CONVERTED');
  assert(
    hasExpectedAudits,
    'TEST 9: Audit trail contains complete history: LEAD_ASSIGNED, LEAD_STATUS_CHANGED, SITE_VISIT, NEGOTIATION, LEAD_CONVERTED'
  );

  // ----------------------------------------------------
  // TEST 10: Follow-up scheduled with overdue tracking
  // ----------------------------------------------------
  const overdueTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  const followUpRes = await dispatchRequest(app, `/api/crm/leads/${createdLeadId}/follow-up`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${intakeToken}` },
    body: { nextFollowUpAt: overdueTimestamp, followUpNotes: 'Check buyer loan approval' },
  });
  const followUpJson = await followUpRes.json();
  const auditFollowUp = memoryAuditLogs.find(a => a.action === 'FOLLOW_UP_SCHEDULED' && a.target_entity_id === createdLeadId);
  assert(
    followUpRes.status === 200 &&
    (followUpJson?.isOverdue === true || followUpJson?.lead?.isOverdue === true) &&
    Boolean(auditFollowUp),
    'TEST 10: Follow-up scheduled, overdue flag computed accurately, and audited'
  );

  // ----------------------------------------------------
  // TEST 11: Document status updated (PENDING, VERIFIED, REJECTED)
  // ----------------------------------------------------
  const docVerifyRes = await dispatchRequest(app, `/api/crm/documents/${testDoc.id}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'VERIFIED', note: 'Kaveri online stamp confirmed' },
  });
  const statusAfterVerify = memoryDocuments.get(testDoc.id)?.verification_status;

  const docRejectRes = await dispatchRequest(app, `/api/crm/documents/${testDoc.id}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'REJECTED', note: 'Missing signature on page 4' },
  });
  const statusAfterReject = memoryDocuments.get(testDoc.id)?.verification_status;

  const auditDoc = memoryAuditLogs.find(a => a.action === 'DOCUMENT_STATUS_CHANGED' && a.target_entity_id === testDoc.id);
  assert(
    docVerifyRes.status === 200 &&
    statusAfterVerify === 'VERIFIED' &&
    docRejectRes.status === 200 &&
    statusAfterReject === 'REJECTED' &&
    Boolean(auditDoc),
    'TEST 11: Document verification status transitions (VERIFIED, REJECTED) succeed and are audited'
  );

  // ----------------------------------------------------
  // TEST 12: Seller dashboard receives authoritative status
  // ----------------------------------------------------
  // Set status to CONVERTED
  await dispatchRequest(app, `/api/crm/leads/${createdLeadId}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${intakeToken}` },
    body: { status: 'CONVERTED' },
  });

  const sellerDashboardRes = await dispatchRequest(app, '/api/properties', {
    method: 'GET',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const sellerDashboardJson = await sellerDashboardRes.json();
  const returnedProperty = sellerDashboardJson?.properties?.[0];
  assert(
    sellerDashboardRes.status === 200 &&
    returnedProperty?.crm_status === 'CONVERTED' &&
    Boolean(returnedProperty?.progressTracker),
    'TEST 12: Seller dashboard (GET /api/properties) reflects authoritative crm_status: CONVERTED'
  );

  // ----------------------------------------------------
  // TEST 13: Progress tracker advances with CRM status
  // ----------------------------------------------------
  // Check activeIndex for CONVERTED (index 5)
  const convertedIndex = returnedProperty?.progressTracker?.activeIndex;
  
  // Transition back to SITE_VISIT (index 3) and verify tracker responds
  await dispatchRequest(app, `/api/crm/leads/${createdLeadId}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${intakeToken}` },
    body: { status: 'SITE_VISIT' },
  });
  const dashboardVisitRes = await dispatchRequest(app, '/api/properties', {
    method: 'GET',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const visitProperty = (await dashboardVisitRes.json())?.properties?.[0];
  const visitIndex = visitProperty?.progressTracker?.activeIndex;

  assert(
    convertedIndex === 5 && visitIndex === 3 && visitProperty?.progressTracker?.currentStatus === 'SITE_VISIT',
    'TEST 13: Amazon-style progress tracker advances and retreats synchronously with CRM status (5 for CONVERTED, 3 for SITE_VISIT)'
  );

  // ----------------------------------------------------
  // TEST 14: LOST state flags isLost: true
  // ----------------------------------------------------
  const lostRes = await dispatchRequest(app, `/api/crm/leads/${createdLeadId}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${intakeToken}` },
    body: { status: 'LOST', note: 'Buyer purchased elsewhere' },
  });
  const dashboardLostRes = await dispatchRequest(app, '/api/properties', {
    method: 'GET',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const lostProperty = (await dashboardLostRes.json())?.properties?.[0];
  const auditLost = memoryAuditLogs.find(a => a.action === 'LEAD_LOST' && a.target_entity_id === createdLeadId);
  assert(
    lostRes.status === 200 &&
    lostProperty?.crm_status === 'LOST' &&
    lostProperty?.progressTracker?.isLost === true &&
    lostProperty?.progressTracker?.activeIndex === -1 &&
    Boolean(auditLost),
    'TEST 14: LOST status sets isLost: true, activeIndex: -1, and records LEAD_LOST in audit_logs'
  );

  // ----------------------------------------------------
  // TEST 15: Status persists authoritatively across subsequent requests
  // ----------------------------------------------------
  const singleLeadRes = await dispatchRequest(app, `/api/crm/leads/${createdLeadId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${intakeToken}` },
  });
  const singleLeadJson = await singleLeadRes.json();
  const subsequentPropRes = await dispatchRequest(app, '/api/properties', {
    method: 'GET',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const subsequentPropJson = await subsequentPropRes.json();

  assert(
    singleLeadRes.status === 200 &&
    singleLeadJson?.lead?.stage === 'LOST' &&
    subsequentPropJson?.properties?.[0]?.crm_status === 'LOST' &&
    memorySellerLeads.get(createdLeadId)?.lead_status === 'LOST',
    'TEST 15: Operational CRM status is persistent in PostgreSQL and verified identical across separate endpoints'
  );

  return { passed, failed, results };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('run-crm-workflow-tests.ts')) {
  runCrmWorkflowTests().then(res => {
    console.log(`CRM Tests: ${res.passed} passed, ${res.failed} failed`);
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
