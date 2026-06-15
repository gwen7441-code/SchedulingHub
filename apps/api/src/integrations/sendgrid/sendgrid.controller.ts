import { Body, Controller, Headers, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SendGridWebhookService } from "./sendgrid-webhook.service.js";

@ApiTags("sendgrid")
@Controller({ path: "integrations/sendgrid", version: "1" })
export class SendGridController {
  constructor(private readonly webhook: SendGridWebhookService) {}

  @Post("events")
  receive(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    return this.webhook.receive(headers, body);
  }
}
