/**
 * SellMyGhar Authentication & RBAC Definitions
 * 
 * Defines granular permissions and roles enforced across server endpoints
 * and PostgreSQL Row-Level Security policies.
 */

export type StaffRole = 
  | 'STAFF_INTAKE_AGENT'
  | 'STAFF_VERIFICATION_AGENT'
  | 'STAFF_LISTING_MANAGER'
  | 'STAFF_DEAL_CLOSER'
  | 'STAFF_SUPER_ADMIN';

export type CustomerRole = 'OWNER' | 'BUYER';

export type AppRole = CustomerRole | StaffRole;

export type Permission = 
  // Seller Lead Permissions
  | 'leads:create'
  | 'leads:read_assigned'
  | 'leads:read_all'
  | 'leads:update_status'
  | 'leads:export'

  // Property Permissions
  | 'properties:create'
  | 'properties:read_own'
  | 'properties:read_details_all'
  | 'properties:read_sensitive_identifiers' // unit_number, tower
  | 'properties:read_reserve_price'         // owner bottom line
  | 'properties:update_own'
  | 'properties:update_verification_tier'

  // Document Permissions
  | 'documents:upload_own'
  | 'documents:read_own'
  | 'documents:read_all_secure'
  | 'documents:verify'

  // Listing Permissions
  | 'listings:read_public'
  | 'listings:draft'
  | 'listings:publish_approve'
  | 'listings:archive'

  // Visit & Enquiry Permissions
  | 'visits:request'
  | 'visits:read_own'
  | 'visits:coordinate'
  | 'visits:complete'

  // Offer & Deal Permissions
  | 'offers:create'
  | 'offers:read_own'
  | 'offers:manage_all'
  | 'deals:manage'

  // Compliance & Super Admin
  | 'compliance:view_consents'
  | 'compliance:execute_erasure'
  | 'audit:read';

export interface AuthenticatedUser {
  uid: string; // Auth Subject ID
  phone: string;
  email: string | null;
  roles: AppRole[];
  permissions: Permission[];
}
