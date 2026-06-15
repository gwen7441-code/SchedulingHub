import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

type AuditInput = {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  requestId?: string;
  source: string;
  before?: unknown;
  after?: unknown;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        requestId: input.requestId,
        source: input.source,
        before: input.before as object | undefined,
        after: input.after as object | undefined
      }
    });
  }

  async listRecent() {
    return {
      data: await this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 250
      })
    };
  }
}
