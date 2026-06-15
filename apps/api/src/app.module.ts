import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuditModule } from "./audit/audit.module.js";
import { AssignmentsModule } from "./assignments/assignments.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { AvailabilityModule } from "./availability/availability.module.js";
import { CoursesModule } from "./courses/courses.module.js";
import { DevicesModule } from "./devices/devices.module.js";
import { HealthModule } from "./health/health.module.js";
import { DynamicsModule } from "./integrations/dynamics/dynamics.module.js";
import { IntegrationSetupModule } from "./integrations/setup/integration-setup.module.js";
import { SendGridModule } from "./integrations/sendgrid/sendgrid.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL
      }
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    DevicesModule,
    AssignmentsModule,
    AvailabilityModule,
    NotificationsModule,
    DynamicsModule,
    SendGridModule,
    IntegrationSetupModule,
    HealthModule
  ]
})
export class AppModule {}
