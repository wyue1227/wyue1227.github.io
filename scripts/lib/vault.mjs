import {
  pbkdf2Sync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from "node:crypto";
export const FORMAT = "diet-vault-v1";
export function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export function encrypt(value, passphrase) {
  if (typeof passphrase !== "string" || passphrase.length < 16)
    throw new Error("分享口令至少16个字符，请使用独立的随机长口令。");
  const salt = randomBytes(16),
    iv = randomBytes(12),
    key = pbkdf2Sync(passphrase, salt, 600000, 32, "sha256");
  try {
    const cipher = createCipheriv("aes-256-gcm", key, iv),
      body = Buffer.concat([
        cipher.update(canonical(value), "utf8"),
        cipher.final(),
        cipher.getAuthTag(),
      ]);
    return {
      format: FORMAT,
      kdf: {
        name: "PBKDF2",
        hash: "SHA-256",
        iterations: 600000,
        salt: salt.toString("base64"),
      },
      cipher: { name: "AES-GCM", iv: iv.toString("base64") },
      ciphertext: body.toString("base64"),
    };
  } finally {
    key.fill(0);
  }
}
export function decrypt(envelope, passphrase) {
  if (
    envelope?.format !== FORMAT ||
    envelope.kdf?.name !== "PBKDF2" ||
    envelope.kdf.hash !== "SHA-256" ||
    envelope.kdf.iterations !== 600000 ||
    envelope.cipher?.name !== "AES-GCM"
  )
    throw new Error("Previous snapshot format is invalid");
  const salt = Buffer.from(envelope.kdf.salt, "base64"),
    iv = Buffer.from(envelope.cipher.iv, "base64"),
    body = Buffer.from(envelope.ciphertext, "base64");
  if (salt.length !== 16 || iv.length !== 12 || body.length < 16)
    throw new Error("Previous snapshot is incomplete");
  const key = pbkdf2Sync(passphrase, salt, 600000, 32, "sha256");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(body.subarray(-16));
    return JSON.parse(
      Buffer.concat([
        decipher.update(body.subarray(0, -16)),
        decipher.final(),
      ]).toString("utf8"),
    );
  } catch {
    throw new Error(
      "Previous snapshot cannot be decrypted; do not overwrite it. Check the passphrase.",
    );
  } finally {
    key.fill(0);
  }
}
