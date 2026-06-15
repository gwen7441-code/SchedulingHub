import { describe, expect, it } from "vitest";
import { z } from "zod";

const entityMapping = z.record(z.string().min(1));
const mappingSchema = z.object({
  instructor: entityMapping,
  course: entityMapping,
  assignment: entityMapping,
  availability: entityMapping
});

describe("Dynamics mapping shape", () => {
  it("requires all mapped entities", () => {
    expect(mappingSchema.safeParse({ instructor: {}, course: {}, assignment: {}, availability: {} }).success).toBe(true);
    expect(mappingSchema.safeParse({ instructor: {} }).success).toBe(false);
  });
});
