import { describe, expect, it } from "vitest";
import { safeParseConfig } from "./index.js";

describe("configuration validation", () => {
  it("rejects short JWT secrets", () => {
    const result = safeParseConfig({
      DATABASE_URL: "postgresql://localhost/test",
      REDIS_URL: "redis://localhost:6379",
      JWT_ACCESS_SECRET: "short",
      JWT_REFRESH_SECRET: "also-short",
      API_PUBLIC_URL: "http://localhost:3000",
      PASSWORD_RESET_URL: "http://localhost:8081/reset"
    });

    expect(result.success).toBe(false);
  });
});
