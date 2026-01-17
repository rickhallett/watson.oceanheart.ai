/**
 * Demo authentication for local testing and Clerk bridge
 * Generates HS256 JWT matching backend test mode expectations
 */

import * as jose from 'jose';

const TEST_SECRET = 'watson-e2e-test-secret';

export const DEMO_USER = {
  sub: 'demo-user-001',
  email: 'demo@watson.oceanheart.ai',
  name: 'Demo Clinician',
  role: 'clinician',
};

/**
 * User info for generating tokens
 */
export interface TokenUserInfo {
  sub: string;
  email: string;
  name?: string;
  role?: string;
}

/**
 * Generate a demo JWT token signed with HS256
 * This token will be accepted by the backend when JWT_TEST_MODE=true
 *
 * @param userInfo - Optional custom user info (defaults to DEMO_USER)
 */
export async function generateDemoToken(userInfo?: TokenUserInfo): Promise<string> {
  const secret = new TextEncoder().encode(TEST_SECRET);

  const user = userInfo || DEMO_USER;

  const jwt = await new jose.SignJWT({
    sub: user.sub,
    email: user.email,
    name: user.name || 'Watson User',
    role: user.role || 'clinician',
    permissions: ['read:documents', 'write:edits', 'read:analytics'],
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer('watson-test-auth')
    .setAudience('watson.oceanheart.ai')
    .setExpirationTime('8h') // 8 hours for convenience
    .sign(secret);

  return jwt;
}

/**
 * Check if we're in demo mode (test environment)
 */
export function isDemoMode(): boolean {
  // In development or when VITE_DEMO_MODE is set
  return Boolean(import.meta.env.DEV) || import.meta.env.VITE_DEMO_MODE === 'true';
}
