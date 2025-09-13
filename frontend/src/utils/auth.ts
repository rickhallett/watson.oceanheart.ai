/**
 * Authentication utilities for Watson application
 * Handles JWT token validation, parsing, and localStorage management
 */

import { JWTPayload, User, AuthError } from '../types/auth';

/**
 * Parse JWT token payload (basic implementation)
 * Note: In production, use proper JWT library with signature verification
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    // Basic JWT parsing (payload is base64-encoded second part)
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Validate JWT token expiration
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Validate JWT token format and expiration
 */
export function isValidToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  return !isTokenExpired(token);
}

/**
 * Extract user information from JWT token
 */
export function getUserFromToken(token: string): User | null {
  const payload = parseJWT(token);
  if (!payload) return null;
  
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

/**
 * Get stored authentication token from localStorage
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem('watson-auth-token');
  } catch (error) {
    console.error('Failed to get stored token:', error);
    return null;
  }
}

/**
 * Store authentication token in localStorage
 */
export function storeToken(token: string): void {
  try {
    localStorage.setItem('watson-auth-token', token);
  } catch (error) {
    console.error('Failed to store token:', error);
  }
}

/**
 * Remove authentication token from localStorage
 */
export function removeToken(): void {
  try {
    localStorage.removeItem('watson-auth-token');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
}

/**
 * Check if user has been checked in within last 7 days
 */
export function shouldShowLanding(): boolean {
  try {
    const lastCheckIn = localStorage.getItem('watson-last-check-in');
    
    if (!lastCheckIn) return true;
    
    const lastDate = new Date(lastCheckIn);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff > 7;
  } catch (error) {
    console.error('Failed to check landing page requirement:', error);
    return true; // Show landing page on error for safety
  }
}

/**
 * Update last check-in date to current timestamp
 */
export function updateCheckIn(): void {
  try {
    localStorage.setItem('watson-last-check-in', new Date().toISOString());
  } catch (error) {
    console.error('Failed to update check-in:', error);
  }
}

/**
 * Get last check-in date
 */
export function getLastCheckIn(): Date | null {
  try {
    const lastCheckIn = localStorage.getItem('watson-last-check-in');
    return lastCheckIn ? new Date(lastCheckIn) : null;
  } catch (error) {
    console.error('Failed to get last check-in:', error);
    return null;
  }
}

/**
 * Clear all authentication-related localStorage data
 */
export function clearAuthData(): void {
  try {
    localStorage.removeItem('watson-auth-token');
    localStorage.removeItem('watson-last-check-in');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}

/**
 * Create authentication error
 */
export function createAuthError(message: string, code: string): AuthError {
  return {
    message,
    code,
  };
}