// mail.controller.ts
import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { MailService } from "../services/mail.service";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";
class SendMailDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  to: string[]; // ["a@x.com", "b@y.com"]
  @IsString() @IsNotEmpty() subject: string;
  @IsString() @IsNotEmpty() body: string;
}
@Controller("mail")
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Get("test")
  async test(@Query("to") to: string) {
    await this.mail.sendTestEmail(to);
    return { ok: true };
  }
  @Post("send")
  async sendHtmlEmail(@Body() dto: SendMailDto): Promise<{ ok: true }> {
    console.log("MailController.sendHtmlEmail", dto);
    await this.mail.sendHtmlEmail({
      to: dto.to,
      subject: dto.subject,
      html: dto.body,
      // optionally also generate html on server
    });
    return { ok: true };
  }
}
