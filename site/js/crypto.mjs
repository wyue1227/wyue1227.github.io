export const FORMAT = "diet-vault-v1";
const bytes = (value) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
export async function decryptEnvelope(envelope, passphrase) {
  if (!globalThis.crypto?.subtle)
    throw new Error(
      "这个浏览器不支持安全解密，请通过 HTTPS 或本地 localhost 使用较新的浏览器。",
    );
  if (
    envelope?.format !== FORMAT ||
    envelope.kdf?.name !== "PBKDF2" ||
    envelope.kdf.hash !== "SHA-256" ||
    envelope.cipher?.name !== "AES-GCM" ||
    envelope.kdf.iterations !== 600000
  )
    throw new Error("加密文件格式不受支持。");
  const salt = bytes(envelope.kdf.salt),
    iv = bytes(envelope.cipher.iv),
    payload = bytes(envelope.ciphertext);
  if (salt.length !== 16 || iv.length !== 12 || payload.length < 16)
    throw new Error("加密文件不完整。");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000 },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, payload);
  } catch {
    throw new Error("口令不正确，或加密文件已损坏。");
  }
  return JSON.parse(new TextDecoder().decode(plain));
}
