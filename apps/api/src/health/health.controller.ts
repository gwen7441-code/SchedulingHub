import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { HealthService } from "./health.service.js";

@ApiTags("health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  health() {
    return { data: { ok: true, service: "api", timestamp: new Date().toISOString() } };
  }

  @Get("ready")
  ready() {
    return this.healthService.ready();
  }
}
