import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

function getVaultKey(): Buffer {
  const secret =
    process.env.CREDENTIAL_VAULT_KEY ??
    process.env.JWT_SECRET ??
    "empire-dev-vault-key-not-for-production";
  return scryptSync(secret, "empire-canva-oauth-v1", 32);
}

export function encryptCanvaSecret(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", getVaultKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptCanvaSecret(ciphertext: string): string {
  const buffer = Buffer.from(ciphertext, "base64");
  const iv = buffer.subarray(0, 16);
  const tag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);
  const decipher = createDecipheriv("aes-256-gcm", getVaultKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
