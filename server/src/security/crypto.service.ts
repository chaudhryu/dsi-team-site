import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

@Injectable()
export class CryptoService {
  private readonly key: Buffer;
  private static readonly PREFIX = "gcm:"; // to flag encrypted values

  constructor(config: ConfigService) {
    const b64 = config.get<string>("DATA_CRED_KEY");
    if (!b64) throw new Error("DATA_CRED_KEY is required (base64-encoded 32 bytes)");
    const key = Buffer.from(b64, "base64");
    if (key.length !== 32) throw new Error("DATA_CRED_KEY must decode to 32 bytes");
    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const packed = Buffer.concat([iv, tag, ciphertext]).toString("base64");
    return CryptoService.PREFIX + packed;
  }

  isEncrypted(maybe: string | undefined | null): boolean {
    return !!maybe && maybe.startsWith(CryptoService.PREFIX);
  }

  decrypt(value: string): string {
    if (!this.isEncrypted(value)) {
      // legacy plaintext support; return as-is
      return value;
    }
    const b64 = value.slice(CryptoService.PREFIX.length);
    const buf = Buffer.from(b64, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  }
}
