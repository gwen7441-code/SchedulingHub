import { Module } from "@nestjs/common";
import { SendGridController } from "./sendgrid.controller.js";
import { SendGridWebhookService } from "./sendgrid-webhook.service.js";

@Module({
  controllers: [SendGridController],
  providers: [SendGridWebhookService],
  exports: [SendGridWebhookService]
})
export class SendGridModule {}
