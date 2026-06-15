import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { DynamicsHealthService } from "../dynamics/dynamics-health.service.js";
import { DynamicsMappingService } from "../dynamics/dynamics-mapping.service.js";

type SetupStatus = "Not configured" | "Configured but not validated" | "Connected" | "Warning" | "Error";

@Injectable()
export class IntegrationSetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamics: DynamicsHealthService,
    private readonly mapping: DynamicsMappingService
  ) {}

  async status() {
    const [lastSync, lastWebhook, persisted] = await Promise.all([
      this.prisma.integrationSyncRun.findFirst({ orderBy: { startedAt: "desc" } }),
      this.prisma.webhookEvent.findFirst({ orderBy: { receivedAt: "desc" } }),
      this.prisma.integrationConfiguration.findMany()
    ]);
    const persistedByService = new Map(persisted.map((item) => [item.service, item]));

    return {
      data: {
        services: {
          dynamics: this.dynamicsStatus(persistedByService.get("DYNAMICS")?.status),
          sendgrid: this.requiredEnvStatus(["SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"]),
          twilio: this.requiredEnvStatus(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"]),
          pushNotifications: this.requiredEnvStatus(["EXPO_ACCESS_TOKEN", "EXPO_PROJECT_ID"]),
          database: this.requiredEnvStatus(["DATABASE_URL"]),
          redis: this.requiredEnvStatus(["REDIS_URL"])
        },
        lastSync: lastSync
          ? { id: lastSync.id, service: lastSync.service, entity: lastSync.entity, status: lastSync.status, startedAt: lastSync.startedAt, completedAt: lastSync.completedAt }
          : null,
        mappingStatus: this.mapping.validate().ok ? "Connected" : "Error",
        webhookStatus: lastWebhook ? { status: lastWebhook.status, receivedAt: lastWebhook.receivedAt } : "Not configured"
      }
    };
  }

  async validate() {
    const dynamics = await this.dynamics.validate();
    return {
      data: {
        dynamics: dynamics.data,
        sendgrid: this.requiredEnvStatus(["SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"]),
        twilio: this.requiredEnvStatus(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"]),
        pushNotifications: this.requiredEnvStatus(["EXPO_ACCESS_TOKEN", "EXPO_PROJECT_ID"]),
        database: this.requiredEnvStatus(["DATABASE_URL"]),
        redis: this.requiredEnvStatus(["REDIS_URL"])
      }
    };
  }

  private requiredEnvStatus(keys: string[]): SetupStatus {
    return keys.every((key) => Boolean(process.env[key])) ? "Configured but not validated" : "Not configured";
  }

  private dynamicsStatus(status?: string): SetupStatus {
    if (process.env.DYNAMICS_ENABLED !== "true") return "Not configured";
    if (status === "CONNECTED") return "Connected";
    if (status === "MAPPING_ERROR" || status === "CONNECTION_ERROR" || status === "ERROR") return "Error";
    return "Configured but not validated";
  }
}
