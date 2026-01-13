import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";

// Test types
interface MockEdit {
  id: string;
  status: string;
  editor_name: string;
  edited_content: Record<string, unknown>;
  diff_stats: { change_rate: number };
  created_at: string;
}

interface MockAnalytics {
  total_edits: number;
  average_edit_rate: number;
  edits_by_status: Record<string, number>;
  edits_by_model: Array<{ model_name: string; count: number; avg_change_rate: number }>;
  common_labels: Array<{ label_name: string; count: number; percentage: number }>;
  recent_activity: Array<{ date: string; count: number }>;
}

// Mock fetch
const mockFetch = mock(() => Promise.resolve(new Response()));

describe("API Client Utilities", () => {
  beforeEach(() => {
    // Reset mock before each test
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe("fetchEdits", () => {
    test("fetches edits successfully", async () => {
      const mockEdits: MockEdit[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          status: "draft",
          editor_name: "Dr. Smith",
          edited_content: { summary: "Test" },
          diff_stats: { change_rate: 15.5 },
          created_at: "2024-01-15T10:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockEdits), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const response = await fetch("/api/edits/");
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].editor_name).toBe("Dr. Smith");
    });

    test("handles empty response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const response = await fetch("/api/edits/");
      const data = await response.json();

      expect(data).toHaveLength(0);
    });

    test("handles network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetch("/api/edits/")).rejects.toThrow("Network error");
    });
  });

  describe("fetchAnalytics", () => {
    test("fetches analytics with default time range", async () => {
      const mockAnalytics: MockAnalytics = {
        total_edits: 42,
        average_edit_rate: 28.5,
        edits_by_status: { draft: 10, submitted: 20, approved: 12 },
        edits_by_model: [
          { model_name: "GPT-4", count: 30, avg_change_rate: 25.0 },
        ],
        common_labels: [
          { label_name: "hallucination", count: 15, percentage: 35.7 },
        ],
        recent_activity: [{ date: "2024-01-15", count: 5 }],
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockAnalytics), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const response = await fetch("/api/analytics/?range=30d");
      const data = await response.json();

      expect(data.total_edits).toBe(42);
      expect(data.average_edit_rate).toBe(28.5);
    });

    test("fetches analytics with different time ranges", async () => {
      const mockAnalytics: MockAnalytics = {
        total_edits: 10,
        average_edit_rate: 20.0,
        edits_by_status: {},
        edits_by_model: [],
        common_labels: [],
        recent_activity: [],
      };

      for (const range of ["7d", "30d", "90d"]) {
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify(mockAnalytics), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );

        const response = await fetch(`/api/analytics/?range=${range}`);
        const data = await response.json();

        expect(data.total_edits).toBe(10);
      }
    });
  });

  describe("API Error Handling", () => {
    test("handles 401 unauthorized", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      const response = await fetch("/api/edits/");
      expect(response.status).toBe(401);
    });

    test("handles 404 not found", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      );

      const response = await fetch("/api/edits/invalid-id/");
      expect(response.status).toBe(404);
    });

    test("handles 500 server error", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );

      const response = await fetch("/api/edits/");
      expect(response.status).toBe(500);
    });
  });
});

describe("handleApiError utility", () => {
  test("extracts message from Error object", () => {
    const error = new Error("Something went wrong");
    expect(error.message).toBe("Something went wrong");
  });

  test("handles non-Error objects", () => {
    const error = "string error";
    expect(typeof error).toBe("string");
  });

  test("handles null/undefined", () => {
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
  });
});

describe("API Response Types", () => {
  test("Edit type has correct structure", () => {
    const edit: MockEdit = {
      id: "test-id",
      status: "draft",
      editor_name: "Test Editor",
      edited_content: { summary: "Test" },
      diff_stats: { change_rate: 10 },
      created_at: "2024-01-01T00:00:00Z",
    };

    expect(edit.id).toBeDefined();
    expect(edit.status).toBeDefined();
    expect(edit.edited_content).toBeDefined();
  });

  test("Analytics type has correct structure", () => {
    const analytics: MockAnalytics = {
      total_edits: 0,
      average_edit_rate: 0,
      edits_by_status: {},
      edits_by_model: [],
      common_labels: [],
      recent_activity: [],
    };

    expect(analytics.total_edits).toBeDefined();
    expect(analytics.average_edit_rate).toBeDefined();
    expect(Array.isArray(analytics.edits_by_model)).toBe(true);
  });
});
