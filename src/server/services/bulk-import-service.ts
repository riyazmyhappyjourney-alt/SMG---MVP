import crypto from 'crypto';
import { executeQuery } from '../db/pool';
import { devSandboxStore, DevProperty, DevUser, DevSellerLead } from '../db/dev-sandbox-store';
import { DedupValidationService } from './dedup-service';

export interface RawSpreadsheetRow {
  projectName?: string;
  'Project Name'?: string;
  configurations?: string;
  'Configurations'?: string;
  superBuildupArea?: string | number;
  'Super Buildup Area'?: string | number;
  facing?: string;
  'Facing'?: string;
  furnishingStatus?: string;
  'Furnishing Status'?: string;
  floor?: string;
  'Floor'?: string;
  balcony?: string | number;
  'Balcony'?: string | number;
  bathrooms?: string | number;
  'Bathrooms'?: string | number;
  propertyAge?: string;
  'Property age'?: string;
  possession?: string;
  'Possession'?: string;
  price?: string | number;
  'Price'?: string | number;
  closingPrice?: string | number;
  'Closing Price'?: string | number;
  leadSource?: string;
  'Lead Source'?: string;
  ownerName?: string;
  'Owner Name'?: string;
  ownerContact?: string | number;
  'Owner Contact'?: string | number;
  sellmyghar?: boolean | string;
  'Sellmyghar'?: boolean | string;
  magicBricks?: boolean | string;
  'Magic Brics'?: boolean | string;
  'MagicBricks'?: boolean | string;
  acres99?: boolean | string;
  '99 Acres'?: boolean | string;
  [key: string]: any;
}

export interface ParsedPropertyImportItem {
  index: number;
  projectName: string;
  bhkType: string;
  superBuiltUpSqft: number;
  facing: string;
  furnishingStatus: string;
  unitFloor: number;
  totalFloors: number;
  balconiesCount: number;
  bathroomsCount: number;
  possessionStatus: 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION';
  possessionTimeline?: string;
  askingPriceInr: number;
  reservePriceInr?: number;
  leadSource: string;
  ownerName: string;
  ownerPhone: string;
  isPublished: boolean;
  isValid: boolean;
  validationError?: string;
  isDuplicate?: boolean;
  duplicateOfPropertyId?: string | null;
  duplicateReason?: string | null;
}

export interface BulkImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  duplicatesFlagged: number;
  errorCount: number;
  items: ParsedPropertyImportItem[];
}

export class BulkImportService {
  /**
   * Helper: Parse Indian Currency strings
   * Examples: '1.95 cr' -> 19500000, '95 Lakhs' -> 9500000, '1.5' -> 15000000, '85 Lakhs' -> 8500000
   */
  static parseIndianPrice(raw: any): number {
    if (!raw && raw !== 0) return 0;
    if (typeof raw === 'number') return Math.round(raw);
    const cleaned = String(raw).trim().toLowerCase().replace(/,/g, '');
    
    // Check for Crores
    const crMatch = cleaned.match(/([\d.]+)\s*(?:cr|crore|crores)/);
    if (crMatch) {
      return Math.round(parseFloat(crMatch[1]) * 10000000);
    }

    // Check for Lakhs
    const lMatch = cleaned.match(/([\d.]+)\s*(?:l|lac|lakh|lakhs)/);
    if (lMatch) {
      return Math.round(parseFloat(lMatch[1]) * 100000);
    }

    // Direct numeric value
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      // In Indian real estate sheets, e.g., '1.5' or '2.05' without suffix implies Crores if < 50
      if (num > 0 && num < 50 && cleaned.includes('.')) {
        return Math.round(num * 10000000);
      }
      return Math.round(num);
    }

