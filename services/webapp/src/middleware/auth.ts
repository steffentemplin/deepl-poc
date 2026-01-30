import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

const jwks = createRemoteJWKSet(new URL(config.keycloak.jwksUri));

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Optional auth middleware — extracts user_id from JWT if present,
 * but does not reject unauthenticated requests.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.keycloak.issuer,
    });
    req.userId = (payload.sub as string) ?? undefined;
  } catch (err) {
    // Invalid token — treat as unauthenticated
    console.warn('JWT validation failed:', err instanceof Error ? err.message : err);
  }

  next();
}
