/*
 * db.js — IndexedDB 数据层
 *
 * 所有练习数据只保存在本机浏览器，不上传任何服务器。
 * 数据库：gojuon-db
 *   kanaStats (keyPath: id)   — 每个假名的练习次数 / 正确次数 / 最近一次结果
 *   daily     (keyPath: date) — 每日练习记录 YYYY-MM-DD
 *   settings  (keyPath: key)  — 用户设置
 *
 * 说明：Service Worker 只操作 Cache Storage，绝不触碰本数据库；
 *       清空记录只由用户在「我的 → 清空记录」并二次确认后触发。
 */

const DB_NAME = 'gojuon-db';
const DB_VERSION = 1;
const EXPORT_APP = 'gojuon-trainer';
const EXPORT_VERSION = 1;

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('当前浏览器不支持 IndexedDB，无法保存练习记录'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains('kanaStats')) {
        db.createObjectStore('kanaStats', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('daily')) {
        db.createObjectStore('daily', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('打开本地数据库失败'));
    req.onblocked = () => reject(new Error('数据库被其他标签页占用，请关闭其它页面后重试'));
  });
  return _dbPromise;
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('数据库写入失败'));
    tx.onabort = () => reject(tx.error || new Error('数据库写入被中止'));
  });
}

function reqResult(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('数据库读取失败'));
  });
}

/* ---------- 读取 ---------- */

async function getAll(storeName) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const out = await reqResult(tx.objectStore(storeName).getAll());
  await txDone(tx);
  return out || [];
}

async function getKanaStats() {
  return getAll('kanaStats');
}

async function getKanaStatsMap() {
  const rows = await getKanaStats();
  const map = new Map();
  for (const r of rows) map.set(r.id, r);
  return map;
}

async function getDailyRecords() {
  const rows = await getAll('daily');
  rows.sort((a, b) => (a.date < b.date ? 1 : -1)); // 最新在前
  return rows;
}

async function getSettings() {
  const rows = await getAll('settings');
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
}

async function setSetting(key, value) {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put({ key, value });
  await txDone(tx);
}

/* ---------- 记录一次答题 ---------- */

function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * 记录一次答题结果，同时更新该假名统计与当日记录。
 * @param {{id:string, correct:boolean}} param0
 */
async function recordAnswer({ id, correct }) {
  const db = await openDB();
  const tx = db.transaction(['kanaStats', 'daily'], 'readwrite');
  const statStore = tx.objectStore('kanaStats');
  const dailyStore = tx.objectStore('daily');
  const now = Date.now();
  const date = todayKey();

  const existing = await reqResult(statStore.get(id));
  const prev = existing || {
    id,
    attempts: 0,
    correct: 0,
    wrong: 0,
    lastResult: null,
    lastAt: null,
    firstAt: null,
  };
  const next = {
    ...prev,
    attempts: prev.attempts + 1,
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    lastResult: correct ? 'correct' : 'wrong',
    lastAt: now,
    firstAt: prev.firstAt || now,
  };
  statStore.put(next);

  const daily = (await reqResult(dailyStore.get(date))) || {
    date,
    total: 0,
    correct: 0,
    rounds: 0,
    updatedAt: now,
  };
  daily.total += 1;
  daily.correct += correct ? 1 : 0;
  daily.updatedAt = now;
  dailyStore.put(daily);

  await txDone(tx);
  return { stat: next, daily };
}

/** 一轮练习结束，给当日记录累加轮次 */
async function bumpRound(date = todayKey()) {
  const db = await openDB();
  const tx = db.transaction('daily', 'readwrite');
  const store = tx.objectStore('daily');
  const daily = (await reqResult(store.get(date))) || {
    date,
    total: 0,
    correct: 0,
    rounds: 0,
    updatedAt: Date.now(),
  };
  daily.rounds += 1;
  daily.updatedAt = Date.now();
  store.put(daily);
  await txDone(tx);
}

/* ---------- 导出 / 导入 ---------- */

