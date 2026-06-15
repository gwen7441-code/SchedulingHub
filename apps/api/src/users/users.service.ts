import { Injectable } from "@nestjs/common";
import { RoleName, UserStatus } from "@prisma/client";
import argon2 from "argon2";
import { AuditService } from "../audit/audit.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

type CreateInstructorInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  employeeId: string;
  status?: UserStatus;
  qualificationCodes?: string[];
  temporaryPassword?: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService
  ) {}

  async listInstructors() {
    const instructors = await this.prisma.instructorProfile.findMany({
      include: { user: true, qualifications: { include: { qualification: true } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    });
    return { data: instructors };
  }

  async createInstructor(input: CreateInstructorInput) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: RoleName.INSTRUCTOR } });
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        phoneE164: input.phoneE164,
        status: input.status ?? "ACTIVE",
        passwordHash: input.temporaryPassword ? await argon2.hash(input.temporaryPassword) : undefined,
        mustChangePassword: Boolean(input.temporaryPassword),
        roles: { create: { roleId: role.id } },
        instructorProfile: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            employeeId: input.employeeId,
            status: input.status ?? "ACTIVE",
            syncState: "AWAITING_INITIAL_SYNC"
          }
        }
      },
      include: { instructorProfile: true }
    });

    if (input.qualificationCodes?.length && user.instructorProfile) {
      for (const code of input.qualificationCodes) {
        const qualification = await this.prisma.qualification.upsert({
          where: { code },
          create: { code, name: code },
          update: {}
        });
        await this.prisma.instructorQualification.create({
          data: { instructorId: user.instructorProfile.id, qualificationId: qualification.id }
        });
      }
    }

    await this.audit.record({
      actorId: undefined,
      action: "INSTRUCTOR_CREATED",
      entityType: "InstructorProfile",
      entityId: user.instructorProfile?.id,
      source: "api",
      after: { email: user.email, phoneE164: user.phoneE164 }
    });

    if (user.email) {
      const emailMessage = await this.prisma.emailMessage.create({
        data: {
          template: "instructor_invitation",
          to: user.email,
          subject: "Your instructor account is ready",
          htmlBody: `<p>Your account for ${process.env.APP_NAME ?? "First Aid Instructor Scheduler"} is ready. Use your phone number to request a one-time sign-in code.</p>`,
          textBody: "Your instructor account is ready. Use your phone number to request a one-time sign-in code.",
          idempotencyKey: `invite:${user.id}`
        }
      });
      await this.notifications.queueEmail(emailMessage.id, emailMessage.idempotencyKey);
    }

    return { data: user };
  }

  async setInstructorStatus(instructorId: string, status: UserStatus) {
    const profile = await this.prisma.instructorProfile.update({
      where: { id: instructorId },
      data: { status, user: { update: { status } } }
    });
    await this.audit.record({ action: "INSTRUCTOR_STATUS_CHANGED", entityType: "InstructorProfile", entityId: instructorId, source: "api", after: { status } });
    return { data: profile };
  }
}
