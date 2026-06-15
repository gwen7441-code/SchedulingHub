import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";
import { AuditService } from "./audit.service.js";

@ApiTags("audit")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller({ path: "audit", version: "1" })
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles("ADMIN", "SUPER_ADMIN")
  list() {
    return this.audit.listRecent();
  }
}
