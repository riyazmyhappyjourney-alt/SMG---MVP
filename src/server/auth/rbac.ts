import { AppRole, Permission, AuthenticatedUser } from '../../core/types/auth';

/**
 * Role to Granular Permissions Mapping
 * Principle of Least Privilege: Every role is granted the bare minimum.
 */
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  // 1. Property Seller (Customer)
  OWNER: [
    'properties:create',
    'properties:read_own',
    'properties:update_own',
    'properties:read_reserve_price',
    'documents:upload_own',
    'documents:read_own',
    'visits:read_own',
    'offers:read_own',
    'listings:read_public',
  ],

  // 2. Buyer (Customer)
  BUYER: [
    'listings:read_public',
    'visits:request',
    'visits:read_own',
    'offers:create',
    'offers:read_own',
  ],

  // 3. Staff: Intake / Lead Agent
  STAFF_INTAKE_AGENT: [
    'leads:create',
    'leads:read_assigned',
    'leads:read_all',
    'leads:update_status',
    'properties:create',
    'properties:read_details_all',
    'properties:read_sensitive_identifiers',
    'listings:read_public',
  ],

  // 4. Staff: Verification Agent (Legal & Title Inspection)
  STAFF_VERIFICATION_AGENT: [
    'leads:read_assigned',
    'properties:read_details_all',
    'properties:read_sensitive_identifiers',
    'properties:update_verification_tier',
    'documents:read_all_secure',
    'documents:verify',
    'listings:read_public',
  ],

  // 5. Staff: Listing Manager (Media & Public Copy)
  STAFF_LISTING_MANAGER: [
    'properties:read_details_all', // Can read specs, but CANNOT read unit_number or reserve_price
    'listings:draft',
    'listings:publish_approve',
    'listings:archive',
    'listings:read_public',
  ],

  // 6. Staff: Deal Closer & Negotiator
  STAFF_DEAL_CLOSER: [
    'properties:read_details_all',
    'properties:read_sensitive_identifiers',
    'properties:read_reserve_price',
    'visits:coordinate',
    'visits:complete',
    'offers:manage_all',
    'deals:manage',
    'listings:read_public',
  ],

  // 7. Staff: Super Admin & Compliance Officer
  STAFF_SUPER_ADMIN: [
    'leads:create',
    'leads:read_all',
    'leads:update_status',
    'leads:export',
    'properties:create',
    'properties:read_own',
    'properties:read_details_all',
    'properties:read_sensitive_identifiers',
    'properties:read_reserve_price',
    'properties:update_own',
    'properties:update_verification_tier',
    'documents:upload_own',
    'documents:read_own',
    'documents:read_all_secure',
    'documents:verify',
    'listings:read_public',
    'listings:draft',
    'listings:publish_approve',
    'listings:archive',
    'visits:request',
    'visits:read_own',
    'visits:coordinate',
    'visits:complete',
    'offers:create',
    'offers:read_own',
    'offers:manage_all',
    'deals:manage',
    'compliance:view_consents',
    'compliance:execute_erasure',
    'audit:read',
  ],
};

/**
 * Checks if a user possesses the requested permission across any of their roles.
 */
export function hasPermission(user: AuthenticatedUser, requiredPermission: Permission): boolean {
  if (!user || !user.roles || user.roles.length === 0) {
    return false;
  }

  // Super Admin short-circuit
  if (user.roles.includes('STAFF_SUPER_ADMIN')) {
    return true;
  }

  return user.roles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(requiredPermission);
  });
}

/**
 * Asserts permission, throwing an authorization error if unauthorized.
 */
export function requirePermission(user: AuthenticatedUser, requiredPermission: Permission): void {
  if (!hasPermission(user, requiredPermission)) {
    throw new Error(`FORBIDDEN: User lacks required permission: ${requiredPermission}`);
  }
}
