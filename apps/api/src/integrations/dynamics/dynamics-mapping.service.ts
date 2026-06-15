import { Injectable } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { z } from "zod";

const entityMapping = z.record(z.string().min(1));
const mappingSchema = z.object({
  instructor: entityMapping,
  course: entityMapping,
  assignment: entityMapping,
  availability: entityMapping
});

export type DynamicsMapping = z.infer<typeof mappingSchema>;

@Injectable()
export class DynamicsMappingService {
  load() {
    const file = process.env.DYNAMICS_MAPPING_FILE ?? "config/dynamics-mapping.example.json";
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return mappingSchema.parse(parsed);
  }

  validate() {
    const result = mappingSchema.safeParse(JSON.parse(readFileSync(process.env.DYNAMICS_MAPPING_FILE ?? "config/dynamics-mapping.example.json", "utf8")));
    if (result.success) return { ok: true, mapping: result.data };
    return { ok: false, issues: result.error.flatten() };
  }
}
