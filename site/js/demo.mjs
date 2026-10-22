// Fictional browser-local fixtures. Not personal records.
export function demoData() {
  const rows = [
    [
      "2026-10-22",
      "早餐",
      "全麦吐司与水煮蛋",
      "吐司 2 片、鸡蛋 1 个",
      "约 320 kcal",
      320,
      320,
      "",
    ],
    [
      "2026-10-22",
      "午餐",
      "鸡肉蔬菜饭",
      "1 份",
      "550–650 kcal",
      550,
      650,
      "加了一份生菜，少酱。",
    ],
    ["2026-10-22", "晚餐", "番茄牛肉乌冬", "1 碗", "约 580 kcal", 580, 580, ""],
    ["2026-10-22", "加餐", "无糖酸奶", "150 g", "热量未记录", null, null, ""],
    [
      "2026-10-21",
      "早餐",
      "全麦吐司与水煮蛋",
      "吐司 2 片、鸡蛋 1 个",
      "约 320 kcal",
      320,
      320,
      "",
    ],
    ["2026-10-21", "午餐", "鸡肉蔬菜饭", "1 份", "550–650 kcal", 550, 650, ""],
    ["2026-10-21", "晚餐", "清蒸鱼与米饭", "1 份", "约 510 kcal", 510, 510, ""],
    [
      "2026-10-20",
      "午餐",
      "荞麦面",
      "1 碗",
      "约 420 kcal",
      420,
      420,
      "只记录了午餐。",
    ],
    ["2026-10-18", "早餐", "燕麦与牛奶", "1 碗", "约 340 kcal", 340, 340, ""],
    [
      "2026-10-18",
      "晚餐",
      "蔬菜汤与三明治",
      "1 份",
      "480–560 kcal",
      480,
      560,
      "",
    ],
    [
      "2026-09-30",
      "早餐",
      "全麦吐司与水煮蛋",
      "吐司 2 片、鸡蛋 1 个",
      "约 320 kcal",
      320,
      320,
      "",
    ],
  ];
  const entries = rows.map(
    (
      [date, meal, food, portion, calories_raw, kcal_low, kcal_high, notes],
      i,
    ) => ({
      id: `example-${i}`,
      date,
      meal,
      food,
      portion,
      calories_raw,
      kcal_low,
      kcal_high,
      kcal_value: null,
      notes,
    }),
  );
  const days = [...new Set(entries.map((e) => e.date))].map((date) => ({
    date,
    status: date === "2026-10-21" ? "complete" : "partial",
    reported_raw: null,
  }));
  return { entries, days };
}
