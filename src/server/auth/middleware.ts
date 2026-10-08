import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from './tokens';
import { ROLE_PERMISSIONS, hasPermission } from './rbac';
import { AppRole, Permission, AuthenticatedUser } from '../../core/types/auth';
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
  const cookies = (req as any).cookies;
  if (cookies && cookies.sellmyghar_session) {
    return cookies.sellmyghar_session;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
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
      }>(
        `SELECT id, phone, email, roles, is_active, token_version FROM users WHERE id = $1 LIMIT 1;`,
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

      req.user = {
        uid: dbUser.id,
        phone: dbUser.phone,
        email: dbUser.email,
        roles,
        permissions,
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
      req.user = {
        uid: payload.uid,
        phone: payload.phone,
        email: payload.email,
        roles,
        permissions,
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
      }>(
        `SELECT id, phone, email, roles, is_active, token_version FROM users WHERE id = $1 LIMIT 1;`,
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
      req.user = {
        uid: dbUser.id,
        phone: dbUser.phone,
        email: dbUser.email,
        roles,
        permissions,
      };
    } else {
      const roles = (payload.roles || ['OWNER']) as AppRole[];
      const permissions = resolveUserPermissions(roles);
      req.user = {
        uid: payload.uid,
        phone: payload.phone,
        email: payload.email,
        roles,
        permissions,
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
