import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export interface EncryptedSecretPayload {
  version: 1;
  iv: string;
  ciphertext: string;
  authTag: string;
}

function credentialsSecret() {
  const secret =
    process.env.AI_CREDENTIALS_SECRET?.trim() ||
    process.env.STUDIO_SESSION_SECRET?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "endless-ai-dev-secret";
  if (!secret) {
    throw new Error("AI_CREDENTIALS_SECRET is required for AI credential storage.");
  }
  return secret;
}

function encryptionKey() {
  return createHash("sha256").update(credentialsSecret()).digest();
}

export function encryptSecret(value: string): EncryptedSecretPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    version: 1,
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    authTag: authTag.toString("base64")
  };
}

export function decryptSecret(payload: EncryptedSecretPayload): string {
  if (payload.version !== 1) {
    throw new Error("Unsupported encrypted secret payload version.");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final()
  ]);
  return plaintext.toString("utf8");
}
