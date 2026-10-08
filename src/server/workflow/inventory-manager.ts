import { PublicListingProjection, ListingStatus } from '../../core/types/entities';

/**
 * Public Inventory & Sitemap Lifecycle Manager
 * 
 * [SEO & Legal Requirement]:
 * Sold or withdrawn properties MUST NOT remain falsely indexed or accessible
 * as active inventory.
 * 
 * HTTP Behavior:
 * - ACTIVE: HTTP 200 OK + full Schema.org structured data.
 * - UNDER_OFFER: HTTP 200 OK with visible "Under Offer / Contingent" badge, no visit bookings.
 * - SOLD (Grace Period < 30 days): HTTP 200 with prominent "Sold" banner + `<meta name="robots" content="noindex, follow">`
 * - SOLD (> 30 days) or WITHDRAWN: HTTP 410 Gone (Permanently removed, instructs search engines to de-index promptly).
 * - UNKNOWN SLUG: HTTP 404 Not Found.
 */

export interface ListingResolutionResult {
  httpStatus: 200 | 404 | 410;
  listing: PublicListingProjection | null;
  metaRobots: string;
  errorMessage?: string;
}

export class InventoryManager {
  /**
   * Resolves a public listing page request with strict HTTP status code enforcement.
   */
  static resolvePublicListing(listing: PublicListingProjection | null): ListingResolutionResult {
    if (!listing) {
      return {
        httpStatus: 404,
        listing: null,
        metaRobots: 'noindex, nofollow',
        errorMessage: 'Listing not found or invalid URL.',
      };
    }

    if (listing.status === 'WITHDRAWN') {
      return {
        httpStatus: 410,
        listing: null,
        metaRobots: 'noindex, nofollow',
        errorMessage: 'This listing has been withdrawn by the owner and is permanently unavailable (HTTP 410 Gone).',
      };
    }

    if (listing.status === 'SOLD') {
      // Check sale timestamp; if older than 30 days, return HTTP 410
      const soldDate = new Date(listing.published_at).getTime();
      const ageDays = (Date.now() - soldDate) / (1000 * 3600 * 24);

      if (ageDays > 30) {
        return {
          httpStatus: 410,
          listing: null,
          metaRobots: 'noindex, nofollow',
          errorMessage: 'This property has been sold and the archive has expired (HTTP 410 Gone).',
        };
      }

      // Within 30 days grace period: display sold status with noindex
      return {
        httpStatus: 200,
        listing,
        metaRobots: 'noindex, follow',
      };
    }

    // Active or Under Offer
    return {
      httpStatus: 200,
      listing,
      metaRobots: 'index, follow',
    };
  }

  /**
   * Generates dynamic XML sitemap URLs strictly for ACTIVE listings.
   * Sold and withdrawn items are completely excluded.
   */
  static generateSitemapEntries(listings: PublicListingProjection[], baseUrl: string): string[] {
    return listings
      .filter((l) => l.status === 'ACTIVE')
      .map((l) => `${baseUrl}/buy/${l.slug}`);
  }
}
