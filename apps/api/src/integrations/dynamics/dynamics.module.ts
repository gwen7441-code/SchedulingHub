import { Module } from "@nestjs/common";
import { DynamicsController } from "./dynamics.controller.js";
import { DynamicsApiClient } from "./dynamics-api.client.js";
import { DynamicsAuthService } from "./dynamics-auth.service.js";
import { DynamicsHealthService } from "./dynamics-health.service.js";
import { DynamicsMappingService } from "./dynamics-mapping.service.js";
import { DynamicsSyncService } from "./dynamics-sync.service.js";
import { DynamicsWebhookService } from "./dynamics-webhook.service.js";

@Module({
  controllers: [DynamicsController],
  providers: [
    DynamicsAuthService,
    DynamicsApiClient,
    DynamicsMappingService,
    DynamicsHealthService,
    DynamicsSyncService,
    DynamicsWebhookService
  ],
  exports: [DynamicsHealthService, DynamicsSyncService, DynamicsMappingService]
})
export class DynamicsModule {}
