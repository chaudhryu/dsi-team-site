// mail.module.ts
import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailService } from "../services/mail.service";

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        transport: {
          host: cfg.get<string>("SMTP_HOST"),
          port: Number(cfg.get<string>("SMTP_PORT") ?? 587),
          secure: false, // true only for 465
          // auth: {
          //   user: cfg.get<string>("SMTP_USER"),
          //   pass: cfg.get<string>("SMTP_PASS"),
          // },
          tls: {
            // Many org relays use internal certs; keep this ON unless you get CA issues
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: cfg.get<string>("SMTP_FROM") ?? cfg.get<string>("SMTP_USER"),
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
