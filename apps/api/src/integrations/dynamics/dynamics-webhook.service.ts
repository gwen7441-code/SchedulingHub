import { ForbiddenException, Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class DynamicsWebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async receive(headers: Record<string, string>, body: unknown) {
    this.verifySharedSecret(headers, body);
    const eventId = headers["x-dynamics-event-id"] ?? headers["x-ms-client-tracking-id"] ?? createHmac("sha256", "event").update(JSON.stringify(body)).digest("hex");
    const eventType = headers["x-dynamics-event-type"] ?? "unknown";
    const event = await this.prisma.webhookEvent.upsert({
      where: { service_eventId: { service: "DYNAMICS", eventId } },
      create: { service: "DYNAMICS", eventId, eventType, payloadSummary: this.summarize(body), status: "RECEIVED" },
      update: {}
    });
    return { data: { accepted: true, eventId: event.id } };
  }

  private verifySharedSecret(headers: Record<string, string>, body: unknown) {
    const secret = process.env.DYNAMICS_WEBHOOK_SECRET;
    if (!secret) throw new ForbiddenException("Dynamics webhook secret is not configured.");
    const signature = headers["x-first-aid-signature"];
    if (!signature) throw new ForbiddenException("Missing webhook signature.");
    const expected = createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex");
    const received = Buffer.from(signature);
    const calculated = Buffer.from(expected);
    if (received.length !== calculated.length || !timingSafeEqual(received, calculated)) {
      throw new ForbiddenException("Invalid webhook signature.");
    }
  }

  private summarize(body: unknown) {
    if (!body || typeof body !== "object") return {};
    const value = body as Record<string, unknown>;
    return {
      id: value.id,
      entity: value.entity,
      operation: value.operation,
      modifiedOn: value.modifiedOn
    };
  }
}
