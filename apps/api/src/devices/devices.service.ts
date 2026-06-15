import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(userId: string) {
    const devices = await this.prisma.device.findMany({
      where: { userId, revokedAt: null },
      include: { pushTokens: { where: { enabled: true, invalidAt: null } } },
      orderBy: { createdAt: "desc" }
    });
    return { data: devices };
  }

  async register(userId: string, input: { platform: string; label?: string; expoPushToken?: string }) {
    const device = await this.prisma.device.create({
      data: {
        userId,
        platform: input.platform,
        label: input.label,
        lastSeenAt: new Date(),
        pushTokens: input.expoPushToken
          ? {
              create: {
                expoToken: input.expoPushToken
              }
            }
          : undefined
      },
      include: { pushTokens: true }
    });
    await this.audit.record({
      actorId: userId,
      action: "DEVICE_REGISTERED",
      entityType: "Device",
      entityId: device.id,
      source: "mobile",
      after: { platform: input.platform, hasPushToken: Boolean(input.expoPushToken) }
    });
    return { data: device };
  }

  async savePushToken(userId: string, deviceId: string, expoPushToken: string) {
    await this.ensureDeviceOwner(userId, deviceId);
    const token = await this.prisma.pushToken.upsert({
      where: { expoToken: expoPushToken },
      create: { deviceId, expoToken: expoPushToken },
      update: { deviceId, enabled: true, invalidAt: null }
    });
    await this.audit.record({
      actorId: userId,
      action: "PUSH_TOKEN_REGISTERED",
      entityType: "PushToken",
      entityId: token.id,
      source: "mobile",
      after: { deviceId }
    });
    return { data: token };
  }

  async revoke(userId: string, deviceId: string) {
    await this.ensureDeviceOwner(userId, deviceId);
    const device = await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        revokedAt: new Date(),
        pushTokens: {
          updateMany: {
            where: { invalidAt: null },
            data: { enabled: false, invalidAt: new Date() }
          }
        }
      }
    });
    await this.audit.record({
      actorId: userId,
      action: "DEVICE_REVOKED",
      entityType: "Device",
      entityId: device.id,
      source: "mobile"
    });
    return { data: device };
  }

  private async ensureDeviceOwner(userId: string, deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException("Device not found.");
    if (device.userId !== userId) throw new ForbiddenException("You cannot manage this device.");
    return device;
  }
}
