import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/current-user.decorator.js";
import { DevicesService } from "./devices.service.js";

@ApiTags("devices")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller({ path: "devices", version: "1" })
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.devices.list(user.id);
  }

  @Post()
  register(
    @CurrentUser() user: { id: string },
    @Body() body: { platform: string; label?: string; expoPushToken?: string }
  ) {
    return this.devices.register(user.id, body);
  }

  @Post(":id/push-token")
  savePushToken(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() body: { expoPushToken: string }) {
    return this.devices.savePushToken(user.id, id, body.expoPushToken);
  }

  @Delete(":id")
  revoke(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.devices.revoke(user.id, id);
  }
}
