import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/roles.decorator.js";
import { RolesGuard } from "../../common/roles.guard.js";
import { DynamicsHealthService } from "./dynamics-health.service.js";
import { DynamicsSyncService } from "./dynamics-sync.service.js";
import { DynamicsWebhookService } from "./dynamics-webhook.service.js";

@ApiTags("dynamics")
@Controller({ path: "integrations/dynamics", version: "1" })
export class DynamicsController {
  constructor(
    private readonly health: DynamicsHealthService,
    private readonly sync: DynamicsSyncService,
    private readonly webhook: DynamicsWebhookService
  ) {}

  @Get("health")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiBearerAuth()
  status() {
    return this.health.validate();
  }

  @Post("sync")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiBearerAuth()
  syncAll() {
    return this.sync.sync("all");
  }

  @Post("webhook")
  receiveWebhook(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    return this.webhook.receive(headers, body);
  }
}
