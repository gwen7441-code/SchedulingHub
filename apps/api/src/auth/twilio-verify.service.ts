import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import twilio from "twilio";

@Injectable()
export class TwilioVerifyService {
  private get configured() {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
  }

  async sendCode(phoneE164: string) {
    if (!this.configured) throw new ServiceUnavailableException("Twilio Verify is not configured.");
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!).verifications.create({
      to: phoneE164,
      channel: "sms"
    });
  }

  async checkCode(phoneE164: string, code: string) {
    if (!this.configured) throw new ServiceUnavailableException("Twilio Verify is not configured.");
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const result = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!).verificationChecks.create({
      to: phoneE164,
      code
    });
    return result.status === "approved";
  }
}
