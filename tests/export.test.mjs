import test from "node:test";
import assert from "node:assert/strict";
import { encrypt, decrypt, canonical } from "../scripts/lib/vault.mjs";
import { Source, normalize, makeSnapshot } from "../scripts/lib/export.mjs";
import { decryptEnvelope } from "../site/js/crypto.mjs";
import { energy, summarize, energyText } from "../site/js/model.mjs";
import { demoData } from "../site/js/demo.mjs";
const pass = "fictional-test-passphrase-only";
const source = () => demoData();
test("Node encryption is browser WebCrypto compatible; wrong password and tamper fail", async () => {
  const data = { text: "虚构测试，中文与🍚" },
    envelope = encrypt(data, pass);
  assert.deepEqual(decrypt(envelope, pass), data);
  assert.deepEqual(await decryptEnvelope(envelope, pass), data);
  await assert.rejects(decryptEnvelope(envelope, "wrong-passphrase"), /口令/);
  const changed = structuredClone(envelope),
    bytes = Buffer.from(changed.ciphertext, "base64");
  bytes[0] ^= 1;
  changed.ciphertext = bytes.toString("base64");
  await assert.rejects(decryptEnvelope(changed, pass), /口令/);
  assert.notEqual(encrypt(data, pass).ciphertext, envelope.ciphertext);
  assert.throws(() => encrypt(data, "short"), /16/);
});
test("energy preserves intervals, unknowns, and explicit zero", () => {
  assert.deepEqual(energy({ kcal_low: 100, kcal_high: 200, kcal_value: 150 }), {
    low: 100,
    high: 200,
  });
  const sum = summarize([
    { kcal_value: 0 },
    { kcal_low: 100, kcal_high: 200 },
    { kcal_value: null },
  ]);
  assert.equal(energyText(sum), "约 150 kcal");
  assert.equal(energyText({ low: 1958, high: 2318 }), "约 2,138 kcal");
  assert.equal(energyText({ low: 1641.8, high: 1736.8 }, false), "约 1,689");
  assert.equal(energyText(summarize([{ kcal_value: 0 }])), "0 kcal");
  assert.equal(sum.unknown, 1);
  assert.equal(energyText(summarize([{ kcal_value: null }])), "—");
});
test("normalization strips internal fields and refuses duplicate IDs or missing days", () => {
  const data = source();
  data.entries[0].profile_id = "private";
  data.entries[0].source_path = "private/path";
  const result = normalize(data.entries, data.days);
  assert.equal(result.entries[0].profile_id, undefined);
  assert.equal(result.entries[0].source_path, undefined);
  assert.throws(
    () => normalize([...data.entries, data.entries[0]], data.days),
    /Duplicate/,
  );
  assert.throws(() => normalize(data.entries, []), /incomplete/);
  assert.throws(
    () => normalize([{ ...data.entries[0], date: "2026-02-30" }], data.days),
    /date/,
  );
});
test("incremental publication detects old edits, date moves and deletions without merging food names", () => {
  const data = source(),
    first = makeSnapshot(data, pass);
  const again = makeSnapshot(data, pass, {
    previous: first.index,
    previousFiles: first.files,
  });
  assert.equal(again.changed, 0);
  assert.deepEqual(again.index.months, first.index.months);
  const oldEdit = structuredClone(data);
  oldEdit.entries.find((e) => e.date === "2026-09-30").notes = "历史修改";
  const edited = makeSnapshot(oldEdit, pass, {
    previous: first.index,
    previousFiles: first.files,
  });
  assert.equal(edited.changed, 1);
  assert.equal(
    edited.index.months.find((m) => m.month === "2026-10").file,
    first.index.months.find((m) => m.month === "2026-10").file,
  );
  const removed = {
    entries: data.entries.filter((e) => !e.date.startsWith("2026-09")),
    days: data.days.filter((d) => !d.date.startsWith("2026-09")),
  };
  const deleted = makeSnapshot(removed, pass, {
    previous: first.index,
    previousFiles: first.files,
  });
  assert.equal(deleted.index.months.length, 1);
  assert.equal(deleted.files.size, 2);
  const moved = structuredClone(data);
  moved.entries.at(-1).date = "2026-10-21";
  moved.days = moved.days.filter((d) => !d.date.startsWith("2026-09"));
  assert.equal(
    makeSnapshot(moved, pass, {
      previous: first.index,
      previousFiles: first.files,
    }).index.recordCount,
    data.entries.length,
  );
  const content = [...first.files.values()].join("");
  assert.ok(!content.includes("鸡肉蔬菜饭"));
  assert.ok(!content.includes(pass));
  assert.throws(
    () =>
      makeSnapshot(data, "a-different-long-password", {
        previous: first.index,
        previousFiles: first.files,
      }),
    /decrypted/,
  );
});
test("keyset pagination continues when server page cap is lower than requested, and never leaks key to redirects", async () => {
  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const rows = [1, 2, 3].map((n) => ({ id: id(n) })),
    calls = [];
  const client = new Source({
    url: "https://test.supabase.co",
    key: "sb_secret_fixture",
    profile: id(9),
    request: async (url, options) => {
      calls.push({ url, options });
      assert.equal(options.redirect, "error");
      assert.equal(url.searchParams.get("profile_id"), "eq." + id(9));
      if (options.method === "HEAD")
        return new Response(null, { headers: { "content-range": "*/3" } });
      const page = rows
        .filter(
          (row) => row.id > (url.searchParams.get("id") || "gt.").slice(3),
        )
        .slice(0, 2);
      return Response.json(page, {
        headers: {
          "content-range": `0-${page.length - 1}/${calls.length === 1 ? 3 : 1}`,
        },
      });
    },
  });
  assert.deepEqual(await client.table("diet_entries", "id", "id"), rows);
  assert.equal(calls.length, 3);
  assert.throws(
    () =>
      new Source({ url: "https://evil.test", key: "private", profile: id(9) }),
    /Invalid Supabase URL/,
  );
  client.request = async () => new Response(null, { status: 401 });
  await assert.rejects(client.table("diet_entries", "id", "id"), /401/);
});
test("count changes and premature pagination stop abort rather than publish truncated data", async () => {
  let count = 0;
  const request = async (url, options) => {
    if (options.method === "HEAD")
      return new Response(null, { headers: { "content-range": "*/2" } });
    count++;
    return Response.json(count === 1 ? [{ date: "2026-10-22" }] : [], {
      headers: { "content-range": "0-0/1" },
    });
  };
  const client = new Source({
    url: "https://test.supabase.co",
    key: "sb_secret_fixture",
    profile: "00000000-0000-4000-8000-000000000009",
    request,
  });
  await assert.rejects(
    client.table("diet_days", "date", "date"),
    /count changed/,
  );
});
