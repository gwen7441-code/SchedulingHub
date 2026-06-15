import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuditModule } from "../audit/audit.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "./jwt.strategy.js";
import { TwilioVerifyService } from "./twilio-verify.service.js";

@Module({
  imports: [PassportModule, JwtModule.register({}), AuditModule, NotificationsModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TwilioVerifyService],
  exports: [AuthService]
})
export class AuthModule {}
