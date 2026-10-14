import { AuthenticatedUser } from '../../core/types/auth';
import { recordAuditEvent } from '../audit/logger';

export interface ExternalPropertySuggestion {
  id: string;
  externalSource: string;
  externalRefId: string;
  societyName: string;
  localityName: string;
  bhkType: string;
  superBuiltUpSqft: number;
  carpetAreaSqft?: number;
  floor?: number;
  totalFloors?: number;
  askingPriceInr: number;
  pricePerSqft?: number;
  facing?: string;
  furnishingStatus?: string;
  possessionStatus?: string;
  contactPersonName?: string;
  contactPhone?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isExternalSuggestion: true; // Hard distinction: never presented as verified by SellMyGhar
  importedAt: string;
  importedBy: string;
  updatedAt: string;
}

export interface CsvValidationError {
  rowNumber: number;
  fieldName: string;
  invalidValue: string;
  message: string;
}

export interface CsvParsedRow {
  rowNumber: number;
  data: Partial<ExternalPropertySuggestion>;
  errors: CsvValidationError[];
  isDuplicate: boolean;
  duplicateOfId?: string;
}

export interface CsvImportSummary {
  totalRows: number;
  acceptedCount: number;
  rejectedCount: number;
  skippedCount: number;
  updatedCount: number;
  errors: CsvValidationError[];
  importedIds: string[];
}

export class PropertySuggestionsService {
  // In-memory decoupled suggestion registry (guarantees zero schema collision with verified listings)
  private static suggestions = new Map<string, ExternalPropertySuggestion>();

