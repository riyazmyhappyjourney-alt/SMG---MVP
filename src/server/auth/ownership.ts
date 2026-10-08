import { AuthenticatedUser } from '../../core/types/auth';
import { PropertyPrivateRecord, DocumentPrivateRecord, VisitPrivateRecord, OfferPrivateRecord } from '../../core/types/entities';

/**
 * Resource Ownership Verifier (IDOR Defense)
 * 
 * Verifies that the authenticated subject owns the resource being accessed,
 * or possesses staff credentials authorized to access cross-customer records.
 */

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Property Ownership Guard
 */
export function assertCanAccessProperty(
  user: AuthenticatedUser,
  property: PropertyPrivateRecord,
  action: 'READ' | 'WRITE'
): void {
  // 1. Staff with appropriate permissions can access
  const isStaff = user.roles.some((r) => r.startsWith('STAFF_'));
  if (isStaff) {
    if (action === 'WRITE') {
      const canWriteStaff = user.roles.includes('STAFF_SUPER_ADMIN') || 
                            user.roles.includes('STAFF_VERIFICATION_AGENT') || 
                            user.roles.includes('STAFF_INTAKE_AGENT');
      if (!canWriteStaff) {
        throw new AuthorizationError('Staff role lacks write permission on property');
      }
    }
    return;
  }

  // 2. Customer Ownership Check
  if (property.owner_id !== user.uid) {
    throw new AuthorizationError('ACCESS_DENIED: You do not own this property record');
  }
}

/**
 * Document Ownership Guard
 */
export function assertCanAccessDocument(
  user: AuthenticatedUser,
  document: DocumentPrivateRecord
): void {
  // Staff with secure document read permission
  const isDocStaff = user.roles.includes('STAFF_SUPER_ADMIN') || 
                     user.roles.includes('STAFF_VERIFICATION_AGENT');
  if (isDocStaff) {
    return;
  }

  // Customer ownership check
  if (document.uploader_user_id !== user.uid) {
    throw new AuthorizationError('ACCESS_DENIED: You do not have permission to view this legal document');
  }
}

/**
 * Visit Ownership Guard
 */
export function assertCanAccessVisit(
  user: AuthenticatedUser,
  visit: VisitPrivateRecord,
  propertyOwnerId: string
): void {
  const isStaff = user.roles.some((r) => r.startsWith('STAFF_'));
  if (isStaff) {
    return;
  }

  // Must be either the Buyer who requested the visit or the Property Owner
  const isBuyer = visit.buyer_user_id === user.uid;
  const isOwner = propertyOwnerId === user.uid;

  if (!isBuyer && !isOwner) {
    throw new AuthorizationError('ACCESS_DENIED: You are neither the buyer nor the seller for this visit');
  }
}

/**
 * Offer Ownership Guard
 */
export function assertCanAccessOffer(
  user: AuthenticatedUser,
  offer: OfferPrivateRecord,
  propertyOwnerId: string
): void {
  const isStaff = user.roles.includes('STAFF_SUPER_ADMIN') || 
                  user.roles.includes('STAFF_DEAL_CLOSER');
  if (isStaff) {
    return;
  }

  // Must be either the Buyer who submitted the offer or the Property Owner
  const isBuyer = offer.buyer_user_id === user.uid;
  const isOwner = propertyOwnerId === user.uid;

  if (!isBuyer && !isOwner) {
    throw new AuthorizationError('ACCESS_DENIED: You are not authorized to view this offer');
  }
}

/**
 * Field-Level Masking Helper: Masks sensitive fields based on user role
 */
export function sanitizePropertyForStaff(
  user: AuthenticatedUser,
  property: PropertyPrivateRecord
): Partial<PropertyPrivateRecord> {
  const isSuperAdmin = user.roles.includes('STAFF_SUPER_ADMIN');
  const isDealCloser = user.roles.includes('STAFF_DEAL_CLOSER');
  const isVerification = user.roles.includes('STAFF_VERIFICATION_AGENT');
  const isListingManager = user.roles.includes('STAFF_LISTING_MANAGER');

  const copy = { ...property };

  // Listing Manager should NOT see exact unit number, reserve price, or loan bank
  if (isListingManager && !isSuperAdmin) {
    copy.unit_number = '[MASKED_FOR_LISTING_MANAGER]';
    copy.reserve_minimum_price_inr = 0;
    copy.loan_bank_name = null;
    copy.internal_verification_notes = '[RESTRICTED]';
  }

  // Verification Agent should NOT see the owner's reserve negotiation floor
  if (isVerification && !isSuperAdmin && !isDealCloser) {
    copy.reserve_minimum_price_inr = 0;
  }

  return copy;
}
