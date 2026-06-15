import { Injectable } from "@nestjs/common";
import IORedis from "ioredis";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async ready() {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();
    return {
      data: {
        ok: database.ok && redis.ok,
        checks: { database, redis },
        timestamp: new Date().toISOString()
      }
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, status: "Connected" };
    } catch (error) {
      return { ok: false, status: "Error", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private async checkRedis() {
    const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: 1 });
    try {
      await redis.ping();
      return { ok: true, status: "Connected" };
    } catch (error) {
      return { ok: false, status: "Error", error: error instanceof Error ? error.message : "Unknown error" };
    } finally {
      redis.disconnect();
    }
  }
}
