import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/roles.decorator.js";
import { RolesGuard } from "../../common/roles.guard.js";
import { IntegrationSetupService } from "./integration-setup.service.js";

@ApiTags("integration setup")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
@Controller({ path: "integrations/setup", version: "1" })
export class IntegrationSetupController {
  constructor(private readonly setup: IntegrationSetupService) {}

  @Get("status")
  status() {
    return this.setup.status();
  }

  @Post("validate")
  validate() {
    return this.setup.validate();
  }
}
