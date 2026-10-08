import { 
  OwnerProperty, 
  OwnerDashboardStats, 
  StatutoryDocType, 
  OwnerDocument 
} from '../types/ownerProperty';

const STORAGE_KEY = 'sellmyghar_owner_properties';

export const STATUTORY_DOC_LIST: StatutoryDocType[] = [
  'Parent Title Deed',
  'Mother Deed',
  'Khata Certificate',
  'Encumbrance Certificate',
  'BBMP Tax Receipt',
];

// Realistic sample properties for Bengaluruean apartment owners showcasing diverse pipeline stages
const INITIAL_SAMPLE_PROPERTIES: OwnerProperty[] = [
  {
    id: 'prop-prestige-shantiniketan-1102',
    owner_user_id: 'default_owner',
    society_name: 'Prestige Shantiniketan',
    locality: 'Whitefield',
    zone: 'East',
    bhk_type: '3 BHK',
    sbua_sqft: 2074,
    carpet_area_sqft: 1618,
    floor_num: 11,
    total_floors: 18,
    facing: 'North-East (Vaastu Compliant)',
    asking_price_inr: 24000000, // ₹2.40 Cr
    status: 'ACTIVE',
    lead_status: 'LISTED',
    khata_type: 'A-Khata',
    completion_score: 100,
    view_count: 342,
    offers_count: 3,
    created_at: '2026-09-12T10:30:00Z',
    updated_at: '2026-10-06T14:20:00Z',
    media: [
      {
        id: 'med-1',
        property_id: 'prop-prestige-shantiniketan-1102',
        media_type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        is_featured: true,
      },
    ],
    documents: [
      {
        id: 'doc-ps-1',
        property_id: 'prop-prestige-shantiniketan-1102',
        doc_type: 'Parent Title Deed',
        file_name: 'Sale_Deed_Prestige_1102_Registered.pdf',
        file_size_kb: 4210,
        uploaded_at: '2026-09-13T11:00:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-ps-2',
        property_id: 'prop-prestige-shantiniketan-1102',
        doc_type: 'Mother Deed',
        file_name: 'Mother_Deed_Prestige_Sy_102_30yrChain.pdf',
        file_size_kb: 8900,
        uploaded_at: '2026-09-13T11:15:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-ps-3',
        property_id: 'prop-prestige-shantiniketan-1102',
        doc_type: 'Khata Certificate',
        file_name: 'eAasthi_AKhata_Extract_Ward84.pdf',
        file_size_kb: 1420,
        uploaded_at: '2026-09-14T09:30:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-ps-4',
        property_id: 'prop-prestige-shantiniketan-1102',
        doc_type: 'Encumbrance Certificate',
        file_name: 'EC_Form15_2010_to_2026_KaveriOnline.pdf',
        file_size_kb: 2150,
        uploaded_at: '2026-09-14T10:00:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-ps-5',
        property_id: 'prop-prestige-shantiniketan-1102',
        doc_type: 'BBMP Tax Receipt',
        file_name: 'BBMP_PropertyTax_Receipt_2025_26_Paid.pdf',
        file_size_kb: 850,
        uploaded_at: '2026-09-14T10:30:00Z',
        verification_status: 'APPROVED',
      },
    ],
  },
  {
    id: 'prop-sobha-dream-acres-408',
    owner_user_id: 'default_owner',
    society_name: 'Sobha Dream Acres',
    locality: 'Panathur',
    zone: 'East',
    bhk_type: '2 BHK',
    sbua_sqft: 1205,
    carpet_area_sqft: 940,
    floor_num: 4,
    total_floors: 14,
    facing: 'East (Vaastu Compliant)',
    asking_price_inr: 11500000, // ₹1.15 Cr
    status: 'ACTIVE',
    lead_status: 'IN_VERIFICATION',
    khata_type: 'A-Khata',
    completion_score: 90,
    view_count: 189,
    offers_count: 1,
    created_at: '2026-09-24T16:00:00Z',
    updated_at: '2026-10-05T11:45:00Z',
    media: [
      {
        id: 'med-2',
        property_id: 'prop-sobha-dream-acres-408',
        media_type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        is_featured: true,
      },
    ],
    documents: [
      {
        id: 'doc-sda-1',
        property_id: 'prop-sobha-dream-acres-408',
        doc_type: 'Parent Title Deed',
        file_name: 'Sobha_Allotment_Sale_Deed_Flat408.pdf',
        file_size_kb: 3890,
        uploaded_at: '2026-09-25T10:00:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-sda-2',
        property_id: 'prop-sobha-dream-acres-408',
        doc_type: 'Mother Deed',
        file_name: 'Sobha_Master_MotherDeed_TitleChain.pdf',
        file_size_kb: 6700,
        uploaded_at: '2026-09-25T10:30:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-sda-3',
        property_id: 'prop-sobha-dream-acres-408',
        doc_type: 'Khata Certificate',
        file_name: 'Sobha_AKhata_Certificate_2026.pdf',
        file_size_kb: 1200,
        uploaded_at: '2026-09-26T08:15:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-sda-4',
        property_id: 'prop-sobha-dream-acres-408',
        doc_type: 'Encumbrance Certificate',
        file_name: 'EC_Form15_VarthurSubRegistrar_2026.pdf',
        file_size_kb: 1980,
        uploaded_at: '2026-10-04T12:00:00Z',
        verification_status: 'PENDING',
        feedback_notes: 'Under active review by Bengaluru Legal Title Desk.',
      },
      {
        id: 'doc-sda-5',
        property_id: 'prop-sobha-dream-acres-408',
        doc_type: 'BBMP Tax Receipt',
        file_name: 'BBMP_TaxReceipt_FY2025_Flat408.pdf',
        file_size_kb: 790,
        uploaded_at: '2026-09-26T08:45:00Z',
        verification_status: 'APPROVED',
      },
    ],
  },
  {
    id: 'prop-brigade-gateway-803',
    owner_user_id: 'default_owner',
    society_name: 'Brigade Gateway',
    locality: 'Malleshwaram',
    zone: 'West',
    bhk_type: '3.5 BHK',
    sbua_sqft: 2360,
    carpet_area_sqft: 1840,
    floor_num: 8,
    total_floors: 24,
    facing: 'East',
    asking_price_inr: 36500000, // ₹3.65 Cr
    status: 'ACTIVE',
    lead_status: 'DOCS_REQUESTED',
    khata_type: 'A-Khata',
    completion_score: 75,
    view_count: 67,
    offers_count: 0,
    created_at: '2026-10-01T09:20:00Z',
    updated_at: '2026-10-06T18:00:00Z',
    media: [
      {
        id: 'med-3',
        property_id: 'prop-brigade-gateway-803',
        media_type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        is_featured: true,
      },
    ],
    documents: [
      {
        id: 'doc-bg-1',
        property_id: 'prop-brigade-gateway-803',
        doc_type: 'Parent Title Deed',
        file_name: 'BrigadeGateway_SaleDeed_Registered.pdf',
        file_size_kb: 5120,
        uploaded_at: '2026-10-02T11:00:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-bg-2',
        property_id: 'prop-brigade-gateway-803',
        doc_type: 'Mother Deed',
        file_name: 'Brigade_ParentMotherDeed_Scan.pdf',
        file_size_kb: 3200,
        uploaded_at: '2026-10-03T14:30:00Z',
        verification_status: 'CLARIFICATION_REQUESTED',
        feedback_notes: 'Pages 14-16 are blurry. Please re-upload high-resolution scan of schedule section.',
      },
      {
        id: 'doc-bg-3',
        property_id: 'prop-brigade-gateway-803',
        doc_type: 'Khata Certificate',
        file_name: 'BBMP_AKhata_Extract_2025.pdf',
        file_size_kb: 1100,
        uploaded_at: '2026-10-02T11:30:00Z',
        verification_status: 'APPROVED',
      },
      // Missing Encumbrance Certificate & BBMP Tax Receipt
    ],
  },
  {
    id: 'prop-godrej-air-502',
    owner_user_id: 'default_owner',
    society_name: 'Godrej Air',
    locality: 'Whitefield',
    zone: 'East',
    bhk_type: '2.5 BHK',
    sbua_sqft: 1450,
    carpet_area_sqft: 1130,
    floor_num: 5,
    total_floors: 16,
    facing: 'North (Vaastu Compliant)',
    asking_price_inr: 15800000, // ₹1.58 Cr
    status: 'DRAFT',
    lead_status: 'NEW',
    khata_type: 'A-Khata',
    completion_score: 55,
    view_count: 0,
    offers_count: 0,
    created_at: '2026-10-05T15:10:00Z',
    updated_at: '2026-10-06T09:40:00Z',
    media: [
      {
        id: 'med-4',
        property_id: 'prop-godrej-air-502',
        media_type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        is_featured: true,
      },
    ],
    documents: [
      {
        id: 'doc-ga-1',
        property_id: 'prop-godrej-air-502',
        doc_type: 'Parent Title Deed',
        file_name: 'GodrejAir_AllotmentAgreement.pdf',
        file_size_kb: 4100,
        uploaded_at: '2026-10-05T15:20:00Z',
        verification_status: 'PENDING',
      },
    ],
  },
  {
    id: 'prop-salarpuria-greenage-1404',
    owner_user_id: 'default_owner',
    society_name: 'Salarpuria Greenage',
    locality: 'Hosur Road',
    zone: 'South',
    bhk_type: '3 BHK',
    sbua_sqft: 1890,
    carpet_area_sqft: 1475,
    floor_num: 14,
    total_floors: 25,
    facing: 'East (Vaastu Compliant)',
    asking_price_inr: 19500000, // ₹1.95 Cr
    status: 'ACTIVE',
    lead_status: 'SOLD',
    khata_type: 'A-Khata',
    completion_score: 100,
    view_count: 512,
    offers_count: 6,
    created_at: '2026-08-01T12:00:00Z',
    updated_at: '2026-09-18T16:00:00Z',
    media: [
      {
        id: 'med-5',
        property_id: 'prop-salarpuria-greenage-1404',
        media_type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
        is_featured: true,
      },
    ],
    documents: [
      {
        id: 'doc-sg-1',
        property_id: 'prop-salarpuria-greenage-1404',
        doc_type: 'Parent Title Deed',
        file_name: 'SalarpuriaGreenage_SaleDeed.pdf',
        file_size_kb: 4500,
        uploaded_at: '2026-08-02T10:00:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-sg-2',
        property_id: 'prop-salarpuria-greenage-1404',
        doc_type: 'Mother Deed',
        file_name: 'Greenage_MotherDeed_Chain.pdf',
        file_size_kb: 7800,
        uploaded_at: '2026-08-02T10:30:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-sg-3',
        property_id: 'prop-salarpuria-greenage-1404',
        doc_type: 'Khata Certificate',
        file_name: 'BBMP_AKhata_Extract.pdf',
        file_size_kb: 1300,
        uploaded_at: '2026-08-03T11:00:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-sg-4',
        property_id: 'prop-salarpuria-greenage-1404',
        doc_type: 'Encumbrance Certificate',
        file_name: 'Form15_EC_Complete.pdf',
        file_size_kb: 2400,
        uploaded_at: '2026-08-03T11:30:00Z',
        verification_status: 'APPROVED',
      },
      {
        id: 'doc-sg-5',
        property_id: 'prop-salarpuria-greenage-1404',
        doc_type: 'BBMP Tax Receipt',
        file_name: 'BBMP_TaxReceipt_2025.pdf',
        file_size_kb: 650,
        uploaded_at: '2026-08-03T12:00:00Z',
        verification_status: 'APPROVED',
      },
    ],
  },
];

