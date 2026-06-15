import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/current-user.decorator.js";
import { Roles } from "../common/roles.decorator.js";
import { RolesGuard } from "../common/roles.guard.js";
import { AssignmentsService } from "./assignments.service.js";

@ApiTags("assignments")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller({ path: "assignments", version: "1" })
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  list(@CurrentUser() user: { roles: string[]; instructorId?: string }) {
    return this.assignments.listVisible(user);
  }

  @Post()
  @Roles("ADMIN", "SUPER_ADMIN")
  assign(@Body() body: { courseId: string; instructorId: string }, @CurrentUser() user: { id: string }) {
    return this.assignments.assignInstructor(body.courseId, body.instructorId, user.id);
  }

  @Post(":id/respond")
  respond(@Param("id") id: string, @Body() body: { status: "ACCEPTED" | "DECLINED"; declineReason?: string }, @CurrentUser() user: { id: string; instructorId?: string; roles: string[] }) {
    return this.assignments.respond(id, body, user);
  }
}