  /**
   * Sanitizes value to prevent CSV Formula Injection (CWE-1236)
   * Formula characters (=, +, -, @, tab, CR) are neutralized with a leading single quote.
   */
  static sanitizeForCsv(val: any): string {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      return `'${str}`;
    }
    return str;
  }

  /**
   * Generates a documented, standard CSV template for property suggestions
   */
  static generateTemplate(): string {
    const headers = [
      'Society_Name',
      'Locality',
      'BHK_Type',
      'Super_Built_Up_Sqft',
      'Asking_Price_INR',
      'Carpet_Area_Sqft',
      'Floor',
      'Total_Floors',
      'Facing',
      'Furnishing',
      'Possession_Status',
      'External_Ref_ID',
      'Source',
      'Contact_Name',
      'Contact_Phone',
      'Notes'
    ];

    const sampleRow = [
      'Prestige Falcon City',
      'Kanakapura Road',
      '3 BHK',
      '1588',
      '16500000',
      '1250',
      '14',
      '28',
      'North-East',
      'Semi-Furnished',
      'Ready to Move',
      'EXT-PFC-3BHK-001',
      'External Agent Network',
      'Ramesh Kumar',
      '9876543210',
      'Clear title parent deed verified with society AGM approval'
    ];

    return `${headers.join(',')}\r\n${sampleRow.join(',')}\r\n`;
  }

  /**
   * Parses CSV string into structured tokens handling quotes and escaped commas
   */
  static parseCsvLines(csvText: string): string[][] {
    const lines: string[][] = [];
    const rows = csvText.split(/\r?\n/);

    for (const rawRow of rows) {
      if (!rawRow.trim()) continue;

      const cells: string[] = [];
      let inQuote = false;
      let currentCell = '';

      for (let i = 0; i < rawRow.length; i++) {
        const char = rawRow[i];
        if (char === '"') {
          if (inQuote && rawRow[i + 1] === '"') {
            currentCell += '"';
            i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (char === ',' && !inQuote) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());
      lines.push(cells);
    }

    return lines;
  }

  /**
   * Previews CSV content, performing comprehensive server-side field validation and duplicate detection
   */
  static previewCsv(csvText: string): {
    headers: string[];
    rows: CsvParsedRow[];
    totalRows: number;
    validCount: number;
    errorCount: number;
    duplicateCount: number;
  } {
    const lines = this.parseCsvLines(csvText);
    if (lines.length < 2) {
      throw new Error('CSV file must contain a header row and at least one data row.');
    }

    const rawHeaders = lines[0].map(h => h.trim().toLowerCase());
    const headerMap = new Map<string, number>();
    rawHeaders.forEach((h, idx) => headerMap.set(h, idx));

    // Required column validation
    const requiredColumns = [
      'society_name',
      'locality',
      'bhk_type',
      'super_built_up_sqft',
      'asking_price_inr'
    ];

    for (const req of requiredColumns) {
      if (!headerMap.has(req)) {
        throw new Error(`Missing mandatory CSV column: '${req}'. Please use the downloadable template.`);
      }
    }

    const parsedRows: CsvParsedRow[] = [];
    let validCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const rowErrors: CsvValidationError[] = [];
      const rowNum = i + 1; // 1-indexed for human readability

      const getVal = (col: string): string => {
        const idx = headerMap.get(col);
        return idx !== undefined && line[idx] !== undefined ? line[idx].trim() : '';
      };

      const societyName = getVal('society_name');
      const locality = getVal('locality');
      const bhkType = getVal('bhk_type');
      const sbuaStr = getVal('super_built_up_sqft');
      const priceStr = getVal('asking_price_inr');
      const carpetStr = getVal('carpet_area_sqft');
      const floorStr = getVal('floor');
      const totalFloorsStr = getVal('total_floors');
      const externalRef = getVal('external_ref_id');
      const source = getVal('source') || 'EXTERNAL_IMPORT';
      const facing = getVal('facing');
      const furnishing = getVal('furnishing');
      const possession = getVal('possession_status');
      const contactName = getVal('contact_name');
      const contactPhone = getVal('contact_phone');
      const notes = getVal('notes');

      // Validations
      if (!societyName) {
        rowErrors.push({ rowNumber: rowNum, fieldName: 'Society_Name', invalidValue: '', message: 'Society name is required' });
      }
      if (!locality) {
        rowErrors.push({ rowNumber: rowNum, fieldName: 'Locality', invalidValue: '', message: 'Locality is required' });
      }
      if (!bhkType) {
        rowErrors.push({ rowNumber: rowNum, fieldName: 'BHK_Type', invalidValue: '', message: 'BHK type is required (e.g. 2 BHK, 3 BHK)' });
      }

      const sbua = parseInt(sbuaStr, 10);
      if (isNaN(sbua) || sbua < 100 || sbua > 20000) {
        rowErrors.push({ rowNumber: rowNum, fieldName: 'Super_Built_Up_Sqft', invalidValue: sbuaStr, message: 'SBUA must be an integer between 100 and 20,000 sq.ft' });
      }

      const price = parseInt(priceStr, 10);
      if (isNaN(price) || price < 500000 || price > 500000000) {
        rowErrors.push({ rowNumber: rowNum, fieldName: 'Asking_Price_INR', invalidValue: priceStr, message: 'Asking price must be a valid amount between ₹5 Lakhs and ₹50 Crores' });
      }

      let carpetArea: number | undefined;
      if (carpetStr) {
        const c = parseInt(carpetStr, 10);
        if (isNaN(c) || c < 50 || c > sbua) {
          rowErrors.push({ rowNumber: rowNum, fieldName: 'Carpet_Area_Sqft', invalidValue: carpetStr, message: 'Carpet area must be greater than 50 and less than SBUA' });
        } else {
          carpetArea = c;
        }
      }

      let floor: number | undefined;
      if (floorStr) {
        const f = parseInt(floorStr, 10);
        if (isNaN(f) || f < 0 || f > 120) {
          rowErrors.push({ rowNumber: rowNum, fieldName: 'Floor', invalidValue: floorStr, message: 'Floor must be a valid integer between 0 and 120' });
        } else {
          floor = f;
        }
      }

      let totalFloors: number | undefined;
      if (totalFloorsStr) {
        const tf = parseInt(totalFloorsStr, 10);
        if (isNaN(tf) || tf < 1 || (floor !== undefined && tf < floor)) {
          rowErrors.push({ rowNumber: rowNum, fieldName: 'Total_Floors', invalidValue: totalFloorsStr, message: 'Total floors must be >= 1 and >= unit floor' });
        } else {
          totalFloors = tf;
        }
      }

      // Check duplicates in existing store
      let isDuplicate = false;
      let duplicateOfId: string | undefined;

      for (const item of Array.from(this.suggestions.values())) {
        if (externalRef && item.externalRefId && item.externalRefId.toLowerCase() === externalRef.toLowerCase()) {
          isDuplicate = true;
          duplicateOfId = item.id;
          break;
        }
        if (
          item.societyName.toLowerCase() === societyName.toLowerCase() &&
          item.localityName.toLowerCase() === locality.toLowerCase() &&
          item.bhkType.toLowerCase() === bhkType.toLowerCase() &&
          item.superBuiltUpSqft === sbua &&
          item.askingPriceInr === price
        ) {
          isDuplicate = true;
          duplicateOfId = item.id;
          break;
        }
      }

      if (isDuplicate) duplicateCount++;
      if (rowErrors.length === 0) validCount++;
      else errorCount++;

      parsedRows.push({
        rowNumber: rowNum,
        data: {
          societyName,
          localityName: locality,
          bhkType,
          superBuiltUpSqft: sbua || 0,
          carpetAreaSqft: carpetArea,
          floor,
          totalFloors,
          askingPriceInr: price || 0,
          pricePerSqft: sbua && price ? Math.round(price / sbua) : undefined,
          externalRefId: externalRef || `EXT-${Date.now().toString(36)}-${i}`,
          externalSource: source,
          facing,
          furnishingStatus: furnishing,
          possessionStatus: possession,
          contactPersonName: contactName,
          contactPhone,
          notes,
          status: 'ACTIVE',
          isExternalSuggestion: true,
        },
        errors: rowErrors,
        isDuplicate,
        duplicateOfId,
      });
    }

    return {
      headers: lines[0],
      rows: parsedRows,
      totalRows: lines.length - 1,
      validCount,
      errorCount,
      duplicateCount,
    };
  }

  /**
   * Executes import applying selected policy for duplicates:
   * 'SKIP_DUPLICATES' ignores duplicate rows
   * 'UPDATE_DUPLICATES' updates existing records with incoming values
   */
  static executeImport(
    csvText: string,
    policy: 'SKIP_DUPLICATES' | 'UPDATE_DUPLICATES' = 'SKIP_DUPLICATES',
    actor: AuthenticatedUser
  ): CsvImportSummary {
    const preview = this.previewCsv(csvText);
    const now = new Date().toISOString();

    let acceptedCount = 0;
    let rejectedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    const allErrors: CsvValidationError[] = [];
    const importedIds: string[] = [];

    for (const row of preview.rows) {
      if (row.errors.length > 0) {
        rejectedCount++;
        allErrors.push(...row.errors);
        continue;
      }

      if (row.isDuplicate) {
        if (policy === 'SKIP_DUPLICATES') {
          skippedCount++;
          continue;
        } else if (policy === 'UPDATE_DUPLICATES' && row.duplicateOfId) {
          const existing = this.suggestions.get(row.duplicateOfId);
          if (existing) {
            Object.assign(existing, {
              ...row.data,
              updatedAt: now,
            });
            updatedCount++;
            importedIds.push(existing.id);
            continue;
          }
        }
      }

      // New Insert
      const newId = `sugg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      const suggestionRecord: ExternalPropertySuggestion = {
        id: newId,
        externalSource: row.data.externalSource || 'CSV_BATCH',
        externalRefId: row.data.externalRefId || newId,
        societyName: row.data.societyName!,
        localityName: row.data.localityName!,
        bhkType: row.data.bhkType!,
        superBuiltUpSqft: row.data.superBuiltUpSqft!,
        carpetAreaSqft: row.data.carpetAreaSqft,
        floor: row.data.floor,
        totalFloors: row.data.totalFloors,
        askingPriceInr: row.data.askingPriceInr!,
        pricePerSqft: row.data.pricePerSqft,
        facing: row.data.facing,
        furnishingStatus: row.data.furnishingStatus,
        possessionStatus: row.data.possessionStatus,
        contactPersonName: row.data.contactPersonName,
        contactPhone: row.data.contactPhone,
        notes: row.data.notes,
        status: 'ACTIVE',
        isExternalSuggestion: true,
        importedAt: now,
        importedBy: actor.email || actor.uid,
        updatedAt: now,
      };

      this.suggestions.set(newId, suggestionRecord);
      acceptedCount++;
      importedIds.push(newId);
    }

    recordAuditEvent({
      actor,
      action: 'CSV_PROPERTY_SUGGESTIONS_IMPORTED' as any,
      targetEntity: 'property_suggestions',
      targetEntityId: `batch-${Date.now().toString(36)}`,
      clientIp: '127.0.0.1',
      diffSummary: {
        totalRows: preview.totalRows,
        acceptedCount,
        rejectedCount,
        skippedCount,
        updatedCount,
        policy,
      },
    }).catch(() => {});

    return {
      totalRows: preview.totalRows,
      acceptedCount,
      rejectedCount,
      skippedCount,
      updatedCount,
      errors: allErrors,
      importedIds,
    };
  }

  /**
   * Retrieves external suggestions with optional search and locality filter
   */
  static listSuggestions(filter?: {
    search?: string;
    locality?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  }): ExternalPropertySuggestion[] {
    let list = Array.from(this.suggestions.values());

    if (filter?.status) {
      list = list.filter(item => item.status === filter.status);
    }

    if (filter?.locality) {
      const loc = filter.locality.toLowerCase();
      list = list.filter(item => item.localityName.toLowerCase().includes(loc));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        item =>
          item.societyName.toLowerCase().includes(q) ||
          item.localityName.toLowerCase().includes(q) ||
          item.externalRefId.toLowerCase().includes(q) ||
          (item.contactPersonName && item.contactPersonName.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  }

  /**
   * Updates suggestion status (ACTIVE / INACTIVE / ARCHIVED)
   */
  static updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED', actor: AuthenticatedUser): boolean {
    const item = this.suggestions.get(id);
    if (!item) return false;
    item.status = status;
    item.updatedAt = new Date().toISOString();

    recordAuditEvent({
      actor,
      action: 'CSV_PROPERTY_SUGGESTION_STATUS_UPDATED' as any,
      targetEntity: 'property_suggestions',
      targetEntityId: id,
      clientIp: '127.0.0.1',
      diffSummary: { newStatus: status },
    }).catch(() => {});

    return true;
  }

  /**
   * Deletes a suggestion with authorized staff audit
   */
  static deleteSuggestion(id: string, actor: AuthenticatedUser): boolean {
    const existed = this.suggestions.delete(id);
    if (existed) {
      recordAuditEvent({
        actor,
        action: 'CSV_PROPERTY_SUGGESTION_DELETED' as any,
        targetEntity: 'property_suggestions',
        targetEntityId: id,
        clientIp: '127.0.0.1',
        diffSummary: { deletedId: id },
      }).catch(() => {});
    }
    return existed;
  }
}
