/**
 * Demo authentication for local testing
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
 * Generate a demo JWT token signed with HS256
 * This token will be accepted by the backend when JWT_TEST_MODE=true
 */
export async function generateDemoToken(): Promise<string> {
  const secret = new TextEncoder().encode(TEST_SECRET);

  const jwt = await new jose.SignJWT({
    sub: DEMO_USER.sub,
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    role: DEMO_USER.role,
    permissions: ['read:documents', 'write:edits', 'read:analytics'],
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer('watson-test-auth')
    .setAudience('watson.oceanheart.ai')
    .setExpirationTime('8h') // 8 hours for demo convenience
    .sign(secret);

  return jwt;
}

/**
 * Check if we're in demo mode (test environment)
 */
export function isDemoMode(): boolean {
  // In development or when VITE_DEMO_MODE is set
  return import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';
}
