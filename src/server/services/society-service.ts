import { executeQuery } from '../db/pool';
import { devSandboxStore } from '../db/dev-sandbox-store';

export interface SocietyRecord {
  id: string;
  name: string;
  locality: string;
  city: string;
  developer_name?: string | null;
  total_towers?: number;
  source: 'system' | 'user_submitted';
  verification_status: 'verified' | 'unverified';
  created_at?: string;
  updated_at?: string;
}

export interface SocietyTowerRecord {
  id: string;
  society_id: string;
  tower_name: string;
  total_floors?: number | null;
  units_per_floor?: number | null;
  created_at?: string;
}

export interface SocietyFlatTypeRecord {
  id: string;
  tower_id: string;
  flat_no_pattern?: string | null;
  bhk_type: string;
  super_builtup_sqft?: number | null;
  created_at?: string;
}

// Seed societies for fallback / instant local testing
export const INITIAL_BENGALURU_SOCIETIES: Array<{
  society: SocietyRecord;
  towers: Array<{
    tower: SocietyTowerRecord;
    flatTypes: SocietyFlatTypeRecord[];
  }>;
}> = [
  {
    society: {
      id: 'soc-prestige-shantiniketan',
      name: 'Prestige Shantiniketan',
      locality: 'Whitefield',
      city: 'Bengaluru',
      developer_name: 'Prestige Group',
      total_towers: 24,
      source: 'system',
      verification_status: 'verified'
    },
    towers: [
      {
        tower: {
          id: 'tow-psn-c1',
          society_id: 'soc-prestige-shantiniketan',
          tower_name: 'Crescent Tower 1',
          total_floors: 18,
          units_per_floor: 4
        },
        flatTypes: [
          { id: 'ft-psn-1', tower_id: 'tow-psn-c1', flat_no_pattern: '*01', bhk_type: '3 BHK', super_builtup_sqft: 1920 },
          { id: 'ft-psn-2', tower_id: 'tow-psn-c1', flat_no_pattern: '*02', bhk_type: '2 BHK', super_builtup_sqft: 1297 },
          { id: 'ft-psn-3', tower_id: 'tow-psn-c1', flat_no_pattern: '*03', bhk_type: '3.5 BHK', super_builtup_sqft: 2072 },
          { id: 'ft-psn-4', tower_id: 'tow-psn-c1', flat_no_pattern: '*04', bhk_type: '4 BHK', super_builtup_sqft: 3190 }
        ]
      },
      {
        tower: {
          id: 'tow-psn-c2',
          society_id: 'soc-prestige-shantiniketan',
          tower_name: 'Crescent Tower 2',
          total_floors: 18,
          units_per_floor: 4
        },
        flatTypes: [
          { id: 'ft-psn-5', tower_id: 'tow-psn-c2', flat_no_pattern: '*01', bhk_type: '3 BHK', super_builtup_sqft: 1920 },
          { id: 'ft-psn-6', tower_id: 'tow-psn-c2', flat_no_pattern: '*02', bhk_type: '2 BHK', super_builtup_sqft: 1297 }
        ]
      }
    ]
  },
  {
    society: {
      id: 'soc-sobha-dream-acres',
      name: 'Sobha Dream Acres',
      locality: 'Panathur / Balagere',
      city: 'Bengaluru',
      developer_name: 'Sobha Limited',
      total_towers: 16,
      source: 'system',
      verification_status: 'verified'
    },
    towers: [
      {
        tower: {
          id: 'tow-sda-t4',
          society_id: 'soc-sobha-dream-acres',
          tower_name: 'Tower 4',
          total_floors: 18,
          units_per_floor: 6
        },
        flatTypes: [
          { id: 'ft-sda-1', tower_id: 'tow-sda-t4', flat_no_pattern: '*01', bhk_type: '2 BHK', super_builtup_sqft: 1012 },
          { id: 'ft-sda-2', tower_id: 'tow-sda-t4', flat_no_pattern: '*02', bhk_type: '2 BHK', super_builtup_sqft: 1205 },
          { id: 'ft-sda-3', tower_id: 'tow-sda-t4', flat_no_pattern: '*03', bhk_type: '1 BHK', super_builtup_sqft: 650 }
        ]
      },
      {
        tower: {
          id: 'tow-sda-t5',
          society_id: 'soc-sobha-dream-acres',
          tower_name: 'Tower 5',
          total_floors: 18,
          units_per_floor: 6
        },
        flatTypes: [
          { id: 'ft-sda-4', tower_id: 'tow-sda-t5', flat_no_pattern: '*01', bhk_type: '2 BHK', super_builtup_sqft: 1012 },
          { id: 'ft-sda-5', tower_id: 'tow-sda-t5', flat_no_pattern: '*02', bhk_type: '2 BHK', super_builtup_sqft: 1205 }
        ]
      }
    ]
  },
  {
    society: {
      id: 'soc-brigade-gateway',
      name: 'Brigade Gateway',
      locality: 'Malleshwaram / Rajajinagar',
      city: 'Bengaluru',
      developer_name: 'Brigade Enterprises',
      total_towers: 7,
      source: 'system',
      verification_status: 'verified'
    },
    towers: [
      {
        tower: {
          id: 'tow-bg-regal',
          society_id: 'soc-brigade-gateway',
          tower_name: 'Regal Tower',
          total_floors: 24,
          units_per_floor: 4
        },
        flatTypes: [
          { id: 'ft-bg-1', tower_id: 'tow-bg-regal', flat_no_pattern: '*01', bhk_type: '3 BHK', super_builtup_sqft: 2100 },
          { id: 'ft-bg-2', tower_id: 'tow-bg-regal', flat_no_pattern: '*02', bhk_type: '4 BHK', super_builtup_sqft: 3350 }
        ]
      }
    ]
  },
  {
    society: {
      id: 'soc-godrej-woodsman',
      name: 'Godrej Woodsman Estate',
      locality: 'Hebbal',
      city: 'Bengaluru',
      developer_name: 'Godrej Properties',
      total_towers: 7,
      source: 'system',
      verification_status: 'verified'
    },
    towers: [
      {
        tower: {
          id: 'tow-gwe-acacia',
          society_id: 'soc-godrej-woodsman',
          tower_name: 'Acacia Block',
          total_floors: 16,
          units_per_floor: 4
        },
        flatTypes: [
          { id: 'ft-gwe-1', tower_id: 'tow-gwe-acacia', flat_no_pattern: '*01', bhk_type: '2 BHK', super_builtup_sqft: 1450 },
          { id: 'ft-gwe-2', tower_id: 'tow-gwe-acacia', flat_no_pattern: '*02', bhk_type: '3 BHK', super_builtup_sqft: 1980 }
        ]
      }
    ]
  },
  {
    society: {
      id: 'soc-salarpuria-greenage',
      name: 'Salarpuria Sattva Greenage',
      locality: 'Bommanahalli / Hosur Road',
      city: 'Bengaluru',
      developer_name: 'Salarpuria Sattva',
      total_towers: 10,
      source: 'system',
      verification_status: 'verified'
    },
    towers: [
      {
        tower: {
          id: 'tow-ssg-oak',
          society_id: 'soc-salarpuria-greenage',
          tower_name: 'Oak Tower',
          total_floors: 22,
          units_per_floor: 4
        },
        flatTypes: [
          { id: 'ft-ssg-1', tower_id: 'tow-ssg-oak', flat_no_pattern: '*01', bhk_type: '2 BHK', super_builtup_sqft: 1345 },
          { id: 'ft-ssg-2', tower_id: 'tow-ssg-oak', flat_no_pattern: '*02', bhk_type: '3 BHK', super_builtup_sqft: 1890 }
        ]
      }
    ]
  }
];

