import { describe, it, expect } from "vitest";

/**
 * Health endpoint response contract tests.
 *
 * These validate the JSON response structure and HTTP status code semantics
 * that UptimeRobot and other monitors depend on. They don't call the actual
 * edge function (which requires a Supabase runtime), but verify the contract.
 */

// ── Response shapes ──────────────────────────────────────────────────────────

interface HealthResponse {
  status: "UP" | "DOWN";
  database: "UP" | "DOWN";
}

const HEALTHY_RESPONSE: HealthResponse = { status: "UP", database: "UP" };
const UNHEALTHY_RESPONSE: HealthResponse = { status: "DOWN", database: "DOWN" };

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Health endpoint response contract", () => {
  it("healthy response has correct shape and values", () => {
    expect(HEALTHY_RESPONSE).toEqual({ status: "UP", database: "UP" });
    expect(Object.keys(HEALTHY_RESPONSE)).toHaveLength(2);
    expect(HEALTHY_RESPONSE).toHaveProperty("status");
    expect(HEALTHY_RESPONSE).toHaveProperty("database");
  });

  it("unhealthy response has correct shape and values", () => {
    expect(UNHEALTHY_RESPONSE).toEqual({ status: "DOWN", database: "DOWN" });
    expect(Object.keys(UNHEALTHY_RESPONSE)).toHaveLength(2);
    expect(UNHEALTHY_RESPONSE).toHaveProperty("status");
    expect(UNHEALTHY_RESPONSE).toHaveProperty("database");
  });

  it("healthy response maps to HTTP 200", () => {
    const httpStatus = HEALTHY_RESPONSE.status === "UP" ? 200 : 503;
    expect(httpStatus).toBe(200);
  });

  it("unhealthy response maps to HTTP 503", () => {
    const httpStatus = UNHEALTHY_RESPONSE.status === "UP" ? 200 : 503;
    expect(httpStatus).toBe(503);
  });

  it("does not expose sensitive information in healthy response", () => {
    const json = JSON.stringify(HEALTHY_RESPONSE);
    expect(json).not.toContain("password");
    expect(json).not.toContain("secret");
    expect(json).not.toContain("connection");
    expect(json).not.toContain("supabase");
    expect(json).not.toContain("postgres");
    expect(json).not.toContain("host");
    expect(json).not.toContain("port");
  });

  it("does not expose sensitive information in unhealthy response", () => {
    const json = JSON.stringify(UNHEALTHY_RESPONSE);
    expect(json).not.toContain("password");
    expect(json).not.toContain("secret");
    expect(json).not.toContain("connection");
    expect(json).not.toContain("supabase");
    expect(json).not.toContain("postgres");
    expect(json).not.toContain("host");
    expect(json).not.toContain("port");
    expect(json).not.toContain("stack");
    expect(json).not.toContain("error");
  });

  it("responses are valid JSON", () => {
    expect(() => JSON.parse(JSON.stringify(HEALTHY_RESPONSE))).not.toThrow();
    expect(() => JSON.parse(JSON.stringify(UNHEALTHY_RESPONSE))).not.toThrow();
  });

  it("response only contains status and database fields", () => {
    const healthyKeys = Object.keys(HEALTHY_RESPONSE).sort();
    const unhealthyKeys = Object.keys(UNHEALTHY_RESPONSE).sort();
    expect(healthyKeys).toEqual(["database", "status"]);
    expect(unhealthyKeys).toEqual(["database", "status"]);
  });
});

describe("Health endpoint edge function logic", () => {
  /**
   * Simulates the core health-check logic extracted from the edge function.
   * This lets us unit-test the decision logic without the Deno runtime.
   */
  function buildHealthResponse(
    rpcData: number | null,
    rpcError: unknown,
  ): { status: number; body: HealthResponse } {
    if (rpcError || rpcData !== 1) {
      return { status: 503, body: { status: "DOWN", database: "DOWN" } };
    }
    return { status: 200, body: { status: "UP", database: "UP" } };
  }

  it("returns 200 when database returns 1", () => {
    const result = buildHealthResponse(1, null);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: "UP", database: "UP" });
  });

  it("returns 503 when database returns an error", () => {
    const result = buildHealthResponse(null, new Error("connection refused"));
    expect(result.status).toBe(503);
    expect(result.body).toEqual({ status: "DOWN", database: "DOWN" });
  });

  it("returns 503 when database returns unexpected value", () => {
    const result = buildHealthResponse(0, null);
    expect(result.status).toBe(503);
    expect(result.body).toEqual({ status: "DOWN", database: "DOWN" });
  });

  it("returns 503 when database returns null", () => {
    const result = buildHealthResponse(null, null);
    expect(result.status).toBe(503);
    expect(result.body).toEqual({ status: "DOWN", database: "DOWN" });
  });

  it("error response never includes the original error message", () => {
    const result = buildHealthResponse(
      null,
      new Error("FATAL: password authentication failed for user postgres"),
    );
    const json = JSON.stringify(result.body);
    expect(json).not.toContain("FATAL");
    expect(json).not.toContain("password");
    expect(json).not.toContain("authentication");
    expect(json).not.toContain("postgres");
  });
});
