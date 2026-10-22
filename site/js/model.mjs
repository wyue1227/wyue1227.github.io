export const MEALS = ["早餐", "午餐", "晚餐", "加餐"];
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T12:00:00Z");
  return !Number.isNaN(+parsed) && parsed.toISOString().slice(0, 10) === value;
}
export function energy(entry) {
  const n = (value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0;
  if (
    n(entry.kcal_low) &&
    n(entry.kcal_high) &&
    entry.kcal_high >= entry.kcal_low
  )
    return { low: entry.kcal_low, high: entry.kcal_high };
  if (n(entry.kcal_value))
    return { low: entry.kcal_value, high: entry.kcal_value };
  return null;
}
export function summarize(entries) {
  let low = 0,
    high = 0,
    known = 0;
  for (const entry of entries) {
    const value = energy(entry);
    if (value) {
      low += value.low;
      high += value.high;
      known++;
    }
  }
  return {
    low,
    high,
    known,
    unknown: entries.length - known,
    count: entries.length,
  };
}
const number = (value) =>
  new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(value);
export function approximateEnergy(value) {
  return Math.round((value.low + value.high) / 2);
}
export function energyText(value, unit = true) {
  if (!value || value.known === 0) return "—";
  return (
    (value.low !== value.high ? "约 " : "") +
    number(approximateEnergy(value)) + (unit ? " kcal" : "")
  );
}
export function validateMonth(data, month) {
  if (
    data?.schema !== 1 ||
    data.month !== month ||
    !Array.isArray(data.entries) ||
    !Array.isArray(data.days)
  )
    throw new Error("月份数据格式无效。");
  const ids = new Set();
  for (const entry of data.entries) {
    if (
      !entry.id ||
      ids.has(entry.id) ||
      !validDate(entry.date) ||
      !entry.date.startsWith(month + "-") ||
      typeof entry.food !== "string" ||
      typeof entry.meal !== "string"
    )
      throw new Error("饮食记录重复或格式无效。");
    ids.add(entry.id);
  }
  for (const day of data.days)
    if (!validDate(day.date) || !day.date.startsWith(month + "-"))
      throw new Error("日期记录格式无效。");
  return data;
}