async function exportAll() {
  const [kanaStats, daily, settings] = await Promise.all([
    getKanaStats(),
    getDailyRecords(),
    getAll('settings'),
  ]);
  return {
    app: EXPORT_APP,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    note: '五十音练习记录备份。换手机 / 换浏览器 / 清理网站数据后，可用此文件导入恢复。',
    counts: {
      kanaStats: kanaStats.length,
      practicedKana: kanaStats.filter((s) => s.attempts > 0).length,
      daily: daily.length,
    },
    data: { kanaStats, daily, settings },
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isCount = (value) => Number.isSafeInteger(value) && value >= 0;
const isTimestamp = (value) => value === null || (isCount(value) && value <= 8640000000000000);

function isCalendarDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * 校验导入文件结构。只做校验，不写库。
 * @returns {{ok:boolean, errors:string[], preview:object|null, payload:object|null}}
 */
function validateImport(raw) {
  const errors = [];
  let obj = raw;

  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      return { ok: false, errors: ['不是合法的 JSON 文件，无法解析。'], preview: null, payload: null };
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, errors: ['文件内容不是预期的对象结构。'], preview: null, payload: null };
  }
  if (obj.app !== EXPORT_APP) {
    errors.push(`这不是本练习站的备份文件（app 字段应为 "${EXPORT_APP}"，实际为 ${JSON.stringify(obj.app)}）。`);
  }
  if (!Number.isSafeInteger(obj.version) || obj.version < 1) {
    errors.push('缺少有效的版本号 version。');
  } else if (obj.version > EXPORT_VERSION) {
    errors.push(`备份版本 v${obj.version} 高于当前网站支持的 v${EXPORT_VERSION}，请先更新网站版本。`);
  }
  if (!obj.data || typeof obj.data !== 'object') {
    errors.push('缺少 data 字段。');
  }

  const data = obj.data || {};
  const kanaStats = data.kanaStats;
  const daily = data.daily;
  const settings = data.settings;

  if (!Array.isArray(kanaStats)) errors.push('data.kanaStats 应为数组。');
  if (!Array.isArray(daily)) errors.push('data.daily 应为数组。');
  if (settings !== undefined && !Array.isArray(settings)) errors.push('data.settings 应为数组。');

  const cleanStats = [];
  const statIds = new Set();
  if (Array.isArray(kanaStats)) {
    kanaStats.forEach((s, i) => {
      if (!s || typeof s !== 'object') return errors.push(`kanaStats[${i}] 不是对象。`);
      if (typeof s.id !== 'string' || !s.id) return errors.push(`kanaStats[${i}].id 缺失。`);
      if (!KANA_BY_ID.has(s.id)) return errors.push(`kanaStats[${i}].id 不是有效假名。`);
      if (statIds.has(s.id)) return errors.push(`kanaStats[${i}].id 重复：${s.id}。`);
      statIds.add(s.id);
      const { attempts, correct, wrong } = s;
      if (!isCount(attempts)) return errors.push(`kanaStats[${i}].attempts 应为非负整数。`);
      if (!isCount(correct) || !isCount(wrong) || correct + wrong !== attempts) {
        return errors.push(`kanaStats[${i}].correct 与 attempts 不一致。`);
      }
      if (!isTimestamp(s.lastAt) || !isTimestamp(s.firstAt) ||
          (attempts > 0 && (s.firstAt === null || s.lastAt === null || s.firstAt > s.lastAt)) ||
          (attempts === 0 && (s.lastResult !== null || s.lastAt !== null || s.firstAt !== null)) ||
          (attempts > 0 && !['correct', 'wrong'].includes(s.lastResult)) ||
          (s.lastResult === 'correct' && correct === 0) || (s.lastResult === 'wrong' && wrong === 0)) {
        return errors.push(`kanaStats[${i}] 最近结果或时间与统计不一致。`);
      }
      cleanStats.push({
        id: s.id,
        attempts,
        correct,
        wrong,
        lastResult: s.lastResult === 'correct' || s.lastResult === 'wrong' ? s.lastResult : null,
        lastAt: s.lastAt,
        firstAt: s.firstAt,
      });
    });
  }

  const cleanDaily = [];
  const datesSeen = new Set();
  if (Array.isArray(daily)) {
    daily.forEach((d, i) => {
      if (!d || typeof d !== 'object') return errors.push(`daily[${i}] 不是对象。`);
      if (!isCalendarDate(d.date)) return errors.push(`daily[${i}].date 应为有效的 YYYY-MM-DD 日期。`);
      if (datesSeen.has(d.date)) return errors.push(`daily[${i}].date 重复：${d.date}。`);
      datesSeen.add(d.date);
      const { total, correct, rounds } = d;
      if (!isCount(total)) return errors.push(`daily[${i}].total 应为非负整数。`);
      if (!isCount(correct) || correct > total) return errors.push(`daily[${i}].correct 与 total 不一致。`);
      if (!isCount(rounds) || !isTimestamp(d.updatedAt)) return errors.push(`daily[${i}] 轮次或更新时间无效。`);
      cleanDaily.push({
        date: d.date,
        total,
        correct,
        rounds,
        updatedAt: d.updatedAt,
      });
    });
  }

  const cleanSettings = [];
  const settingKeys = new Set();
  if (Array.isArray(settings)) {
    settings.forEach((s, i) => {
      if (!s || typeof s !== 'object' || typeof s.key !== 'string') return errors.push(`settings[${i}] 结构无效。`);
      if (settingKeys.has(s.key)) return errors.push(`settings[${i}].key 重复：${s.key}。`);
      settingKeys.add(s.key);
      cleanSettings.push({ key: s.key, value: s.value });
    });
  }

  if (errors.length) {
    return { ok: false, errors, preview: null, payload: null };
  }

  const dates = cleanDaily.map((d) => d.date).sort();
  const totalAnswered = cleanDaily.reduce((a, d) => a + d.total, 0);
  const totalCorrect = cleanDaily.reduce((a, d) => a + d.correct, 0);

  return {
    ok: true,
    errors: [],
    preview: {
      exportedAt: obj.exportedAt || null,
      version: obj.version,
      kanaRows: cleanStats.length,
      practicedKana: cleanStats.filter((s) => s.attempts > 0).length,
      dailyRows: cleanDaily.length,
      dateFrom: dates[0] || null,
      dateTo: dates[dates.length - 1] || null,
      totalAnswered,
      totalCorrect,
      accuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : null,
      settingsRows: cleanSettings.length,
    },
    payload: { kanaStats: cleanStats, daily: cleanDaily, settings: cleanSettings },
  };
}

