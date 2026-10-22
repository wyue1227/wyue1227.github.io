import { canonical, decrypt, encrypt, hash } from "./vault.mjs";
import { validDate, validateMonth } from "../../site/js/model.mjs";

export const ENTRY_FIELDS =
  "id,date,meal,food,food_raw,portion,calories_raw,kcal_low,kcal_high,kcal_value,notes";
export const DAY_FIELDS = "date,status,status_override,reported_raw";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function normalize(entries, days) {
  if (!Array.isArray(entries) || !Array.isArray(days))
    throw new Error("Source data is not an array");
  const seen = new Set(),
    dates = new Set();
  const cleanEntries = entries
    .map((row) => {
      if (
        typeof row.id !== "string" ||
        !row.id ||
        seen.has(row.id) ||
        !validDate(row.date)
      )
        throw new Error("Duplicate ID or invalid source date");
      seen.add(row.id);
      const clean = {};
      for (const field of ENTRY_FIELDS.split(",")) {
        const value = row[field];
        if (["kcal_low", "kcal_high", "kcal_value"].includes(field)) {
          if (
            value !== null &&
            value !== undefined &&
            (typeof value !== "number" || !Number.isFinite(value) || value < 0)
          )
            throw new Error("Invalid energy value");
          clean[field] = value ?? null;
        } else {
          if (
            value !== null &&
            value !== undefined &&
            typeof value !== "string"
          )
            throw new Error("Invalid source text field");
          clean[field] = value ?? "";
        }
      }
      if (!clean.food || !clean.meal) throw new Error("Missing food or meal");
      if (
        clean.kcal_low !== null &&
        clean.kcal_high !== null &&
        clean.kcal_high < clean.kcal_low
      )
        throw new Error("Invalid energy interval");
      return clean;
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.meal.localeCompare(b.meal) ||
        a.id.localeCompare(b.id),
    );
  const cleanDays = days
    .map((row) => {
      if (
        !validDate(row.date) ||
        dates.has(row.date) ||
        !["complete", "partial"].includes(row.status) ||
        ![null, undefined, "complete", "partial"].includes(row.status_override)
      )
        throw new Error("Invalid or duplicate day");
      dates.add(row.date);
      if (
        row.reported_raw !== null &&
        row.reported_raw !== undefined &&
        typeof row.reported_raw !== "string"
      )
        throw new Error("Invalid day summary");
      return {
        date: row.date,
        status: row.status,
        status_override: row.status_override ?? null,
        reported_raw: row.reported_raw ?? null,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  // The live schema has a day foreign key. Do not silently drop incomplete pages.
  if (cleanEntries.some((row) => !dates.has(row.date)))
    throw new Error("Source day records are incomplete");
  return { entries: cleanEntries, days: cleanDays };
}
export function makeSnapshot(
  source,
  passphrase,
  {
    previous = null,
    previousFiles = new Map(),
    now = new Date().toISOString(),
    fictional = false,
  } = {},
) {
  const { entries, days } = normalize(source.entries, source.days),
    files = new Map(),
    months = [];
  if (previous?.schema !== 1 && previous !== null)
    throw new Error("Invalid previous index");
  const monthNames = [
    ...new Set([...entries, ...days].map((row) => row.date.slice(0, 7))),
  ].sort();
  let changed = 0;
  for (const month of monthNames) {
    const data = {
      schema: 1,
      month,
      entries: entries.filter((row) => row.date.startsWith(month)),
      days: days.filter((row) => row.date.startsWith(month)),
    };
    const old = previous?.months.find((item) => item.month === month);
    let file, serialized;
    if (old) {
      if (
        !/^m-[a-f0-9]{32}\.json$/.test(old.file) ||
        !previousFiles.has(old.file)
      )
        throw new Error("Missing previous month");
      const oldText = previousFiles.get(old.file);
      const oldData = validateMonth(
        decrypt(JSON.parse(oldText), passphrase),
        month,
      );
      if (canonical(oldData) === canonical(data)) {
        file = old.file;
        serialized = oldText;
      }
    }
    if (!file) {
      serialized = canonical(encrypt(data, passphrase)) + "\n";
      file = "m-" + hash(serialized).slice(0, 32) + ".json";
      changed++;
    }
    files.set(file, serialized);
    months.push({
      month,
      file,
      dayCount: data.days.length,
      recordCount: data.entries.length,
    });
  }
  const allDates = [...entries, ...days].map((row) => row.date).sort();
  const index = {
    schema: 1,
    fictional,
    generatedAt: now,
    latestDate: allDates.at(-1) || null,
    recordCount: entries.length,
    dayCount: days.length,
    months,
  };
  files.set("vault.json", canonical(encrypt(index, passphrase)) + "\n");
  return { index, files, changed };
}

export class Source {
  constructor({ url, key, profile, request = fetch }) {
    const origin = new URL(url);
    if (
      origin.protocol !== "https:" ||
      !origin.hostname.endsWith(".supabase.co") ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    )
      throw new Error("Invalid Supabase URL");
    if (!UUID.test(profile)) throw new Error("Invalid profile UUID");
    if (!key) throw new Error("Missing Supabase server credential");
    this.origin = origin.origin;
    this.profile = profile;
    this.request = request;
    this.headers = { apikey: key, Prefer: "count=exact" };
    if (!key.startsWith("sb_secret_"))
      this.headers.Authorization = `Bearer ${key}`;
  }
  async call(table, params = {}, method = "GET") {
    if (!["diet_entries", "diet_days"].includes(table))
      throw new Error("Table is not allowed");
    const url = new URL(this.origin + "/rest/v1/" + table);
    url.search = new URLSearchParams({
      profile_id: "eq." + this.profile,
      ...params,
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try {
        response = await this.request(url, {
          method,
          headers: this.headers,
          redirect: "error",
          signal: AbortSignal.timeout(30000),
        });
      } catch {
        if (attempt === 2) throw new Error("Supabase read timed out or failed");
      }
      if (response?.ok) return response;
      if (response && response.status !== 429 && response.status < 500)
        throw new Error(
          `Supabase ${table} read rejected: HTTP ${response.status}`,
        );
      if (attempt === 2) throw new Error(`Supabase ${table} read failed`);
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  async table(table, fields, key) {
    const rows = [];
    let cursor = null,
      total = null;
    for (let page = 0; page < 1000; page++) {
      const params = { select: fields, order: key + ".asc", limit: "1000" };
      if (cursor !== null) params[key] = "gt." + cursor;
      const response = await this.call(table, params),
        data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid database response");
      if (total === null) {
        const count = response.headers.get("content-range")?.split("/")[1];
        if (!/^\d+$/.test(count || ""))
          throw new Error("Exact source count is missing");
        total = Number(count);
      }
      for (const row of data) {
        const value = row[key];
        if (
          typeof value !== "string" ||
          (key === "id" ? !UUID.test(value) : !validDate(value)) ||
          (cursor !== null && value <= cursor)
        )
          throw new Error("Source pagination is not strictly ordered");
        cursor = value;
        rows.push(row);
      }
      if (rows.length > total)
        throw new Error("Source changed during pagination");
      if (rows.length === total) {
        const end = await this.call(table, { select: key }, "HEAD"),
          endCount = end.headers.get("content-range")?.split("/")[1];
        if (endCount !== String(total))
          throw new Error("Source count changed; retry next run");
        return rows;
      }
      if (!data.length)
        throw new Error("Source pagination ended before exact count");
    }
    throw new Error("Source exceeded pagination safety limit");
  }
  async read() {
    const entries = await this.table("diet_entries", ENTRY_FIELDS, "id");
    const days = await this.table("diet_days", DAY_FIELDS, "date");
    return normalize(entries, days);
  }
}
