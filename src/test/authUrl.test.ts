import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAuthRedirectUrl } from "@/lib/authUrl";

describe("getAuthRedirectUrl", () => {
  const originalLocation = window.location;

  afterEach(() => {
    // Restore window.location
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  function mockLocation(origin: string, hostname: string) {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin,
        hostname,
      } as Location,
    });
  }

  it("returns current origin on localhost port 8080", () => {
    mockLocation("http://localhost:8080", "localhost");
    expect(getAuthRedirectUrl()).toBe("http://localhost:8080/");
  });

  it("returns current origin on localhost port 8081 (dynamic port)", () => {
    mockLocation("http://localhost:8081", "localhost");
    expect(getAuthRedirectUrl()).toBe("http://localhost:8081/");
  });

  it("returns current origin on localhost port 5173 or 3000", () => {
    mockLocation("http://localhost:5173", "localhost");
    expect(getAuthRedirectUrl()).toBe("http://localhost:5173/");

    mockLocation("http://localhost:3000", "localhost");
    expect(getAuthRedirectUrl()).toBe("http://localhost:3000/");
  });

  it("supports 127.0.0.1 on any port", () => {
    mockLocation("http://127.0.0.1:8081", "127.0.0.1");
    expect(getAuthRedirectUrl()).toBe("http://127.0.0.1:8081/");
  });

  it("appends custom path correctly when specified", () => {
    mockLocation("http://localhost:8081", "localhost");
    expect(getAuthRedirectUrl("/reset-password")).toBe("http://localhost:8081/reset-password");
    expect(getAuthRedirectUrl("auth/callback")).toBe("http://localhost:8081/auth/callback");
  });

  it("returns production origin when running on production domain", () => {
    mockLocation("https://algoguru.online", "algoguru.online");
    expect(getAuthRedirectUrl()).toBe("https://algoguru.online/");
  });

  it("supports 0.0.0.0 and local network IP addresses", () => {
    mockLocation("http://0.0.0.0:8080", "0.0.0.0");
    expect(getAuthRedirectUrl()).toBe("http://0.0.0.0:8080/");

    mockLocation("http://192.168.1.50:8080", "192.168.1.50");
    expect(getAuthRedirectUrl()).toBe("http://192.168.1.50:8080/");
  });

  it("supports .localhost and .local subdomains", () => {
    mockLocation("http://sub.localhost:8080", "sub.localhost");
    expect(getAuthRedirectUrl()).toBe("http://sub.localhost:8080/");
  });

  it("returns preview deployment origin when deployed on vercel", () => {
    mockLocation("https://algoguru-preview-123.vercel.app", "algoguru-preview-123.vercel.app");
    expect(getAuthRedirectUrl()).toBe("https://algoguru-preview-123.vercel.app/");
  });
});
