import { SignJWT, jwtVerify } from 'jose';
import { AuthenticatedUser } from '../../core/types/auth';
import { getValidatedConfig } from '../config/env';

/**
 * Cryptographic JWT Session Token Service (Using jose)
 * 
 * [Fail-Closed Enforcement]:
 * Rejects execution if JWT_SECRET is unset or under 32 characters,
 * unless explicitly operating in sandbox test mode.
 */

const TOKEN_ISSUER = 'https://sellmyghar.com';
const TOKEN_AUDIENCE = 'https://api.sellmyghar.com';

export interface TokenPayload {
  uid: string;
  phone: string;
  email: string | null;
  roles: string[];
}

/**
 * Signs a real cryptographic JWT containing user identity and assigned roles.
 */
export async function signSessionToken(user: AuthenticatedUser): Promise<string> {
  const config = getValidatedConfig();

  const token = await new SignJWT({
    uid: user.uid,
    phone: user.phone,
    email: user.email,
    roles: user.roles,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setExpirationTime('24h') // 24-hour session lifetime
    .sign(config.jwtSecret);

  return token;
}

/**
 * Verifies and decodes a signed JWT, throwing an error if expired, tampered with, or untrusted.
 */
export async function verifySessionToken(token: string): Promise<TokenPayload> {
  const config = getValidatedConfig();

  const { payload } = await jwtVerify(token, config.jwtSecret, {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });

  return {
    uid: payload.uid as string,
    phone: payload.phone as string,
    email: (payload.email as string) || null,
    roles: (payload.roles as string[]) || [],
  };
}
