import { 
  PropertyPrivateRecord, 
  ProjectLocalityRecord, 
  PublicListingProjection,
  PublicListingPhoto
} from '../types/entities';
import { computeFloorBand } from '../schemas/validation';

/**
 * Public Listing Projection Mapper
 * 
 * HARD SECURITY BOUNDARY:
 * Ensures that private owner PII, flat/unit numbers, reserve bottom pricing,
 * internal inspection notes, and private document bucket references are
 * NEVER serialized to public discovery APIs or HTML pages.
 */
export function toPublicListingProjection(
  property: PropertyPrivateRecord,
  project: ProjectLocalityRecord,
  sanitizedPhotos: PublicListingPhoto[],
  amenitiesList: string[]
): PublicListingProjection {
  // Map internal verification tier to safe, customer-understandable badge
  const verificationBadgeMap: Record<PropertyPrivateRecord['verification_tier'], PublicListingProjection['public_verification_badge']> = {
    'LEVEL_0_UNVERIFIED': 'OWNER_VERIFIED',
    'LEVEL_1_OWNER_DECLARED': 'OWNER_VERIFIED',
    'LEVEL_2_DOCS_REVIEWED': 'DOCS_CHECKED',
    'LEVEL_3_PHYSICALLY_INSPECTED': 'INSPECTED'
  };

  const calculatedPricePerSqft = property.super_built_up_sqft > 0 
    ? Math.round(property.asking_price_inr / property.super_built_up_sqft) 
    : 0;

  const seoSlug = [
    property.bhk_type.toLowerCase(),
    project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    project.locality.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    property.id.slice(0, 8)
  ].join('-');

  return {
    id: `sgl-${property.id.slice(0, 8)}`,
    slug: seoSlug,
    project_name: project.name,
    locality_name: `${project.locality}, Bengaluru`,
    bhk_type: property.bhk_type,
    super_built_up_sqft: property.super_built_up_sqft,
    carpet_area_sqft: property.carpet_area_sqft,
    floor_band: computeFloorBand(property.unit_floor, property.total_floors),
    facing: property.facing,
    bathrooms_count: property.bathrooms_count,
    car_parks_count: property.car_parks_count,
    asking_price_inr: property.asking_price_inr,
    price_per_sqft_inr: calculatedPricePerSqft,
    photos: sanitizedPhotos,
    amenities: amenitiesList,
    public_verification_badge: verificationBadgeMap[property.verification_tier] || 'OWNER_VERIFIED',
    status: 'ACTIVE',
    published_at: new Date().toISOString(),
  };
}
