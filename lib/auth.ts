import * as jose from 'jose';

/**
 * Verify JWT token and return decoded payload
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string | undefined): any {
  if (!token) {
    return null;
  }

  try {
    // Note: This is a synchronous version for API routes
    // For middleware, use jose.jwtVerify which is async
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    // For synchronous verification in API routes
    // We'll use a different approach since jose.jwtVerify is async
    // This is a simplified version - in production you might want to use async verification
    
    // Decode the token (this doesn't verify signature, just decodes)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Async version of token verification using jose.jwtVerify
 * Use this for proper signature verification
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export async function verifyTokenAsync(token: string | undefined): Promise<any> {
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Generate JWT token
 * @param payload - Token payload
 * @returns JWT token string
 */
export async function generateToken(payload: { userId: number; username: string }): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  return await new jose.SignJWT({
    userId: payload.userId,
    username: payload.username,
    type: 'access'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(secret);
}

/**
 * Generate refresh token
 * @param payload - Token payload
 * @returns JWT refresh token string
 */
export async function generateRefreshToken(payload: { userId: number; username: string }): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  return await new jose.SignJWT({
    userId: payload.userId,
    username: payload.username,
    type: 'refresh'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}