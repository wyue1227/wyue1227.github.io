import { readFile, readdir } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import assert from "node:assert/strict";
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
    const envelope = JSON.parse(text);
    assert.equal(envelope.format, "diet-vault-v1");
    assert.equal(typeof envelope.ciphertext, "string");
    assert.ok(!("entries" in envelope));
  }
}
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g))
  assert.ok(match[1].startsWith("./"), "Only same-site resources allowed");
console.log(
  `Static checks passed: ${files.length} files; same-origin resources; no plaintext data envelope.`,
);
