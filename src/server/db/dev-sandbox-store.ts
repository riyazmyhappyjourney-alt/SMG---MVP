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
  property_id?: string | null;
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
  listing_status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'SOLD' | 'ARCHIVED';
  title?: string;
  description?: string;
  amenities?: string[];
  property_type?: string;
  public_address?: string;
  floor_band?: string;
  developer_name?: string;
  landmarks?: any[];
  highlights?: string[];
  verification_tier: string;
  internal_verification_notes: string;
  created_at: string;
  updated_at: string;
}

export interface DevPropertyMedia {
  id: string;
  property_id: string;
  url: string;
  is_featured: boolean;
  display_order?: number;
  checksum: string;
  storage_path?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  created_at: string;
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
      project_locality_id: 'Sobha Dream Acres, Panathur',
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
      listing_status: 'PUBLISHED',
      title: 'Sobha Dream Acres - Spacious 3BHK',
      property_type: 'Apartment',
      public_address: 'Tower 4, Panathur / Balagere, East Bengaluru',
      floor_band: 'Floor 11 of 18 (High Floor)',
      developer_name: 'Sobha Limited',
      description: 'RERA-approved 3BHK resale apartment in Sobha Dream Acres. Featuring 1650 sq.ft. super built-up area, East facing, cross ventilation, and complete clear legal title.',
      amenities: ['Clubhouse with Indoor Badminton Courts', 'Olympic-Sized Swimming Pool', '24/7 Security & CCTV', '100% DG Power Backup', 'Gymnasium'],
      verification_tier: 'LEVEL_1_OWNER_DECLARED',
      internal_verification_notes: JSON.stringify({ verified: false }),
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.properties.set(prop1.id, prop1);

