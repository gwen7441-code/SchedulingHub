import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listVisible(user: { roles: string[]; instructorId?: string }) {
    const where = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN")
      ? {}
      : { assignments: { some: { instructorId: user.instructorId } } };
    return { data: await this.prisma.course.findMany({ where, include: { assignments: true }, orderBy: { startsAt: "asc" } }) };
  }

  async getVisible(id: string, user: { roles: string[]; instructorId?: string }) {
    const course = await this.prisma.course.findUnique({ where: { id }, include: { assignments: true } });
    if (!course) throw new NotFoundException("Course not found.");
    if (!user.roles.includes("ADMIN") && !user.roles.includes("SUPER_ADMIN")) {
      const assigned = course.assignments.some((assignment) => assignment.instructorId === user.instructorId);
      if (!assigned) throw new ForbiddenException("You cannot view this course.");
    }
    return { data: course };
  }

  async create(input: {
    referenceNumber: string;
    title: string;
    certificationType: string;
    startsAt: string;
    endsAt: string;
    timezone?: string;
    locationName?: string;
    address?: string;
    deliveryType?: "IN_PERSON" | "VIRTUAL" | "HYBRID";
    maximumAttendance?: number;
  }) {
    const course = await this.prisma.course.create({
      data: {
        referenceNumber: input.referenceNumber,
        title: input.title,
        certificationType: input.certificationType,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        timezone: input.timezone ?? process.env.DEFAULT_TIMEZONE ?? "America/Toronto",
        locationName: input.locationName,
        address: input.address,
        deliveryType: input.deliveryType ?? "IN_PERSON",
        maximumAttendance: input.maximumAttendance,
        syncState: process.env.DYNAMICS_ENABLED === "true" ? "AWAITING_INITIAL_SYNC" : "LOCAL_ONLY"
      }
    });
    await this.audit.record({ action: "COURSE_CREATED", entityType: "Course", entityId: course.id, source: "api", after: course });
    return { data: course };
  }
}
