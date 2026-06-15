import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service.js";
import { CurrentUser } from "../common/current-user.decorator.js";

@ApiTags("auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("otp/request")
  requestOtp(@Body() body: { phoneE164: string }) {
    return this.auth.requestOtp(body.phoneE164);
  }

  @Post("otp/verify")
  verifyOtp(@Body() body: { phoneE164: string; code: string; deviceId?: string }) {
    return this.auth.verifyOtp(body.phoneE164, body.code, body.deviceId);
  }

  @Post("email/login")
  emailLogin(@Body() body: { email: string; password: string; deviceId?: string }) {
    return this.auth.emailLogin(body.email, body.password, body.deviceId);
  }

  @Post("token/refresh")
  refresh(@Body() body: { refreshToken: string; deviceId?: string }) {
    return this.auth.refresh(body.refreshToken, body.deviceId);
  }

  @Post("logout")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  logout(@CurrentUser() user: { id: string }, @Body() body: { refreshToken?: string; allDevices?: boolean }) {
    return this.auth.logout(user.id, body);
  }

  @Post("password/forgot")
  forgotPassword(@Body() body: { email: string }) {
    return this.auth.forgotPassword(body.email);
  }

  @Post("password/reset")
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.auth.resetPassword(body.token, body.password);
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  me(@Req() req: { user: unknown }) {
    return { data: req.user };
  }
}
