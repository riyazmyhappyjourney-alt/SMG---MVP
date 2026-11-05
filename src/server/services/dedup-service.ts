import { executeQuery } from '../db/pool';
import { devSandboxStore } from '../db/dev-sandbox-store';

export interface PropertyValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: {
    phone: string;
    ownerName: string;
    bhkType: string;
    askingPriceInr: number;
    superBuiltUpSqft?: number;
    carpetAreaSqft?: number;
    locality: string;
    societyName?: string;
    towerName?: string;
    flatNumber?: string;
    unitFloor?: number;
    totalFloors?: number;
    facing?: string;
    furnishingStatus?: string;
    description?: string;
  };
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateOfPropertyId: string | null;
  matchType: 'PHONE_LOCALITY_BHK_PRICE' | 'SOCIETY_TOWER_FLAT' | null;
  reason: string | null;
}

const ALLOWED_BHK_TYPES = new Set([
  '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '4.5 BHK', '4+ BHK', 'Penthouse', 'Villa'
]);

const ALLOWED_FACING = new Set([
  'EAST', 'WEST', 'NORTH', 'SOUTH', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST'
]);

export class DedupValidationService {
  /**
   * Strict server-side validation on all property submission paths
   */
  static validatePropertyPayload(input: any): PropertyValidationResult {
    const errors: Record<string, string> = {};
    const sanitized: any = {};

    // 1. Phone validation (E.164 normalization)
    const rawPhone = String(input.phone || input.ownerPhone || input.owner_phone || '').trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    let normalizedPhone = '';
    if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
      normalizedPhone = `+91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91') && /^[6-9]/.test(digitsOnly.slice(2))) {
      normalizedPhone = `+${digitsOnly}`;
    } else {
      errors.phone = 'Valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 is required (+91).';
    }
    sanitized.phone = normalizedPhone;

    // 2. Owner Name Sanitization
    const rawName = String(input.ownerName || input.owner_name || input.name || '').trim();
    if (rawName.length < 2 || rawName.length > 80) {
      errors.ownerName = 'Owner name must be between 2 and 80 characters.';
    } else {
      sanitized.ownerName = rawName.replace(/[<>'"`;]/g, '');
    }

    // 3. Price Validation (positive integer between ₹5 Lakh and ₹100 Crore)
    const rawPrice = input.askingPriceInr || input.asking_price_inr || input.expectedPrice || input.expected_price;
    const priceNum = typeof rawPrice === 'string' ? parseInt(rawPrice.replace(/\D/g, ''), 10) : Number(rawPrice);
    if (!priceNum || isNaN(priceNum) || priceNum < 500000 || priceNum > 1000000000) {
      errors.askingPriceInr = 'Asking price must be a valid positive integer between ₹5,00,000 (5 Lakhs) and ₹100,00,00,000 (100 Crores).';
    } else {
      sanitized.askingPriceInr = Math.round(priceNum);
    }

    // 4. BHK Type validation
    let rawBhk = String(input.bhkType || input.bhk_type || input.bhkConfig || '').trim();
    if (!rawBhk.toUpperCase().includes('BHK') && !['PENTHOUSE', 'VILLA'].includes(rawBhk.toUpperCase())) {
      rawBhk = `${rawBhk} BHK`;
    }
    const matchedBhk = Array.from(ALLOWED_BHK_TYPES).find(b => b.toLowerCase() === rawBhk.toLowerCase());
    if (!matchedBhk) {
      errors.bhkType = `Invalid BHK type. Allowed configurations: ${Array.from(ALLOWED_BHK_TYPES).join(', ')}.`;
    } else {
      sanitized.bhkType = matchedBhk;
    }

    // 5. Area Validations (Super built-up 200 - 30,000 sq.ft.)
    const rawSbua = input.superBuiltUpSqft || input.super_built_up_sqft || input.sbua;
    if (rawSbua !== undefined && rawSbua !== null && rawSbua !== '') {
      const sbuaNum = Number(rawSbua);
      if (isNaN(sbuaNum) || sbuaNum < 200 || sbuaNum > 30000) {
        errors.superBuiltUpSqft = 'Super built-up area must be between 200 and 30,000 sq.ft.';
      } else {
        sanitized.superBuiltUpSqft = Math.round(sbuaNum);
      }
    }

    const rawCarpet = input.carpetAreaSqft || input.carpet_area_sqft || input.carpetArea;
    if (rawCarpet !== undefined && rawCarpet !== null && rawCarpet !== '') {
      const carpetNum = Number(rawCarpet);
      if (isNaN(carpetNum) || carpetNum < 150 || carpetNum > 25000) {
        errors.carpetAreaSqft = 'Carpet area must be between 150 and 25,000 sq.ft.';
      } else if (sanitized.superBuiltUpSqft && carpetNum > sanitized.superBuiltUpSqft) {
        errors.carpetAreaSqft = 'Carpet area cannot exceed Super Built-up area.';
      } else {
        sanitized.carpetAreaSqft = Math.round(carpetNum);
      }
    }

    // 6. Locality & Society Sanitization
    const rawLocality = String(input.locality || input.localityName || input.locality_name || '').trim();
    if (!rawLocality || rawLocality.length < 2) {
      errors.locality = 'Valid property locality in Bengaluru is required.';
    } else {
      sanitized.locality = rawLocality.replace(/[<>'"`;]/g, '');
    }

    sanitized.societyName = input.societyName || input.society || input.apartment_society_name ? String(input.societyName || input.society || input.apartment_society_name).trim().replace(/[<>'"`;]/g, '') : undefined;
    sanitized.towerName = input.towerName || input.wing_tower || input.wingTower ? String(input.towerName || input.wing_tower || input.wingTower).trim().replace(/[<>'"`;]/g, '') : undefined;
    sanitized.flatNumber = input.flatNumber || input.unit_number || input.unitNumber || input.flatNo ? String(input.flatNumber || input.unit_number || input.unitNumber || input.flatNo).trim().replace(/[<>'"`;]/g, '') : undefined;
    sanitized.unitFloor = input.unitFloor !== undefined && input.unitFloor !== '' ? Number(input.unitFloor) : undefined;
    sanitized.totalFloors = input.totalFloors !== undefined && input.totalFloors !== '' ? Number(input.totalFloors) : undefined;

    if (input.facing) {
      const cleanFacing = String(input.facing).trim().toUpperCase();
      sanitized.facing = ALLOWED_FACING.has(cleanFacing) ? cleanFacing : 'EAST';
    }

    if (input.description) {
      sanitized.description = String(input.description).trim().replace(/<[^>]*>?/gm, '').slice(0, 3000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Duplicate Detection Check on Insert:
   * Criteria A: (phone + locality + bhk_type + price within 5%)
   * Criteria B: (society_id/society_name + tower_name + flat_no if known)
   *
   * Note: Does NOT reject! Returns suspected match for staff flagging.
   */
  static async checkDuplicateProperty(candidate: {
    phone: string;
    locality?: string;
    bhkType?: string;
    askingPriceInr?: number;
    societyId?: string;
    societyName?: string;
    towerName?: string;
    flatNumber?: string;
  }): Promise<DuplicateDetectionResult> {
    const { phone, locality = '', bhkType = '', askingPriceInr = 0, societyId, societyName, towerName, flatNumber } = candidate;

    const minPrice = askingPriceInr > 0 ? Math.floor(askingPriceInr * 0.95) : 0;
    const maxPrice = askingPriceInr > 0 ? Math.ceil(askingPriceInr * 1.05) : Infinity;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    try {
      // 1. Check Criteria B first: exact physical unit match (Society + Tower + Flat) if provided
      if (flatNumber && (societyId || societyName)) {
        const flatQuery = `
          SELECT p.id, p.unit_number, p.wing_tower, p.project_locality_id, p.asking_price_inr, u.phone AS owner_phone
          FROM properties p
          LEFT JOIN users u ON u.id = p.owner_id
          WHERE (p.society_id = $1 OR p.project_locality_id ILIKE $2)
            AND LOWER(p.unit_number) = LOWER($3)
            ${towerName ? 'AND LOWER(p.wing_tower) = LOWER($4)' : ''}
          LIMIT 1;
        `;
        const paramsB = towerName 
          ? [societyId || '', `%${societyName || ''}%`, flatNumber, towerName]
          : [societyId || '', `%${societyName || ''}%`, flatNumber];
        
        const resB = await executeQuery(flatQuery, paramsB);
        if (resB.rows && resB.rows.length > 0) {
          const matched = resB.rows[0];
          return {
            isDuplicate: true,
            duplicateOfPropertyId: matched.id,
            matchType: 'SOCIETY_TOWER_FLAT',
            reason: `Exact Unit Match: Flat ${flatNumber}${towerName ? ` in ${towerName}` : ''} at ${societyName || 'same society'} already exists in inventory (Property ID: ${matched.id}).`
          };
        }
      }

      // 2. Check Criteria A: Phone + Locality + BHK + Price within 5%
      const phoneQuery = `
        SELECT p.id, p.asking_price_inr, p.bhk_type, p.project_locality_id, u.phone AS owner_phone
        FROM properties p
        LEFT JOIN users u ON u.id = p.owner_id
        LEFT JOIN seller_leads sl ON sl.property_id = p.id
        WHERE (u.phone LIKE $1 OR sl.phone LIKE $1)
          AND (p.project_locality_id ILIKE $2)
          AND (LOWER(p.bhk_type) = LOWER($3))
          AND (p.asking_price_inr BETWEEN $4 AND $5)
        LIMIT 1;
      `;
      const resA = await executeQuery(phoneQuery, [`%${cleanPhone}`, `%${locality}%`, bhkType, minPrice, maxPrice]);
      if (resA.rows && resA.rows.length > 0) {
        const matched = resA.rows[0];
        return {
          isDuplicate: true,
          duplicateOfPropertyId: matched.id,
          matchType: 'PHONE_LOCALITY_BHK_PRICE',
          reason: `Seller & Spec Match: Phone +91***${cleanPhone.slice(-4)}, ${bhkType} in ${locality} with price ₹${(askingPriceInr / 100000).toFixed(1)}L (within 5% of existing ₹${(matched.asking_price_inr / 100000).toFixed(1)}L, Property ID: ${matched.id}).`
        };
      }
    } catch {
      // Sandbox fallback below
    }

    // 3. Dev Sandbox Store In-Memory Fallback Check
    if (devSandboxStore && devSandboxStore.properties) {
      for (const p of devSandboxStore.properties.values()) {
        // Criteria B Sandbox check
        if (flatNumber && p.unit_number && String(p.unit_number).toLowerCase().includes(flatNumber.toLowerCase())) {
          if (societyName && p.project_locality_id && p.project_locality_id.toLowerCase().includes(societyName.toLowerCase())) {
            return {
              isDuplicate: true,
              duplicateOfPropertyId: p.id,
              matchType: 'SOCIETY_TOWER_FLAT',
              reason: `Exact Unit Match: Flat ${flatNumber} at ${societyName} matches existing listing (Property ID: ${p.id}).`
            };
          }
        }

        // Criteria A Sandbox check
        const owner = devSandboxStore.users.get(p.owner_id);
        const ownerPhoneClean = (owner?.phone || '').replace(/\D/g, '').slice(-10);
        if (ownerPhoneClean && ownerPhoneClean === cleanPhone) {
          const locMatch = !locality || (p.project_locality_id || '').toLowerCase().includes(locality.toLowerCase());
          const bhkMatch = !bhkType || (p.bhk_type || '').toLowerCase() === bhkType.toLowerCase();
          const existingPrice = p.asking_price_inr || 0;
          const priceMatch = existingPrice >= minPrice && existingPrice <= maxPrice;

          if (locMatch && bhkMatch && priceMatch) {
            return {
              isDuplicate: true,
              duplicateOfPropertyId: p.id,
              matchType: 'PHONE_LOCALITY_BHK_PRICE',
              reason: `Seller & Spec Match: Same seller phone +91***${cleanPhone.slice(-4)}, ${bhkType} in ${locality} with price within 5% (Property ID: ${p.id}).`
            };
          }
        }
      }
    }

    return {
      isDuplicate: false,
      duplicateOfPropertyId: null,
      matchType: null,
      reason: null
    };
  }
}