export class SocietyService {
  /**
   * Search societies with trigram fuzzy matching (Top 8 ranked results)
   */
  static async searchSocieties(query: string, limit = 8): Promise<SocietyRecord[]> {
    const cleanQ = (query || '').trim();
    if (!cleanQ) return [];

    try {
      // 1. Attempt PostgreSQL Trigram match first
      const sql = `
        SELECT id, name, locality, city, developer_name, total_towers, source, verification_status,
               similarity(name, $1) AS score
        FROM societies
        WHERE similarity(name, $1) > 0.15 OR name ILIKE $2 OR locality ILIKE $2
        ORDER BY score DESC, name ASC
        LIMIT $3;
      `;
      const res = await executeQuery(sql, [cleanQ, `%${cleanQ}%`, limit]);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {
      // Fallback handled below
    }

    // 2. In-memory fallback (used in dev sandbox and test doubles)
    const lowerQ = cleanQ.toLowerCase();
    const sandboxSocieties: SocietyRecord[] = [];

    // Pull from devSandboxStore if available
    if (devSandboxStore && (devSandboxStore as any).societies) {
      for (const soc of (devSandboxStore as any).societies.values()) {
        sandboxSocieties.push(soc);
      }
    }

    // Include seed societies
    INITIAL_BENGALURU_SOCIETIES.forEach(item => {
      if (!sandboxSocieties.some(s => s.id === item.society.id)) {
        sandboxSocieties.push(item.society);
      }
    });

    // Score based on trigram/substring similarity
    const scored = sandboxSocieties.map(soc => {
      const name = soc.name.toLowerCase();
      const loc = (soc.locality || '').toLowerCase();
      let score = 0;

      if (name === lowerQ) score = 1.0;
      else if (name.startsWith(lowerQ)) score = 0.85;
      else if (name.includes(lowerQ)) score = 0.65;
      else if (loc.includes(lowerQ)) score = 0.4;
      else {
        // Simple fuzzy token overlap
        const qTokens = lowerQ.split(/\s+/);
        const matchTokens = qTokens.filter(t => t && name.includes(t));
        score = matchTokens.length / Math.max(qTokens.length, 1) * 0.5;
      }

      return { soc, score };
    });

    return scored
      .filter(item => item.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.soc);
  }

  /**
   * Get towers for a society
   */
  static async getTowersForSociety(societyId: string): Promise<SocietyTowerRecord[]> {
    if (!societyId) return [];

    try {
      const res = await executeQuery(
        `SELECT id, society_id, tower_name, total_floors, units_per_floor 
         FROM society_towers 
         WHERE society_id = $1 
         ORDER BY tower_name ASC;`,
        [societyId]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {}

    // Fallback: check dev store & seed data
    const found = INITIAL_BENGALURU_SOCIETIES.find(s => s.society.id === societyId);
    if (found) {
      return found.towers.map(t => t.tower);
    }

    if (devSandboxStore && (devSandboxStore as any).societyTowers) {
      const result: SocietyTowerRecord[] = [];
      for (const tow of (devSandboxStore as any).societyTowers.values()) {
        if (tow.society_id === societyId) result.push(tow);
      }
      if (result.length > 0) return result;
    }

    return [];
  }

  /**
   * Get flat types for a tower
   */
  static async getFlatTypesForTower(towerId: string): Promise<SocietyFlatTypeRecord[]> {
    if (!towerId) return [];

    try {
      const res = await executeQuery(
        `SELECT id, tower_id, flat_no_pattern, bhk_type, super_builtup_sqft 
         FROM society_flat_types 
         WHERE tower_id = $1 
         ORDER BY super_builtup_sqft ASC;`,
        [towerId]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {}

    // Fallback from seed data
    for (const soc of INITIAL_BENGALURU_SOCIETIES) {
      for (const tow of soc.towers) {
        if (tow.tower.id === towerId) {
          return tow.flatTypes;
        }
      }
    }

    if (devSandboxStore && (devSandboxStore as any).societyFlatTypes) {
      const result: SocietyFlatTypeRecord[] = [];
      for (const ft of (devSandboxStore as any).societyFlatTypes.values()) {
        if (ft.tower_id === towerId) result.push(ft);
      }
      if (result.length > 0) return result;
    }

    return [];
  }

  /**
   * Auto-grow dataset: If a user enters a typed society name that does not exist,
   * insert it with source='user_submitted', verification_status='unverified'.
   */
  static async findOrCreateSociety(name: string, locality = 'Bengaluru', city = 'Bengaluru'): Promise<SocietyRecord> {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      throw new Error('Society name is required.');
    }

    try {
      const existing = await executeQuery(
        `SELECT id, name, locality, city, developer_name, total_towers, source, verification_status 
         FROM societies 
         WHERE LOWER(name) = LOWER($1) 
         LIMIT 1;`,
        [cleanName]
      );
      if (existing.rows && existing.rows.length > 0) {
        return existing.rows[0];
      }

      const newId = `soc-user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const insertRes = await executeQuery(
        `INSERT INTO societies (id, name, locality, city, total_towers, source, verification_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 1, 'user_submitted', 'unverified', NOW(), NOW())
         RETURNING id, name, locality, city, developer_name, total_towers, source, verification_status;`,
        [newId, cleanName, locality, city]
      );
      if (insertRes.rows && insertRes.rows.length > 0) {
        return insertRes.rows[0];
      }
    } catch {
      // Sandbox fallback
    }

    const newId = `soc-user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: SocietyRecord = {
      id: newId,
      name: cleanName,
      locality,
      city,
      total_towers: 1,
      source: 'user_submitted',
      verification_status: 'unverified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (devSandboxStore) {
      if (!(devSandboxStore as any).societies) {
        (devSandboxStore as any).societies = new Map<string, SocietyRecord>();
      }
      (devSandboxStore as any).societies.set(newId, newRecord);
    }

    return newRecord;
  }
}
