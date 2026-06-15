import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";
import { UsersService } from "./users.service.js";

@ApiTags("instructors")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller({ path: "instructors", version: "1" })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles("ADMIN", "SUPER_ADMIN")
  list() {
    return this.users.listInstructors();
  }

  @Post()
  @Roles("ADMIN", "SUPER_ADMIN")
  create(@Body() body: Parameters<UsersService["createInstructor"]>[0]) {
    return this.users.createInstructor(body);
  }

  @Patch(":id/disable")
  @Roles("ADMIN", "SUPER_ADMIN")
  disable(@Param("id") id: string) {
    return this.users.setInstructorStatus(id, "DISABLED");
  }

  @Patch(":id/reactivate")
  @Roles("ADMIN", "SUPER_ADMIN")
  reactivate(@Param("id") id: string) {
    return this.users.setInstructorStatus(id, "ACTIVE");
  }
}
