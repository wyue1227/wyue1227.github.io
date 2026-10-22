// Build a loopback-only preview from an explicitly exported owner snapshot.
// Never print the generated passphrase or raw records.
import { readFile, writeFile, mkdir, chmod } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const secretDir = join(root, ".secrets");
await mkdir(secretDir, { recursive: true, mode: 0o700 });
await chmod(secretDir, 0o700);
const passFile = join(secretDir, "local-preview-passphrase.txt");
let pass;
try {
  pass = (await readFile(passFile, "utf8")).trim();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  pass = randomBytes(24).toString("base64url");
  await writeFile(passFile, pass + "\n", { mode: 0o600, flag: "wx" });
}
await chmod(passFile, 0o600);
if (pass.length < 16) throw new Error("Existing local preview passphrase is too short");
const result = spawnSync(process.execPath, [
  join(root, "scripts/export-diet.mjs"), "--input", ".secrets/connector-diet.json",
  "--initialize", "--output", ".preview/real",
], { cwd: root, env: { ...process.env, DIET_SHARE_PASSPHRASE: pass }, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
if (!process.exitCode) console.log("Real preview built; local passphrase is in the ignored .secrets/local-preview-passphrase.txt file.");
