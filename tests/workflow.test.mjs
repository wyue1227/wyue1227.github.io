import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Pages deploys static assets only, without data export or credentials", async () => {
  const workflow = await readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
  assert.ok(workflow.includes("branches: [main]"));
  assert.ok(workflow.includes("github.event_name != 'pull_request'"));
  assert.ok(workflow.includes("needs: verify"));
  assert.ok(workflow.includes("path: ./site"));
  assert.ok(!/secrets\.|SUPABASE|SHARE_PASSPHRASE|export-diet/.test(workflow));
  assert.ok(!/^\s+schedule:/m.test(workflow));
});
