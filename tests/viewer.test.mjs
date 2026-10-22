import test from "node:test";
import assert from "node:assert/strict";
import { pbkdf2Sync, randomBytes, createCipheriv } from "node:crypto";
import { decryptEnvelope } from "../site/js/crypto.mjs";
import { summarize, energyText } from "../site/js/model.mjs";

test("viewer decrypts the producer envelope format without credentials or a network call", async () => {
  const pass = "fictional-test-passphrase-only", salt = randomBytes(16), iv = randomBytes(12);
  const key = pbkdf2Sync(pass, salt, 600000, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const expected = { schema: 1, text: "虚构测试🍚" };
  const payload = Buffer.concat([cipher.update(JSON.stringify(expected)), cipher.final(), cipher.getAuthTag()]);
  key.fill(0);
  const envelope = {
    format: "diet-vault-v1",
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: 600000, salt: salt.toString("base64") },
    cipher: { name: "AES-GCM", iv: iv.toString("base64") }, ciphertext: payload.toString("base64"),
  };
  assert.deepEqual(await decryptEnvelope(envelope, pass), expected);
  await assert.rejects(decryptEnvelope(envelope, "wrong-passphrase"), /口令/);
  const corrupted = structuredClone(envelope);
  payload[0] ^= 1;
  corrupted.ciphertext = payload.toString("base64");
  await assert.rejects(decryptEnvelope(corrupted, pass), /口令/);
});

test("viewer rounds interval midpoints but retains unknowns and explicit zero", () => {
  assert.equal(energyText(summarize([{ kcal_low: 1958, kcal_high: 2318 }])), "约 2,138 kcal");
  const sum = summarize([{ kcal_low: 1641.8, kcal_high: 1736.8 }, { kcal_value: null }]);
  assert.equal(energyText(sum, false), "约 1,689");
  assert.equal(sum.unknown, 1);
  assert.equal(energyText(summarize([{ kcal_value: 0 }])), "0 kcal");
  assert.equal(energyText(summarize([{ kcal_value: null }])), "—");
});
