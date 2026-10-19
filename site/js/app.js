/*
 * app.js — 五十音练习 主逻辑
 * 纯原生 JavaScript，无框架、无构建、无外部请求。
 */
(function () {
  'use strict';

  const DB = window.GojuonDB;
  const KANA_STORE_KEY = 'lastSetup';

  /* ======================================================================
     工具函数
     ====================================================================== */

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  /* 条形图下方只显示「日」，避免 14 个完整日期把一行撑宽 */
  function dayOfMonth(dateStr) {
    return String(Number(dateStr.split('-')[2]));
  }

  function fmtTime(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s} 秒`;
    return `${Math.floor(s / 60)} 分 ${s % 60} 秒`;
  }

  function relTime(ts) {
    if (!ts) return '—';
    const diff = Date.now() - ts;
    if (diff < 60e3) return '刚刚';
    if (diff < 3600e3) return `${Math.floor(diff / 60e3)} 分钟前`;
    if (diff < 86400e3) return `${Math.floor(diff / 3600e3)} 小时前`;
    if (diff < 7 * 86400e3) return `${Math.floor(diff / 86400e3)} 天前`;
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  /* 状态描述：明确区分「未练习」与「答错」 */
  function kanaState(stat) {
    if (!stat || !stat.attempts) {
      return { key: 'none', label: '未练习', badge: 'badge--none', accuracy: null, attempts: 0, correct: 0 };
    }
    const accuracy = Math.round((stat.correct / stat.attempts) * 100);
    if (stat.lastResult === 'wrong') {
      return { key: 'wrong', label: '待复习', badge: 'badge--bad', accuracy, attempts: stat.attempts, correct: stat.correct };
    }
    if (accuracy >= 80) {
      return { key: 'good', label: '已掌握', badge: 'badge--ok', accuracy, attempts: stat.attempts, correct: stat.correct };
    }
    return { key: 'weak', label: '练习中', badge: 'badge--warn', accuracy, attempts: stat.attempts, correct: stat.correct };
  }

  function accuracyText(st) {
    return st.accuracy === null ? '—' : `${st.accuracy}%`;
  }

  /* ======================================================================
     应用状态
     ====================================================================== */

  const state = {
    view: 'home',
    dbOk: true,
    dbError: null,
    stats: new Map(),
    daily: [],
    settings: { kanaFont: 'sans', speech: false },
    chart: { script: 'hira', filter: 'all' },
    me: { filter: 'all', script: 'both' },
    review: { script: 'both' },
    quiz: null,
    setup: { script: 'hira', rows: [], mode: 'kana2romaji', count: 10, preferUnpracticed: true },
    online: navigator.onLine,
    swReady: false,
  };

  const MODE_LABEL = {
    kana2romaji: '看假名选罗马音',
    romaji2kana: '看罗马音选假名',
    mixed: '混合出题',
  };
  const SCRIPT_LABEL_SETUP = { hira: '平假名', kata: '片假名', both: '平假名+片假名' };

  /* ======================================================================
     数据读写（含内存降级）
     ====================================================================== */

  function dbFail(err) {
    if (state.dbOk) {
      state.dbOk = false;
      state.dbError = err && err.message ? err.message : String(err);
      render();
      toast('本地保存不可用，本次练习不会保存记录', 'bad', 4200);
    }
  }

  async function loadAll() {
    try {
      const [stats, daily, settings] = await Promise.all([
        DB.getKanaStats(),
        DB.getDailyRecords(),
        DB.getSettings(),
      ]);
      state.stats = new Map(stats.map((s) => [s.id, s]));
      state.daily = daily;
      state.settings = {
        kanaFont: settings.kanaFont === 'serif' ? 'serif' : 'sans',
        speech: !!settings.speech,
      };
      if (settings.lastSetup && typeof settings.lastSetup === 'object') {
        state.setup = Object.assign(state.setup, settings.lastSetup);
      }
      state.dbOk = true;
    } catch (err) {
      dbFail(err);
    }
  }

  async function persistSetting(key, value) {
    state.settings[key] = value;
    if (!state.dbOk) return;
    try {
      await DB.setSetting(key, value);
    } catch (err) {
      dbFail(err);
    }
  }

  async function persistSetup() {
    if (!state.dbOk) return;
    try {
      await DB.setSetting(KANA_STORE_KEY, state.setup);
    } catch (err) {
      dbFail(err);
    }
  }

  /* 记录一次答题：先写库，再同步内存；库不可用时仅内存 */
  async function recordAnswer(id, correct) {
    if (state.dbOk) {
      try {
        await DB.recordAnswer({ id, correct });
      } catch (err) {
        dbFail(err);
      }
    }
    const now = Date.now();
    const prev = state.stats.get(id) || {
      id, attempts: 0, correct: 0, wrong: 0, lastResult: null, lastAt: null, firstAt: null,
    };
    state.stats.set(id, {
      ...prev,
      attempts: prev.attempts + 1,
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      lastResult: correct ? 'correct' : 'wrong',
      lastAt: now,
      firstAt: prev.firstAt || now,
    });

    const date = DB.todayKey();
    let day = state.daily.find((d) => d.date === date);
    if (!day) {
      day = { date, total: 0, correct: 0, rounds: 0, updatedAt: now };
      state.daily.unshift(day);
      state.daily.sort((a, b) => (a.date < b.date ? 1 : -1));
    }
    day.total += 1;
    day.correct += correct ? 1 : 0;
    day.updatedAt = now;
  }

  async function finishRound() {
    if (!state.dbOk) return;
    try {
      await DB.bumpRound();
    } catch (err) {
      dbFail(err);
    }
    const today = state.daily.find((d) => d.date === DB.todayKey());
    if (today) today.rounds += 1;
  }

  /* ======================================================================
     派生数据
     ====================================================================== */

  function scriptPool(script) {
    return KANA_LIST.filter((k) => (script === 'both' ? true : k.script === script));
  }

  function buildPool(setup) {
    let pool = scriptPool(setup.script || 'hira');
    const rows = setup.rows || [];
    if (rows.length) pool = pool.filter((k) => rows.includes(k.rowId));
    return pool;
  }

  function wrongList(script) {
    return KANA_LIST.filter((k) => {
      if (script && script !== 'both' && k.script !== script) return false;
      const s = state.stats.get(k.id);
      return s && s.attempts > 0 && s.lastResult === 'wrong';
    });
  }

  function calcStreak() {
    const days = new Set(state.daily.filter((d) => d.total > 0).map((d) => d.date));
    if (!days.size) return 0;
    const d = new Date();
    if (!days.has(DB.todayKey(d))) {
      d.setDate(d.getDate() - 1);
      if (!days.has(DB.todayKey(d))) return 0;
    }
    let streak = 0;
    while (days.has(DB.todayKey(d))) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function totals() {
    let total = 0;
    let correct = 0;
    for (const d of state.daily) {
      total += d.total;
      correct += d.correct;
    }
    return { total, correct, accuracy: total ? Math.round((correct / total) * 100) : null };
  }

  function todayTotals() {
    const d = state.daily.find((x) => x.date === DB.todayKey());
    if (!d || !d.total) return { total: 0, correct: 0, accuracy: null, rounds: 0 };
    return { total: d.total, correct: d.correct, accuracy: Math.round((d.correct / d.total) * 100), rounds: d.rounds };
  }

  /* ======================================================================
     语音（系统合成音，可选；绝不称为真人发音）
     ====================================================================== */

  let jaVoice = null;
  function refreshVoices() {
    if (!('speechSynthesis' in window)) return;
    const list = window.speechSynthesis.getVoices() || [];
    jaVoice = list.find((v) => /^ja/i.test(v.lang || '')) || null;
  }
  if ('speechSynthesis' in window) {
    refreshVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  }

  function speak(text) {
    if (!state.settings.speech) return;
    if (!('speechSynthesis' in window)) {
      toast('当前浏览器不支持语音朗读', 'bad');
      return;
    }
    refreshVoices();
    if (!jaVoice) {
      toast('当前设备没有日语语音音色，无法朗读。不影响文字练习。', 'bad', 3600);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.voice = jaVoice;
    u.lang = 'ja-JP';
    u.rate = 0.85;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      toast('朗读失败：' + e.message, 'bad');
    }
  }

  /* ======================================================================
     提示条 / 弹层
     ====================================================================== */

  let toastTimer = null;
  function toast(msg, kind, ms) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast' + (kind ? ` toast--${kind}` : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms || 2400);
  }

  let sheetResolve = null;
  function openSheet(html) {
    const wrap = document.getElementById('sheet-backdrop');
    document.getElementById('sheet-body').innerHTML = html;
    wrap.hidden = false;
  }
  function closeSheet(result) {
    document.getElementById('sheet-backdrop').hidden = true;
    document.getElementById('sheet-body').innerHTML = '';
    if (sheetResolve) {
      const r = sheetResolve;
      sheetResolve = null;
      r(result);
    }
  }
  function confirmSheet({ title, desc, confirmText, cancelText, danger }) {
    return new Promise((resolve) => {
      sheetResolve = resolve;
      openSheet(`
        <h3 class="sheet__title">${esc(title)}</h3>
        <p class="sheet__desc">${desc}</p>
        <div class="btn-row" style="margin-top:16px">
          <button class="btn" data-act="close-sheet" data-v="cancel">${esc(cancelText || '取消')}</button>
          <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-act="close-sheet" data-v="ok">${esc(confirmText || '确定')}</button>
        </div>
      `);
    });
  }

  /* ======================================================================
     渲染：顶栏 / 底部导航
     ====================================================================== */

  const TABS = [
    { id: 'home', label: '首页' },
    { id: 'chart', label: '五十音表' },
    { id: 'quiz', label: '测验' },
    { id: 'review', label: '错题' },
    { id: 'me', label: '我的' },
  ];

  function renderTopbar() {
    const el = document.getElementById('topbar-right');
    const net = state.online
      ? '<span class="chip chip--ok"><i class="dot"></i>在线</span>'
      : '<span class="chip chip--off"><i class="dot"></i>离线可用</span>';
    const save = state.dbOk ? '' : '<span class="chip chip--off">未保存</span>';
    el.innerHTML = save + net;
  }

  function renderTabbar() {
    const wc = wrongList().length;
    document.getElementById('tabbar').innerHTML = TABS.map((t) => {
      const badge = t.id === 'review' && wc ? `<span class="tabbar__count">${wc > 99 ? '99+' : wc}</span>` : '';
      return `<button class="tabbar__btn ${state.view === t.id ? 'is-on' : ''}" data-act="nav" data-v="${t.id}">
        ${badge}<span class="tabbar__dot"></span><span>${t.label}</span>
      </button>`;
    }).join('');
  }

  /* ======================================================================
     渲染：首页
     ====================================================================== */

  function renderHome() {
    const t = todayTotals();
    const all = totals();
    const streak = calcStreak();
    const pool = scriptPool(state.setup.script || 'hira');
    const practiced = pool.filter((k) => {
      const s = state.stats.get(k.id);
      return s && s.attempts > 0;
    }).length;
    const unpracticed = pool.length - practiced;
    const wc = wrongList(state.setup.script === 'both' ? null : state.setup.script).length;
    const pct = pool.length ? Math.round((practiced / pool.length) * 100) : 0;

    const rowsTxt = (state.setup.rows || []).length
      ? state.setup.rows.map((r) => (ROW_OPTIONS.find((x) => x.id === r) || {}).label || r).join('、')
      : '全部（あ行〜ん）';

    return `
    <section class="view is-active" id="view-home">
      <div class="card card--hero">
        <h2 class="hero-title">继续练习五十音</h2>
        <p class="hero-desc">不需要注册、不需要登录。练习记录只保存在这台设备的浏览器里。</p>
        <div class="notice notice--warn">请用 Safari 等浏览器的<strong>普通标签页</strong>练习。无痕／隐私浏览的记录可能在关闭会话后丢失。重要记录可到「我的」导出备份。</div>
        <div class="seg" style="margin:14px 0" aria-label="练习假名种类">
          ${['hira', 'kata', 'both'].map((s) => `<button class="seg__btn ${state.setup.script === s ? 'is-on' : ''}" data-act="home-script" data-v="${s}">${SCRIPT_LABEL_SETUP[s]}</button>`).join('')}
        </div>
        <div class="hero-meta">
          <span class="chip">${esc(SCRIPT_LABEL_SETUP[state.setup.script] || '平假名')}</span>
          <span class="chip">${esc(MODE_LABEL[state.setup.mode] || '看假名选罗马音')}</span>
          <span class="chip">${esc(rowsTxt)}</span>
          <span class="chip">每轮 ${state.setup.count} 题</span>
        </div>
        <button class="btn btn--primary btn--lg btn--block" data-act="quick-start">开始练习（${state.setup.count} 题）</button>
        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn--sm" data-act="nav" data-v="chart">看五十音表</button>
          <button class="btn btn--sm" data-act="nav" data-v="quiz">调整设置</button>
          <button class="btn btn--sm" data-act="nav" data-v="review">错题复习${wc ? `（${wc}）` : ''}</button>
        </div>
      </div>

      <div class="section-title">今天 <small>${DB.todayKey()}</small></div>
      <div class="card">
        <div class="stat-row">
          <div class="stat"><div class="stat__num">${t.total}</div><div class="stat__label">今日答题</div></div>
          <div class="stat"><div class="stat__num">${t.accuracy === null ? '—' : t.accuracy + '<small>%</small>'}</div><div class="stat__label">今日正确率</div></div>
          <div class="stat"><div class="stat__num">${streak}<small> 天</small></div><div class="stat__label">连续练习</div></div>
        </div>
        ${t.total === 0 ? '<div class="notice" style="margin-top:12px">今天还没有练习记录，随时开始都来得及。</div>' : ''}
      </div>

      <div class="section-title">掌握进度 <small>${esc(SCRIPT_LABEL_SETUP[state.setup.script] || '平假名')}清音 ${pool.length} 音</small></div>
      <div class="card">
        <div class="kv"><span class="kv__k">已练习</span><span class="kv__v">${practiced} / ${pool.length}</span></div>
        <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
        <div class="kv" style="margin-top:8px"><span class="kv__k">还没练习过</span><span class="kv__v">${unpracticed} 个</span></div>
        <div class="kv"><span class="kv__k">待复习（最近一次答错）</span><span class="kv__v">${wc} 个</span></div>
        <div class="kv"><span class="kv__k">累计答题 / 正确率</span><span class="kv__v">${all.total} 题 / ${all.accuracy === null ? '—' : all.accuracy + '%'}</span></div>
      </div>

      <div class="section-title">按行练习 <small>${esc(SCRIPT_LABEL_SETUP[state.setup.script])}</small></div>
      <div class="card">
        <div class="row-practice">
          ${ROW_OPTIONS.map((r) => {
            const items = KANA_LIST.filter((k) => k.rowId === r.id && k.script === (state.setup.script === 'kata' ? 'kata' : 'hira'));
            const label = state.setup.script === 'kata' ? (r.id === 'n' ? 'ン' : `${items[0].kana}行`) : r.label;
            return `<button class="btn" data-act="row-quiz" data-v="${r.id}">${esc(label)} <small>${esc(items.map((k) => k.kana).join(' '))}</small></button>`;
          }).join('')}
        </div>
        <div class="notice">点任意一行，直接用这一行的假名开始一轮 ${state.setup.count} 题测验。</div>
      </div>
    </section>`;
  }

  /* ======================================================================
     渲染：五十音表
     ====================================================================== */

  function kanaCellHTML(k) {
    const st = kanaState(state.stats.get(k.id));
    let cls = 'kana-cell';
    let mark = '';
    if (st.key === 'good') { cls += ' kana-cell--practiced'; mark = '✓'; }
    else if (st.key === 'weak') { cls += ' kana-cell--weak'; mark = '△'; }
    else if (st.key === 'wrong') { cls += ' kana-cell--wrong'; mark = '!'; }
    return `<td><button class="${cls}" data-act="kana" data-id="${esc(k.id)}"
      aria-label="${esc(k.kana)}，罗马音 ${esc(k.romaji)}，${esc(st.label)}">
      <span class="kana-cell__kana">${esc(k.kana)}</span>
      <span class="kana-cell__romaji">${esc(k.romaji)}</span>
      ${mark ? `<span class="kana-cell__mark">${mark}</span>` : ''}
    </button></td>`;
  }

  function renderChart() {
    const script = state.chart.script;
    const filter = state.chart.filter;
    const key = script === 'hira' ? 'hira' : 'kata';

    const rowsToShow = filter === 'all' ? GOJUON_ROWS : GOJUON_ROWS.filter((r) => r.id === filter);
    const showN = filter === 'all' || filter === 'n';

    const head = `<tr><th class="row-head"></th>${COLUMNS.map((c) => `<th>${c}</th>`).join('')}</tr>`;

    let body = '';
    for (const row of rowsToShow) {
      const chars = row[key];
      let tds = '';
      for (let i = 0; i < 5; i++) {
        const kana = chars[i];
        if (!kana) { tds += '<td><div class="kana-cell kana-cell--empty"></div></td>'; continue; }
        const k = KANA_BY_ID.get(`${script}:${kana}`);
        tds += k ? kanaCellHTML(k) : '<td><div class="kana-cell kana-cell--empty"></div></td>';
      }
      body += `<tr><th class="row-head">${row.label}</th>${tds}</tr>`;
    }
    if (showN) {
      const k = KANA_BY_ID.get(`${script}:${key === 'hira' ? 'ん' : 'ン'}`);
      body += `<tr><th class="row-head">ん</th>${k ? kanaCellHTML(k) : ''}<td></td><td></td><td></td><td></td></tr>`;
    }

    const pool = scriptPool(script);
    const practiced = pool.filter((k) => (state.stats.get(k.id) || {}).attempts > 0).length;

    return `
    <section class="view is-active" id="view-chart">
      <div class="seg">
        <button class="seg__btn ${script === 'hira' ? 'is-on' : ''}" data-act="chart-script" data-v="hira">平假名 ひらがな</button>
        <button class="seg__btn ${script === 'kata' ? 'is-on' : ''}" data-act="chart-script" data-v="kata">片假名 カタカナ</button>
      </div>

      <div class="filter-row">
        <button class="btn btn--sm ${filter === 'all' ? 'btn--soft' : ''}" data-act="chart-filter" data-v="all">全部</button>
        ${ROW_OPTIONS.map((r) => `<button class="btn btn--sm ${filter === r.id ? 'btn--soft' : ''}" data-act="chart-filter" data-v="${r.id}">${r.label}</button>`).join('')}
      </div>

      <div class="card">
        <table class="kana-table">
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
        <div class="legend">
          <span><i style="background:#fff"></i>未练习</span>
          <span><i style="background:var(--ok-soft);border-color:#cfe9da"></i>正确率 ≥80%</span>
          <span><i style="background:var(--warn-soft);border-color:#f0dcb4"></i>正确率 &lt;80%</span>
          <span><i style="background:var(--bad-soft);border-color:#f3cdc9"></i>最近答错</span>
          <span><i style="background:#f7f2eb;border-style:dashed"></i>空位（五十音图无此音）</span>
        </div>
        <div class="notice">点任意一个假名可以看它的练习统计。已练习 ${practiced} / ${pool.length} 音。</div>
      </div>

      <div class="section-title">分行学习 <small>点一行直接开练</small></div>
      <div class="card">
        <div class="row-practice">
          ${ROW_OPTIONS.map((r) => `<button class="btn" data-act="row-quiz" data-v="${r.id}">${r.label} <small>${esc(r.preview)}</small></button>`).join('')}
        </div>
      </div>
    </section>`;
  }

  /* ======================================================================
     渲染：测验
     ====================================================================== */

  function renderQuiz() {
    if (!state.quiz) return renderQuizSetup();
    if (!state.quiz.finished) return renderQuizQuestion();
    return renderQuizResult();
  }

  function renderQuizSetup() {
    const setup = state.setup;
    const pool = buildPool(setup);
    const rowsLabel = setup.rows.length ? setup.rows.map((r) => (ROW_OPTIONS.find((x) => x.id === r) || {}).label).join('、') : '全部';

    return `
    <section class="view is-active" id="view-quiz">
      <div class="section-title">出题范围 <small>可多选</small></div>
      <div class="card">
        <div class="filter-row">
          <button class="btn btn--sm ${setup.rows.length === 0 ? 'btn--soft' : ''}" data-act="setup-all">全部</button>
          ${ROW_OPTIONS.map((r) => `<button class="btn btn--sm ${setup.rows.includes(r.id) ? 'btn--soft' : ''}" data-act="setup-row" data-v="${r.id}">${r.label}</button>`).join('')}
        </div>
        <div class="notice">当前范围：${esc(rowsLabel)} · 共 ${pool.length} 个假名${pool.length < 4 ? '。范围不足 4 个，干扰选项会自动从整张假名表里补足。' : ''}</div>
      </div>

      <div class="section-title">假名种类</div>
      <div class="card">
        <div class="seg">
          ${['hira', 'kata', 'both'].map((s) => `<button class="seg__btn ${setup.script === s ? 'is-on' : ''}" data-act="setup-script" data-v="${s}">${SCRIPT_LABEL_SETUP[s]}</button>`).join('')}
        </div>
      </div>

      <div class="section-title">题型</div>
      <div class="card">
        <div class="seg">
          ${['kana2romaji', 'romaji2kana', 'mixed'].map((m) => `<button class="seg__btn ${setup.mode === m ? 'is-on' : ''}" data-act="setup-mode" data-v="${m}">${MODE_LABEL[m]}</button>`).join('')}
        </div>
        <div class="notice">每轮 10 题，选项不重复，只有一个正确答案。答完一题会先显示正确答案，由你点「下一题」再继续。</div>
      </div>

      <div class="section-title">每轮题数</div>
      <div class="card">
        <div class="seg">
          ${[10, 20].map((n) => `<button class="seg__btn ${setup.count === n ? 'is-on' : ''}" data-act="setup-count" data-v="${n}">${n} 题</button>`).join('')}
        </div>
        <label class="kv" style="cursor:pointer">
          <span class="kv__k">优先出还没练习过的假名</span>
          <span class="kv__v"><input type="checkbox" data-act="setup-prefer" ${setup.preferUnpracticed ? 'checked' : ''} style="width:22px;height:22px"></span>
        </label>
      </div>

      <div style="margin-top:18px">
        <button class="btn btn--primary btn--lg btn--block" data-act="start-quiz" ${pool.length === 0 ? 'disabled' : ''}>
          ${pool.length === 0 ? '假名太少，无法出题' : `开始测验（${setup.count} 题）`}
        </button>
      </div>
      ${pool.length === 0 ? '<div class="notice notice--warn">请选择至少一个假名；范围较小时会从完整假名表补充干扰选项。</div>' : ''}
    </section>`;
  }

  function renderQuizQuestion() {
    const q = state.quiz;
    const cur = q.questions[q.index];
    const answered = cur.chosen !== null;
    const isRomajiQuestion = cur.mode === 'kana2romaji';
    const optionCls = 'option' + (isRomajiQuestion ? ' option--romaji' : '');

    const opts = cur.options.map((key) => {
      let cls = optionCls;
      if (answered) {
        if (key === cur.correctKey) cls += ' is-correct';
        else if (key === cur.chosen) cls += ' is-wrong';
        else cls += ' is-dim';
      }
      return `<button class="${cls}" data-act="pick" data-v="${esc(key)}" ${answered ? 'disabled' : ''}>${esc(key)}</button>`;
    }).join('');

    const feedback = answered
      ? `<div class="feedback ${cur.isCorrect ? 'feedback--ok' : 'feedback--bad'}">
           ${cur.isCorrect ? '答对了' : `答错了，正确答案是 <span class="feedback__answer">${esc(cur.correctKey)}</span>`}
           ${cur.isCorrect ? `<span class="feedback__answer">${esc(cur.target.kana)} · ${esc(cur.target.romaji)}</span>` : `<span style="font-weight:500;font-size:12.5px;opacity:.85">（${esc(cur.target.kana)} · ${esc(cur.target.romaji)} · ${esc(cur.target.rowLabel)}）</span>`}
         </div>`
      : '';

    const speakBtn = state.settings.speech && answered
      ? `<button class="btn btn--sm btn--teal" data-act="speak" data-text="${esc(cur.target.kana)}">朗读（系统语音）</button>`
      : '';

    return `
    <section class="view is-active" id="view-quiz">
      <div class="quiz-progress">
        <span>第 ${q.index + 1} / ${q.questions.length} 题</span>
        <div class="progress"><div class="progress__bar" style="width:${Math.round(((q.index + 1) / q.questions.length) * 100)}%"></div></div>
        <span>答对 ${q.score}</span>
      </div>

      <div class="question-card">
        <div class="question-hint">${isRomajiQuestion ? '看假名，选出正确的罗马音' : '看罗马音，选出正确的假名'}</div>
        <div class="question-main ${isRomajiQuestion ? '' : 'question-main--romaji'}">${esc(isRomajiQuestion ? cur.target.kana : cur.target.romaji)}</div>
        <div class="question-hint" style="margin-top:4px">${esc(SCRIPT_LABEL[cur.target.script])} · ${esc(cur.target.rowLabel)}</div>
      </div>

      <div class="options">${opts}</div>
      ${feedback}

      <div style="margin-top:16px">
        ${answered
          ? `<button class="btn btn--primary btn--lg btn--block" data-act="next">${q.index + 1 >= q.questions.length ? '看本轮结果' : '下一题'}</button>`
          : '<div class="notice">选一个答案吧，选完会显示正确答案，不会自动跳走。</div>'}
      </div>
      <div class="btn-row" style="margin-top:10px">
        ${speakBtn}
        <button class="btn btn--sm btn--ghost" data-act="quit-quiz">结束本轮</button>
      </div>
    </section>`;
  }

  function renderQuizResult() {
    const q = state.quiz;
    const n = q.questions.length;
    const acc = Math.round((q.score / n) * 100);
    const wrongs = q.questions.filter((x) => x.chosen !== null && !x.isCorrect);
    const skipped = q.questions.filter((x) => x.chosen === null).length;
    const elapsed = fmtTime(Date.now() - q.startedAt);
    const [elapsedNum, elapsedUnit] = elapsed.split(' ');

    return `
    <section class="view is-active" id="view-quiz">
      <div class="card card--hero">
        <div class="question-hint" style="text-align:center">本轮结果</div>
        <div class="result-score">${q.score}<small> / ${n}</small></div>
        <div class="stat-row">
          <div class="stat"><div class="stat__num">${acc}<small>%</small></div><div class="stat__label">正确率</div></div>
          <div class="stat"><div class="stat__num">${esc(elapsedNum)}<small> ${esc(elapsedUnit || '')}</small></div><div class="stat__label">用时</div></div>
          <div class="stat"><div class="stat__num">${wrongs.length}</div><div class="stat__label">本轮错题</div></div>
        </div>
        ${skipped ? `<div class="notice notice--warn" style="margin-top:12px">有 ${skipped} 题没作答，不计入错题本。</div>` : ''}
      </div>

      ${wrongs.length ? `
      <div class="section-title">本轮错题 <small>已记入错题本</small></div>
      <div class="card"><div class="list">
        ${wrongs.map((w) => `<div class="list-item">
          <div class="list-item__kana">${esc(w.target.kana)}</div>
          <div class="list-item__body">
            <div class="list-item__title">${esc(w.target.romaji)}</div>
            <div class="list-item__sub">${esc(SCRIPT_LABEL[w.target.script])} · ${esc(w.target.rowLabel)} · 你选了 ${esc(w.chosen)}</div>
          </div>
        </div>`).join('')}
      </div></div>` : `
      <div class="section-title">本轮错题</div>
      <div class="card"><div class="empty">本轮全部答对，没有错题。</div></div>`}

      <div style="margin-top:18px">
        <button class="btn btn--primary btn--lg btn--block" data-act="start-quiz">再练一轮（${state.setup.count} 题）</button>
      </div>
      <div class="btn-row" style="margin-top:10px">
        ${wrongs.length ? '<button class="btn" data-act="review-round">复习本轮错题</button>' : ''}
        <button class="btn" data-act="nav" data-v="review">打开错题本</button>
        <button class="btn" data-act="nav" data-v="home">回首页</button>
      </div>
    </section>`;
  }

  /* ======================================================================
     渲染：错题复习
     ====================================================================== */

  function renderReview() {
    const list = wrongList(state.review.script);
    const all = wrongList();
    const hira = all.filter((k) => k.script === 'hira');
    const kata = all.filter((k) => k.script === 'kata');

    return `
    <section class="view is-active" id="view-review">
      <div class="card card--hero">
        <h2 class="hero-title">错题本</h2>
        <p class="hero-desc">这里收录「最近一次作答是错误」的假名。在复习中答对，它就会自动移出错题本；如果又答错，会继续留着。复习时干扰选项会从整张假名表里补充，保证凑满 4 个不重复的选项。</p>
        <div class="stat-row">
          <div class="stat"><div class="stat__num">${hira.length}</div><div class="stat__label">平假名</div></div>
          <div class="stat"><div class="stat__num">${kata.length}</div><div class="stat__label">片假名</div></div>
          <div class="stat"><div class="stat__num">${all.length}</div><div class="stat__label">合计</div></div>
        </div>
        <div class="seg" style="margin-top:14px" aria-label="错题假名种类">
          ${['both', 'hira', 'kata'].map((s) => `<button class="seg__btn ${state.review.script === s ? 'is-on' : ''}" data-act="review-script" data-v="${s}">${s === 'both' ? '全部' : SCRIPT_LABEL[s]}</button>`).join('')}
        </div>
        <div style="margin-top:14px">
          <button class="btn btn--primary btn--lg btn--block" data-act="start-review" ${list.length === 0 ? 'disabled' : ''}>
            ${list.length === 0 ? '暂无错题需要复习' : `开始复习（${list.length} 个假名）`}
          </button>
        </div>
      </div>

      <div class="section-title">待复习清单</div>
      <div class="card" data-role="wrong-list">
        ${list.length ? `<div class="list">
          ${list.map((k) => {
            const s = state.stats.get(k.id) || { attempts: 0, correct: 0, wrong: 0 };
            return `<div class="list-item">
              <div class="list-item__kana">${esc(k.kana)}</div>
              <div class="list-item__body">
                <div class="list-item__title">${esc(k.romaji)}</div>
                <div class="list-item__sub">${esc(SCRIPT_LABEL[k.script])} · ${esc(k.rowLabel)}</div>
              </div>
              <div class="list-item__right">
                <div class="badge badge--bad">错 ${s.wrong || 0} 次</div>
                <div style="margin-top:3px;font-size:11px;color:var(--text-3)">共练 ${s.attempts || 0} 次</div>
              </div>
            </div>`;
          }).join('')}
        </div>` : '<div class="empty">当前范围没有错题。<br>做一轮测验，答错的假名会自动出现在这里。</div>'}
      </div>

      <div class="section-title">易错排行 <small>按累计错误次数</small></div>
      <div class="card" data-role="top-wrong">
        ${renderTopWrong()}
      </div>
    </section>`;
  }

  function renderTopWrong() {
    const rows = scriptPool(state.review.script)
      .map((k) => ({ k, s: state.stats.get(k.id) }))
      .filter((x) => x.s && x.s.wrong > 0)
      .sort((a, b) => b.s.wrong - a.s.wrong || (a.s.correct / a.s.attempts) - (b.s.correct / b.s.attempts))
      .slice(0, 12);
    if (!rows.length) return '<div class="empty">还没有答错记录。</div>';
    return `<div class="list">${rows.map(({ k, s }) => `<div class="list-item">
      <div class="list-item__kana">${esc(k.kana)}</div>
      <div class="list-item__body">
        <div class="list-item__title">${esc(k.romaji)}</div>
        <div class="list-item__sub">${esc(SCRIPT_LABEL[k.script])}</div>
      </div>
      <div class="list-item__right">
        <div class="badge badge--bad">错 ${s.wrong}</div>
        <div style="margin-top:3px;font-size:11px;color:var(--text-3)">正确率 ${Math.round((s.correct / s.attempts) * 100)}%</div>
      </div>
    </div>`).join('')}</div>`;
  }

  /* ======================================================================
     渲染：我的（统计 / 设置 / 数据）
     ====================================================================== */

  function renderMe() {
    const t = todayTotals();
    const all = totals();
    const filter = state.me.filter;
    const rows = KANA_LIST.filter((k) => {
      if (state.me.script !== 'both' && k.script !== state.me.script) return false;
      const s = state.stats.get(k.id);
      const st = kanaState(s);
      if (filter === 'none') return st.key === 'none';
      if (filter === 'wrong') return st.key === 'wrong';
      if (filter === 'practiced') return st.key !== 'none';
      return true;
    });

    return `
    <section class="view is-active" id="view-me">
      <div class="section-title">练习总览</div>
      <div class="card">
        <div class="stat-row">
          <div class="stat"><div class="stat__num">${t.total}</div><div class="stat__label">今日答题</div></div>
          <div class="stat"><div class="stat__num">${t.accuracy === null ? '—' : t.accuracy + '<small>%</small>'}</div><div class="stat__label">今日正确率</div></div>
          <div class="stat"><div class="stat__num">${t.rounds}</div><div class="stat__label">今日轮次</div></div>
          <div class="stat"><div class="stat__num">${all.total}</div><div class="stat__label">累计答题</div></div>
          <div class="stat"><div class="stat__num">${all.accuracy === null ? '—' : all.accuracy + '<small>%</small>'}</div><div class="stat__label">累计正确率</div></div>
          <div class="stat"><div class="stat__num">${calcStreak()}<small> 天</small></div><div class="stat__label">连续练习</div></div>
        </div>
      </div>

      <div class="section-title">每日练习记录 <small>最近 14 天</small></div>
      <div class="card">
        ${renderDayChart()}
        <div class="notice">柱高代表当天答题数量。记录保存在浏览器本地，换设备不会同步。</div>
      </div>

      <div class="section-title">每个假名的练习次数与正确率 <small>${esc(SCRIPT_LABEL_SETUP[state.me.script])}</small></div>
      <div class="card">
        <div class="seg" aria-label="记录假名种类">
          ${['both', 'hira', 'kata'].map((script) => `<button class="seg__btn ${state.me.script === script ? 'is-on' : ''}" data-act="me-script" data-v="${script}">${script === 'both' ? '全部假名' : SCRIPT_LABEL[script]}</button>`).join('')}
        </div>
        <div class="filter-row">
          <button class="btn btn--sm ${filter === 'all' ? 'btn--soft' : ''}" data-act="me-filter" data-v="all">全部</button>
          <button class="btn btn--sm ${filter === 'practiced' ? 'btn--soft' : ''}" data-act="me-filter" data-v="practiced">已练习</button>
          <button class="btn btn--sm ${filter === 'none' ? 'btn--soft' : ''}" data-act="me-filter" data-v="none">未练习</button>
          <button class="btn btn--sm ${filter === 'wrong' ? 'btn--soft' : ''}" data-act="me-filter" data-v="wrong">待复习</button>
        </div>
        ${rows.length ? `<div class="list">${rows.map((k) => {
          const st = kanaState(state.stats.get(k.id));
          return `<div class="list-item">
            <div class="list-item__kana">${esc(k.kana)}</div>
            <div class="list-item__body">
              <div class="list-item__title">${esc(k.romaji)}</div>
              <div class="list-item__sub">${esc(k.rowLabel)}</div>
            </div>
            <div class="list-item__right">
              <div><span class="badge ${st.badge}">${st.label}</span></div>
              <div style="margin-top:3px;font-size:11px;color:var(--text-3)">
                ${st.key === 'none' ? '练习 0 次' : `练习 ${st.attempts} 次 · ${accuracyText(st)}`}
              </div>
            </div>
          </div>`;
        }).join('')}</div>` : '<div class="empty">这个筛选条件下没有假名。</div>'}
      </div>

      <div class="section-title">设置</div>
      <div class="card">
        <div class="kv">
          <span class="kv__k">假名字体</span>
          <span class="kv__v">
            <button class="btn btn--sm ${state.settings.kanaFont === 'sans' ? 'btn--soft' : ''}" data-act="set-font" data-v="sans">黑体</button>
            <button class="btn btn--sm ${state.settings.kanaFont === 'serif' ? 'btn--soft' : ''}" data-act="set-font" data-v="serif">明朝体</button>
          </span>
        </div>
        <div class="setting">
          <div class="setting__main">
            <div class="setting__title">朗读（系统日语语音，可选）</div>
            <div class="setting__desc">使用设备自带的语音合成，不是真人发音；没有日语音色时会提示，不影响练习</div>
          </div>
          <div class="setting__ctrl">
            <input type="checkbox" data-act="set-speech" ${state.settings.speech ? 'checked' : ''} style="width:24px;height:24px" aria-label="开启系统日语语音朗读">
          </div>
        </div>
        <div class="kv">
          <span class="kv__k">本站发音音频</span>
          <span class="kv__v" style="font-weight:500;color:var(--text-2)">暂未提供</span>
        </div>
        <div class="notice">本站没有内置真人录音，也没有调用任何在线语音接口。等有授权明确的日语音频后，会随站点一起提供并注明来源。</div>
      </div>

      <div class="section-title">数据备份</div>
      <div class="card">
        <div class="btn-row">
          <button class="btn btn--primary" data-act="export">导出 JSON</button>
          <button class="btn" data-act="import-pick">导入 JSON</button>
        </div>
        <div class="notice">换手机、换浏览器、清理网站数据之后，记录不会自动跟着走。请定期导出备份，需要时再导入恢复。无痕/隐私模式下数据在关闭窗口后会消失，不适合用来保存练习记录。</div>
      </div>

      <div class="section-title">清空记录</div>
      <div class="card">
        <button class="btn btn--danger btn--block" data-act="clear">清空全部练习记录</button>
        <div class="notice notice--warn">清空只影响本机浏览器中的练习记录，不影响你的设置；操作不可撤销，会二次确认。</div>
      </div>

      <div class="section-title">关于</div>
      <div class="card">
        <div class="kv"><span class="kv__k">内容范围</span><span class="kv__v">五十音图清音，平假名 46 音、片假名 46 音</span></div>
        <div class="kv"><span class="kv__k">本地数据</span><span class="kv__v">IndexedDB（${DB.DB_NAME}）</span></div>
        <div class="kv"><span class="kv__k">离线支持</span><span class="kv__v">Service Worker 缓存</span></div>
        <div class="kv"><span class="kv__k">外部资源</span><span class="kv__v">无（不含任何 CDN / 在线字体 / 在线语音）</span></div>
        <div class="kv"><span class="kv__k">备份格式版本</span><span class="kv__v">v${DB.EXPORT_VERSION}</span></div>
        ${state.dbOk ? '' : `<div class="notice notice--warn">本地数据库当前不可用：${esc(state.dbError || '未知原因')}。练习可以进行，但记录不会被保存。</div>`}
      </div>
    </section>`;
  }

  function renderDayChart() {
    const days = [];
    const d = new Date();
    for (let i = 13; i >= 0; i--) {
      const x = new Date(d);
      x.setDate(d.getDate() - i);
      days.push(DB.todayKey(x));
    }
    const map = new Map(state.daily.map((r) => [r.date, r]));
    const max = Math.max(1, ...days.map((k) => (map.get(k) || {}).total || 0));
    return `<div class="days">${days.map((k) => {
      const r = map.get(k);
      const total = r ? r.total : 0;
      const h = total ? Math.max(6, Math.round((total / max) * 62)) : 3;
      return `<div class="day" title="${k}：${total} 题">
        <div class="day__bar ${total ? '' : 'day__bar--zero'}" style="height:${h}px"></div>
        <div class="day__label">${dayOfMonth(k)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* ======================================================================
     总渲染
     ====================================================================== */

  const VIEW_RENDER = {
    home: renderHome,
    chart: renderChart,
    quiz: renderQuiz,
    review: renderReview,
    me: renderMe,
  };

  function render() {
    document.body.dataset.kanaFont = state.settings.kanaFont;
    renderTopbar();
    renderTabbar();
    document.getElementById('main').innerHTML = (VIEW_RENDER[state.view] || renderHome)();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function go(view) {
    if (!VIEW_RENDER[view]) return;
    if (view !== state.view) state.quiz = null;
    state.view = view;
    render();
  }

  /* ======================================================================
     测验引擎
     ====================================================================== */

  function keyOfMode(kana, mode) {
    return mode === 'kana2romaji' ? kana.romaji : kana.kana;
  }

  function buildOptions(pool, target, mode) {
    const correctKey = keyOfMode(target, mode);
    const size = Math.min(4, pool.length);
    const chosen = [correctKey];
    const seen = new Set(chosen);

    const sameRow = shuffle(pool.filter((k) => k.rowId === target.rowId && k.id !== target.id));
    const others = shuffle(pool.filter((k) => k.rowId !== target.rowId && k.id !== target.id));

    for (const cand of sameRow.concat(others)) {
      if (chosen.length >= size) break;
      const key = keyOfMode(cand, mode);
      if (seen.has(key)) continue; // 选项不重复
      seen.add(key);
      chosen.push(key);
    }
    return shuffle(chosen);
  }

  function pickTargets(pool, count, preferUnpracticed) {
    const bag = [];
    for (const k of pool) {
      let w = 1;
      if (preferUnpracticed) {
        const s = state.stats.get(k.id);
        if (!s || !s.attempts) w = 4;
        else if (s.lastResult === 'wrong') w = 3;
      }
      for (let i = 0; i < w; i++) bag.push(k);
    }
    const win = clamp(pool.length - 1, 1, 3);
    const recent = [];
    const out = [];
    while (out.length < count) {
      let pick = null;
      for (let t = 0; t < 50; t++) {
        const c = bag[Math.floor(Math.random() * bag.length)];
        if (recent.includes(c.id)) continue;
        pick = c;
        break;
      }
      if (!pick) pick = bag[Math.floor(Math.random() * bag.length)];
      out.push(pick);
      recent.push(pick.id);
      while (recent.length > win) recent.shift();
    }
    return out;
  }

  function startQuiz(opts) {
    const pool = opts.pool;
    if (pool.length === 0) {
      toast('请选择至少一个假名', 'bad');
      return;
    }
    const count = opts.count;
    const targets = pickTargets(pool, count, !!opts.preferUnpracticed);
    // 干扰项来源：目标池够 4 个就只在池内出题（例如「か行专项」更聚焦）；
    // 不够 4 个时（错题只有 2 个、や行只有 3 个…）扩展到同种类的整张表，
    // 这样选项始终能凑满 4 个且不重复。
    const fallbackOf = opts.fallbackOf || ((t) => scriptPool(t.script));
    const questions = targets.map((target) => {
      const distractorPool = pool.length >= 4 ? pool : fallbackOf(target);
      const mode = opts.mode === 'mixed'
        ? (Math.random() < 0.5 ? 'kana2romaji' : 'romaji2kana')
        : opts.mode;
      const options = buildOptions(distractorPool, target, mode);
      return {
        target,
        mode,
        options,
        correctKey: keyOfMode(target, mode),
        chosen: null,
        isCorrect: null,
      };
    });
    state.quiz = {
      questions,
      index: 0,
      score: 0,
      startedAt: Date.now(),
      finished: false,
      source: opts.source || 'normal',
      label: opts.label || '',
    };
    state.view = 'quiz';
    render();
  }

  async function answer(choice) {
    const q = state.quiz;
    if (!q || q.finished) return;
    const cur = q.questions[q.index];
    if (cur.chosen !== null) return;
    cur.chosen = choice;
    cur.isCorrect = choice === cur.correctKey;
    if (cur.isCorrect) q.score += 1;
    await recordAnswer(cur.target.id, cur.isCorrect);
    render();
  }

  async function nextQuestion() {
    const q = state.quiz;
    if (!q) return;
    if (q.index + 1 >= q.questions.length) {
      q.finished = true;
      await finishRound();
    } else {
      q.index += 1;
    }
    render();
  }

  /* ======================================================================
     导出 / 导入 / 清空
     ====================================================================== */

  async function doExport() {
    try {
      const payload = await DB.exportAll();
      const text = JSON.stringify(payload, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const name = `gojuon-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast(`已导出 ${payload.counts.practicedKana} 个假名的记录`, 'ok', 3000);
    } catch (err) {
      toast('导出失败：' + (err.message || err), 'bad', 3600);
    }
  }

  function handleImportFile(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast('文件过大（超过 8MB），已拒绝导入', 'bad', 3600);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast('读取文件失败', 'bad');
    reader.onload = async () => {
      const res = DB.validateImport(String(reader.result));
      if (!res.ok) {
        openSheet(`
          <h3 class="sheet__title">这个文件无法导入</h3>
          <p class="sheet__desc">校验没有通过，本地数据没有任何改动。</p>
          <div class="notice notice--warn" style="margin-top:0">
            <ul style="margin:0;padding-left:18px">
              ${res.errors.slice(0, 8).map((e) => `<li>${esc(e)}</li>`).join('')}
            </ul>
          </div>
          <div style="margin-top:16px">
            <button class="btn btn--block" data-act="close-sheet" data-v="cancel">知道了</button>
          </div>
        `);
        return;
      }
      const p = res.preview;
      const ok = await confirmSheet({
        title: '确认用这个备份覆盖本地记录？',
        desc: `
          <div class="kv"><span class="kv__k">备份导出时间</span><span class="kv__v">${p.exportedAt ? esc(new Date(p.exportedAt).toLocaleString('zh-CN')) : '未记录'}</span></div>
          <div class="kv"><span class="kv__k">备份格式版本</span><span class="kv__v">v${esc(p.version)}</span></div>
          <div class="kv"><span class="kv__k">有练习记录的假名</span><span class="kv__v">${p.practicedKana} 个（共 ${p.kanaRows} 条）</span></div>
          <div class="kv"><span class="kv__k">每日记录</span><span class="kv__v">${p.dailyRows} 天${p.dateFrom ? `（${esc(p.dateFrom)} 〜 ${esc(p.dateTo)}）` : ''}</span></div>
          <div class="kv"><span class="kv__k">备份中的答题总数</span><span class="kv__v">${p.totalAnswered} 题${p.accuracy === null ? '' : `，正确率 ${p.accuracy}%`}</span></div>
          <div class="notice notice--warn" style="margin-top:12px">导入会<strong>覆盖</strong>这台设备上现有的练习记录，设置项也会一并替换。如果写入失败，会自动恢复导入前的数据。</div>
        `,
        confirmText: '确认覆盖导入',
        danger: true,
      });
      if (!ok) return;

      const r = await DB.importAll(res.payload);
      if (r.ok) {
        await loadAll();
        render();
        toast('导入完成，记录已恢复', 'ok', 3000);
      } else {
        toast(r.error, 'bad', 5200);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  async function doClear() {
    const first = await confirmSheet({
      title: '清空全部练习记录？',
      desc: '<p>会删除所有假名的练习次数、正确率和每日记录，<strong>不能撤销</strong>。</p><div class="notice">如果只是想换设备，请先到「数据备份」导出 JSON。</div>',
      confirmText: '继续',
      danger: true,
    });
    if (!first) return;
    const second = await confirmSheet({
      title: '再确认一次',
      desc: `<p>真的要清空这台设备上的全部练习记录吗？</p><div class="notice notice--warn">这是第二次确认，点击后立即清空，无法恢复。</div>`,
      confirmText: '确定清空',
      cancelText: '我不清了',
      danger: true,
    });
    if (!second) {
      toast('已取消，记录没有变化');
      return;
    }
    try {
      await DB.clearAllRecords();
      await loadAll();
      state.quiz = null;
      render();
      toast('练习记录已清空', 'ok');
    } catch (err) {
      toast('清空失败：' + (err.message || err), 'bad', 3600);
    }
  }

  /* ======================================================================
     假名详情弹层
     ====================================================================== */

  function openKanaDetail(id) {
    const k = KANA_BY_ID.get(id);
    if (!k) return;
    const st = kanaState(state.stats.get(id));
    const speakRow = state.settings.speech
      ? `<button class="btn btn--teal" data-act="speak" data-text="${esc(k.kana)}">朗读（系统语音）</button>`
      : '';
    openSheet(`
      <h3 class="sheet__title">${esc(SCRIPT_LABEL[k.script])} · ${esc(k.rowLabel)}</h3>
      <p class="sheet__desc">${esc(k.kana)} 的罗马音是 ${esc(k.romaji)}</p>
      <div class="big-kana">${esc(k.kana)}</div>
      <div style="text-align:center;font-size:20px;font-weight:700;color:var(--primary-d);margin-top:2px">${esc(k.romaji)}</div>

      <div class="card" style="margin-top:16px;box-shadow:none">
        <div class="kv"><span class="kv__k">状态</span><span class="kv__v"><span class="badge ${st.badge}">${st.label}</span></span></div>
        <div class="kv"><span class="kv__k">练习次数</span><span class="kv__v">${st.attempts} 次</span></div>
        <div class="kv"><span class="kv__k">正确率</span><span class="kv__v">${accuracyText(st)}</span></div>
        <div class="kv"><span class="kv__k">答对 / 答错</span><span class="kv__v">${st.correct} / ${st.attempts - st.correct}</span></div>
        <div class="kv"><span class="kv__k">最近一次作答</span><span class="kv__v">${st.key === 'none' ? '还没有练习过' : relTime((state.stats.get(id) || {}).lastAt)}</span></div>
      </div>
      ${st.key === 'none' ? '<div class="notice">这个假名还没有练习过，所以正确率显示为「—」，而不是 0%。</div>' : ''}

      <div class="btn-row" style="margin-top:16px">
        ${speakRow}
        <button class="btn btn--primary" data-act="row-quiz" data-v="${k.rowId}" data-script="${k.script}">练这一行（${esc(k.rowLabel)}）</button>
      </div>
      <div style="margin-top:10px">
        <button class="btn btn--block btn--ghost" data-act="close-sheet" data-v="cancel">关闭</button>
      </div>
    `);
  }

  /* ======================================================================
     事件绑定
     ====================================================================== */

  function bind() {
    document.addEventListener('click', async (ev) => {
      const t = ev.target.closest('[data-act]');
      if (!t) return;
      const act = t.dataset.act;
      const v = t.dataset.v;

      switch (act) {
        case 'nav': go(v); break;
        case 'home-script':
          state.setup.script = v;
          state.setup.rows = [];
          await persistSetup();
          render();
          break;
        case 'review-script': state.review.script = v; render(); break;
        case 'chart-script': state.chart.script = v; render(); break;
        case 'chart-filter': state.chart.filter = v; render(); break;
        case 'me-filter': state.me.filter = v; render(); break;
        case 'me-script': state.me.script = v; render(); break;
        case 'kana': openKanaDetail(t.dataset.id); break;
        case 'close-sheet': closeSheet(v === 'ok'); break;
        case 'speak': speak(t.dataset.text); break;

        case 'set-font':
          await persistSetting('kanaFont', v);
          render();
          break;
        case 'set-speech':
          await persistSetting('speech', t.checked);
          if (t.checked) {
            refreshVoices();
            if (!jaVoice) toast('当前设备没有日语语音音色，开启后仍无法朗读，但不影响练习。', 'bad', 4200);
            else toast('已开启系统日语语音朗读', 'ok');
          }
          render();
          break;

        case 'setup-all':
          state.setup.rows = [];
          await persistSetup();
          render();
          break;
        case 'setup-row': {
          const i = state.setup.rows.indexOf(v);
          if (i >= 0) state.setup.rows.splice(i, 1);
          else state.setup.rows.push(v);
          await persistSetup();
          render();
          break;
        }
        case 'setup-script':
          state.setup.script = v;
          await persistSetup();
          render();
          break;
        case 'setup-mode':
          state.setup.mode = v;
          await persistSetup();
          render();
          break;
        case 'setup-count':
          state.setup.count = Number(v);
          await persistSetup();
          render();
          break;

        case 'quick-start':
          startQuiz({
            pool: buildPool(state.setup),
            count: state.setup.count,
            mode: state.setup.mode,
            preferUnpracticed: state.setup.preferUnpracticed,
            label: '常规练习',
          });
          break;
        case 'start-quiz':
          startQuiz({
            pool: buildPool(state.setup),
            count: state.setup.count,
            mode: state.setup.mode,
            preferUnpracticed: state.setup.preferUnpracticed,
            label: '常规练习',
          });
          break;
        case 'row-quiz': {
          const row = ROW_OPTIONS.find((r) => r.id === v);
          const rows = v === 'all' ? [] : [v];
          const script = t.dataset.script || state.setup.script;
          const pool = KANA_LIST.filter((k) => (script === 'both' ? true : k.script === script))
            .filter((k) => (rows.length ? rows.includes(k.rowId) : true));
          closeSheet(false);
          startQuiz({
            pool,
            count: Math.min(state.setup.count, Math.max(10, pool.length * 2)),
            mode: state.setup.mode,
            preferUnpracticed: false,
            label: `${row ? row.label : ''}专项`,
          });
          break;
        }
        case 'start-review': {
          const pool = wrongList(state.review.script);
          if (pool.length === 0) { toast('暂无错题需要复习', 'bad'); return; }
          startQuiz({
            pool,
            count: Math.min(20, Math.max(10, pool.length * 2)),
            mode: 'mixed',
            preferUnpracticed: false,
            source: 'review',
            label: state.review.script === 'both' ? '错题复习' : `${SCRIPT_LABEL[state.review.script]}错题复习`,
          });
          break;
        }
        case 'review-round': {
          const wrongs = state.quiz ? state.quiz.questions.filter((x) => x.chosen !== null && !x.isCorrect) : [];
          const ids = [...new Set(wrongs.map((w) => w.target.id))];
          const pool = ids.map((i) => KANA_BY_ID.get(i)).filter(Boolean);
          if (pool.length === 0) { toast('本轮没有错题需要复习', 'bad'); return; }
          startQuiz({ pool, count: pool.length >= 10 ? 10 : pool.length, mode: 'mixed', preferUnpracticed: false, source: 'review', label: '本轮错题' });
          break;
        }

        case 'pick': await answer(v); break;
        case 'next': await nextQuestion(); break;
        case 'quit-quiz': {
          const ok = await confirmSheet({
            title: '结束本轮练习？',
            desc: '<p>已经答过的题目会照常计入记录，剩下的题目不会计入。</p>',
            confirmText: '结束本轮',
          });
          if (ok && state.quiz) { state.quiz.finished = true; await finishRound(); render(); }
          break;
        }

        case 'export': await doExport(); break;
        case 'import-pick': document.getElementById('import-file').click(); break;
        case 'clear': await doClear(); break;
        default: break;
      }
    });

    document.addEventListener('change', (ev) => {
      const t = ev.target.closest('[data-act]');
      if (!t) return;
      if (t.dataset.act === 'setup-prefer') {
        state.setup.preferUnpracticed = t.checked;
        persistSetup();
      } else if (t.dataset.act === 'set-speech') {
        persistSetting('speech', t.checked).then(() => {
          if (t.checked) {
            refreshVoices();
            if (!jaVoice) toast('当前设备没有日语语音音色，开启后仍无法朗读，但不影响练习。', 'bad', 4200);
            else toast('已开启系统日语语音朗读', 'ok');
          }
          render();
        });
      }
    });

    document.getElementById('import-file').addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      handleImportFile(f);
      ev.target.value = '';
    });

    document.getElementById('sheet-backdrop').addEventListener('click', (ev) => {
      if (ev.target.id === 'sheet-backdrop') closeSheet(false);
    });

    window.addEventListener('online', () => { state.online = true; renderTopbar(); toast('已恢复网络连接', 'ok'); });
    window.addEventListener('offline', () => { state.online = false; renderTopbar(); toast('已离线，仍可继续练习'); });
  }

  /* ======================================================================
     Service Worker
     ====================================================================== */

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return; // file:// 下不支持，本地请用 http 服务
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      state.swReady = true;
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            toast('新版本已缓存，下次打开生效', 'ok', 3200);
          }
        });
      });
    }).catch((err) => {
      console.warn('Service Worker 注册失败：', err);
    });
  }

  /* ======================================================================
     启动
     ====================================================================== */

  async function init() {
    bind();
    await loadAll();
    render();
    registerSW();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* 供本地调试与自动化测试使用 */
  window.__gojuon = { state, render, startQuiz, buildPool, buildOptions, validateImport: DB.validateImport, go };
})();
