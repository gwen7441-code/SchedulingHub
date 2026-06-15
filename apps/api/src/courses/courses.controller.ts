import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/current-user.decorator.js";
import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";
import { CoursesService } from "./courses.service.js";

@ApiTags("courses")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller({ path: "courses", version: "1" })
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  list(@CurrentUser() user: { roles: string[]; instructorId?: string }) {
    return this.courses.listVisible(user);
  }

  @Get(":id")
  get(@Param("id") id: string, @CurrentUser() user: { roles: string[]; instructorId?: string }) {
    return this.courses.getVisible(id, user);
  }

  @Post()
  @Roles("ADMIN", "SUPER_ADMIN")
  create(@Body() body: Parameters<CoursesService["create"]>[0]) {
    return this.courses.create(body);
  }
}
