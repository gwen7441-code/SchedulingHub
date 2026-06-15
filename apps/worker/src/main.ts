import { PrismaClient } from "@prisma/client";
import sendgrid from "@sendgrid/mail";
import { Expo } from "expo-server-sdk";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const log = pino({ level: process.env.LOG_LEVEL ?? "info", redact: ["*.token", "*.apiKey"] });
const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

new Worker(
  "email",
  async (job) => {
    const { emailId } = job.data as { emailId: string };
    const email = await prisma.emailMessage.findUniqueOrThrow({ where: { id: emailId } });
    if (!process.env.SENDGRID_API_KEY) {
      await prisma.emailMessage.update({ where: { id: emailId }, data: { status: "FAILED" } });
      throw new Error("SendGrid is not configured.");
    }
    const [result] = await sendgrid.send({
      to: email.to,
      from: { email: process.env.SENDGRID_FROM_EMAIL!, name: process.env.SENDGRID_FROM_NAME },
      subject: email.subject,
      html: email.htmlBody,
      text: email.textBody
    });
    await prisma.emailMessage.update({
      where: { id: emailId },
      data: { status: "SENT", sentAt: new Date(), providerId: result.headers["x-message-id"] as string | undefined }
    });
  },
  { connection }
);

new Worker(
  "push",
  async (job) => {
    const { notificationId } = job.data as { notificationId: string };
    const notification = await prisma.notification.findUniqueOrThrow({ where: { id: notificationId } });
    const tokens = await prisma.pushToken.findMany({
      where: { enabled: true, invalidAt: null, device: { userId: notification.userId, revokedAt: null } }
    });
    const messages = tokens
      .filter((token) => Expo.isExpoPushToken(token.expoToken))
      .map((token) => ({
        to: token.expoToken,
        title: notification.title,
        body: notification.body,
        data: { deepLink: notification.deepLink, notificationId }
      }));
    for (const chunk of expo.chunkPushNotifications(messages)) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      await Promise.all(
        tickets.map((ticket, index) =>
          prisma.notificationDelivery.create({
            data: {
              notificationId,
              pushTokenId: tokens[index]?.id,
              status: ticket.status,
              providerId: "id" in ticket ? ticket.id : undefined,
              error: "message" in ticket ? ticket.message : undefined,
              deliveredAt: ticket.status === "ok" ? new Date() : undefined
            }
          })
        )
      );
    }
  },
  { connection }
);

log.info("worker started");
