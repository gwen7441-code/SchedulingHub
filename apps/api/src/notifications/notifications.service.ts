import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("push") private readonly pushQueue: Queue,
    @InjectQueue("email") private readonly emailQueue: Queue
  ) {}

  async queueAssignmentNotification(input: { userId: string; assignmentId: string; title: string; body: string; deepLink: string }) {
    const idempotencyKey = `assignment:${input.assignmentId}:new`;
    const notification = await this.prisma.notification.upsert({
      where: { idempotencyKey },
      create: {
        userId: input.userId,
        type: "assignment_new",
        title: input.title,
        body: input.body,
        deepLink: input.deepLink,
        idempotencyKey
      },
      update: {}
    });
    await this.pushQueue.add("send-push", { notificationId: notification.id }, { jobId: idempotencyKey, attempts: 5, backoff: { type: "exponential", delay: 30_000 } });
    return notification;
  }

  async queueEmail(emailId: string, idempotencyKey: string) {
    await this.emailQueue.add("send-email", { emailId }, { jobId: idempotencyKey, attempts: 5, backoff: { type: "exponential", delay: 30_000 } });
  }

  async listForUser(userId: string) {
    return { data: await this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }) };
  }

  async listAll() {
    return {
      data: await this.prisma.notification.findMany({
        include: { deliveries: true },
        orderBy: { createdAt: "desc" },
        take: 200
      })
    };
  }

  async emailHistory() {
    return {
      data: await this.prisma.emailMessage.findMany({
        include: { events: true },
        orderBy: { createdAt: "desc" },
        take: 200
      })
    };
  }
}
