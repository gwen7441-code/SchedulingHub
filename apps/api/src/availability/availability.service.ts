import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import { NotificationsService } from "../notifications/notifications.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

type AvailabilityInput = {
  startsAt: string;
  endsAt: string;
  type: "AVAILABLE" | "UNAVAILABLE" | "BLOCKED";
  note?: string;
  timezone?: string;
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  async listVisible(user: { roles: string[]; instructorId?: string }) {
    const where = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN") ? { deletedAt: null } : { instructorId: user.instructorId, deletedAt: null };
    return { data: await this.prisma.availabilityBlock.findMany({ where, orderBy: { startsAt: "asc" } }) };
  }

  async create(instructorId: string, input: AvailabilityInput, actorId: string) {
    this.validateRange(input);
    await this.ensureNoDuplicate(instructorId, input.startsAt, input.endsAt);
    const auditRef = nanoid();
    const created = await this.prisma.$transaction(async (tx) => {
      const block = await tx.availabilityBlock.create({
        data: {
          instructorId,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          type: input.type,
          note: input.note,
          timezone: input.timezone ?? process.env.DEFAULT_TIMEZONE ?? "America/Toronto",
          syncState: process.env.DYNAMICS_ENABLED === "true" ? "AWAITING_INITIAL_SYNC" : "LOCAL_ONLY"
        }
      });
      await tx.availabilityChange.create({
        data: { availabilityId: block.id, instructorId, action: "created", after: block, note: input.note, auditRef }
      });
      await tx.auditLog.create({ data: { actorId, action: "AVAILABILITY_CREATED", entityType: "AvailabilityBlock", entityId: block.id, source: "mobile", after: block } });
      return block;
    });
    await this.queueAdminAvailabilityEmail("availability_added", instructorId, auditRef, created);
    return { data: created };
  }

  async update(id: string, input: AvailabilityInput, user: { id: string; instructorId?: string; roles: string[] }) {
    this.validateRange(input);
    const existing = await this.getAllowed(id, user);
    const auditRef = nanoid();
    const updated = await this.prisma.$transaction(async (tx) => {
      const block = await tx.availabilityBlock.update({
        where: { id },
        data: { startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), type: input.type, note: input.note }
      });
      await tx.availabilityChange.create({ data: { availabilityId: id, instructorId: block.instructorId, action: "updated", before: existing, after: block, auditRef } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "AVAILABILITY_CHANGED", entityType: "AvailabilityBlock", entityId: id, source: "mobile", before: existing, after: block } });
      return block;
    });
    await this.queueAdminAvailabilityEmail("availability_changed", updated.instructorId, auditRef, updated, existing);
    return { data: updated };
  }

  async remove(id: string, user: { id: string; instructorId?: string; roles: string[] }) {
    const existing = await this.getAllowed(id, user);
    const auditRef = nanoid();
    const removed = await this.prisma.$transaction(async (tx) => {
      const block = await tx.availabilityBlock.update({ where: { id }, data: { deletedAt: new Date() } });
      await tx.availabilityChange.create({ data: { availabilityId: id, instructorId: block.instructorId, action: "removed", before: existing, auditRef } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "AVAILABILITY_REMOVED", entityType: "AvailabilityBlock", entityId: id, source: "mobile", before: existing } });
      return block;
    });
    await this.queueAdminAvailabilityEmail("availability_removed", removed.instructorId, auditRef, removed, existing);
    return { data: removed };
  }

  private validateRange(input: AvailabilityInput) {
    if (new Date(input.startsAt) >= new Date(input.endsAt)) throw new BadRequestException("Start time must be before end time.");
  }

  private async ensureNoDuplicate(instructorId: string, startsAt: string, endsAt: string) {
    const overlap = await this.prisma.availabilityBlock.findFirst({
      where: {
        instructorId,
        deletedAt: null,
        startsAt: { lt: new Date(endsAt) },
        endsAt: { gt: new Date(startsAt) }
      }
    });
    if (overlap) throw new BadRequestException("Availability overlaps an existing block.");
  }

  private async getAllowed(id: string, user: { instructorId?: string; roles: string[] }) {
    const block = await this.prisma.availabilityBlock.findUnique({ where: { id } });
    if (!block) throw new NotFoundException("Availability not found.");
    if (!user.roles.includes("ADMIN") && !user.roles.includes("SUPER_ADMIN") && block.instructorId !== user.instructorId) {
      throw new ForbiddenException("You cannot change this availability.");
    }
    return block;
  }

  private async queueAdminAvailabilityEmail(template: string, instructorId: string, auditRef: string, after: unknown, before?: unknown) {
    const instructor = await this.prisma.instructorProfile.findUnique({ where: { id: instructorId }, include: { user: true } });
    const to = (process.env.ADMIN_EMAILS ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    for (const recipient of to) {
      const email = await this.prisma.emailMessage.upsert({
        where: { idempotencyKey: `${template}:${auditRef}:${recipient}` },
        create: {
          template,
          to: recipient,
          subject: `${process.env.APP_NAME ?? "Scheduler"} availability update`,
          htmlBody: `<h1>Availability update</h1><p>${instructor?.firstName} ${instructor?.lastName} (${instructor?.employeeId}) changed availability.</p><p>Audit reference: ${auditRef}</p>`,
          textBody: `Availability update for ${instructor?.firstName} ${instructor?.lastName}. Audit reference: ${auditRef}`,
          idempotencyKey: `${template}:${auditRef}:${recipient}`,
          status: "QUEUED"
        },
        update: {}
      });
      await this.notifications.queueEmail(email.id, email.idempotencyKey);
    }
  }
}
