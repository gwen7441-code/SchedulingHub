import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/current-user.decorator.js";
import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";
import { AvailabilityService } from "./availability.service.js";

@ApiTags("availability")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller({ path: "availability", version: "1" })
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get()
  list(@CurrentUser() user: { roles: string[]; instructorId?: string }) {
    return this.availability.listVisible(user);
  }

  @Post()
  create(@Body() body: Parameters<AvailabilityService["create"]>[1], @CurrentUser() user: { id: string; instructorId?: string }) {
    return this.availability.create(user.instructorId!, body, user.id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Parameters<AvailabilityService["update"]>[1], @CurrentUser() user: { id: string; instructorId?: string; roles: string[] }) {
    return this.availability.update(id, body, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string; instructorId?: string; roles: string[] }) {
    return this.availability.remove(id, user);
  }
}
