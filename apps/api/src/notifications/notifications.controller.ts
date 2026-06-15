import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/current-user.decorator.js";
import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";
import { NotificationsService } from "./notifications.service.js";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.notifications.listForUser(user.id);
  }

  @Get("admin/all")
  @Roles("ADMIN", "SUPER_ADMIN")
  listAll() {
    return this.notifications.listAll();
  }

  @Get("admin/email-history")
  @Roles("ADMIN", "SUPER_ADMIN")
  emailHistory() {
    return this.notifications.emailHistory();
  }
}
