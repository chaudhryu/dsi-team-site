// mail.controller.ts
import { Controller, Get, Query } from "@nestjs/common";
import { MailService } from "../services/mail.service";

@Controller("mail")
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Get("test")
  async test(@Query("to") to: string) {
    await this.mail.sendTestEmail(to);
    return { ok: true };
  }
}
