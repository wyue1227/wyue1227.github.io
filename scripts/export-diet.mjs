import {
  readFile,
  writeFile,
  mkdir,
  rename,
  mkdtemp,
  cp,
} from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Source, makeSnapshot } from "./lib/export.mjs";
import { decrypt } from "./lib/vault.mjs";
import { demoData } from "../site/js/demo.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { values } = parseArgs({
  options: {
    demo: { type: "boolean" },
    input: { type: "string" },
    initialize: { type: "boolean" },
    output: { type: "string", default: ".preview/publish" },
    previous: { type: "string" },
    "previous-url": { type: "string" },
  },
});
async function main() {
  const pass = process.env.DIET_SHARE_PASSPHRASE;
  if (!pass || pass.length < 16)
    throw new Error(
      "Set DIET_SHARE_PASSPHRASE to an independent passphrase of at least 16 characters",
    );
  const output = resolve(root, values.output);
  // Never place generated snapshots or credentials in tracked source directories.
  if (!output.startsWith(root + "/.preview/"))
    throw new Error("Output must be under the ignored .preview/ directory");
  let source;
  if (values.demo) source = demoData();
  else if (values.input) {
    const input = resolve(root, values.input);
    if (!input.startsWith(root + "/.secrets/"))
      throw new Error("Connector imports must be under ignored .secrets/");
    source = JSON.parse(await readFile(input, "utf8"));
    if (!Array.isArray(source.entries) || !source.entries.length)
      throw new Error("Refusing to import an empty connector snapshot");
  }
  else {
    for (const name of [
      "DIET_SUPABASE_URL",
      "DIET_SUPABASE_KEY",
      "DIET_PROFILE_ID",
    ])
      if (!process.env[name]) throw new Error("Missing " + name);
    source = await new Source({
      url: process.env.DIET_SUPABASE_URL,
      key: process.env.DIET_SUPABASE_KEY,
      profile: process.env.DIET_PROFILE_ID,
    }).read();
    if (!source.entries.length)
      throw new Error(
        "Refusing to publish an empty personal dataset; inspect profile and access first",
      );
  }
  let previous = null;
  const previousFiles = new Map();
  let load;
  if (values.previous)
    load = async (file) =>
      readFile(join(resolve(root, values.previous), file), "utf8");
  else if (values["previous-url"]) {
    const base = new URL(values["previous-url"]);
    if (
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !base.pathname.endsWith("/")
    )
      throw new Error("Previous URL must be a clean HTTPS directory URL");
    load = async (file) => {
      const response = await fetch(new URL(file, base), {
        redirect: "error",
        credentials: "omit",
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok)
        throw new Error(
          "Previous snapshot unavailable: HTTP " + response.status,
        );
      return response.text();
    };
  }
  if (!values.initialize && !values.demo && !load)
    throw new Error(
      "Provide --previous/--previous-url or explicitly --initialize for the first export",
    );
  if (load && !values.initialize) {
    previous = decrypt(JSON.parse(await load("vault.json")), pass);
    if (previous.schema !== 1 || !Array.isArray(previous.months))
      throw new Error("Invalid previous index");
    for (const item of previous.months) {
      if (!/^m-[a-f0-9]{32}\.json$/.test(item.file))
        throw new Error("Unsafe previous filename");
      previousFiles.set(item.file, await load(item.file));
    }
  }
  const result = makeSnapshot(source, pass, {
    previous,
    previousFiles,
    fictional: Boolean(values.demo),
  });
  await mkdir(dirname(output), { recursive: true });
  const staging = await mkdtemp(join(root, ".preview", "build-"));
  // A fresh Pages artifact is built each time; superseded ciphertext is not uploaded.
  await cp(join(root, "site"), staging, {
    recursive: true,
    filter: (path) => path !== join(root, "site", "data"),
  });
  const dataDir = join(staging, "data");
  await mkdir(dataDir, { recursive: true });
  for (const [file, content] of result.files) {
    if (file === "vault.json") continue;
    await writeFile(join(dataDir, file), content, { mode: 0o600 });
  }
  // The index becomes visible only after all encrypted month files are complete.
  const temp = join(dataDir, "vault.json.tmp");
  await writeFile(temp, result.files.get("vault.json"), { mode: 0o600 });
  await rename(temp, join(dataDir, "vault.json"));
  // Preserve an existing local build recoverably; CI workspaces start empty.
  try {
    await rename(output, output + ".previous-" + Date.now());
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await rename(staging, output);
  const receipt = {
    mode: values.demo ? "fictional-demo" : "personal",
    records: result.index.recordCount,
    days: result.index.dayCount,
    months: result.index.months.length,
    changedMonths: result.changed,
    generatedAt: result.index.generatedAt,
  };
  await writeFile(
    join(root, ".preview", "export-receipt.json"),
    JSON.stringify(receipt, null, 2) + "\n",
    { mode: 0o600 },
  );
  console.log(JSON.stringify(receipt));
}
main().catch((error) => {
  console.error("Export failed: " + error.message);
  process.exitCode = 1;
});
