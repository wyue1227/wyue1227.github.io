/*
 * data.js — 五十音基础数据（清音 / 清音 = 五十音図の清音）
 *
 * 数据来源：日语教学通用五十音图（清音 46 音）。
 * 平假名 46 个、片假名 46 个，一一对应，罗马音一致。
 * 表中「空位」以 null 表示，渲染时保持空白，不编造任何字符。
 */

/* 五列（段）：あ段 / い段 / う段 / え段 / お段 */
const COLUMNS = ['あ段', 'い段', 'う段', 'え段', 'お段'];

/*
 * 十行（行）。每行 5 列，用 null 占位表示该段为空位。
 * や行：い段、え段为空位（与あ行重复，不另计）
 * わ行：い段、う段、え段为空位
 */
const GOJUON_ROWS = [
  { id: 'a',  label: 'あ行', romaji: ['a',   'i',   'u',   'e',   'o'  ], hira: ['あ', 'い', 'う', 'え', 'お'], kata: ['ア', 'イ', 'ウ', 'エ', 'オ'] },
  { id: 'ka', label: 'か行', romaji: ['ka',  'ki',  'ku',  'ke',  'ko' ], hira: ['か', 'き', 'く', 'け', 'こ'], kata: ['カ', 'キ', 'ク', 'ケ', 'コ'] },
  { id: 'sa', label: 'さ行', romaji: ['sa',  'shi', 'su',  'se',  'so' ], hira: ['さ', 'し', 'す', 'せ', 'そ'], kata: ['サ', 'シ', 'ス', 'セ', 'ソ'] },
  { id: 'ta', label: 'た行', romaji: ['ta',  'chi', 'tsu', 'te',  'to' ], hira: ['た', 'ち', 'つ', 'て', 'と'], kata: ['タ', 'チ', 'ツ', 'テ', 'ト'] },
  { id: 'na', label: 'な行', romaji: ['na',  'ni',  'nu',  'ne',  'no' ], hira: ['な', 'に', 'ぬ', 'ね', 'の'], kata: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'] },
  { id: 'ha', label: 'は行', romaji: ['ha',  'hi',  'fu',  'he',  'ho' ], hira: ['は', 'ひ', 'ふ', 'へ', 'ほ'], kata: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'] },
  { id: 'ma', label: 'ま行', romaji: ['ma',  'mi',  'mu',  'me',  'mo' ], hira: ['ま', 'み', 'む', 'め', 'も'], kata: ['マ', 'ミ', 'ム', 'メ', 'モ'] },
  { id: 'ya', label: 'や行', romaji: ['ya',  null,  'yu',  null,  'yo' ], hira: ['や', null, 'ゆ', null, 'よ'], kata: ['ヤ', null, 'ユ', null, 'ヨ'] },
  { id: 'ra', label: 'ら行', romaji: ['ra',  'ri',  'ru',  're',  'ro' ], hira: ['ら', 'り', 'る', 'れ', 'ろ'], kata: ['ラ', 'リ', 'ル', 'レ', 'ロ'] },
  { id: 'wa', label: 'わ行', romaji: ['wa',  null,  null,  null,  'wo' ], hira: ['わ', null, null, null, 'を'], kata: ['ワ', null, null, null, 'ヲ'] },
];

/* ん — 独立一行（拨音），不属于任何段 */
const N_ROW = { id: 'n', label: 'ん', romaji: ['n'], hira: ['ん'], kata: ['ン'] };

const SCRIPT_LABEL = { hira: '平假名', kata: '片假名' };

/**
 * 把行数据展开成扁平的假名条目列表。
 * 每个条目：
 *   id      — 稳定唯一键，形如 "hira:あ"，用于 IndexedDB 主键
 *   script  — 'hira' | 'kata'
 *   kana    — 假名字符
 *   romaji  — 罗马音
 *   rowId   — 所属行 id（'n' 表示ん）
 *   rowLabel— 所属行显示名
 *   col     — 段序号 0-4，ん为 -1
 */
function buildKanaList() {
  const list = [];
  for (const script of ['hira', 'kata']) {
    for (const row of GOJUON_ROWS) {
      const chars = script === 'hira' ? row.hira : row.kata;
      for (let col = 0; col < 5; col++) {
        const kana = chars[col];
        const romaji = row.romaji[col];
        if (!kana || !romaji) continue; // 空位：跳过，不生成条目
        list.push({
          id: `${script}:${kana}`,
          script,
          kana,
          romaji,
          rowId: row.id,
          rowLabel: row.label,
          col,
        });
      }
    }
    const chars = script === 'hira' ? N_ROW.hira : N_ROW.kata;
    list.push({
      id: `${script}:${chars[0]}`,
      script,
      kana: chars[0],
      romaji: N_ROW.romaji[0],
      rowId: 'n',
      rowLabel: N_ROW.label,
      col: -1,
    });
  }
  return list;
}

const KANA_LIST = buildKanaList();
const KANA_BY_ID = new Map(KANA_LIST.map((k) => [k.id, k]));

/* 行清单（用于「分行学习」的范围选择），含每行的假名数量 */
const ROW_OPTIONS = [
  ...GOJUON_ROWS.map((r) => ({
    id: r.id,
    label: r.label,
    preview: r.hira.filter(Boolean).join(' '),
  })),
  { id: 'n', label: 'ん', preview: 'ん' },
];

/* 自检：清音必须各 46 个 */
const KANA_COUNT = {
  hira: KANA_LIST.filter((k) => k.script === 'hira').length,
  kata: KANA_LIST.filter((k) => k.script === 'kata').length,
};
