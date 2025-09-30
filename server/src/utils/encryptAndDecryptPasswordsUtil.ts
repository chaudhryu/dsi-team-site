import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY = process.env.KEY;

export function encrypt(text: string) {
  const IV = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, IV);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    iv: IV.toString("hex"),
    content: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt(encrypted: any) {
  const decipher = crypto.createDecipheriv(
    ALGO,
    KEY,
    Buffer.from(encrypted.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.content, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
