import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from './tokens';
import { ROLE_PERMISSIONS, hasPermission } from './rbac';
import { AppRole, Permission, AuthenticatedUser, CrmModule } from '../../core/types/auth';
import { executeQuery } from '../db/pool';
import { getValidatedConfig } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Extracts session token from HTTP cookie or Bearer authorization header
 */
function extractToken(req: Request): string | null {
  // 1. Bearer authorization header takes highest priority (enables CRM client explicit token isolation)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.substring(7).trim();
    if (bearer) return bearer;
  }

  // 2. Staff-specific cookie check (prevents customer sessions from colliding with staff desk)
  const cookies = (req as any).cookies;
  if (cookies && cookies.sellmyghar_staff_session) {
    return cookies.sellmyghar_staff_session;
  }
  if (cookies && cookies.sellmyghar_session) {
    return cookies.sellmyghar_session;
  }

  // 3. Fallback direct parse from raw Cookie header
  const rawCookie = req.headers.cookie;
  if (rawCookie) {
    const staffMatch = rawCookie.match(/(?:^|;\s*)sellmyghar_staff_session=([^;]+)/);
    if (staffMatch && staffMatch[1]) {
      try {
        return decodeURIComponent(staffMatch[1]);
      } catch {
        return staffMatch[1];
      }
    }
    const match = rawCookie.match(/(?:^|;\s*)sellmyghar_session=([^;]+)/);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Resolves all permissions associated with a set of roles
 */
export function resolveUserPermissions(roles: AppRole[]): Permission[] {
  const permSet = new Set<Permission>();
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    for (const p of rolePerms) {
      permSet.add(p);
    }
  }
  return Array.from(permSet);
}

/**
 * Resolves default module access for backward compatibility with legacy staff roles.
 */
export function resolveLegacyModulePermissions(roles: AppRole[]): CrmModule[] {
  if (roles.includes('STAFF_SUPER_ADMIN')) {
    return [
      'OVERVIEW',
      'LEADS',
      'PROPERTIES',
      'VISITS',
      'OFFERS',
      'TASKS',
      'CALENDAR',
      'REPORTS',
      'TEAM',
      'AUDIT_LOGS',
      'SETTINGS'
    ];
  }
  const perms = new Set<CrmModule>();
  for (const r of roles) {
    if (r === 'STAFF_INTAKE_AGENT') {
      (['OVERVIEW', 'LEADS', 'TASKS', 'CALENDAR'] as CrmModule[]).forEach(m => perms.add(m));
    } else if (r === 'STAFF_VERIFICATION_AGENT') {
      (['OVERVIEW', 'LEADS', 'PROPERTIES', 'TASKS', 'CALENDAR'] as CrmModule[]).forEach(m => perms.add(m));
    } else if (r === 'STAFF_LISTING_MANAGER') {
      (['OVERVIEW', 'PROPERTIES', 'REPORTS'] as CrmModule[]).forEach(m => perms.add(m));
    } else if (r === 'STAFF_DEAL_CLOSER') {
      (['OVERVIEW', 'LEADS', 'PROPERTIES', 'VISITS', 'OFFERS', 'TASKS', 'CALENDAR'] as CrmModule[]).forEach(m => perms.add(m));
    }
  }
  return Array.from(perms);
}

/**
 * Checks whether an authenticated user has access to a specific CRM module
 */
export function hasModulePermission(user: AuthenticatedUser, module: CrmModule): boolean {
  if (user.roles.includes('STAFF_SUPER_ADMIN')) return true;
  if (!user.module_permissions || !Array.isArray(user.module_permissions)) {
    const fallback = resolveLegacyModulePermissions(user.roles);
    return fallback.includes(module);
  }
  return user.module_permissions.includes(module);
}

