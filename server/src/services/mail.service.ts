// mail.service.ts
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { htmlToText } from "html-to-text";

function toPlainText(html: string) {
  return htmlToText(html, {
    wordwrap: 120,
    selectors: [
      // Make links readable in plain text: "Label (url)"
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
    ],
    // Keeps line breaks more natural
    preserveNewlines: true,
  });
}
@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendTestEmail(to: string) {
    await this.mailer.sendMail({
      to,
      subject: "Test email from DSI",
      text: toPlainText(
        "<p><strong>Hello! This email was sent from DSI</strong>.</p>"
      ),
      html: `<p><strong>Hello! This email was sent from DSI</strong>.</p>`,
    });
  }
  async sendHtmlEmail(opts: { to: string[]; subject: string; html: string }) {
    const text = toPlainText(opts.html);

    await this.mailer.sendMail({
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text, // auto-generated
    });
  }
}
