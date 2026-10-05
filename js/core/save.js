/* 别关我 · 存档（抽屉）
   file:// 下所有本地页面共用一个 localStorage，所以键名带前缀。
   localStorage 不可用时退回内存存档（刷新就忘）。 */
(function (B) {
  'use strict';
  const KEY = '别关我.v1';

  const fresh = () => ({
    v: 1,
    level: null,          // 当前关卡 id
    phase: 'new',         // new / playing / awaitingClose / epilogue / done
    name: '',
    notes: [],            // 已收集的纸条编号
    lv: {},               // 当前关卡的临时状态（换关清空）
    hint: 0,              // 当前关卡已显示几条提示
    stats: { playMs: 0, awayCount: 0, awayMaxMs: 0, reloads: 0, closes: 0, hints: 0, skips: 0, startedAt: 0, endedAt: 0 },
    settings: { muted: false },
    flags: {},
  });

  const Save = B.Save = { ok: true, data: fresh() };

  try {
    localStorage.setItem(KEY + '.test', '1');
    localStorage.removeItem(KEY + '.test');
  } catch (e) { Save.ok = false; }

  Save.load = function () {
    if (!Save.ok) return Save.data;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.v === 1) {
          const f = fresh();
          Save.data = Object.assign(f, d, {
            stats: Object.assign(f.stats, d.stats),
            settings: Object.assign(f.settings, d.settings),
            flags: Object.assign({}, d.flags),
            lv: Object.assign({}, d.lv),
            notes: Array.isArray(d.notes) ? d.notes : [],
          });
        }
      } else {
        Save.data = fresh();
      }
    } catch (e) { /* 存档坏了就当新的 */ Save.data = fresh(); }
    return Save.data;
  };

  // 只有"主实例"能写存档（多标签页时其他实例只读）
  Save.write = function () {
    if (!Save.ok) return;
    if (B.Inst && B.Inst.role !== 'main') return;
    try { localStorage.setItem(KEY, JSON.stringify(Save.data)); } catch (e) { /* 满了或被禁 */ }
  };

  Save.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    Save.data = fresh();
  };

  Save.addNote = function (id) {
    if (!Save.data.notes.includes(id)) { Save.data.notes.push(id); Save.write(); }
  };
})(window.BGW);
