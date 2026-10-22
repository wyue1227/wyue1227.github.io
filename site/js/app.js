import { decryptEnvelope } from "./crypto.mjs";
import {
  MEALS,
  energy,
  summarize,
  energyText,
  approximateEnergy,
  validDate,
  validateMonth,
} from "./model.mjs";
import { demoData } from "./demo.mjs";
const $ = (id) => document.getElementById(id);
const state = {
  mode: null,
  pass: null,
  index: null,
  month: null,
  date: null,
  data: null,
  epoch: 0,
};
const today = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
}).format(new Date());
let idle;
function node(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}
async function getJSON(path) {
  const url = new URL(path, location.href);
  if (url.origin !== location.origin)
    throw new Error("拒绝加载其他站点的数据。");
  let response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    });
  } catch {
    throw new Error("数据加载失败，请检查网络后重试。");
  }
  if (response.status === 404)
    throw new Error("真实记录尚未发布，可以先查看虚构示例。");
  if (!response.ok)
    throw new Error(`数据暂时不可用（${response.status}），请稍后重试。`);
  return response.json();
}
function validateIndex(index) {
  if (
    index?.schema !== 1 ||
    !Array.isArray(index.months) ||
    !Number.isFinite(Date.parse(index.generatedAt))
  )
    throw new Error("索引格式无效。");
  const seen = new Set();
  for (const item of index.months) {
    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(item.month) ||
      !/^m-[a-f0-9]{32}\.json$/.test(item.file) ||
      seen.has(item.month)
    )
      throw new Error("月份索引无效。");
    seen.add(item.month);
  }
  if (index.latestDate !== null && !validDate(index.latestDate))
    throw new Error("最近日期无效。");
  return index;
}
function resetIdle() {
  clearTimeout(idle);
  if (state.mode === "private") idle = setTimeout(lock, 15 * 60 * 1000);
}
function lock() {
  state.epoch++;
  state.pass = null;
  state.data = null;
  state.index = null;
  state.mode = null;
  state.month = null;
  state.date = null;
  clearTimeout(idle);
  $("unlock-form").reset();
  $("passphrase").type = "password";
  $("show-pass").textContent = "显示";
  $("show-pass").setAttribute("aria-pressed", "false");
  $("dashboard").hidden = true;
  $("gate").hidden = false;
  $("lock").hidden = true;
  $("gate-status").textContent = "";
  for (const id of [
    "meal-list",
    "calendar",
    "month-select",
    "search-results",
    "reported-total",
    "updated-label",
    "data-status",
    "day-title",
    "day-weekday",
    "day-kcal",
    "energy-note",
    "day-entries",
    "entry-note",
    "day-completeness",
    "completeness-note",
    "month-count",
    "search-status",
  ])
    $(id).replaceChildren();
  $("search").value = "";
  $("passphrase").focus();
}
function enter() {
  $("gate").hidden = true;
  $("dashboard").hidden = false;
  $("lock").hidden = false;
  $("demo-banner").hidden =
    state.mode !== "demo" && state.index.fictional !== true;
  $("refresh").textContent = state.mode === "demo" ? "退出示例" : "刷新记录";
  $("updated-label").textContent =
    state.mode === "demo"
      ? "示例日期：2026年10月 · 非真实饮食数据"
      : `快照更新：${new Date(state.index.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Tokyo", hour12: false })}（日本时间）`;
  $("month-select").replaceChildren(
    ...state.index.months
      .slice()
      .sort((a, b) => b.month.localeCompare(a.month))
      .map((item) => {
        const opt = node("option", "", item.month.replace("-", "年") + "月");
        opt.value = item.month;
        return opt;
      }),
  );
  $("search").value = "";
  resetIdle();
}
async function selectMonth(month, date) {
  const epoch = ++state.epoch;
  $("data-status").textContent = "正在读取这个月的记录…";
  document.querySelector(".day-panel").setAttribute("aria-busy", "true");
  try {
    const item = state.index.months.find((item) => item.month === month);
    if (!item) throw new Error("没有这个月份的快照。");
    let data;
    if (state.mode === "demo") {
      const demo = demoData();
      data = {
        schema: 1,
        month,
        entries: demo.entries.filter((e) => e.date.startsWith(month)),
        days: demo.days.filter((d) => d.date.startsWith(month)),
      };
    } else {
      const envelope = await getJSON("./data/" + item.file);
      data = await decryptEnvelope(envelope, state.pass);
    }
    if (epoch !== state.epoch) return;
    state.data = validateMonth(data, month);
    state.month = month;
    const dates = [
      ...new Set([...data.entries, ...data.days].map((row) => row.date)),
    ].sort();
    state.date = date?.startsWith(month) ? date : dates.at(-1) || month + "-01";
    $("month-select").value = month;
    $("search").value = "";
    $("data-status").textContent = "";
    render();
  } catch (error) {
    if (epoch === state.epoch) {
      $("data-status").textContent = error.message;
      if (state.month) $("month-select").value = state.month;
    }
  } finally {
    if (epoch === state.epoch)
      document.querySelector(".day-panel").setAttribute("aria-busy", "false");
  }
}
function render() {
  const [year, month] = state.month.split("-").map(Number),
    first = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7,
    count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const recorded = new Set(
      [...state.data.entries, ...state.data.days].map((row) => row.date),
    ),
    grid = $("calendar");
  const dailyEntries = new Map();
  for (const entry of state.data.entries) {
    if (!dailyEntries.has(entry.date)) dailyEntries.set(entry.date, []);
    dailyEntries.get(entry.date).push(entry);
  }
  grid.replaceChildren();
  for (let i = 0; i < first; i++) grid.append(node("span"));
  for (let day = 1; day <= count; day++) {
    const date = `${state.month}-${String(day).padStart(2, "0")}`,
      btn = node("button", "calendar-day");
    btn.append(node("span", "calendar-date", String(day)));
    const daySum = summarize(dailyEntries.get(date) || []);
    let description = recorded.has(date) ? "仅有日期记录，条目热量未知" : "无记录";
    if (recorded.has(date)) {
      const metric = node("span", "calendar-kcal");
      metric.setAttribute("aria-hidden", "true");
      if (daySum.known) {
        const marker = daySum.unknown ? "*" : "";
        metric.textContent = String(approximateEnergy(daySum)) + marker;
        description = `已记录估算 ${energyText(daySum)}${daySum.unknown ? `，另有 ${daySum.unknown} 条热量未知` : ""}`;
      } else {
        metric.textContent = "未知";
        metric.classList.add("unknown");
        if (daySum.count) description = "已记录食品，但热量均未知";
      }
      btn.append(metric);
    }
    btn.type = "button";
    btn.classList.toggle("has-data", recorded.has(date));
    btn.classList.toggle("selected", state.date === date);
    btn.classList.toggle("is-today", date === today);
    btn.setAttribute(
      "aria-label",
      `${date}，${description}`,
    );
    btn.title = `${date} · ${description}`;
    btn.setAttribute("aria-pressed", String(state.date === date));
    btn.addEventListener("click", () => {
      state.date = date;
      render();
    });
    grid.append(btn);
  }
  const months = state.index.months.map((item) => item.month).sort(),
    index = months.indexOf(state.month);
  $("prev-month").disabled = index === 0;
  $("next-month").disabled = index === months.length - 1;
  $("month-count").textContent = `本月 ${recorded.size} 天有记录`;
  $("day-weekday").textContent = new Date(
    state.date + "T12:00:00Z",
  ).toLocaleDateString("zh-CN", { weekday: "long", timeZone: "UTC" });
  $("day-title").textContent = state.date.replace(/-/g, ".");
  const entries = state.data.entries.filter((row) => row.date === state.date),
    sum = summarize(entries),
    day = state.data.days.find((row) => row.date === state.date),
    meals = new Set(entries.map((row) => row.meal));
  $("day-kcal").textContent = energyText(sum, false);
  $("energy-note").textContent = sum.known
    ? `kcal · ${sum.unknown ? `${sum.unknown} 条热量未知，未计入` : "基于有数值的记录合计"}`
    : "没有可汇总的热量数值";
  $("day-entries").textContent = entries.length ? String(entries.length) : "—";
  $("entry-note").textContent = entries.length
    ? `${meals.size} 个餐次 · 未合并重复食品`
    : "当天没有饮食条目";
  const complete = (day?.status_override || day?.status) === "complete";
  $("day-completeness").textContent = complete
    ? "已记完整"
    : entries.length
      ? "部分记录"
      : day
        ? "仅有日汇总"
        : "未记录";
  $("completeness-note").textContent = complete
    ? "来源标记为完整"
    : "不推断缺少的餐次";
  $("reported-total").hidden = !day?.reported_raw;
  $("reported-total").textContent = day?.reported_raw
    ? `原始当日汇总：${day.reported_raw}（单独展示，不与条目合计相加）`
    : "";
  const list = $("meal-list");
  list.replaceChildren();
  if (!entries.length) {
    const empty = node("div", "empty-state");
    empty.append(
      node("h3", "", "这一天还没有饮食明细"),
      node("p", "", "可以在日历中选择有热量标记的日期。"),
    );
    list.append(empty);
  }
  const ordered = [
      ...MEALS,
      ...[...meals].filter((meal) => !MEALS.includes(meal)).sort(),
    ],
    symbols = { 早餐: "☀", 午餐: "◑", 晚餐: "☾", 加餐: "◇" },
    english = {
      早餐: "BREAKFAST",
      午餐: "LUNCH",
      晚餐: "DINNER",
      加餐: "SNACK",
    };
  for (const meal of ordered) {
    const rows = entries.filter((row) => row.meal === meal);
    if (!rows.length) continue;
    const card = node("section", "meal-card"),
      heading = node("div", "meal-heading"),
      label = node("div", "meal-label"),
      title = node("div");
    title.append(
      node("h3", "", meal),
      node("small", "", english[meal] || "OTHER"),
    );
    label.append(node("span", "meal-symbol", symbols[meal] || "◇"), title);
    const total = summarize(rows);
    heading.append(
      label,
      node(
        "div",
        "meal-total",
        energyText(total) + (total.unknown ? " · 部分未知" : ""),
      ),
    );
    card.append(heading);
    for (const row of rows) {
      const food = node("div", "food-row"),
        copy = node("div");
      copy.append(node("p", "food-name", row.food));
      if (row.portion) copy.append(node("p", "food-meta", row.portion));
      if (row.food_raw && row.food_raw !== row.food)
        copy.append(node("p", "food-notes", "原文：" + row.food_raw));
      if (row.notes) copy.append(node("p", "food-notes", row.notes));
      const value = energy(row),
        right = node(
          "div",
          "food-energy" + (value ? "" : " unknown"),
          value ? energyText(value) : "热量未知",
        );
      if (row.calories_raw) right.append(node("small", "", row.calories_raw));
      food.append(copy, right);
      card.append(food);
    }
    list.append(card);
  }
  renderSearch();
}
function renderSearch() {
  const query = $("search").value.trim().toLocaleLowerCase();
  $("search-results").replaceChildren();
  if (!query || !state.data) {
    $("search-status").textContent = "";
    return;
  }
  const results = state.data.entries.filter((row) =>
    [row.food, row.food_raw, row.portion, row.meal, row.notes].some((v) =>
      String(v || "")
        .toLocaleLowerCase()
        .includes(query),
    ),
  );
  $("search-status").textContent = results.length
    ? `找到 ${results.length} 条，本月范围`
    : "本月没有匹配记录";
  for (const row of results.slice(0, 30)) {
    const btn = node(
      "button",
      "",
      `${row.date.slice(5)} · ${row.meal} · ${row.food}`,
    );
    btn.addEventListener("click", () => {
      state.date = row.date;
      render();
    });
    $("search-results").append(btn);
  }
}
function shiftMonth(delta) {
  const months = state.index.months.map((item) => item.month).sort(),
    month = months[months.indexOf(state.month) + delta];
  if (month) selectMonth(month);
}
function shiftDay(delta) {
  if (!state.date) return;
  const date = new Date(state.date + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + delta);
  const value = date.toISOString().slice(0, 10);
  if (value.startsWith(state.month)) {
    state.date = value;
    render();
  } else if (state.index.months.some((m) => m.month === value.slice(0, 7)))
    selectMonth(value.slice(0, 7), value);
}
$("unlock-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const pass = $("passphrase").value,
    epoch = ++state.epoch;
  $("unlock").disabled = true;
  $("gate-status").textContent = "正在本地解密…";
  try {
    const envelope = await getJSON("./data/vault.json"),
      index = validateIndex(await decryptEnvelope(envelope, pass));
    if (epoch !== state.epoch) return;
    state.mode = "private";
    state.pass = pass;
    state.index = index;
    $("passphrase").value = "";
    $("gate-status").textContent = "";
    enter();
    if (index.months.length)
      await selectMonth(
        index.latestDate?.slice(0, 7) || index.months.at(-1).month,
        index.latestDate,
      );
    else {
      $("data-status").textContent = "快照中还没有饮食记录。";
    }
  } catch (error) {
    if (epoch === state.epoch) $("gate-status").textContent = error.message;
  } finally {
    $("unlock").disabled = false;
  }
});
$("show-pass").addEventListener("click", () => {
  const show = $("passphrase").type === "password";
  $("passphrase").type = show ? "text" : "password";
  $("show-pass").textContent = show ? "隐藏" : "显示";
  $("show-pass").setAttribute("aria-pressed", String(show));
});
$("demo").addEventListener("click", () => {
  state.epoch++;
  state.mode = "demo";
  state.pass = null;
  const demo = demoData();
  state.index = {
    generatedAt: new Date().toISOString(),
    latestDate: "2026-10-22",
    months: [...new Set(demo.entries.map((e) => e.date.slice(0, 7)))]
      .sort()
      .map((month) => ({ month })),
  };
  enter();
  selectMonth("2026-10", "2026-10-22");
});
$("lock").addEventListener("click", lock);
$("exit-demo").addEventListener("click", lock);
$("refresh").addEventListener("click", () => {
  if (state.mode === "demo") lock();
  else {
    lock();
    $("gate-status").textContent = "请重新输入口令，读取最新快照。";
  }
});
$("month-select").addEventListener("change", (event) =>
  selectMonth(event.target.value),
);
$("prev-month").addEventListener("click", () => shiftMonth(-1));
$("next-month").addEventListener("click", () => shiftMonth(1));
$("prev-day").addEventListener("click", () => shiftDay(-1));
$("next-day").addEventListener("click", () => shiftDay(1));
$("latest").addEventListener("click", () => {
  const latest = state.index.latestDate;
  if (latest) selectMonth(latest.slice(0, 7), latest);
});
$("search").addEventListener("input", renderSearch);
for (const event of ["pointerdown", "keydown"])
  document.addEventListener(event, resetIdle, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "private") {
    clearTimeout(idle);
    idle = setTimeout(lock, 5 * 60 * 1000);
  }
});
if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register("./sw.js")
    .then((reg) => reg.update())
    .catch(() => {});