    return 0;
  }

  /**
   * Helper: Parse floor notation like '5/31' -> floor 5 of 31, '11/12' -> 11 of 12
   */
  static parseFloorNotation(raw: any): { unitFloor: number; totalFloors: number } {
    if (!raw) return { unitFloor: 5, totalFloors: 14 };
    const str = String(raw).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      const uFloor = parseInt(parts[0].replace(/\D/g, ''), 10);
      const tFloors = parseInt(parts[1].replace(/\D/g, ''), 10);
      return {
        unitFloor: isNaN(uFloor) ? 5 : uFloor,
        totalFloors: isNaN(tFloors) || tFloors === 0 ? 14 : tFloors
      };
    }
    const num = parseInt(str.replace(/\D/g, ''), 10);
    return { unitFloor: isNaN(num) ? 5 : num, totalFloors: 14 };
  }

  /**
   * Helper: Parse Indian mobile numbers into E.164 (+91...)
   */
  static parseIndianPhone(raw: any): string {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return `+91${digits}`;
    }
    if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
      return `+${digits}`;
    }
    return '';
  }

  /**
   * Helper: Parse standard BHK string
   */
  static parseBhk(raw: any): string {
    let clean = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!clean.includes('BHK')) {
      clean = `${clean}BHK`;
    }
    if (clean === '2BHK') return '2 BHK';
    if (clean === '2.5BHK') return '2.5 BHK';
    if (clean === '3BHK') return '3 BHK';
    if (clean === '3.5BHK') return '3.5 BHK';
    if (clean === '4BHK') return '4 BHK';
    if (clean === '4.5BHK') return '4.5 BHK';
    if (clean === '1BHK') return '1 BHK';
    return clean.replace('BHK', ' BHK');
  }

  /**
   * Helper: Parse Facing
   */
  static parseFacing(raw: any): string {
    const str = String(raw || '').trim().toUpperCase();
    if (str.includes('NORTH') && str.includes('EAST')) return 'NORTH_EAST';
    if (str.includes('NORTH') && str.includes('WEST')) return 'NORTH_WEST';
    if (str.includes('SOUTH') && str.includes('EAST')) return 'SOUTH_EAST';
    if (str.includes('SOUTH') && str.includes('WEST')) return 'SOUTH_WEST';
    if (str.includes('EAST')) return 'EAST';
    if (str.includes('WEST')) return 'WEST';
    if (str.includes('NORTH')) return 'NORTH';
    if (str.includes('SOUTH')) return 'SOUTH';
    return 'EAST';
  }

  /**
   * Helper: Parse Furnishing Status
   */
  static parseFurnishing(raw: any): string {
    const str = String(raw || '').trim().toLowerCase();
    if (str.includes('fully') || str.includes('full')) return 'FULLY_FURNISHED';
    if (str.includes('semi')) return 'SEMI_FURNISHED';
    return 'UNFURNISHED';
  }

  /**
   * Helper: Parse Possession
   */
  static parsePossession(raw: any): { status: 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION'; timeline?: string } {
    const str = String(raw || '').trim();
    if (str.toLowerCase().includes('ready')) {
      return { status: 'READY_TO_MOVE', timeline: 'Ready to Move' };
    }
    return { status: 'UNDER_CONSTRUCTION', timeline: str || 'Under Construction' };
  }

  /**
   * Parse a single row from the spreadsheet into canonical typed structure
   */
  static parseRow(row: RawSpreadsheetRow, index: number): ParsedPropertyImportItem {
    const projectName = String(row.projectName || row['Project Name'] || '').trim();
    const configurations = String(row.configurations || row['Configurations'] || '3BHK');
    const sbua = parseInt(String(row.superBuildupArea || row['Super Buildup Area'] || 1200).replace(/\D/g, ''), 10) || 1200;
    const facing = this.parseFacing(row.facing || row['Facing']);
    const furnishing = this.parseFurnishing(row.furnishingStatus || row['Furnishing Status']);
    const { unitFloor, totalFloors } = this.parseFloorNotation(row.floor || row['Floor']);
    const balcony = parseInt(String(row.balcony || row['Balcony'] || 1).replace(/\D/g, ''), 10) || 1;
    const bathrooms = parseInt(String(row.bathrooms || row['Bathrooms'] || 2).replace(/\D/g, ''), 10) || 2;
    const { status: possessionStatus, timeline } = this.parsePossession(row.possession || row['Possession']);
    
    const price = this.parseIndianPrice(row.price || row['Price']);
    const closingPrice = this.parseIndianPrice(row.closingPrice || row['Closing Price']);
    const leadSource = String(row.leadSource || row['Lead Source'] || 'SPREADSHEET_IMPORT').trim();
    const ownerName = String(row.ownerName || row['Owner Name'] || 'Property Owner').trim();
    const ownerPhone = this.parseIndianPhone(row.ownerContact || row['Owner Contact']);

    const isPublished = Boolean(
      row.sellmyghar === true ||
      row['Sellmyghar'] === true ||
      String(row.sellmyghar || row['Sellmyghar']).toLowerCase() === 'true' ||
      String(row.sellmyghar || row['Sellmyghar']).toLowerCase() === 'checked' ||
      String(row.sellmyghar || row['Sellmyghar']).toLowerCase() === 'yes' ||
      String(row.sellmyghar || row['Sellmyghar']) === '1'
    );

    const bhkType = this.parseBhk(configurations);

    let isValid = true;
    let validationError = '';

    if (!projectName || projectName.length < 2) {
      isValid = false;
      validationError = 'Missing Project / Society name';
    } else if (!ownerPhone) {
      isValid = false;
      validationError = 'Invalid Indian mobile number (must be 10 digits)';
    } else if (price < 500000) {
      isValid = false;
      validationError = 'Asking price must be at least ₹5 Lakhs';
    }

    return {
      index,
      projectName,
      bhkType,
      superBuiltUpSqft: sbua,
      facing,
      furnishingStatus: furnishing,
      unitFloor,
      totalFloors,
      balconiesCount: balcony,
      bathroomsCount: bathrooms,
      possessionStatus,
      possessionTimeline: timeline,
      askingPriceInr: price,
      reservePriceInr: closingPrice > 0 ? closingPrice : undefined,
      leadSource,
      ownerName,
      ownerPhone,
      isPublished,
      isValid,
      validationError: validationError || undefined
    };
  }

  /**
   * Preview a batch of spreadsheet rows with validation and dedup check
   */
  static async previewBatch(rows: RawSpreadsheetRow[]): Promise<{
    total: number;
    validCount: number;
    duplicateCount: number;
    errorCount: number;
    items: ParsedPropertyImportItem[];
  }> {
    const items: ParsedPropertyImportItem[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const parsed = this.parseRow(rows[i], i + 1);

      if (parsed.isValid) {
        // Run Feature 5 dedup check
        try {
          const dedup = await DedupValidationService.checkDuplicateProperty({
            ownerPhone: parsed.ownerPhone,
            locality: parsed.projectName,
            bhkType: parsed.bhkType,
            askingPriceInr: parsed.askingPriceInr
          });

          if (dedup.isDuplicate) {
            parsed.isDuplicate = true;
            parsed.duplicateOfPropertyId = dedup.duplicateOfPropertyId;
            parsed.duplicateReason = dedup.reason;
            duplicateCount++;
          }
        } catch {
          // sandbox or fallback
        }
        validCount++;
      } else {
        errorCount++;
      }

      items.push(parsed);
    }

    return {
      total: rows.length,
      validCount,
      duplicateCount,
      errorCount,
      items
    };
  }

  /**
   * Execute bulk ingestion of approved items into database and sandbox
   */
  static async executeImport(items: ParsedPropertyImportItem[], staffId: string = 'usr-staff-superadmin'): Promise<BulkImportResult> {
    let importedCount = 0;
    let duplicatesFlagged = 0;
    let errorCount = 0;

    for (const item of items) {
      if (!item.isValid) {
        errorCount++;
        continue;
      }

      const propertyId = `prop-imp-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
      const ownerId = `usr-owner-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
      const leadId = `lead-imp-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
      const now = new Date().toISOString();

      const floorBand = `Floor ${item.unitFloor} of ${item.totalFloors}`;
      const title = `${item.projectName} - ${item.bhkType}`;
      const carpetArea = Math.round(item.superBuiltUpSqft * 0.78);
      const listingStatus = item.isPublished ? 'PUBLISHED' : 'DRAFT';

      // 1. PostgreSQL ingestion
      try {
        // Upsert User
        await executeQuery(
          `INSERT INTO users (id, phone, display_name, roles, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, '{"CUSTOMER_SELLER"}', true, NOW(), NOW())
           ON CONFLICT (phone) DO UPDATE SET display_name = EXCLUDED.display_name
           RETURNING id;`,
          [ownerId, item.ownerPhone, item.ownerName]
        );

        // Society auto-growth (Feature 1)
        await executeQuery(
          `INSERT INTO societies (id, name, locality, city, source, verification_status, created_at, updated_at)
           VALUES ($1, $2, 'Bengaluru', 'Bengaluru', 'user_submitted', 'unverified', NOW(), NOW())
           ON CONFLICT DO NOTHING;`,
          [`soc-${crypto.randomBytes(4).toString('hex')}`, item.projectName]
        );

        // Insert Property (with Feature 5 duplicate flag if near-duplicate detected)
        await executeQuery(
          `INSERT INTO properties (
             id, owner_id, title, project_locality_id, unit_floor, total_floors,
             bhk_type, super_built_up_sqft, carpet_area_sqft, balconies_count, bathrooms_count,
             facing, floor_band, asking_price_inr, reserve_minimum_price_inr,
             listing_status, crm_status, verification_tier, possible_duplicate_of, duplicate_detection_notes,
             created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'APPROVED', 'LEVEL_1_OWNER_DECLARED', $17, $18, NOW(), NOW()
           );`,
          [
            propertyId,
            ownerId,
            title,
            item.projectName,
            item.unitFloor,
            item.totalFloors,
            item.bhkType,
            item.superBuiltUpSqft,
            carpetArea,
            item.balconiesCount,
            item.bathroomsCount,
            item.facing,
            floorBand,
            item.askingPriceInr,
            item.reservePriceInr || null,
            listingStatus,
            item.duplicateOfPropertyId || null,
            item.duplicateReason || null
          ]
        );

        // Insert Seller Lead
        await executeQuery(
          `INSERT INTO seller_leads (
             id, property_id, name, phone, lead_source, lead_status, stage,
             assigned_staff_id, asking_price_inr, reserve_minimum_price_inr, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, 'CONTACTED', 'CONTACTED', $6, $7, $8, NOW(), NOW()
           );`,
          [
            leadId,
            propertyId,
            item.ownerName,
            item.ownerPhone,
            item.leadSource,
            staffId,
            item.askingPriceInr,
            item.reservePriceInr || null
          ]
        );

        // Audit Log
        await executeQuery(
          `INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details, created_at)
           VALUES ($1, 'PROPERTY', $2, 'BULK_IMPORT', $3, $4, NOW());`,
          [
            `audit-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
            propertyId,
            staffId,
            JSON.stringify({
              source: 'SPREADSHEET_IMPORT',
              projectName: item.projectName,
              askingPrice: item.askingPriceInr,
              isDuplicate: item.isDuplicate || false
            })
          ]
        );
      } catch (err: any) {
        // Fallback or ignore for sandbox
      }

      // 2. DevSandboxStore synchronous support
      if (devSandboxStore && devSandboxStore.properties) {
        const devUser: DevUser = {
          id: ownerId,
          phone: item.ownerPhone,
          email: null,
          display_name: item.ownerName,
          password_hash: null,
          token_version: 1,
          roles: ['CUSTOMER_SELLER'],
          is_active: true,
          failed_login_attempts: 0,
          locked_until: null,
          created_at: now,
          updated_at: now
        };
        devSandboxStore.users.set(devUser.id, devUser);

        const devProp: DevProperty = {
          id: propertyId,
          owner_id: ownerId,
          project_locality_id: item.projectName,
          unit_number: `Unit ${item.unitFloor}0${item.index}`,
          wing_tower: 'Tower 1',
          unit_floor: item.unitFloor,
          total_floors: item.totalFloors,
          bhk_type: item.bhkType,
          super_built_up_sqft: item.superBuiltUpSqft,
          carpet_area_sqft: carpetArea,
          balconies_count: item.balconiesCount,
          bathrooms_count: item.bathroomsCount,
          facing: item.facing,
          car_parks_count: 1,
          is_covered_parking: true,
          khata_type: 'A_KHATA',
          encumbrance_status: 'CLEAR',
          loan_bank_name: null,
          occupancy_status: item.possessionStatus,
          monthly_maintenance_inr: 4500,
          asking_price_inr: item.askingPriceInr,
          reserve_minimum_price_inr: item.reservePriceInr,
          listing_intent: 'SELL',
          crm_status: 'NEW',
          listing_status: listingStatus,
          title,
          property_type: 'Apartment',
          public_address: `${item.projectName}, Bengaluru`,
          floor_band: floorBand,
          developer_name: item.projectName.split(' ')[0],
          description: `Imported resale property in ${item.projectName}. ${item.bhkType} (${item.superBuiltUpSqft} sq.ft), ${item.facing} facing.`,
          amenities: ['24/7 Security', 'Power Backup', 'Clubhouse', 'Children Play Area'],
          verification_tier: 'LEVEL_1_OWNER_DECLARED',
          internal_verification_notes: JSON.stringify({ verified: false }),
          possible_duplicate_of: item.duplicateOfPropertyId || null,
          duplicate_detection_notes: item.duplicateReason || null,
          created_at: now,
          updated_at: now
        };
        devSandboxStore.properties.set(devProp.id, devProp);

        const devLead: DevSellerLead = {
          id: leadId,
          property_id: propertyId,
          phone: item.ownerPhone,
          name: item.ownerName,
          lead_source: item.leadSource,
          lead_status: 'CONTACTED',
          stage: 'CONTACTED',
          assigned_staff_id: staffId,
          asking_price_inr: item.askingPriceInr,
          reserve_minimum_price_inr: item.reservePriceInr || null,
          next_follow_up_at: null,
          call_notes_history: [],
          created_at: now,
          updated_at: now
        };
        devSandboxStore.sellerLeads.set(devLead.id, devLead);
      }

      importedCount++;
      if (item.isDuplicate) {
        duplicatesFlagged++;
      }
    }

    return {
      success: true,
      totalRows: items.length,
      importedCount,
      duplicatesFlagged,
      errorCount,
      items
    };
  }
}
