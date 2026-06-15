import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { AuditService } from "../audit/audit.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { TwilioVerifyService } from "./twilio-verify.service.js";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly twilio: TwilioVerifyService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService
  ) {}

  async requestOtp(phoneE164: string) {
    const user = await this.prisma.user.findUnique({ where: { phoneE164 } });
    if (!user || user.status === "DISABLED") {
      throw new ForbiddenException("Account is not active.");
    }
    await this.twilio.sendCode(phoneE164);
    await this.audit.record({ actorId: user.id, action: "OTP_REQUESTED", entityType: "User", entityId: user.id, source: "api" });
    return { data: { sent: true } };
  }

  async verifyOtp(phoneE164: string, code: string, deviceId?: string) {
    const ok = await this.twilio.checkCode(phoneE164, code);
    if (!ok) throw new UnauthorizedException("Invalid verification code.");
    const user = await this.prisma.user.findUnique({
      where: { phoneE164 },
      include: { roles: { include: { role: true } }, instructorProfile: true }
    });
    if (!user || user.status === "DISABLED") throw new ForbiddenException("Account is not active.");
    await this.audit.record({ actorId: user.id, action: "OTP_VERIFIED", entityType: "User", entityId: user.id, source: "api" });
    return this.issueTokens(user, deviceId);
  }

  async emailLogin(email: string, password: string, deviceId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { roles: { include: { role: true } }, instructorProfile: true }
    });
    if (!user?.passwordHash) throw new UnauthorizedException("Invalid email or password.");
    if (user.status === "DISABLED") throw new ForbiddenException("Account is disabled.");
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      await this.prisma.securityEvent.create({ data: { userId: user.id, type: "LOGIN_FAILED" } });
      throw new UnauthorizedException("Invalid email or password.");
    }
    await this.audit.record({ actorId: user.id, action: "LOGIN_SUCCESS", entityType: "User", entityId: user.id, source: "api" });
    return this.issueTokens(user, deviceId);
  }

  async refresh(refreshToken: string, deviceId?: string) {
    const tokenHash = sha256(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({ where: { tokenHash }, include: { user: { include: { roles: { include: { role: true } }, instructorProfile: true } } } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) throw new UnauthorizedException("Invalid refresh token.");
    await this.prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date(), rotatedAt: new Date() } });
    return this.issueTokens(session.user, deviceId);
  }

  async logout(userId: string, input: { refreshToken?: string; allDevices?: boolean }) {
    if (input.allDevices) {
      await this.prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    } else if (input.refreshToken) {
      await this.prisma.refreshSession.updateMany({ where: { userId, tokenHash: sha256(input.refreshToken) }, data: { revokedAt: new Date() } });
    }
    await this.audit.record({ actorId: userId, action: "LOGOUT", entityType: "User", entityId: userId, source: "api" });
    return { data: { loggedOut: true } };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return { data: { accepted: true } };
    const token = randomBytes(32).toString("base64url");
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30)
      }
    });
    const emailMessage = await this.prisma.emailMessage.create({
      data: {
        template: "password_reset",
        to: user.email!,
        subject: "Reset your password",
        htmlBody: `<p>Reset your password: <a href="${process.env.PASSWORD_RESET_URL}?token=${token}">Reset password</a></p>`,
        textBody: `Reset your password: ${process.env.PASSWORD_RESET_URL}?token=${token}`,
        idempotencyKey: `password-reset:${user.id}:${Date.now()}`
      }
    });
    await this.notifications.queueEmail(emailMessage.id, emailMessage.idempotencyKey);
    return { data: { accepted: true } };
  }

  async resetPassword(token: string, password: string) {
    if (password.length < 12) throw new BadRequestException("Password must be at least 12 characters.");
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) throw new BadRequestException("Reset token is invalid or expired.");
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await argon2.hash(password), mustChangePassword: false } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
    ]);
    return { data: { reset: true } };
  }

  private async issueTokens(user: { id: string; email: string | null; roles: { role: { name: string } }[]; instructorProfile?: { id: string } | null }, deviceId?: string) {
    const roles = user.roles.map((item) => item.role.name);
    const payload = { sub: user.id, email: user.email, roles, instructorId: user.instructorProfile?.id };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRY ?? "15m"
    });
    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        deviceId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });
    return { data: { accessToken, refreshToken, user: payload } };
  }
}
