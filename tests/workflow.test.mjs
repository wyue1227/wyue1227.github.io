import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Pages auto-releases main pushes, protects PRs, and keeps daily dispatch incremental", async () => {
  const workflow = await readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
  assert.ok(workflow.includes("branches: [main]"));
  assert.ok(workflow.includes("if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && inputs.publish))"));
  assert.ok(workflow.includes("INITIALIZE: ${{ github.event_name == 'push' || inputs.initialize }}"));
  assert.ok(workflow.includes("needs: verify"));
  assert.ok(workflow.includes("Missing GitHub Actions configuration:"));
  assert.ok(workflow.includes("path: ./.preview/publish"));
  assert.ok(!/^\s+schedule:/m.test(workflow));
});
