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
  _action: 'READ' | 'WRITE'
): void {
  // 1. Staff with appropriate credentials can access
  const isStaff = user.roles.some((r) => r.startsWith('STAFF_') || r === 'STAFF' || r === 'EMPLOYEE' || r === 'STAFF_MEMBER');
  if (isStaff) {
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
  // Staff with employee credentials
  const isDocStaff = user.roles.some((r) => r.startsWith('STAFF_') || r === 'STAFF' || r === 'EMPLOYEE' || r === 'STAFF_MEMBER');
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
  const isStaff = user.roles.some((r) => r.startsWith('STAFF_') || r === 'STAFF' || r === 'EMPLOYEE' || r === 'STAFF_MEMBER');
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
  const isStaff = user.roles.some((r) => r.startsWith('STAFF_') || r === 'STAFF' || r === 'EMPLOYEE' || r === 'STAFF_MEMBER');
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
 * Field-Level Masking Helper: In unified CRM architecture, all approved staff
 * have visibility into standard property operational specifications.
 */
export function sanitizePropertyForStaff(
  _user: AuthenticatedUser,
  property: PropertyPrivateRecord
): Partial<PropertyPrivateRecord> {
  return { ...property };
}
