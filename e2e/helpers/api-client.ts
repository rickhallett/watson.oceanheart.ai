/**
 * API Client Helper for E2E Tests
 *
 * Provides authenticated API access for integration testing.
 * Supports both mock JWT (for isolated tests) and real Passport auth.
 */

import { APIRequestContext } from '@playwright/test';
import { createHmac, generateKeyPairSync, createSign } from 'crypto';

// Configuration from environment
export const API_CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:8001',
  appUrl: process.env.APP_URL || 'http://localhost:3001',
  useRealAuth: process.env.USE_REAL_AUTH === 'true',
  passportUrl: process.env.PASSPORT_URL || 'https://passport.oceanheart.ai',
  testUserEmail: process.env.TEST_USER_EMAIL || 'test-clinician@watson.oceanheart.ai',
  testUserPassword: process.env.TEST_USER_PASSWORD || '',
};

// Test user claims
export const TEST_USER_CLAIMS = {
  sub: 'test-user-e2e-uuid-00001',
  email: 'test-clinician@watson.oceanheart.ai',
  name: 'Dr. Test Clinician',
  role: 'clinician',
  permissions: ['read:documents', 'write:edits', 'read:analytics', 'export:data'],
};

// Generate RSA key pair for testing (mimics Passport's RS256 signing)
let _testKeyPair: { privateKey: string; publicKey: string } | null = null;

function getTestKeyPair() {
  if (!_testKeyPair) {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    _testKeyPair = { privateKey, publicKey };
  }
  return _testKeyPair;
}

/**
 * Generate a test JWT token with RS256 signature
 * This matches what Passport would generate
 */
export function generateTestJWT(
  claims: Record<string, unknown> = {},
  options: { expiresIn?: number; algorithm?: 'RS256' | 'HS256' } = {}
): string {
  const { expiresIn = 3600, algorithm = 'HS256' } = options;

  const header = {
    alg: algorithm,
    typ: 'JWT',
    kid: 'test-key-001',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ...TEST_USER_CLAIMS,
    ...claims,
    iss: 'https://passport.oceanheart.ai',
    aud: 'watson.oceanheart.ai',
    iat: now,
    exp: now + expiresIn,
  };

  const base64UrlEncode = (obj: object): string => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);

  let signature: string;

  if (algorithm === 'RS256') {
    const keyPair = getTestKeyPair();
    const sign = createSign('RSA-SHA256');
    sign.update(`${headerEncoded}.${payloadEncoded}`);
    signature = sign
      .sign(keyPair.privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  } else {
    // HS256 for simpler test scenarios
    const testSecret = process.env.JWT_SECRET || 'watson-e2e-test-secret';
    signature = createHmac('sha256', testSecret)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Generate an expired JWT for testing expiry handling
 */
export function generateExpiredJWT(): string {
  return generateTestJWT({}, { expiresIn: -3600 }); // Expired 1 hour ago
}

/**
 * Generate a JWT with invalid signature
 */
export function generateInvalidSignatureJWT(): string {
  const token = generateTestJWT();
  const parts = token.split('.');
  // Corrupt the signature
  parts[2] = parts[2].split('').reverse().join('');
  return parts.join('.');
}

/**
 * Generate a JWT with wrong issuer
 */
export function generateWrongIssuerJWT(): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    ...TEST_USER_CLAIMS,
    iss: 'https://evil-issuer.com',
    aud: 'watson.oceanheart.ai',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const base64UrlEncode = (obj: object): string => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const testSecret = process.env.JWT_SECRET || 'watson-e2e-test-secret';
  const signature = createHmac('sha256', testSecret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Get auth token for API tests
 * Uses real Passport auth if configured, otherwise generates test JWT
 */
export async function getAuthToken(): Promise<string> {
  if (API_CONFIG.useRealAuth && API_CONFIG.testUserPassword) {
    return await getRealPassportToken();
  }
  return generateTestJWT();
}

/**
 * Get real Passport token (for production-like tests)
 */
async function getRealPassportToken(): Promise<string> {
  const response = await fetch(`${API_CONFIG.passportUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: API_CONFIG.testUserEmail,
      password: API_CONFIG.testUserPassword,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Passport token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * API Client class for making authenticated requests
 */
export class APIClient {
  private token: string;
  private request: APIRequestContext;

  constructor(request: APIRequestContext, token: string) {
    this.request = request;
    this.token = token;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  // Document endpoints
  async getDocuments() {
    return this.request.get(`${API_CONFIG.apiUrl}/api/documents/`, {
      headers: this.headers,
    });
  }

  async createDocument(data: Record<string, unknown>) {
    return this.request.post(`${API_CONFIG.apiUrl}/api/documents/`, {
      headers: this.headers,
      data,
    });
  }

  async getDocument(id: string) {
    return this.request.get(`${API_CONFIG.apiUrl}/api/documents/${id}/`, {
      headers: this.headers,
    });
  }

  // Output endpoints
  async getOutputs() {
    return this.request.get(`${API_CONFIG.apiUrl}/api/outputs/`, {
      headers: this.headers,
    });
  }

  async createOutput(data: Record<string, unknown>) {
    return this.request.post(`${API_CONFIG.apiUrl}/api/outputs/`, {
      headers: this.headers,
      data,
    });
  }

  async getOutput(id: string) {
    return this.request.get(`${API_CONFIG.apiUrl}/api/outputs/${id}/`, {
      headers: this.headers,
    });
  }

  // Edit endpoints
  async getEdits(params?: Record<string, string>) {
    const url = new URL(`${API_CONFIG.apiUrl}/api/edits/`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return this.request.get(url.toString(), { headers: this.headers });
  }

  async createEdit(data: Record<string, unknown>) {
    return this.request.post(`${API_CONFIG.apiUrl}/api/edits/`, {
      headers: this.headers,
      data,
    });
  }

  async getEdit(id: string) {
    return this.request.get(`${API_CONFIG.apiUrl}/api/edits/${id}/`, {
      headers: this.headers,
    });
  }

  async updateEdit(id: string, data: Record<string, unknown>) {
    return this.request.patch(`${API_CONFIG.apiUrl}/api/edits/${id}/`, {
      headers: this.headers,
      data,
    });
  }

  async submitEdit(id: string) {
    return this.request.post(`${API_CONFIG.apiUrl}/api/edits/${id}/submit/`, {
      headers: this.headers,
    });
  }

  // Label endpoints
  async getLabels() {
    return this.request.get(`${API_CONFIG.apiUrl}/api/labels/`, {
      headers: this.headers,
    });
  }

  async createLabel(data: Record<string, unknown>) {
    return this.request.post(`${API_CONFIG.apiUrl}/api/labels/`, {
      headers: this.headers,
      data,
    });
  }

  // Analytics endpoint
  async getAnalytics(range: string = '30d') {
    return this.request.get(`${API_CONFIG.apiUrl}/api/analytics/?range=${range}`, {
      headers: this.headers,
    });
  }

  // Export endpoint
  async getExport(format: string = 'jsonl', params?: Record<string, string>) {
    const url = new URL(`${API_CONFIG.apiUrl}/api/exports/`);
    url.searchParams.append('export_format', format);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return this.request.get(url.toString(), { headers: this.headers });
  }

  // Health check (no auth required)
  async healthCheck() {
    return this.request.get(`${API_CONFIG.apiUrl}/health/`);
  }
}

/**
 * Create an authenticated API client
 */
export async function createAPIClient(request: APIRequestContext): Promise<APIClient> {
  const token = await getAuthToken();
  return new APIClient(request, token);
}
