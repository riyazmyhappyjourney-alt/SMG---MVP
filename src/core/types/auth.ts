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
  | 'leads:assign'
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

export type CrmModule = 
  | 'OVERVIEW'
  | 'LEADS'
  | 'PROPERTIES'
  | 'VISITS'
  | 'OFFERS'
  | 'TASKS'
  | 'CALENDAR'
  | 'REPORTS'
  | 'TEAM'
  | 'AUDIT_LOGS'
  | 'SETTINGS';

export interface CrmModuleMetadata {
  key: CrmModule;
  label: string;
  description: string;
}

export const ALL_CRM_MODULES: CrmModuleMetadata[] = [
  { key: 'OVERVIEW', label: 'Overview', description: 'Real-time KPI cards, workbench & pipeline summaries' },
  { key: 'LEADS', label: 'Leads', description: 'Seller listings and buyer inquiry intake & progression' },
  { key: 'PROPERTIES', label: 'Properties', description: 'Inventory management, specifications & title documents' },
  { key: 'VISITS', label: 'Visits', description: 'Physical site tour scheduling, status & WhatsApp reminders' },
  { key: 'OFFERS', label: 'Offers', description: 'Purchase offers, counter-negotiations & deal records' },
  { key: 'TASKS', label: 'Tasks', description: 'Daily follow-up queue, workbench & Kanban board' },
  { key: 'CALENDAR', label: 'Calendar', description: 'Month, week and day viewing schedule & agenda' },
  { key: 'REPORTS', label: 'Reports', description: 'Performance analytics, funnel conversion & CSV exports' },
  { key: 'TEAM', label: 'Team', description: 'Staff directory & module access permission governance' },
  { key: 'AUDIT_LOGS', label: 'Audit Logs', description: 'Immutable security event ledger & DPDP compliance queue' },
  { key: 'SETTINGS', label: 'Settings', description: 'Platform configurations, API sync & notification preferences' },
];

export function resolveLegacyModulePermissions(roles: string[]): CrmModule[] {
  if (roles.includes('STAFF_SUPER_ADMIN') || roles.includes('SUPER_ADMIN')) {
    return ['OVERVIEW', 'LEADS', 'PROPERTIES', 'VISITS', 'OFFERS', 'TASKS', 'CALENDAR', 'REPORTS', 'TEAM', 'AUDIT_LOGS', 'SETTINGS'];
  }
  const set = new Set<CrmModule>(['OVERVIEW']);
  if (roles.includes('STAFF_LISTING_MANAGER')) {
    set.add('PROPERTIES');
    set.add('LEADS');
    set.add('VISITS');
    set.add('TASKS');
    set.add('CALENDAR');
    set.add('TEAM');
    set.add('REPORTS');
  }
  if (roles.includes('STAFF_DEAL_CLOSER')) {
    set.add('LEADS');
    set.add('PROPERTIES');
    set.add('OFFERS');
    set.add('VISITS');
    set.add('TASKS');
    set.add('CALENDAR');
  }
  if (roles.includes('STAFF_INTAKE_AGENT')) {
    set.add('LEADS');
    set.add('TASKS');
    set.add('CALENDAR');
  }
  if (roles.includes('STAFF_VERIFICATION_AGENT')) {
    set.add('PROPERTIES');
    set.add('LEADS');
    set.add('TASKS');
  }
  return Array.from(set);
}

export interface AuthenticatedUser {
  uid: string; // Auth Subject ID
  phone: string;
  email: string | null;
  roles: AppRole[];
  permissions: Permission[];
  module_permissions?: CrmModule[];
}
