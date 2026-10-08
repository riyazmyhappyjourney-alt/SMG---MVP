export type PropertyIntent = 'SELL' | 'RENT';

export type PropertyStageEnum = 
  | 'NEW'
  | 'CONTACTED'
  | 'FOLLOW_UP'
  | 'SITE_VISIT'
  | 'NEGOTIATION'
  | 'CONVERTED'
  | 'LOST'
  | 'DROPPED'
  | 'DOCS_REQUESTED'
  | 'IN_VERIFICATION'
  | 'VERIFIED'
  | 'LISTED'
  | 'SOLD';

export type DocumentTypeKey = 
  | 'TITLE_DEED'
  | 'MOTHER_DEED'
  | 'KHATA_CERTIFICATE'
  | 'ENCUMBRANCE_CERTIFICATE'
  | 'TAX_RECEIPT';

export type DocumentStatus = 'VERIFIED' | 'IN_REVIEW' | 'REJECTED' | 'PENDING_UPLOAD';

export interface StatutoryDocument {
  id: string;
  type: DocumentTypeKey;
  label: string;
  subLabel: string;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  legalReviewNote?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent?: boolean;
  stageKey: PropertyStageEnum;
  officerName?: string;
}

export interface SiteVisitItem {
  id: string;
  scheduledTime: string;
  visitorProfile: string; // e.g. "Senior Architect, Cisco Systems"
  rmEscort: string; // e.g. "Escorted by RM Kavitha"
  feedbackNotes?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'OFFER_IN_PIPELINE';
}

export interface CorridorDemandIndex {
  demandIndexRating: string; // e.g. "High Buyer Demand"
  demandScore: number; // e.g. 94
  avgPriceSqft: number; // e.g. 10400
  avgMonthlyRent: number; // e.g. 68000
  activeBuyersInCorridor: number; // e.g. 84
  estimatedDaysToClose: number; // e.g. 35
}

export interface SellerPropertyItem {
  id: string;
  referenceId: string;
  intent: PropertyIntent; // 'SELL' | 'RENT'
  listing_intent?: PropertyIntent; // Direct SQL column: 'SELL' | 'RENT'
  societyName: string;
  locality: string;
  bhkType: string;
  superBuiltUpSqft: number;
  carpetAreaSqft: number;
  unitFloor: number;
  totalFloors: number;
  facing: string;
  
  // Pricing: either Resale Asking Price or Monthly Rent
  askingPriceInr?: number;
  pricePerSqft?: number;
  monthlyRentInr?: number;
  securityDepositInr?: number;
  maintenanceIncluded?: boolean;
  tenantPreference?: string;
  availableFrom?: string;
  
  isNegotiable: boolean;
  furnishing: string;
  status: PropertyStageEnum;
  crm_status?: PropertyStageEnum;
  stageBadgeLabel: string;
  progressTracker?: {
    currentStatus: string;
    isLost: boolean;
    activeIndex: number;
    stages: Array<{ key: string; label: string; shortDesc: string }>;
  };
  createdAt: string;
  lastUpdated: string;
  photos: string[];
  photoCount: number;
  visibilityScore: number;
  completionScore: number;
  viewsCount: number;
  
  // Backend Managed Operations (Zero DIY buyer haggling)
  siteVisits: SiteVisitItem[];
  activityTimeline: ActivityLogItem[];
  corridorDemand: CorridorDemandIndex;
  
  // 5 Statutory Documents
  documents: Record<DocumentTypeKey, StatutoryDocument>;
  
  // Assigned Desk
  rmName: string;
  rmPhone: string;
  rmRole: string;
}
