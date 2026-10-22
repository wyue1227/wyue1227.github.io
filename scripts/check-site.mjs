import { readFile, readdir } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const root = resolve(process.argv[2] || "site");
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), "No symlinks in publish artifact");
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}
const files = await walk(root),
  html = await readFile(join(root, "index.html"), "utf8");
assert.ok(html.includes("connect-src 'self'"));
assert.ok(html.includes("虚构示例"));
for (const file of files) {
  if (
    ![".html", ".css", ".js", ".mjs", ".json", ".webmanifest", ".svg"].includes(
      extname(file),
    )
  )
    continue;
  const text = await readFile(file, "utf8");
  assert.ok(
    !/(?:github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{25,}|sb_secret_[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{30,}\.)/.test(
      text,
    ),
    "Potential credential in " + file,
  );
  if (file.includes("/data/")) {
    assert.match(file.slice(join(root, "data").length + 1), /^(vault|m-[a-f0-9]{32})\.json$/);
    const envelope = JSON.parse(text);
    const keys = (value, expected) => assert.deepEqual(Object.keys(value || {}).sort(), expected.split(",").sort());
    keys(envelope, "format,kdf,cipher,ciphertext");
    keys(envelope.kdf, "name,hash,iterations,salt");
    keys(envelope.cipher, "name,iv");
    assert.equal(envelope.format, "diet-vault-v1");
    assert.equal(envelope.kdf.name, "PBKDF2");
    assert.equal(envelope.kdf.hash, "SHA-256");
    assert.equal(envelope.kdf.iterations, 600000);
    assert.equal(envelope.cipher.name, "AES-GCM");
    assert.equal(Buffer.from(envelope.kdf.salt, "base64").length, 16);
    assert.equal(Buffer.from(envelope.cipher.iv, "base64").length, 12);
    assert.equal(typeof envelope.ciphertext, "string");
    assert.ok(Buffer.from(envelope.ciphertext, "base64").length >= 16);
    if (!file.endsWith("/vault.json")) assert.ok(file.endsWith("/m-" + createHash("sha256").update(text).digest("hex").slice(0, 32) + ".json"));
  }
}
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g))
  assert.ok(match[1].startsWith("./"), "Only same-site resources allowed");
console.log(
  `Static checks passed: ${files.length} files; same-origin resources; no plaintext data envelope.`,
);
