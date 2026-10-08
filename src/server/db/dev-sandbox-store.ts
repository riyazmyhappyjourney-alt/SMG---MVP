/**
 * SellMyGhar In-Memory Development Sandbox Store
 * 
 * Active ONLY when:
 * 1. process.env.ALLOW_DEV_FALLBACKS === 'true'
 * 2. DATABASE_URL is unset / empty
 * 3. NODE_ENV !== 'production'
 * 
 * Provides stateful in-process persistence for local browser manual testing
 * so that staff login, lead creation, status changes, assignments, follow-ups,
 * and seller progress tracking work end-to-end.
 * 
 * Production behavior is completely unaffected and remains strictly fail-closed.
 */

export interface DevUser {
  id: string;
  phone: string;
  email: string | null;
  display_name: string;
  password_hash: string | null;
  token_version: number;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DevSellerLead {
  id: string;
  owner_name: string;
  phone: string;
  apartment_society_name: string;
  locality_id: string;
  bhk_type: string;
  expected_price_inr: number | null;
  listing_intent: string;
  lead_status: string;
  assigned_staff_id: string | null;
  assigned_at: string | null;
  property_id: string | null;
  next_follow_up_at: string | null;
  follow_up_notes: string | null;
  notes: string | null;
  consent_record_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DevBuyerEnquiry {
  id: string;
  buyer_name: string;
  phone: string;
  preferred_locality_or_society: string;
  bhk_type: string;
  lead_status: string;
  assigned_staff_id: string | null;
  assigned_at: string | null;
  next_follow_up_at: string | null;
  follow_up_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DevProperty {
  id: string;
  owner_id: string;
  project_locality_id: string;
  unit_number: string;
  wing_tower: string;
  unit_floor: number;
  total_floors: number;
  bhk_type: string;
  super_built_up_sqft: number;
  carpet_area_sqft: number;
  balconies_count: number;
  bathrooms_count: number;
  facing: string;
  car_parks_count: number;
  is_covered_parking: boolean;
  khata_type: string;
  encumbrance_status: string;
  loan_bank_name: string | null;
  occupancy_status: string;
  monthly_maintenance_inr: number;
  asking_price_inr: number;
  reserve_minimum_price_inr: number;
  listing_intent: string;
  crm_status: string;
  verification_tier: string;
  internal_verification_notes: string;
  created_at: string;
  updated_at: string;
}

export interface DevDocument {
  id: string;
  property_id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  checksum: string;
  verification_status: string;
  verified_by_staff_id?: string | null;
  verified_at?: string | null;
  discrepancy_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DevAuditLog {
  id: string;
  actor_user_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_entity: string;
  target_entity_id: string;
  client_ip: string;
  diff_summary: any;
  created_at: string;
}

class DevSandboxStore {
  public users = new Map<string, DevUser>();
  public sellerLeads = new Map<string, DevSellerLead>();
  public buyerEnquiries = new Map<string, DevBuyerEnquiry>();
  public properties = new Map<string, DevProperty>();
  public propertyMedia = new Map<string, any>();
  public documents = new Map<string, DevDocument>();
  public consents = new Map<string, any>();
  public auditLogs: DevAuditLog[] = [];

  private initialized = false;

  public initInitialSeeds() {
    if (this.initialized) return;
    this.initialized = true;

    // Seed default customer owner Harish Babu
    const owner: DevUser = {
      id: 'usr-customer-seller-01',
      phone: '+919845012345',
      email: 'seller@example.com',
      display_name: 'Harish Babu',
      password_hash: null,
      token_version: 1,
      roles: ['OWNER'],
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(owner.id, owner);

    // Seed sample seller leads for initial CRM visualization
    const lead1: DevSellerLead = {
      id: 'lead-dev-seed-01',
      owner_name: 'Vikramaditya Hegde',
      phone: '+919845012345',
      apartment_society_name: 'Sobha Dream Acres, Panathur',
      locality_id: 'panathur',
      bhk_type: '3BHK',
      expected_price_inr: 14500000,
      listing_intent: 'SELL',
      lead_status: 'NEW',
      assigned_staff_id: null,
      assigned_at: null,
      property_id: 'prop-dev-seed-01',
      next_follow_up_at: null,
      follow_up_notes: null,
      notes: 'Submitted via Web Funnel. Awaiting first outreach call.',
      consent_record_id: 'cst-01',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.sellerLeads.set(lead1.id, lead1);

    const lead2: DevSellerLead = {
      id: 'lead-dev-seed-02',
      owner_name: 'Priyanka Nair',
      phone: '+919845088990',
      apartment_society_name: 'Prestige Falcon City, Kanakapura Road',
      locality_id: 'kanakapura-road',
      bhk_type: '2BHK',
      expected_price_inr: 11000000,
      listing_intent: 'SELL',
      lead_status: 'CONTACTED',
      assigned_staff_id: 'usr-staff-intake-01',
      assigned_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      property_id: null,
      next_follow_up_at: new Date(Date.now() + 86400000).toISOString(),
      follow_up_notes: 'Spoke with owner. Requested floor plan and recent maintenance receipt.',
      notes: 'Initial call completed. Very receptive to legal title diligence model.',
      consent_record_id: 'cst-02',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.sellerLeads.set(lead2.id, lead2);

    const lead3: DevSellerLead = {
      id: 'lead-dev-seed-03',
      owner_name: 'Anand Murthy',
      phone: '+919845077112',
      apartment_society_name: 'Brigade Gateway, Rajajinagar',
      locality_id: 'rajajinagar',
      bhk_type: '4BHK',
      expected_price_inr: 38000000,
      listing_intent: 'SELL',
      lead_status: 'FOLLOW_UP',
      assigned_staff_id: 'usr-staff-intake-01',
      assigned_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      property_id: null,
      next_follow_up_at: new Date(Date.now() - 1800000).toISOString(), // Overdue
      follow_up_notes: 'Follow up on Kaveri EC download discrepancy.',
      notes: 'Senior executive relocating to Singapore.',
      consent_record_id: 'cst-03',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.sellerLeads.set(lead3.id, lead3);

    // Seed sample property linked to lead1 and Harish Babu
    const prop1: DevProperty = {
      id: 'prop-dev-seed-01',
      owner_id: owner.id,
      project_locality_id: 'panathur',
      unit_number: 'Flat 1102',
      wing_tower: 'Tower 4',
      unit_floor: 11,
      total_floors: 18,
      bhk_type: '3BHK',
      super_built_up_sqft: 1650,
      carpet_area_sqft: 1287,
      balconies_count: 2,
      bathrooms_count: 3,
      facing: 'EAST',
      car_parks_count: 1,
      is_covered_parking: true,
      khata_type: 'A_KHATA',
      encumbrance_status: 'CLEAR',
      loan_bank_name: null,
      occupancy_status: 'READY_TO_MOVE',
      monthly_maintenance_inr: 4500,
      asking_price_inr: 14500000,
      reserve_minimum_price_inr: 13800000,
      listing_intent: 'SELL',
      crm_status: 'NEW',
      verification_tier: 'LEVEL_1_OWNER_DECLARED',
      internal_verification_notes: JSON.stringify({ verified: false }),
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.properties.set(prop1.id, prop1);
  }

  public handleQuery(sql: string, params: any[] = []): { rows: any[] } {
    this.initInitialSeeds();
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. Transaction & DDL Control
    if (
      cleanSql.startsWith('ALTER TABLE') ||
      cleanSql.startsWith('CREATE TABLE') ||
      cleanSql.startsWith('CREATE INDEX') ||
      cleanSql === 'BEGIN' ||
      cleanSql === 'COMMIT' ||
      cleanSql === 'ROLLBACK'
    ) {
      return { rows: [] };
    }

    // 2. USERS: Select by phone
    if (cleanSql.includes('FROM users') && cleanSql.includes('WHERE phone = $1')) {
      const phone = params[0];
      const u = Array.from(this.users.values()).find(x => x.phone === phone);
      return u ? { rows: [{ ...u }] } : { rows: [] };
    }

    // 3. USERS: Select by LOWER(email)
    if (cleanSql.includes('FROM users') && (cleanSql.includes('WHERE LOWER(email) = $1') || cleanSql.includes('LOWER(email) = $1'))) {
      const email = String(params[0] || '').toLowerCase().trim();
      const u = Array.from(this.users.values()).find(x => x.email && x.email.toLowerCase() === email);
      return u ? { rows: [{ ...u }] } : { rows: [] };
    }

    // 4. USERS: Select by ID
    if (cleanSql.includes('FROM users') && cleanSql.includes('WHERE id = $1')) {
      const id = params[0];
      const u = this.users.get(id);
      return u ? { rows: [{ ...u }] } : { rows: [] };
    }

    // 5. USERS: Select Staff List
    if (cleanSql.includes('FROM users') && cleanSql.includes('STAFF_')) {
      const staff = Array.from(this.users.values()).filter(x => x.roles.some(r => r.startsWith('STAFF_')));
      return { rows: staff.map(s => ({ ...s })) };
    }

    // 6. USERS: Select Admin Users List
    if (cleanSql.includes('FROM users') && cleanSql.includes('ORDER BY created_at DESC LIMIT 100')) {
      const all = Array.from(this.users.values());
      return { rows: all.map(s => ({ ...s })) };
    }

    // 7. USERS: Multi-Row Insert (Bootstrap Query in server.ts)
    if (cleanSql.includes('INSERT INTO users') && cleanSql.includes('usr-staff-intake-01')) {
      const staffPassHash = params[4];
      const staff1: DevUser = {
        id: params[0] || 'usr-staff-verification-01',
        phone: params[1] || '+919800000001',
        email: params[2] || 'staff@sellmyghar.in',
        display_name: params[3] || 'Verification Desk Staff',
        password_hash: staffPassHash,
        token_version: 1,
        roles: ['STAFF_VERIFICATION_AGENT'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const staff2: DevUser = {
        id: 'usr-staff-intake-01',
        phone: '+919800000002',
        email: 'intake@sellmyghar.in',
        display_name: 'Sneha Reddy (Lead Intake)',
        password_hash: staffPassHash,
        token_version: 1,
        roles: ['STAFF_INTAKE_AGENT'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const staff3: DevUser = {
        id: 'usr-staff-closer-01',
        phone: '+919800000003',
        email: 'closer@sellmyghar.in',
        display_name: 'Vikram Sethi (Deal Closer)',
        password_hash: staffPassHash,
        token_version: 1,
        roles: ['STAFF_DEAL_CLOSER'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!this.users.has(staff1.id) && !Array.from(this.users.values()).some(u => u.phone === staff1.phone)) {
        this.users.set(staff1.id, staff1);
      }
      if (!this.users.has(staff2.id) && !Array.from(this.users.values()).some(u => u.phone === staff2.phone)) {
        this.users.set(staff2.id, staff2);
      }
      if (!this.users.has(staff3.id) && !Array.from(this.users.values()).some(u => u.phone === staff3.phone)) {
        this.users.set(staff3.id, staff3);
      }
      return { rows: [staff1, staff2, staff3] };
    }

    // 8. USERS: Single-Row Insert (Admin bootstrap, etc.)
    if (cleanSql.includes('INSERT INTO users')) {
      const id = params[0] || `usr-${Date.now()}`;
      const phone = params[1];
      const email = params[2] || null;
      const display_name = params[3] || 'User';
      const password_hash = params[4] || null;
      let roles = ['OWNER'];
      if (cleanSql.includes('STAFF_SUPER_ADMIN')) {
        roles = ['STAFF_SUPER_ADMIN'];
      }

      // Check conflict by phone
      let existing = Array.from(this.users.values()).find(x => x.phone === phone);
      if (existing) {
        if (cleanSql.includes('DO UPDATE')) {
          existing.display_name = display_name;
          if (email) existing.email = email;
          existing.updated_at = new Date().toISOString();
        }
        return { rows: [{ ...existing }] };
      }

      const u: DevUser = {
        id,
        phone,
        email,
        display_name,
        password_hash,
        token_version: 1,
        roles,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.users.set(u.id, u);
      return { rows: [{ ...u }] };
    }

    // 9. USERS: Update token_version (Logout)
    if (cleanSql.includes('UPDATE users') && cleanSql.includes('token_version = token_version + 1')) {
      const id = params[0];
      const u = this.users.get(id);
      if (u) {
        u.token_version = (u.token_version || 1) + 1;
        u.updated_at = new Date().toISOString();
        return { rows: [{ ...u }] };
      }
      return { rows: [] };
    }

    // 10. CONSENTS: Insert
    if (cleanSql.includes('INSERT INTO consents')) {
      const c = {
        id: params[0] || `cst-${Date.now()}`,
        phone: params[1],
        user_id: params[2] || null,
        purpose: params[3] || 'GENERAL',
        is_consented: true,
        is_withdrawn: false,
        created_at: new Date().toISOString(),
      };
      this.consents.set(c.id, c);
      return { rows: [{ ...c }] };
    }

    // 11. CONSENTS: Select
    if (cleanSql.includes('FROM consents')) {
      const phone = params[0];
      let matched = Array.from(this.consents.values()).filter(x => x.phone === phone);
      if (cleanSql.includes('purpose = $2') && params[1]) {
        matched = matched.filter(x => x.purpose === params[1]);
      }
      return { rows: matched };
    }

    // 11b. CONSENTS: Update (Withdrawal)
    if (cleanSql.includes('UPDATE consents') && cleanSql.includes('is_withdrawn = true')) {
      const nowIso = params[0];
      const phone = params[1];
      const purpose = params[2];
      const target = Array.from(this.consents.values()).find(x => x.phone === phone && x.purpose === purpose && !x.is_withdrawn);
      if (target) {
        target.is_withdrawn = true;
        target.withdrawn_at = nowIso;
        target.revoked_at = nowIso;
        return { rows: [{ id: target.id }] };
      }
      return { rows: [] };
    }

    // 12. SELLER_LEADS: Single lead detail query
    if (cleanSql.includes('FROM seller_leads') && (cleanSql.includes('WHERE sl.id = $1') || cleanSql.includes('WHERE id = $1'))) {
      const id = params[0];
      const lead = this.sellerLeads.get(id);
      if (!lead) return { rows: [] };

      const staff = lead.assigned_staff_id ? this.users.get(lead.assigned_staff_id) : null;
      const prop = lead.property_id ? this.properties.get(lead.property_id) : null;

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

    // 13. SELLER_LEADS: List query (CRM dashboard)
    if (cleanSql.includes('FROM seller_leads sl')) {
      let leads = Array.from(this.sellerLeads.values());

      // Status filter
      if (cleanSql.includes('sl.lead_status = $')) {
        const statusVal = params.find(p => ['NEW', 'CONTACTED', 'FOLLOW_UP', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED', 'LOST'].includes(p));
        if (statusVal) {
          leads = leads.filter(l => l.lead_status === statusVal);
        }
      }

      // Assigned staff filter
      if (cleanSql.includes('sl.assigned_staff_id IS NULL')) {
        leads = leads.filter(l => !l.assigned_staff_id);
      } else if (cleanSql.includes('sl.assigned_staff_id = $')) {
        const staffVal = params.find(p => typeof p === 'string' && p.startsWith('usr-'));
        if (staffVal) {
          leads = leads.filter(l => l.assigned_staff_id === staffVal);
        }
      }

      const mapped = leads.map(lead => {
        const staff = lead.assigned_staff_id ? this.users.get(lead.assigned_staff_id) : null;
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

    // 14. SELLER_LEADS: Update
    if (cleanSql.includes('UPDATE seller_leads')) {
      const id = params[params.length - 1];
      const lead = this.sellerLeads.get(id);
      if (lead) {
        if (cleanSql.includes('lead_status = $1')) {
          lead.lead_status = params[0];
          if (params[1] && typeof params[1] === 'string' && params[1].trim()) {
            lead.notes = lead.notes ? `${lead.notes}\n${params[1]}` : params[1];
          }
        }
        if (cleanSql.includes('assigned_staff_id = $1')) {
          lead.assigned_staff_id = params[0];
          lead.assigned_at = new Date().toISOString();
          if (lead.lead_status === 'NEW') lead.lead_status = 'CONTACTED';
        }
        if (cleanSql.includes('next_follow_up_at = $1')) {
          lead.next_follow_up_at = params[0];
          lead.follow_up_notes = params[1] || null;
          if (lead.lead_status === 'NEW') lead.lead_status = 'CONTACTED';
        }
        if (cleanSql.includes('notes = CASE') || cleanSql.includes('notes = COALESCE')) {
          const noteText = params[0] || params[1];
          if (noteText) {
            lead.notes = lead.notes ? `${lead.notes}\n${noteText}` : noteText;
          }
        }
        lead.updated_at = new Date().toISOString();
        return { rows: [{ ...lead }] };
      }
      return { rows: [] };
    }

    // 15. SELLER_LEADS: Insert
    if (cleanSql.includes('INSERT INTO seller_leads')) {
      const lead: DevSellerLead = {
        id: params[0] || `lead-${Date.now()}`,
        owner_name: params[1],
        phone: params[2],
        apartment_society_name: params[3],
        locality_id: params[4],
        bhk_type: params[5],
        expected_price_inr: params[6] || null,
        listing_intent: params[7] || 'SELL',
        lead_status: params[8] || 'NEW',
        assigned_staff_id: params[9] || null,
        consent_record_id: params[10] || null,
        property_id: null,
        assigned_at: null,
        next_follow_up_at: null,
        follow_up_notes: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.sellerLeads.set(lead.id, lead);
      return { rows: [{ ...lead }] };
    }

    // 16. BUYER_ENQUIRIES: List & Details
    if (cleanSql.includes('FROM buyer_enquiries')) {
      if (cleanSql.includes('WHERE be.id = $1') || cleanSql.includes('WHERE id = $1')) {
        const id = params[0];
        const be = this.buyerEnquiries.get(id);
        if (!be) return { rows: [] };
        const staff = be.assigned_staff_id ? this.users.get(be.assigned_staff_id) : null;
        return {
          rows: [{
            ...be,
            assigned_staff_name: staff?.display_name || null,
            assigned_staff_phone: staff?.phone || null,
          }]
        };
      }
      return { rows: Array.from(this.buyerEnquiries.values()).map(b => ({ ...b })) };
    }

    // 17. BUYER_ENQUIRIES: Insert
    if (cleanSql.includes('INSERT INTO buyer_enquiries')) {
      const be: DevBuyerEnquiry = {
        id: params[0] || `enq-${Date.now()}`,
        buyer_name: params[1],
        phone: params[2],
        preferred_locality_or_society: params[3],
        bhk_type: params[4],
        lead_status: params[5] || 'NEW',
        assigned_staff_id: params[6] || null,
        assigned_at: null,
        next_follow_up_at: null,
        follow_up_notes: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.buyerEnquiries.set(be.id, be);
      return { rows: [{ ...be }] };
    }

    // 18. BUYER_ENQUIRIES: Update
    if (cleanSql.includes('UPDATE buyer_enquiries')) {
      const id = params[params.length - 1];
      const be = this.buyerEnquiries.get(id);
      if (be) {
        if (cleanSql.includes('lead_status = $1')) {
          be.lead_status = params[0];
          if (params[1]) be.notes = be.notes ? `${be.notes}\n${params[1]}` : params[1];
        }
        if (cleanSql.includes('assigned_staff_id = $1')) {
          be.assigned_staff_id = params[0];
          be.assigned_at = new Date().toISOString();
          if (be.lead_status === 'NEW') be.lead_status = 'CONTACTED';
        }
        if (cleanSql.includes('next_follow_up_at = $1')) {
          be.next_follow_up_at = params[0];
          be.follow_up_notes = params[1] || null;
          if (be.lead_status === 'NEW') be.lead_status = 'CONTACTED';
        }
        be.updated_at = new Date().toISOString();
        return { rows: [{ ...be }] };
      }
      return { rows: [] };
    }

    // 19. PROPERTIES: Select (with owner filter or list)
    if (cleanSql.includes('FROM properties')) {
      if (cleanSql.includes('WHERE p.owner_id = $1') || cleanSql.includes('WHERE owner_id = $1')) {
        const ownerId = params[0];
        const matched = Array.from(this.properties.values()).filter(p => p.owner_id === ownerId);
        return {
          rows: matched.map(p => {
            const lead = Array.from(this.sellerLeads.values()).find(l => l.property_id === p.id || l.phone === '+919845012345');
            const staff = lead?.assigned_staff_id ? this.users.get(lead.assigned_staff_id) : null;
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

      if (cleanSql.includes('WHERE id = $1')) {
        const id = params[0];
        const p = this.properties.get(id);
        return p ? { rows: [{ ...p }] } : { rows: [] };
      }

      // All properties
      const all = Array.from(this.properties.values());
      return { rows: all.map(p => ({ ...p })) };
    }

    // 20. PROPERTIES: Insert
    if (cleanSql.includes('INSERT INTO properties')) {
      const prop: DevProperty = {
        id: params[0] || `prop-${Date.now()}`,
        owner_id: params[1],
        project_locality_id: params[2],
        unit_number: params[3] || 'Flat 101',
        wing_tower: params[4] || 'Tower A',
        unit_floor: params[5] || 1,
        total_floors: params[6] || 10,
        bhk_type: params[7] || '2BHK',
        super_built_up_sqft: params[8] || 1200,
        carpet_area_sqft: params[9] || 950,
        balconies_count: params[10] || 1,
        bathrooms_count: params[11] || 2,
        facing: params[12] || 'EAST',
        car_parks_count: params[13] || 1,
        is_covered_parking: Boolean(params[14]),
        khata_type: params[15] || 'A_KHATA',
        encumbrance_status: params[16] || 'CLEAR',
        loan_bank_name: params[17] || null,
        occupancy_status: params[18] || 'READY_TO_MOVE',
        monthly_maintenance_inr: params[19] || 0,
        asking_price_inr: params[20] || 10000000,
        reserve_minimum_price_inr: params[21] || 9500000,
        listing_intent: params[22] || 'SELL',
        crm_status: 'NEW',
        verification_tier: params[23] || 'LEVEL_1_OWNER_DECLARED',
        internal_verification_notes: params[24] || '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.properties.set(prop.id, prop);
      return { rows: [{ ...prop }] };
    }

    // 21. PROPERTIES: Update crm_status
    if (cleanSql.includes('UPDATE properties') && cleanSql.includes('crm_status = $1')) {
      const newStatus = params[0];
      if (cleanSql.includes('WHERE id = $2')) {
        const id = params[1];
        const p = this.properties.get(id);
        if (p) {
          p.crm_status = newStatus;
          p.updated_at = new Date().toISOString();
        }
      } else if (cleanSql.includes('WHERE owner_id =')) {
        const phone = params[1];
        const u = Array.from(this.users.values()).find(x => x.phone === phone);
        if (u) {
          for (const p of this.properties.values()) {
            if (p.owner_id === u.id) {
              p.crm_status = newStatus;
              p.updated_at = new Date().toISOString();
            }
          }
        }
      }
      return { rows: [] };
    }

    // 22. DOCUMENTS: Select / Update
    if (cleanSql.includes('FROM documents') && cleanSql.includes('WHERE id = $1')) {
      const id = params[0];
      const d = this.documents.get(id);
      return d ? { rows: [{ ...d }] } : { rows: [] };
    }
    if (cleanSql.includes('UPDATE documents') && cleanSql.includes('verification_status = $1')) {
      const docId = params[3];
      const d = this.documents.get(docId);
      if (d) {
        d.verification_status = params[0];
        d.verified_by_staff_id = params[1];
        d.discrepancy_note = params[2];
        d.verified_at = new Date().toISOString();
        d.updated_at = new Date().toISOString();
        return { rows: [{ ...d }] };
      }
      return { rows: [] };
    }

    // 23. AUDIT_LOGS: Insert & Select
    if (cleanSql.includes('INSERT INTO audit_logs')) {
      const logEntry: DevAuditLog = {
        id: params[0] || `aud-${Date.now()}`,
        actor_user_id: params[1],
        actor_id: params[1],
        actor_role: params[2],
        action: params[3],
        target_entity: params[4],
        target_entity_id: params[5],
        client_ip: params[6] || '127.0.0.1',
        diff_summary: params[7] || {},
        created_at: new Date().toISOString(),
      };
      this.auditLogs.unshift(logEntry);
      return { rows: [{ ...logEntry }] };
    }

    if (cleanSql.includes('FROM audit_logs')) {
      const targetId = params[0];
      const filtered = this.auditLogs.filter(l => l.target_entity_id === targetId);
      return { rows: filtered };
    }

    // Fallback: return empty set
    return { rows: [] };
  }
}

export const devSandboxStore = new DevSandboxStore();
