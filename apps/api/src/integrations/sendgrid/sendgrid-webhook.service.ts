import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createPublicKey, verify } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service.js";

type SendGridEvent = {
  email?: string;
  event?: string;
  sg_event_id?: string;
  sg_message_id?: string;
  timestamp?: number;
  reason?: string;
};

@Injectable()
export class SendGridWebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async receive(headers: Record<string, string>, body: unknown) {
    this.verifySignature(headers, body);
    const events = Array.isArray(body) ? (body as SendGridEvent[]) : [body as SendGridEvent];
    const stored = [];

    for (const event of events) {
      const message = event.sg_message_id
        ? await this.prisma.emailMessage.findFirst({ where: { providerId: { startsWith: event.sg_message_id } } })
        : null;
      stored.push(
        await this.prisma.emailDeliveryEvent.create({
          data: {
            emailId: message?.id,
            providerEventId: event.sg_event_id,
            event: event.event ?? "unknown",
            payload: {
              messageId: event.sg_message_id,
              timestamp: event.timestamp,
              reason: event.reason
            }
          }
        })
      );
      if (message && ["bounce", "dropped", "deferred"].includes(event.event ?? "")) {
        await this.prisma.emailMessage.update({
          where: { id: message.id },
          data: { status: event.event!.toUpperCase() }
        });
      }
    }

    return { data: { accepted: true, events: stored.length } };
  }

  private verifySignature(headers: Record<string, string>, body: unknown) {
    const publicKey = process.env.SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY;
    if (!publicKey) return;

    const signature = headers["x-twilio-email-event-webhook-signature"];
    const timestamp = headers["x-twilio-email-event-webhook-timestamp"];
    if (!signature || !timestamp) throw new UnauthorizedException("Missing SendGrid webhook signature.");

    const payload = timestamp + JSON.stringify(body);
    const ok = verify("sha256", Buffer.from(payload), createPublicKey(publicKey), Buffer.from(signature, "base64"));
    if (!ok) throw new UnauthorizedException("Invalid SendGrid webhook signature.");
  }
}