class OwnerPropertyService {
  private getStoredProperties(): OwnerProperty[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored owner properties from localStorage', e);
    }
    // Seed initial properties
    this.saveProperties(INITIAL_SAMPLE_PROPERTIES);
    return INITIAL_SAMPLE_PROPERTIES;
  }

  private saveProperties(properties: OwnerProperty[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    } catch (e) {
      console.error('Failed to save owner properties to localStorage', e);
    }
  }

  /**
   * Returns all properties belonging to the logged-in owner.
   * If userId is provided, matches user's ID or includes sample records for development.
   */
  public getProperties(userId?: string): OwnerProperty[] {
    const all = this.getStoredProperties();
    if (!userId) return all;

    const userProps = all.filter(p => p.owner_user_id === userId);
    if (userProps.length > 0) {
      return all; // Return all so the owner can explore realistic sample properties along with their own
    }
    return all;
  }

  public getPropertyById(propertyId: string): OwnerProperty | undefined {
    return this.getStoredProperties().find(p => p.id === propertyId);
  }

  public addProperty(property: Omit<OwnerProperty, 'id' | 'created_at' | 'updated_at'>): OwnerProperty {
    const all = this.getStoredProperties();
    const newProperty: OwnerProperty = {
      ...property,
      id: `prop-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    all.unshift(newProperty);
    this.saveProperties(all);
    return newProperty;
  }

  public updateProperty(propertyId: string, updates: Partial<OwnerProperty>): OwnerProperty | null {
    const all = this.getStoredProperties();
    const index = all.findIndex(p => p.id === propertyId);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveProperties(all);
    return all[index];
  }

  public deleteProperty(propertyId: string): boolean {
    const all = this.getStoredProperties();
    const filtered = all.filter(p => p.id !== propertyId);
    if (filtered.length !== all.length) {
      this.saveProperties(filtered);
      return true;
    }
    return false;
  }

  public uploadDocument(
    propertyId: string, 
    docType: StatutoryDocType, 
    fileName: string, 
    fileSizeKb: number = 2450
  ): OwnerProperty | null {
    const all = this.getStoredProperties();
    const propIndex = all.findIndex(p => p.id === propertyId);
    if (propIndex === -1) return null;

    const prop = all[propIndex];
    const existingDocIndex = prop.documents.findIndex(d => d.doc_type === docType);

    const newDoc: OwnerDocument = {
      id: `doc-${Date.now().toString(36)}`,
      property_id: propertyId,
      doc_type: docType,
      file_name: fileName,
      file_size_kb: fileSizeKb,
      uploaded_at: new Date().toISOString(),
      verification_status: 'PENDING',
      feedback_notes: 'Uploaded by homeowner. Awaiting legal title desk review.',
    };

    let updatedDocs: OwnerDocument[];
    if (existingDocIndex >= 0) {
      updatedDocs = [...prop.documents];
      updatedDocs[existingDocIndex] = newDoc;
    } else {
      updatedDocs = [...prop.documents, newDoc];
    }

    // Recompute completion score & lead status
    const verifiedOrUploadedCount = updatedDocs.length;
    const docScoreContribution = Math.round((verifiedOrUploadedCount / 5) * 40);
    const newCompletionScore = Math.min(100, 60 + docScoreContribution);
    
    // If all docs are uploaded and was DOCS_REQUESTED, advance to IN_VERIFICATION
    let newLeadStatus = prop.lead_status;
    if (prop.lead_status === 'DOCS_REQUESTED' && updatedDocs.length >= 5) {
      newLeadStatus = 'IN_VERIFICATION';
    }

    all[propIndex] = {
      ...prop,
      documents: updatedDocs,
      completion_score: newCompletionScore,
      lead_status: newLeadStatus,
      updated_at: new Date().toISOString(),
    };

    this.saveProperties(all);
    return all[propIndex];
  }

  public calculateStats(properties: OwnerProperty[]): OwnerDashboardStats {
    let draftCount = 0;
    let inVerificationCount = 0;
    let docsNeededCount = 0;
    let listedCount = 0;
    let offersReceivedCount = 0;

    for (const p of properties) {
      // 1. Draft / Incomplete
      if (p.status === 'DRAFT' || p.completion_score < 100) {
        draftCount++;
      }

      // 2. In Verification
      const hasPendingDoc = p.documents.some(d => d.verification_status === 'PENDING');
      if (p.lead_status === 'IN_VERIFICATION' || hasPendingDoc) {
        inVerificationCount++;
      }

      // 3. Docs Needed (fewer than 5/5 statutory docs or any REJECTED/CLARIFICATION_REQUESTED)
      const hasDefectiveDoc = p.documents.some(
        d => d.verification_status === 'REJECTED' || d.verification_status === 'CLARIFICATION_REQUESTED'
      );
      if (p.documents.length < 5 || hasDefectiveDoc) {
        docsNeededCount++;
      }

      // 4. Live / Listed
      if (p.lead_status === 'LISTED') {
        listedCount++;
      }

      // 5. Offers Received
      if (p.offers_count && p.offers_count > 0) {
        offersReceivedCount += p.offers_count;
      }
    }

    return {
      draftCount,
      inVerificationCount,
      docsNeededCount,
      listedCount,
      offersReceivedCount,
    };
  }

  public formatInr(amount: number): string {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
    }
    if (amount >= 100000) {
      const lk = amount / 100000;
      return `₹${lk.toFixed(lk % 1 === 0 ? 0 : 1)} L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

export const ownerPropertyService = new OwnerPropertyService();
