import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { DynamicsApiClient } from "./dynamics-api.client.js";
import { DynamicsMappingService } from "./dynamics-mapping.service.js";

@Injectable()
export class DynamicsHealthService {
  constructor(
    private readonly mapping: DynamicsMappingService,
    private readonly api: DynamicsApiClient,
    private readonly prisma: PrismaService
  ) {}

  async validate() {
    if (process.env.DYNAMICS_ENABLED !== "true") {
      return { data: { status: "NOT_CONFIGURED", enabled: false } };
    }
    const mapping = this.mapping.validate();
    if (!mapping.ok) return { data: { status: "MAPPING_ERROR", mapping } };
    try {
      await this.api.request("GET", "WhoAmI()");
      await this.prisma.integrationConfiguration.upsert({
        where: { service: "DYNAMICS" },
        create: { service: "DYNAMICS", status: "CONNECTED", lastCheckedAt: new Date() },
        update: { status: "CONNECTED", lastCheckedAt: new Date() }
      });
      return { data: { status: "CONNECTED", mapping: "valid" } };
    } catch (error) {
      await this.prisma.integrationConfiguration.upsert({
        where: { service: "DYNAMICS" },
        create: { service: "DYNAMICS", status: "CONNECTION_ERROR", lastCheckedAt: new Date() },
        update: { status: "CONNECTION_ERROR", lastCheckedAt: new Date() }
      });
      return { data: { status: "CONNECTION_ERROR", error: error instanceof Error ? error.message : "Unknown error" } };
    }
  }
}