    const prop2: DevProperty = {
      id: 'prop-dev-seed-02',
      owner_id: owner.id,
      project_locality_id: 'Sobha Dream Acres, Panathur / Balagere',
      unit_number: 'Flat 402',
      wing_tower: 'Tower 2',
      unit_floor: 4,
      total_floors: 18,
      bhk_type: '2BHK',
      super_built_up_sqft: 1205,
      carpet_area_sqft: 890,
      balconies_count: 1,
      bathrooms_count: 2,
      facing: 'NORTH',
      car_parks_count: 1,
      is_covered_parking: true,
      khata_type: 'A_KHATA',
      encumbrance_status: 'CLEAR',
      loan_bank_name: 'SBI Home Finance',
      occupancy_status: 'READY_TO_MOVE',
      monthly_maintenance_inr: 3800,
      asking_price_inr: 10800000,
      reserve_minimum_price_inr: 10200000,
      listing_intent: 'SELL',
      crm_status: 'CONTACTED',
      listing_status: 'PUBLISHED',
      title: 'Sobha Dream Acres - Compact 2BHK',
      property_type: 'Apartment',
      public_address: 'Panathur / Balagere, East Bengaluru',
      floor_band: 'Floor 4 of 18 (Mid Floor)',
      developer_name: 'Sobha Limited',
      description: 'Well-ventilated 2BHK residence with modular kitchen and Kaveri Form 15 verified title.',
      amenities: ['Swimming Pool', 'Gymnasium', '24/7 Security', 'Power Backup'],
      verification_tier: 'LEVEL_3_PHYSICALLY_INSPECTED',
      internal_verification_notes: JSON.stringify({ verified: true }),
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.properties.set(prop2.id, prop2);

    const prop3: DevProperty = {
      id: 'prop-dev-seed-03',
      owner_id: owner.id,
      project_locality_id: 'Prestige Falcon City, Kanakapura Road',
      unit_number: 'Flat 801',
      wing_tower: 'Tower 1',
      unit_floor: 8,
      total_floors: 18,
      bhk_type: '3BHK',
      super_built_up_sqft: 1850,
      carpet_area_sqft: 1420,
      balconies_count: 2,
      bathrooms_count: 3,
      facing: 'EAST',
      car_parks_count: 1,
      is_covered_parking: true,
      khata_type: 'A_KHATA',
      encumbrance_status: 'CLEAR',
      loan_bank_name: 'HDFC Bank',
      occupancy_status: 'READY_TO_MOVE',
      monthly_maintenance_inr: 5200,
      asking_price_inr: 16500000,
      reserve_minimum_price_inr: 15800000,
      listing_intent: 'SELL',
      crm_status: 'FOLLOW_UP',
      listing_status: 'PUBLISHED',
      title: 'Prestige Falcon City - Premium 3BHK',
      property_type: 'Apartment',
      public_address: 'Kanakapura Road, South Bengaluru',
      floor_band: 'Floor 8 of 18 (Mid Floor)',
      developer_name: 'Prestige Group',
      description: 'Spacious 3BHK high-rise apartment near Metro Station with expansive balcony deck.',
      amenities: ['Clubhouse', 'Swimming Pool', 'Tennis Court', 'Gymnasium', '24/7 Security'],
      verification_tier: 'LEVEL_2_DOCS_REVIEWED',
      internal_verification_notes: JSON.stringify({ verified: true }),
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.properties.set(prop3.id, prop3);

    const prop4: DevProperty = {
      id: 'prop-dev-seed-04',
      owner_id: owner.id,
      project_locality_id: 'Brigade Cornerstone Utopia, Varthur / Whitefield',
      unit_number: 'Flat 1604',
      wing_tower: 'Tower Eden',
      unit_floor: 16,
      total_floors: 22,
      bhk_type: '4BHK+',
      super_built_up_sqft: 2450,
      carpet_area_sqft: 1890,
      balconies_count: 3,
      bathrooms_count: 4,
      facing: 'NORTH_EAST',
      car_parks_count: 2,
      is_covered_parking: true,
      khata_type: 'A_KHATA',
      encumbrance_status: 'CLEAR',
      loan_bank_name: 'ICICI Bank',
      occupancy_status: 'READY_TO_MOVE',
      monthly_maintenance_inr: 6800,
      asking_price_inr: 28500000,
      reserve_minimum_price_inr: 27500000,
      listing_intent: 'SELL',
      crm_status: 'SITE_VISIT',
      listing_status: 'PUBLISHED',
      title: 'Brigade Cornerstone Utopia - Luxury 4BHK+',
      property_type: 'Apartment',
      public_address: 'Varthur / Whitefield, East Bengaluru',
      floor_band: 'Floor 16 of 22 (High Floor)',
      developer_name: 'Brigade Group',
      description: 'Exclusive 4BHK penthouse style residence in integrated smart township.',
      amenities: ['Olympic Pool', 'Multiplex Screening', 'Clubhouse', 'EV Stations', 'Security'],
      verification_tier: 'LEVEL_3_PHYSICALLY_INSPECTED',
      internal_verification_notes: JSON.stringify({ verified: true }),
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.properties.set(prop4.id, prop4);

    // Seed default media for sample properties
    const mediaSeeds = [
      { id: 'media-seed-01', property_id: 'prop-dev-seed-01', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', is_featured: true },
      { id: 'media-seed-02', property_id: 'prop-dev-seed-02', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', is_featured: true },
      { id: 'media-seed-03', property_id: 'prop-dev-seed-03', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', is_featured: true },
      { id: 'media-seed-04', property_id: 'prop-dev-seed-04', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', is_featured: true },
    ];
    for (const m of mediaSeeds) {
      this.propertyMedia.set(m.id, {
        id: m.id,
        property_id: m.property_id,
        url: m.url,
        is_featured: m.is_featured,
        checksum: 'seed-' + m.id,
        created_at: new Date().toISOString()
      });
    }
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
      const rawPhone = String(params[0] || '').replace(/\D/g, '').slice(-10);
      let matched = Array.from(this.consents.values()).filter(x => 
        x.phone === params[0] || x.phone?.replace(/\D/g, '').slice(-10) === rawPhone
      );
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
            property_id: be.property_id || null,
            assigned_staff_name: staff?.display_name || null,
            assigned_staff_phone: staff?.phone || null,
          }]
        };
      }
      if (cleanSql.includes('WHERE phone = $1') || cleanSql.includes('WHERE buyer_phone = $1')) {
        const rawPhone = String(params[0] || '').replace(/\D/g, '').slice(-10);
        const match = Array.from(this.buyerEnquiries.values()).filter(b => 
          b.phone === params[0] || b.phone?.replace(/\D/g, '').slice(-10) === rawPhone
        );
        return { rows: match.map(b => ({ ...b, property_id: b.property_id || null })) };
      }
      return { rows: Array.from(this.buyerEnquiries.values()).map(b => ({ ...b, property_id: b.property_id || null })) };
    }

    // 17. BUYER_ENQUIRIES: Insert
    if (cleanSql.includes('INSERT INTO buyer_enquiries')) {
      const hasProp = cleanSql.includes('property_id');
      const be: DevBuyerEnquiry = {
        id: params[0] || `enq-${Date.now()}`,
        buyer_name: params[1],
        phone: params[2],
        preferred_locality_or_society: params[3],
        bhk_type: params[4],
        property_id: hasProp ? (params[5] || null) : null,
        lead_status: params.length >= 8 ? (params[6] || 'NEW') : 'NEW',
        assigned_staff_id: null,
        assigned_at: null,
        next_follow_up_at: null,
        follow_up_notes: null,
        notes: params.length === 7 ? (params[6] || null) : (params[7] || params[6] || null),
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

    // 19. PROPERTY MEDIA: Select, Insert, Update, Delete
    if (cleanSql.includes('FROM property_media')) {
      if (cleanSql.includes('WHERE property_id = $1')) {
        const propId = String(params[0] || '').trim();
        const media = Array.from(this.propertyMedia.values()).filter(m => m.property_id === propId);
        media.sort((a, b) => {
          if (cleanSql.toLowerCase().includes('is_featured desc') && b.is_featured !== a.is_featured) {
            return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
          }
          return (a.display_order ?? 0) - (b.display_order ?? 0);
        });
        return { rows: media.map(m => ({ ...m })) };
      }
      if (cleanSql.includes('WHERE id = $1')) {
        const id = String(params[0] || '').trim();
        const m = this.propertyMedia.get(id);
        return m ? { rows: [{ ...m }] } : { rows: [] };
      }
      return { rows: Array.from(this.propertyMedia.values()).map(m => ({ ...m })) };
    }

    if (cleanSql.includes('INSERT INTO property_media')) {
      const mediaId = params[0] || `media-${Date.now()}`;
      const propId = params[1];
      const url = params[2];
      const isFeatured = Boolean(params[3]);
      const existingCount = Array.from(this.propertyMedia.values()).filter(m => m.property_id === propId).length;
      let displayOrder = existingCount;
      if (cleanSql.includes('display_order') && typeof params[4] === 'number') {
        displayOrder = params[4];
      }
      const checksum = params[5] || params[4] || 'hash-' + mediaId;
      const mediaItem: DevPropertyMedia = {
        id: mediaId,
        property_id: propId,
        url,
        is_featured: isFeatured,
        display_order: displayOrder,
        checksum,
        storage_path: params[6] || params[5] || null,
        mime_type: params[7] || params[6] || 'image/jpeg',
        file_size_bytes: params[8] || params[7] || 500000,
        created_at: new Date().toISOString()
      };
      // If this is marked featured, unmark others for the same property
      if (isFeatured) {
        for (const m of this.propertyMedia.values()) {
          if (m.property_id === propId) m.is_featured = false;
        }
      }
      this.propertyMedia.set(mediaId, mediaItem);
      return { rows: [{ ...mediaItem }] };
    }

    if (cleanSql.includes('UPDATE property_media')) {
      if (cleanSql.includes('display_order = $1')) {
        const newOrder = Number(params[0]);
        const targetId = params[1];
        const m = this.propertyMedia.get(targetId);
        if (m) {
          m.display_order = newOrder;
          return { rows: [{ ...m }] };
        }
        return { rows: [] };
      }
      if (cleanSql.includes('is_featured = false WHERE property_id = $1')) {
        const propId = params[0];
        for (const m of this.propertyMedia.values()) {
          if (m.property_id === propId) m.is_featured = false;
        }
        return { rows: [] };
      }
      if (cleanSql.includes('is_featured = true WHERE id = $1') || cleanSql.includes('is_featured = $1 WHERE id = $2')) {
        const targetId = cleanSql.includes('is_featured = true') ? params[0] : params[1];
        const targetVal = cleanSql.includes('is_featured = true') ? true : Boolean(params[0]);
        const m = this.propertyMedia.get(targetId);
        if (m) {
          if (targetVal) {
            for (const other of this.propertyMedia.values()) {
              if (other.property_id === m.property_id) other.is_featured = false;
            }
          }
          m.is_featured = targetVal;
          return { rows: [{ ...m }] };
        }
        return { rows: [] };
      }
    }

    if (cleanSql.includes('DELETE FROM property_media WHERE id = $1')) {
      const mediaId = params[0];
      const m = this.propertyMedia.get(mediaId);
      this.propertyMedia.delete(mediaId);
      // If removed image was featured, promote another
      if (m && m.is_featured) {
        const remaining = Array.from(this.propertyMedia.values()).filter(x => x.property_id === m.property_id);
        if (remaining.length > 0) remaining[0].is_featured = true;
      }
      return { rows: [] };
    }

    // 20. PROPERTIES: Select (with owner filter, single ID lookup, similar lookup, or list)
    if (cleanSql.includes('FROM properties')) {
      // 1. Single property by ID
      if (
        cleanSql.includes('WHERE id = $1') || 
        cleanSql.includes('WHERE p.id = $1') ||
        cleanSql.includes('WHERE (p.id = $1') ||
        cleanSql.includes('WHERE (id = $1')
      ) {
        const id = String(params[0] || '').trim();
        const p = this.properties.get(id) || Array.from(this.properties.values()).find(x => x.id === id || `sgl-${x.id.slice(0, 8)}` === id);
        return p ? { rows: [{ ...p }] } : { rows: [] };
      }

      // 2. Similar properties query (excludes target property ID and non-published / lost / dropped properties)
      if (cleanSql.includes('WHERE id != $1') || cleanSql.includes('WHERE p.id != $1')) {
        const excludeId = String(params[0] || '').trim();
        const candidates = Array.from(this.properties.values()).filter(p => {
          if (p.id === excludeId || `sgl-${p.id.slice(0, 8)}` === excludeId) return false;
          if (p.crm_status === 'LOST' || p.crm_status === 'DROPPED') return false;
          if (p.listing_status && p.listing_status !== 'PUBLISHED') return false;
          return true;
        });
        return { rows: candidates.map(p => ({ ...p })) };
      }

      // 3. Properties by owner ID
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

      // 4. Public active listings query (/api/listings)
      if (cleanSql.includes('listing_status = \'PUBLISHED\'') || cleanSql.includes('COALESCE(listing_status, \'PUBLISHED\') = \'PUBLISHED\'')) {
        const published = Array.from(this.properties.values()).filter(p => 
          (p.listing_status === 'PUBLISHED' || (!p.listing_status && p.id.startsWith('prop-dev-seed'))) &&
          p.crm_status !== 'LOST' && p.crm_status !== 'DROPPED'
        );
        return { rows: published.map(p => ({ ...p })) };
      }

      // 5. All active properties (CRM inventory table)
      const all = Array.from(this.properties.values());
      return {
        rows: all.map(p => {
          const lead = Array.from(this.sellerLeads.values()).find(l => l.property_id === p.id);
          const staff = lead?.assigned_staff_id ? this.users.get(lead.assigned_staff_id) : null;
          return {
            ...p,
            owner_name: lead?.owner_name || 'Owner',
            owner_phone: lead?.phone || '+919800000000',
            rm_name: staff?.display_name || 'Unassigned',
            rm_phone: staff?.phone || null,
          };
        })
      };
    }

    // 21. PROPERTIES: Insert
    if (cleanSql.includes('INSERT INTO properties')) {
      // Determine if listing_status is provided
      let listingStatus: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'SOLD' | 'ARCHIVED' = 'DRAFT';
      if (cleanSql.includes('listing_status')) {
        const found = params.find(p => ['DRAFT', 'PUBLISHED', 'PAUSED', 'SOLD', 'ARCHIVED'].includes(p));
        if (found) listingStatus = found as any;
      }

      // If this is the Phase 2 CRM Property Management insert
      if (cleanSql.includes('property_type') && cleanSql.includes('floor_band')) {
        let amenitiesParsed: string[] = [];
        try { amenitiesParsed = JSON.parse(params[19]); } catch { amenitiesParsed = Array.isArray(params[19]) ? params[19] : []; }
        let landmarksParsed: string[] = [];
        try { landmarksParsed = JSON.parse(params[24]); } catch { landmarksParsed = Array.isArray(params[24]) ? params[24] : []; }
        let highlightsParsed: string[] = [];
        try { highlightsParsed = JSON.parse(params[25]); } catch { highlightsParsed = Array.isArray(params[25]) ? params[25] : []; }

        const prop: DevProperty = {
          id: params[0] || `prop-${Date.now()}`,
          owner_id: params[1] || 'usr-staff-intake-01',
          project_locality_id: params[2] || 'Bengaluru',
          unit_number: params[3] || 'Flat 101',
          wing_tower: params[4] || 'Tower A',
          unit_floor: Number(params[5]) || 1,
          total_floors: Number(params[6]) || 10,
          bhk_type: params[7] || '2BHK',
          super_built_up_sqft: Number(params[8]) || 1200,
          carpet_area_sqft: Number(params[9]) || 950,
          balconies_count: Number(params[10]) || 1,
          bathrooms_count: Number(params[11]) || 2,
          facing: params[12] || 'EAST',
          car_parks_count: Number(params[13]) || 1,
          is_covered_parking: true,
          khata_type: 'A_KHATA',
          encumbrance_status: 'CLEAR',
          loan_bank_name: null,
          occupancy_status: 'READY_TO_MOVE',
          monthly_maintenance_inr: Number(params[14]) || 0,
          asking_price_inr: Number(params[15]) || 10000000,
          reserve_minimum_price_inr: Number(params[16]) || 9500000,
          listing_intent: 'SELL',
          crm_status: 'NEW',
          listing_status: 'DRAFT',
          title: params[17] || 'Property',
          description: params[18] || '',
          amenities: amenitiesParsed,
          property_type: params[20] || 'Apartment',
          public_address: params[21] || params[2] || 'Bengaluru',
          floor_band: params[22] || 'MID',
          developer_name: params[23] || 'Developer',
          landmarks: landmarksParsed,
          highlights: highlightsParsed,
          verification_tier: 'LEVEL_1_OWNER_DECLARED',
          internal_verification_notes: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        this.properties.set(prop.id, prop);
        return { rows: [{ ...prop }] };
      }

      // Default property insert (seller service / wizard)
      const prop: DevProperty = {
        id: params[0] || `prop-${Date.now()}`,
        owner_id: params[1] || 'usr-staff-intake-01',
        project_locality_id: params[2] || 'Bengaluru',
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
        crm_status: (params.find((p: any) => p === 'LOST' || p === 'DROPPED') as any) || 'NEW',
        listing_status: listingStatus,
        verification_tier: params[23] || 'LEVEL_1_OWNER_DECLARED',
        internal_verification_notes: params[24] || '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        property_type: 'Apartment',
        title: 'Property',
        description: '',
        public_address: params[2] || 'Bengaluru',
        floor_band: 'MID',
        developer_name: 'Developer',
        amenities: [],
        landmarks: [],
        highlights: []
      };

      this.properties.set(prop.id, prop);
      return { rows: [{ ...prop }] };
    }

    // 22. PROPERTIES: Update (listing_status, crm_status, or full edit)
    if (cleanSql.includes('UPDATE properties')) {
      if (cleanSql.includes('listing_status =')) {
        let newListingStatus: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'SOLD' | 'ARCHIVED' | undefined;
        let propId = params[0];
        if (cleanSql.includes("listing_status = 'PUBLISHED'")) newListingStatus = 'PUBLISHED';
        else if (cleanSql.includes("listing_status = 'PAUSED'")) newListingStatus = 'PAUSED';
        else if (cleanSql.includes("listing_status = 'SOLD'")) newListingStatus = 'SOLD';
        else if (cleanSql.includes("listing_status = 'ARCHIVED'")) newListingStatus = 'ARCHIVED';
        else if (cleanSql.includes('listing_status = $1')) {
          newListingStatus = params[0] as any;
          propId = params[1];
        }

        if (newListingStatus) {
          const p = this.properties.get(propId);
          if (p) {
            p.listing_status = newListingStatus;
            p.updated_at = new Date().toISOString();
            return { rows: [{ ...p }] };
          }
          return { rows: [] };
        }
      }

      if (cleanSql.includes('crm_status = $1')) {
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

      // Full property field edit: UPDATE properties SET title = COALESCE($1, title)... WHERE id = $17
      if (cleanSql.includes('title = COALESCE($1, title)')) {
        const propId = params[params.length - 1];
        const p = this.properties.get(propId);
        if (p) {
          if (params[0] !== null && params[0] !== undefined) p.title = params[0];
          if (params[1] !== null && params[1] !== undefined) p.description = params[1];
          if (params[2] !== null && params[2] !== undefined) p.property_type = params[2];
          if (params[3] !== null && params[3] !== undefined) p.bhk_type = params[3];
          if (params[4] !== null && params[4] !== undefined) p.project_locality_id = params[4];
          if (params[5] !== null && params[5] !== undefined) p.public_address = params[5];
          if (params[6] !== null && params[6] !== undefined) p.floor_band = params[6];
          if (params[7] !== null && params[7] !== undefined) p.facing = params[7];
          if (params[8] !== null && params[8] !== undefined) p.super_built_up_sqft = Number(params[8]);
          if (params[9] !== null && params[9] !== undefined) p.carpet_area_sqft = Number(params[9]);
          if (params[10] !== null && params[10] !== undefined) p.asking_price_inr = Number(params[10]);
          if (params[11] !== null && params[11] !== undefined) p.monthly_maintenance_inr = Number(params[11]);
          if (params[12] !== null && params[12] !== undefined) {
            try { p.amenities = JSON.parse(params[12]); } catch { p.amenities = params[12]; }
          }
          if (params[13] !== null && params[13] !== undefined) p.developer_name = params[13];
          if (params[14] !== null && params[14] !== undefined) {
            try { p.landmarks = JSON.parse(params[14]); } catch { p.landmarks = params[14]; }
          }
          if (params[15] !== null && params[15] !== undefined) {
            try { p.highlights = JSON.parse(params[15]); } catch { p.highlights = params[15]; }
          }
          p.updated_at = new Date().toISOString();
          return { rows: [{ ...p }] };
        }
        return { rows: [] };
      }

      // General property edit: find by ID in params
      const propId = params[params.length - 1];
      const p = this.properties.get(propId);
      if (p) {
        p.updated_at = new Date().toISOString();
        return { rows: [{ ...p }] };
      }
      return { rows: [] };
    }

    // 23. DOCUMENTS: Select / Update
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

    // 24. AUDIT_LOGS: Insert & Select
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
      const filtered = this.auditLogs.filter(l => 
        l.target_entity_id === targetId || 
        (params[1] && l.target_entity_id === params[1]) ||
        (l.diff_summary && l.diff_summary.propertyId === targetId)
      );
      return { rows: filtered };
    }

    // Fallback: return empty set
    return { rows: [] };
  }
}

export const devSandboxStore = new DevSandboxStore();
