import { z } from 'zod';

/**
 * SellMyGhar Inbound Validation Schemas (Zod)
 * Validated strictly server-side before persisting or processing.
 */

// Phone number: Indian 10-digit mobile number, formatted or raw
export const IndianPhoneSchema = z.string().trim().regex(
  /^(?:\+91|91)?[6-9]\d{9}$/,
  { message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' }
);

// 1. Seller Lead Capture Schema (Minimal frictionless initial entry)
export const SellerLeadInputSchema = z.object({
  owner_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  phone: IndianPhoneSchema,
  apartment_society_name: z.string().trim().min(3, 'Apartment / Society name is required').max(100),
  locality_id: z.string().trim().min(2, 'Locality is required'),
  bhk_type: z.enum(['1BHK', '2BHK', '2.5BHK', '3BHK', '3.5BHK', '4BHK+', 'PENTHOUSE']),
  expected_price_inr: z.number().int().positive().nullable().optional(),
  consent_dpdp: z.literal(true, {
    message: 'You must review and accept the privacy notice to proceed.'
  }),
  marketing_opt_in: z.boolean().default(false), // Separate, never pre-selected
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

// 2. Full Property Details Input (Progressive step after lead qualification)
export const PropertyDetailsInputSchema = z.object({
  unit_number: z.string().trim().min(1, 'Unit / Flat number is required for verification'),
  wing_tower: z.string().trim().min(1, 'Tower or Wing is required'),
  unit_floor: z.number().int().min(0, 'Floor cannot be negative').max(80),
  total_floors: z.number().int().min(1).max(80),
  bhk_type: z.enum(['1BHK', '2BHK', '2.5BHK', '3BHK', '3.5BHK', '4BHK+', 'PENTHOUSE']),
  super_built_up_sqft: z.number().int().min(300).max(20000),
  carpet_area_sqft: z.number().int().min(200).max(18000),
  balconies_count: z.number().int().min(0).max(10),
  bathrooms_count: z.number().int().min(1).max(10),
  facing: z.enum(['NORTH', 'EAST', 'SOUTH', 'WEST', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST']),
  car_parks_count: z.number().int().min(0).max(6),
  is_covered_parking: z.boolean().default(true),
  khata_type: z.enum(['A_KHATA', 'B_KHATA', 'E_KHATA', 'PANCHAYAT', 'NOT_SURE']),
  encumbrance_status: z.enum(['CLEAN', 'EXISTING_LOAN', 'UNDER_DISPUTE', 'PENDING_CHECK']),
  loan_bank_name: z.string().trim().optional().nullable(),
  occupancy_status: z.enum(['SELF_OCCUPIED', 'TENANT_OCCUPIED', 'VACANT']),
  monthly_maintenance_inr: z.number().int().min(0).default(0),
  asking_price_inr: z.number().int().min(1000000, 'Price must be at least ₹10 Lakhs'),
  reserve_minimum_price_inr: z.number().int().min(1000000),
});

// 3. Document Upload Initiation Request (Pre-signed URL issuance)
export const DocumentUploadIntentSchema = z.object({
  property_id: z.string().uuid(),
  doc_type: z.enum([
    'SALE_DEED',
    'PARENT_DEED',
    'KHATA_CERTIFICATE',
    'KHATA_EXTRACT',
    'ENCUMBRANCE_CERTIFICATE',
    'PROPERTY_TAX_RECEIPT',
    'ELECTRICITY_BILL',
    'OCCUPANCY_CERTIFICATE',
    'POSSESSION_LETTER'
  ]),
  file_name: z.string().regex(/^[\w,\s-]+\.(pdf|jpg|jpeg|png)$/i, 'File must be PDF, JPG, or PNG with safe characters'),
  file_size_bytes: z.number().int().min(1024).max(25 * 1024 * 1024, 'File cannot exceed 25MB'),
  mime_type: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  sha256_checksum: z.string().length(64, 'Valid SHA-256 hash required'),
});

// 4. Buyer Enquiry Input
export const BuyerEnquiryInputSchema = z.object({
  listing_id: z.string().min(3),
  buyer_name: z.string().trim().min(2).max(80),
  buyer_phone: IndianPhoneSchema,
  funding_mode: z.enum(['PRE_APPROVED_LOAN', 'SELF_FUNDED', 'NEED_LOAN_ASSISTANCE', 'EXPLORING']),
  buying_timeline: z.enum(['IMMEDIATE_30_DAYS', '1_TO_3_MONTHS', '3_PLUS_MONTHS']),
  consent_dpdp: z.literal(true, {
    message: 'Consent to contact regarding this property is required.'
  }),
});

// 5. Floor band calculation helper to obfuscate exact floor
export function computeFloorBand(floor: number, totalFloors: number): string {
  if (floor === 0) return 'Ground Floor';
  if (floor === totalFloors) return `Top Floor (${floor}/${totalFloors})`;
  if (floor <= 3) return 'Lower Floor (1-3)';
  if (floor <= 8) return 'Mid-Lower Floor (4-8)';
  if (floor <= 14) return 'Mid-Higher Floor (9-14)';
  return 'Higher Floor (15+)';
}
