/**
 * API Client utilities for Watson application
 * Handles communication with Django backend
 */

import { getAuthConfig, getAuthHeader } from '../config/auth';
import { getStoredToken } from './auth';

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Edit/Review types matching Django models
export interface Edit {
  id: string;
  llm_output: LLMOutputSummary;
  llm_output_id?: string;
  editor_id: string;
  editor_name: string;
  edited_content: Record<string, unknown>;
  token_diff: Record<string, unknown>;
  structural_diff: Array<Record<string, unknown>>;
  diff_stats: DiffStats;
  status: 'draft' | 'in_review' | 'submitted' | 'approved' | 'rejected';
  editor_notes: string;
  reviewer_notes: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface LLMOutputSummary {
  id: string;
  document_id: string;
  document_title?: string;
  model_name: string;
  model_version: string;
  created_at: string;
}

export interface DiffStats {
  token_additions: number;
  token_deletions: number;
  token_unchanged: number;
  change_rate: number;
  original_token_count: number;
  edited_token_count: number;
  structural_additions: number;
  structural_deletions: number;
  structural_modifications: number;
  total_structural_changes: number;
}

export interface Label {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  color: string;
  icon: string;
  is_active: boolean;
}

export interface Document {
  id: string;
  title: string;
  source: string;
  document_type: string;
  raw_content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LLMOutput {
  id: string;
  document: Document;
  document_id?: string;
  model_name: string;
  model_version: string;
  output_content: Record<string, unknown>;
  raw_response: string;
  prompt_template: string;
  generation_params: Record<string, unknown>;
  created_at: string;
}

// Analytics types
export interface AnalyticsData {
  total_edits: number;
  average_edit_rate: number;
  edits_by_status: Record<string, number>;
  edits_by_model: Array<{
    model_name: string;
    count: number;
    avg_change_rate: number;
  }>;
  common_labels: Array<{
    label_name: string;
    count: number;
    percentage: number;
  }>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Get the base API URL
 */
function getApiUrl(): string {
  const config = getAuthConfig();
  return config.apiUrl;
}

/**
 * Create request headers with authentication
 */
function getHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = getAuthHeader(token);
  }

  return headers;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiUrl()}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// Edit/Review API
// =============================================================================

/**
 * Fetch all edits/reviews
 */
export async function fetchEdits(): Promise<Edit[]> {
  return apiFetch<Edit[]>('/edits/');
}

/**
 * Fetch a single edit by ID
 */
export async function fetchEdit(id: string): Promise<Edit> {
  return apiFetch<Edit>(`/edits/${id}/`);
}

/**
 * Create a new edit
 */
export async function createEdit(data: Partial<Edit>): Promise<Edit> {
  return apiFetch<Edit>('/edits/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an edit
 */
export async function updateEdit(id: string, data: Partial<Edit>): Promise<Edit> {
  return apiFetch<Edit>(`/edits/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Submit an edit for review
 */
export async function submitEdit(id: string): Promise<Edit> {
  return apiFetch<Edit>(`/edits/${id}/submit/`, {
    method: 'POST',
  });
}

// =============================================================================
// Document API
// =============================================================================

/**
 * Fetch all documents
 */
export async function fetchDocuments(): Promise<Document[]> {
  return apiFetch<Document[]>('/documents/');
}

/**
 * Fetch a single document by ID
 */
export async function fetchDocument(id: string): Promise<Document> {
  return apiFetch<Document>(`/documents/${id}/`);
}

// =============================================================================
// LLM Output API
// =============================================================================

/**
 * Fetch all LLM outputs
 */
export async function fetchOutputs(): Promise<LLMOutput[]> {
  return apiFetch<LLMOutput[]>('/outputs/');
}

/**
 * Fetch a single LLM output by ID
 */
export async function fetchOutput(id: string): Promise<LLMOutput> {
  return apiFetch<LLMOutput>(`/outputs/${id}/`);
}

// =============================================================================
// Label API
// =============================================================================

/**
 * Fetch all labels
 */
export async function fetchLabels(): Promise<Label[]> {
  return apiFetch<Label[]>('/labels/');
}

// =============================================================================
// Analytics API
// =============================================================================

/**
 * Fetch analytics data
 */
export async function fetchAnalytics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsData> {
  return apiFetch<AnalyticsData>(`/analytics/?range=${timeRange}`);
}

// =============================================================================
// React Hook helpers
// =============================================================================

/**
 * Helper to handle API errors in components
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
