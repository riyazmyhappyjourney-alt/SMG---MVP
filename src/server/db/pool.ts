import pg from 'pg';
import { getValidatedConfig, ConfigurationError } from '../config/env';

const { Pool } = pg;

/**
 * PostgreSQL Connection Pool Manager
 * Configured for Google Cloud SQL (asia-south1, Mumbai)
 * 
 * [Fail-Closed Enforcement]:
 * Throws ConfigurationError if DATABASE_URL is missing,
 * unless explicitly operating in sandbox test mode with ALLOW_DEV_FALLBACKS=true.
 */

let poolInstance: pg.Pool | null = null;

type TestQueryHandler = (text: string, params?: unknown[]) => Promise<{ rows: any[] } | null> | { rows: any[] } | null;
let testQueryHandler: TestQueryHandler | null = null;

/**
 * Clean Test Double Hook: allows automated tests to supply query results
 * without embedding test-support state inside production domain services.
 */
export function setTestQueryHandler(handler: TestQueryHandler | null): void {
  testQueryHandler = handler;
}

// ====================================================================
// IN-MEMORY MOCK STORE FOR LOCAL / SANDBOX EXECUTION
// ====================================================================

interface MockUser {
  id: string;
  phone: string;
  email: string | null;
  display_name: string | null;
  password_hash: string | null;
  token_version: number;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mockUsers: MockUser[] = [];
const mockProperties: any[] = [
  {
    id: 'prop-prestige-falcon-1102',
    owner_id: 'owner-default',
    project_locality_id: 'Kanakapura Road',
    unit_number: 'Tower 4, Flat 1102',
    wing_tower: 'Tower 4',
    unit_floor: 11,
    total_floors: 18,
    bhk_type: '3 BHK',
    super_built_up_sqft: 1850,
    carpet_area_sqft: 1420,
    balconies_count: 2,
    bathrooms_count: 3,
    facing: 'East',
    car_parks_count: 1,
    is_covered_parking: true,
    khata_type: 'A-Khata',
    encumbrance_status: 'NIL',
    loan_bank_name: null,
    occupancy_status: 'VACANT',
    monthly_maintenance_inr: 4500,
    asking_price_inr: 16500000,
    reserve_minimum_price_inr: 15800000,
    listing_intent: 'SELL',
    verification_tier: 'LEVEL_2_DOCS_REVIEWED',
    internal_verification_notes: JSON.stringify({
      societyName: 'Prestige Falcon City',
      locality: 'Kanakapura Road, South Bengaluru'
    }),
    created_at: '2026-10-06T10:15:00Z',
    updated_at: '2026-10-08T09:30:00Z',
  },
  {
    id: 'prop-sobha-dream-acres-704',
    owner_id: 'owner-default',
    project_locality_id: 'Panathur / Balagere',
    unit_number: 'Wing B, Flat 704',
    wing_tower: 'Wing B',
    unit_floor: 7,
    total_floors: 14,
    bhk_type: '2 BHK',
    super_built_up_sqft: 1205,
    carpet_area_sqft: 940,
    balconies_count: 1,
    bathrooms_count: 2,
    facing: 'North-East',
    car_parks_count: 1,
    is_covered_parking: true,
    khata_type: 'A-Khata',
    encumbrance_status: 'NIL',
    loan_bank_name: null,
    occupancy_status: 'VACANT',
    monthly_maintenance_inr: 3200,
    asking_price_inr: 11000000,
    reserve_minimum_price_inr: 10500000,
    listing_intent: 'SELL',
    verification_tier: 'LEVEL_2_DOCS_REVIEWED',
    internal_verification_notes: JSON.stringify({
      societyName: 'Sobha Dream Acres',
      locality: 'Panathur / Balagere, East Bengaluru'
    }),
    created_at: '2026-10-07T14:20:00Z',
    updated_at: '2026-10-08T10:00:00Z',
  },
  {
    id: 'prop-brigade-gateway-1502',
    owner_id: 'owner-default',
    project_locality_id: 'Malleshwaram / Rajajinagar',
    unit_number: 'Tower A, Flat 1502',
    wing_tower: 'Tower A',
    unit_floor: 15,
    total_floors: 24,
    bhk_type: '3 BHK',
    super_built_up_sqft: 2010,
    carpet_area_sqft: 1580,
    balconies_count: 2,
    bathrooms_count: 3,
    facing: 'North',
    car_parks_count: 2,
    is_covered_parking: true,
    khata_type: 'A-Khata',
    encumbrance_status: 'NIL',
    loan_bank_name: null,
    occupancy_status: 'VACANT',
    monthly_maintenance_inr: 6000,
    asking_price_inr: 27500000,
    reserve_minimum_price_inr: 26000000,
    listing_intent: 'SELL',
    verification_tier: 'LEVEL_2_DOCS_REVIEWED',
    internal_verification_notes: JSON.stringify({
      societyName: 'Brigade Gateway',
      locality: 'Rajajinagar, West Bengaluru'
    }),
    created_at: '2026-10-08T08:45:00Z',
    updated_at: '2026-10-08T11:15:00Z',
  }
];
const mockSellerLeads: any[] = [];
const mockBuyerEnquiries: any[] = [];
const mockConsents: any[] = [];
const mockPropertyMedia: any[] = [];
const mockErasureRequests: any[] = [];

function executeMockSandboxQuery(text: string, params: any[] = []): { rows: any[] } {
  const normalizedSql = text.trim();
  const upper = normalizedSql.toUpperCase();

  // DDL, Session configs, Transactions
  if (
    upper.startsWith('ALTER TABLE') ||
    upper.startsWith('CREATE TABLE') ||
    upper.startsWith('CREATE INDEX') ||
    upper.startsWith('BEGIN') ||
    upper.startsWith('COMMIT') ||
    upper.startsWith('ROLLBACK') ||
    upper.includes('SET_CONFIG')
  ) {
    return { rows: [] };
  }

  // 1. USERS TABLE
  if (upper.includes('FROM USERS') || upper.includes('INTO USERS') || upper.includes('UPDATE USERS')) {
    if (upper.startsWith('INSERT INTO USERS')) {
      const id = params[0] || `usr-${Date.now()}`;
      const phone = params[1] || '';
      const email = params[2] || null;
      const display_name = params[3] || null;
      const password_hash = params[4] || null;
      
      let roles: string[] = ['OWNER'];
      if (upper.includes('STAFF_SUPER_ADMIN')) {
        roles = ['STAFF_SUPER_ADMIN'];
      } else if (upper.includes('STAFF_VERIFICATION_AGENT')) {
        roles = ['STAFF_VERIFICATION_AGENT'];
      } else if (Array.isArray(params[5])) {
        roles = params[5];
      } else if (typeof params[5] === 'string') {
        const cleanRoleStr = params[5].replace(/[{}]/g, '').trim();
        roles = cleanRoleStr ? cleanRoleStr.split(',').map(r => r.trim()).filter(Boolean) : ['OWNER'];
      }

      const existingIndex = mockUsers.findIndex(u => (phone && u.phone === phone) || (email && u.email && u.email.toLowerCase() === email.toLowerCase()));
      const now = new Date().toISOString();
      const userRecord: MockUser = {
        id,
        phone,
        email,
        display_name,
        password_hash,
        token_version: 1,
        roles,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      if (existingIndex >= 0) {
        if (upper.includes('DO UPDATE')) {
          mockUsers[existingIndex] = {
            ...mockUsers[existingIndex],
            display_name: display_name || mockUsers[existingIndex].display_name,
            email: email || mockUsers[existingIndex].email,
            password_hash: password_hash || mockUsers[existingIndex].password_hash,
            updated_at: now,
          };
          return { rows: [mockUsers[existingIndex]] };
        }
        return { rows: [mockUsers[existingIndex]] };
      }

      mockUsers.push(userRecord);
      return { rows: [userRecord] };
    }

    if (upper.startsWith('UPDATE USERS')) {
      const now = new Date().toISOString();
      if (upper.includes('SET DISPLAY_NAME') && upper.includes('WHERE PHONE')) {
        const newName = params[0];
        const phone = params[1];
        const user = mockUsers.find(u => u.phone === phone);
        if (user) {
          user.display_name = newName;
          user.updated_at = now;
        }
        return { rows: [] };
      }
      if (upper.includes('TOKEN_VERSION') && upper.includes('WHERE ID')) {
        const id = params[0];
        const user = mockUsers.find(u => u.id === id);
        if (user) {
          user.token_version += 1;
          user.updated_at = now;
        }
        return { rows: [] };
      }
      return { rows: [] };
    }

    if (upper.startsWith('SELECT')) {
      if (upper.includes('WHERE LOWER(EMAIL)')) {
        const targetEmail = String(params[0] || '').toLowerCase().trim();
        const found = mockUsers.filter(u => u.email && u.email.toLowerCase().trim() === targetEmail);
        return { rows: found };
      }
      if (upper.includes('WHERE PHONE')) {
        const targetPhone = String(params[0] || '').trim();
        const found = mockUsers.filter(u => u.phone === targetPhone);
        return { rows: found };
      }
      if (upper.includes('WHERE ID')) {
        const targetId = String(params[0] || '').trim();
        const found = mockUsers.filter(u => u.id === targetId);
        return { rows: found };
      }
      return { rows: [...mockUsers] };
    }
  }

  // 2. SELLER LEADS TABLE
  if (upper.includes('SELLER_LEADS')) {
    if (upper.startsWith('INSERT INTO SELLER_LEADS')) {
      const lead = {
        id: params[0] || `lead-${Date.now()}`,
        owner_name: params[1] || 'Owner',
        phone: params[2] || '',
        apartment_society_name: params[3] || 'Prestige Shantiniketan',
        locality_id: params[4] || 'Whitefield',
        bhk_type: params[5] || '3BHK',
        expected_price_inr: params[6] || null,
        listing_intent: params[7] || 'SELL',
        lead_status: params[8] || 'NEW',
        assigned_staff_id: params[9] || null,
        consent_record_id: params[10] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockSellerLeads.unshift(lead);
      return { rows: [lead] };
    }
    return { rows: [...mockSellerLeads] };
  }

  // 3. BUYER ENQUIRIES TABLE
  if (upper.includes('BUYER_ENQUIRIES')) {
    if (upper.startsWith('INSERT INTO BUYER_ENQUIRIES')) {
      const enquiry = {
        id: params[0] || `enq-${Date.now()}`,
        buyer_name: params[1] || 'Buyer',
        phone: params[2] || '',
        preferred_locality_or_society: params[3] || 'Whitefield',
        bhk_type: params[4] || '3BHK',
        lead_status: 'NEW',
        notes: params[5] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockBuyerEnquiries.unshift(enquiry);
      return { rows: [enquiry] };
    }
    return { rows: [...mockBuyerEnquiries] };
  }

  // 4. PROPERTIES TABLE
  if (upper.includes('PROPERTIES')) {
    if (upper.startsWith('INSERT INTO PROPERTIES')) {
      const prop = {
        id: params[0] || `prop-${Date.now()}`,
        owner_id: params[1] || 'owner-1',
        project_locality_id: params[2] || 'Whitefield',
        unit_number: params[3] || 'A-101',
        wing_tower: params[4] || 'Tower 1',
        unit_floor: params[5] || 4,
        total_floors: params[6] || 14,
        bhk_type: params[7] || '3BHK',
        super_built_up_sqft: params[8] || 1650,
        carpet_area_sqft: params[9] || 1280,
        balconies_count: params[10] || 2,
        bathrooms_count: params[11] || 3,
        facing: params[12] || 'EAST',
        car_parks_count: params[13] || 1,
        is_covered_parking: params[14] !== false,
        khata_type: params[15] || 'A-Khata',
        encumbrance_status: params[16] || 'NIL',
        loan_bank_name: params[17] || null,
        occupancy_status: params[18] || 'READY',
        monthly_maintenance_inr: params[19] || 4500,
        asking_price_inr: params[20] || 18500000,
        reserve_minimum_price_inr: params[21] || 17500000,
        listing_intent: params[22] || 'SELL',
        verification_tier: params[23] || 'LEVEL_2_DOCS_REVIEWED',
        internal_verification_notes: params[24] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProperties.unshift(prop);
      return { rows: [prop] };
    }
    if (upper.includes('WHERE OWNER_ID = $1')) {
      const ownerId = params[0];
      const matches = mockProperties.filter(p => p.owner_id === ownerId);
      return { rows: matches.length > 0 ? matches : [...mockProperties] };
    }
    return { rows: [...mockProperties] };
  }

  // 5. CONSENTS TABLE
  if (upper.includes('CONSENTS')) {
    if (upper.startsWith('INSERT INTO CONSENTS')) {
      const consent = {
        id: params[0] || `cst-${Date.now()}`,
        phone: params[1] || '',
        user_id: params[2] || null,
        purpose: params[3] || 'SELLER_ONBOARDING',
        notice_version: params[4] || 'dpdp-notice-v1-2026',
        is_consented: true,
        consented_at: new Date().toISOString(),
      };
      mockConsents.push(consent);
      return { rows: [consent] };
    }
    return { rows: [...mockConsents] };
  }

  // 6. PROPERTY MEDIA TABLE
  if (upper.includes('PROPERTY_MEDIA')) {
    if (upper.startsWith('INSERT INTO PROPERTY_MEDIA')) {
      const media = {
        id: params[0] || `med-${Date.now()}`,
        property_id: params[1] || '',
        url: params[2] || '',
        is_featured: Boolean(params[3]),
        checksum: params[4] || '',
        storage_path: params[5] || '',
        mime_type: params[6] || 'image/jpeg',
        file_size_bytes: params[7] || 1024,
        created_at: new Date().toISOString(),
      };
      mockPropertyMedia.push(media);
      return { rows: [media] };
    }
    return { rows: [...mockPropertyMedia] };
  }

  // 7. ERASURE REQUESTS
  if (upper.includes('ERASURE_REQUESTS')) {
    if (upper.startsWith('INSERT INTO ERASURE_REQUESTS')) {
      const req = {
        id: params[0] || `ers-${Date.now()}`,
        user_id: params[1] || '',
        requester_reason: params[2] || '',
        request_status: 'PENDING',
        requested_at: new Date().toISOString(),
      };
      mockErasureRequests.push(req);
      return { rows: [req] };
    }
    return { rows: [...mockErasureRequests] };
  }

  return { rows: [] };
}

export function getDbPool(): pg.Pool {
  if (!poolInstance) {
    const config = getValidatedConfig();
    const isDummyDb = !config.databaseUrl || 
                      config.databaseUrl.includes('127.0.0.1') || 
                      config.databaseUrl.includes('localhost') || 
                      config.databaseUrl.includes('your_secure_db_password');

    if (isDummyDb && !config.allowSandbox) {
      throw new ConfigurationError(
        'DATABASE_URL',
        'PostgreSQL connection string is required. Fail-closed: database operations cannot proceed.'
      );
    }

    if (isDummyDb && config.allowSandbox) {
      // In sandbox mode without a real databaseUrl, DO NOT instantiate a real pg.Pool.
      // Return a smart in-memory mock pool object so zero real TCP connections are attempted.
      poolInstance = {
        query: async (text: string, params?: unknown[]) => {
          return executeMockSandboxQuery(text, (params as any[]) || []);
        },
        connect: async () => ({
          query: async (sql: string, params?: unknown[]) => {
            return executeMockSandboxQuery(sql, (params as any[]) || []);
          },
          release: () => {},
        }),
        end: async () => {},
        on: () => poolInstance,
      } as unknown as pg.Pool;
      return poolInstance;
    }

    const isRemote = config.databaseUrl.includes('supabase.co') || config.databaseUrl.includes('amazonaws.com') || config.databaseUrl.includes('cloudsql');
    const allowInsecureSsl = process.env.PG_SSL_ALLOW_INSECURE === 'true' || (!config.isProduction);
    const sslConfig = isRemote
      ? (allowInsecureSsl ? { rejectUnauthorized: false } : { rejectUnauthorized: true })
      : (config.isProduction ? { rejectUnauthorized: true } : false);

    const realPool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: sslConfig,
    });

    const origConnect = realPool.connect.bind(realPool);
    (realPool as any).connect = function (...args: any[]) {
      if (typeof args[0] === 'function') {
        const cb = args[0];
        return origConnect((err: any, client: any, release: any) => {
          if (err || !client) return cb(err, client, release);
          const origQuery = client.query.bind(client);
          client.query = async (text: any, params: any, queryCb?: any) => {
            if (testQueryHandler) {
              const testRes = await testQueryHandler(text, params);
              if (testRes !== null) {
                if (typeof queryCb === 'function') return queryCb(null, testRes);
                return testRes;
              }
            }
            return origQuery(text, params, queryCb);
          };
          return cb(null, client, release);
        });
      }

      return origConnect().then((client: any) => {
        const origQuery = client.query.bind(client);
        client.query = async (text: any, params: any, queryCb?: any) => {
          if (testQueryHandler) {
            const testRes = await testQueryHandler(text, params);
            if (testRes !== null) {
              if (typeof queryCb === 'function') return queryCb(null, testRes);
              return testRes;
            }
          }
          return origQuery(text, params, queryCb);
        };
        return client;
      });
    };

    poolInstance = realPool;
  }
  return poolInstance;
}

export const dbPool = getDbPool();

/**
 * Executes a parameterized query with strict fail-closed handling
 */
export async function executeQuery<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
  const config = getValidatedConfig();
  const isDummyDb = !config.databaseUrl || 
                    config.databaseUrl.includes('127.0.0.1') || 
                    config.databaseUrl.includes('localhost') || 
                    config.databaseUrl.includes('your_secure_db_password');

  if (isDummyDb && !config.allowSandbox) {
    throw new ConfigurationError(
      'DATABASE_URL',
      'Cannot execute query: DATABASE_URL is unset. Fail-closed: writes rejected.'
    );
  }

  // 1. Check test double handler if registered (for isolated unit testing)
  if (testQueryHandler) {
    const testResult = await testQueryHandler(text, params);
    if (testResult !== null) {
      return testResult as { rows: T[] };
    }
  }

  // 2. Direct sandbox interception BEFORE any connection attempt
  if (isDummyDb && config.allowSandbox) {
    const res = executeMockSandboxQuery(text, (params as any[]) || []);
    return res as { rows: T[] };
  }

  try {
    const pool = getDbPool();
    const res = await pool.query(text, params);
    return res as { rows: T[] };
  } catch (err: any) {
    if (config.allowSandbox) {
      console.warn(`[AI Studio] Database connection unavailable (${err.message}) — falling back to mock query`);
      const res = executeMockSandboxQuery(text, (params as any[]) || []);
      return res as { rows: T[] };
    }
    throw err;
  }
}

