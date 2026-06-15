import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class DynamicsSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async sync(entity: "all" | "courses" | "instructors" | "assignments" | "availability") {
    const run = await this.prisma.integrationSyncRun.create({
      data: { service: "DYNAMICS", entity, mode: "manual", status: process.env.DYNAMICS_ENABLED === "true" ? "QUEUED" : "SKIPPED" }
    });
    return {
      data: {
        runId: run.id,
        status: run.status,
        message: process.env.DYNAMICS_ENABLED === "true" ? "Synchronization run queued." : "Dynamics is disabled; no external call was made."
      }
    };
  }
}
