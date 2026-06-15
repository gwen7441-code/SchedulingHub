import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService
  ) {}

  async listVisible(user: { roles: string[]; instructorId?: string }) {
    const where = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN") ? {} : { instructorId: user.instructorId };
    return { data: await this.prisma.assignment.findMany({ where, include: { course: true, instructor: true }, orderBy: { createdAt: "desc" } }) };
  }

  async assignInstructor(courseId: string, instructorId: string, adminUserId: string) {
    const assignment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          courseId,
          instructorId,
          assignedByUserId: adminUserId,
          syncState: process.env.DYNAMICS_ENABLED === "true" ? "AWAITING_INITIAL_SYNC" : "LOCAL_ONLY"
        },
        include: { course: true, instructor: { include: { user: true } } }
      });
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "ASSIGNMENT_CREATED",
          entityType: "Assignment",
          entityId: created.id,
          source: "api",
          after: { courseId, instructorId }
        }
      });
      return created;
    });

    await this.notifications.queueAssignmentNotification({
      userId: assignment.instructor.userId,
      assignmentId: assignment.id,
      title: "New course assignment",
      body: `${assignment.course.title} on ${assignment.course.startsAt.toISOString()}`,
      deepLink: `${process.env.MOBILE_DEEP_LINK_SCHEME ?? "firstaidscheduler"}://assignments/${assignment.id}`
    });
    await this.prisma.assignment.update({ where: { id: assignment.id }, data: { notificationSentAt: new Date() } });
    return { data: assignment };
  }

  async respond(id: string, input: { status: "ACCEPTED" | "DECLINED"; declineReason?: string }, user: { id: string; instructorId?: string; roles: string[] }) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id }, include: { instructor: true } });
    if (!assignment) throw new NotFoundException("Assignment not found.");
    if (!user.roles.includes("ADMIN") && !user.roles.includes("SUPER_ADMIN") && assignment.instructorId !== user.instructorId) {
      throw new ForbiddenException("You cannot respond to this assignment.");
    }
    if (assignment.status !== "PENDING") throw new ConflictException("Assignment has already been responded to.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.assignment.update({
        where: { id },
        data: {
          status: input.status,
          declineReason: input.status === "DECLINED" ? input.declineReason : null,
          respondedAt: new Date(),
          syncState: process.env.DYNAMICS_ENABLED === "true" ? "AWAITING_INITIAL_SYNC" : "LOCAL_ONLY",
          responses: { create: { status: input.status, reason: input.declineReason } }
        }
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: input.status === "ACCEPTED" ? "ASSIGNMENT_ACCEPTED" : "ASSIGNMENT_DECLINED",
          entityType: "Assignment",
          entityId: id,
          source: "mobile",
          after: { status: input.status, declineReason: input.declineReason }
        }
      });
      return changed;
    });
    return { data: updated };
  }
}
