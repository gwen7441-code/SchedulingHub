import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { CoursesController } from "./courses.controller.js";
import { CoursesService } from "./courses.service.js";

@Module({
  imports: [AuditModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService]
})
export class CoursesModule {}