/**
 * 用校验后的数据覆盖本地记录。
 * 先备份现有数据；若写入失败，自动回滚为原数据，保证原数据不被损坏。
 */
async function importAll(payload) {
  const backup = {
    kanaStats: await getKanaStats(),
    daily: await getAll('daily'),
    settings: await getAll('settings'),
  };

  const writeAll = async (data) => {
    const db = await openDB();
    const tx = db.transaction(['kanaStats', 'daily', 'settings'], 'readwrite');
    const s1 = tx.objectStore('kanaStats');
    const s2 = tx.objectStore('daily');
    const s3 = tx.objectStore('settings');
    s1.clear();
    s2.clear();
    s3.clear();
    for (const row of data.kanaStats) s1.put(row);
    for (const row of data.daily) s2.put(row);
    for (const row of data.settings) s3.put(row);
    await txDone(tx); // 任一条写入失败 → 事务整体回滚
  };

  try {
    await writeAll(payload);
    return { ok: true };
  } catch (err) {
    // 尝试把原数据写回，确保用户不会因为一次失败导入而丢失记录
    try {
      await writeAll(backup);
    } catch (e2) {
      return {
        ok: false,
        error: `导入失败且自动回滚也失败：${err.message}。原数据仍在浏览器中，请刷新页面确认。`,
      };
    }
    return { ok: false, error: `导入失败，已自动恢复为导入前的数据（原因：${err.message}）。` };
  }
}

/** 清空全部练习记录（保留设置）。调用方必须做二次确认。 */
async function clearAllRecords() {
  const db = await openDB();
  const tx = db.transaction(['kanaStats', 'daily'], 'readwrite');
  tx.objectStore('kanaStats').clear();
  tx.objectStore('daily').clear();
  await txDone(tx);
}

/* 暴露到全局（无构建工具，直接用 script 标签引入） */
window.GojuonDB = {
  DB_NAME,
  EXPORT_VERSION,
  openDB,
  todayKey,
  getKanaStats,
  getKanaStatsMap,
  getDailyRecords,
  getSettings,
  setSetting,
  recordAnswer,
  bumpRound,
  exportAll,
  validateImport,
  importAll,
  clearAllRecords,
};
