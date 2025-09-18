/**
 * Mock authentication interface for Watson application
 * Provides stubbed authentication functionality for development and testing
 */

import { type User, type LoginCredentials, type AuthError } from '../types/auth';

// Mock users for development
const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'admin@watson.local',
    role: 'admin',
    name: 'Dr. Admin User',
  },
  {
    id: 'user-2', 
    email: 'clinician@watson.local',
    role: 'clinician',
    name: 'Dr. Jane Clinician',
  },
  {
    id: 'user-3',
    email: 'viewer@watson.local', 
    role: 'viewer',
    name: 'John Viewer',
  },
];

// Mock JWT tokens for development (not real JWT - just base64 encoded JSON)
function createMockToken(user: User): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  
  const signature = 'mock_signature';
  
  // Base64 encode each part (mock JWT structure)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const encodedSignature = btoa(signature);
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Mock login function for development
 * Simulates authentication API call with artificial delay
 */
export async function mockLogin(credentials: LoginCredentials): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find user by email
  const user = MOCK_USERS.find(u => u.email === credentials.email);
  
  if (!user) {
    throw new Error('Invalid credentials: User not found');
  }
  
  // Simple password check (in development, accept any password)
  if (credentials.password.length < 4) {
    throw new Error('Invalid credentials: Password too short');
  }
  
  // Return mock JWT token
  return createMockToken(user);
}

/**
 * Mock logout function for development
 */
export async function mockLogout(): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In real implementation, this might invalidate the token server-side
  console.log('Mock logout completed');
}

/**
 * Get mock user by email for development
 */
export function getMockUser(email: string): User | null {
  return MOCK_USERS.find(u => u.email === email) || null;
}

/**
 * Get all mock users (for development UI)
 */
export function getAllMockUsers(): User[] {
  return [...MOCK_USERS];
}

/**
 * Mock authentication error for testing error states
 */
export function createMockAuthError(message: string): AuthError {
  return {
    message,
    code: 'MOCK_AUTH_ERROR',
  };
}

/**
 * Check if we're in development mode
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.env.NODE_ENV === 'test' ||
         !process.env.NODE_ENV;
}

/**
 * Mock quick login for development - creates token for given role
 */
export function mockQuickLogin(role: 'admin' | 'clinician' | 'viewer'): string {
  const user = MOCK_USERS.find(u => u.role === role);
  if (!user) {
    throw new Error(`No mock user found for role: ${role}`);
  }
  
  return createMockToken(user);
}

/**
 * Development helper to log current mock auth state
 */
export function logMockAuthState(): void {
  if (isDevelopmentMode()) {
    console.log('🔒 Mock Authentication State:', {
      availableUsers: MOCK_USERS.map(u => ({
        email: u.email,
        role: u.role,
        name: u.name,
      })),
      quickLoginCommands: {
        admin: "mockQuickLogin('admin')",
        clinician: "mockQuickLogin('clinician')",
        viewer: "mockQuickLogin('viewer')",
      },
    });
  }
}