/**
 * Mandatory authentication middleware. Rejects unauthenticated requests with 401.
 * Validates cryptographic JWT signature, account active status, and token_version.
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication session required to access this resource.',
    });
  }

  try {
    const payload = await verifySessionToken(token);

    // Database check for token revocation and user active state
    let dbUser: any = null;
    try {
      const dbRes = await executeQuery<{
        id: string;
        phone: string;
        email: string | null;
        roles: string[];
        is_active: boolean;
        token_version: number;
        module_permissions?: string[];
      }>(
        `SELECT id, phone, email, roles, is_active, token_version, module_permissions FROM users WHERE id = $1 LIMIT 1;`,
        [payload.uid]
      );
      if (dbRes.rows && dbRes.rows.length > 0) {
        dbUser = dbRes.rows[0];
      }
    } catch (dbErr: any) {
      console.warn('[AuthMiddleware] DB user lookup note:', dbErr.message);
    }

    if (dbUser) {
      if (!dbUser.is_active) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Account has been deactivated.',
        });
      }

      if (payload.tokenVersion !== undefined && dbUser.token_version !== payload.tokenVersion) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Session has been revoked. Please log in again.',
        });
      }

      const roles = (dbUser.roles || ['OWNER']) as AppRole[];
      const permissions = resolveUserPermissions(roles);
      const module_permissions = (dbUser.module_permissions && Array.isArray(dbUser.module_permissions) && dbUser.module_permissions.length > 0)
        ? (dbUser.module_permissions as CrmModule[])
        : resolveLegacyModulePermissions(roles);

      req.user = {
        uid: dbUser.id,
        phone: dbUser.phone,
        email: dbUser.email,
        roles,
        permissions,
        module_permissions,
      };
    } else {
      const config = getValidatedConfig();
      if (!config.allowSandbox) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'User account not found.',
        });
      }
      const roles = (payload.roles || ['OWNER']) as AppRole[];
      const permissions = resolveUserPermissions(roles);
      const module_permissions = resolveLegacyModulePermissions(roles);
      req.user = {
        uid: payload.uid,
        phone: payload.phone,
        email: payload.email,
        roles,
        permissions,
        module_permissions,
      };
    }

    next();
  } catch (err: any) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid, expired, or tampered session token.',
    });
  }
}

/**
 * Optional authentication middleware. Populates req.user if a valid token exists,
 * but allows unauthenticated requests to proceed.
 */
export async function optionalAuthenticateUser(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const payload = await verifySessionToken(token);

    let dbUser: any = null;
    try {
      const dbRes = await executeQuery<{
        id: string;
        phone: string;
        email: string | null;
        roles: string[];
        is_active: boolean;
        token_version: number;
        module_permissions?: string[];
      }>(
        `SELECT id, phone, email, roles, is_active, token_version, module_permissions FROM users WHERE id = $1 LIMIT 1;`,
        [payload.uid]
      );
      if (dbRes.rows && dbRes.rows.length > 0) {
        dbUser = dbRes.rows[0];
      }
    } catch {
      // Ignore
    }

    if (dbUser) {
      if (!dbUser.is_active || (payload.tokenVersion !== undefined && dbUser.token_version !== payload.tokenVersion)) {
        req.user = undefined;
        return next();
      }
      const roles = (dbUser.roles || ['OWNER']) as AppRole[];
      const permissions = resolveUserPermissions(roles);
      const module_permissions = (dbUser.module_permissions && Array.isArray(dbUser.module_permissions) && dbUser.module_permissions.length > 0)
        ? (dbUser.module_permissions as CrmModule[])
        : resolveLegacyModulePermissions(roles);
      req.user = {
        uid: dbUser.id,
        phone: dbUser.phone,
        email: dbUser.email,
        roles,
        permissions,
        module_permissions,
      };
    } else {
      const roles = (payload.roles || ['OWNER']) as AppRole[];
      const permissions = resolveUserPermissions(roles);
      const module_permissions = resolveLegacyModulePermissions(roles);
      req.user = {
        uid: payload.uid,
        phone: payload.phone,
        email: payload.email,
        roles,
        permissions,
        module_permissions,
      };
    }
  } catch {
    req.user = undefined;
  }

  next();
}

/**
 * Role-Based Access Control middleware. Requires at least one of the specified roles.
 */
export function requireRole(...allowedRoles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    if (req.user.roles.includes('STAFF_SUPER_ADMIN')) {
      return next();
    }

    const hasAllowedRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasAllowedRole) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Forbidden: role required (${allowedRoles.join(', ')}). Your roles: ${req.user.roles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Granular Permission-Based Access Control middleware.
 */
export function requirePermissionMiddleware(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Forbidden: user lacks required permission: ${permission}`,
      });
    }

    next();
  };
}

/**
 * Module-Based Access Control middleware.
 * Verifies that the authenticated user has explicit permission for the given CRM module.
 */
export function requireModule(module: CrmModule) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    if (!hasModulePermission(req.user, module)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Forbidden: module permission required (${module}).`,
      });
    }

    next();
  };
}

