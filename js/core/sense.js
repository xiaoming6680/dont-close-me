/* 别关我 · 感知：它"感觉"浏览器发生了什么
   - 导航类型（刷新 / 打开 / 后退前进）
   - 你在不在（切标签页、最小化）+ 离开计时统计
   - 鼠标在哪、在不在窗口里
   事件总线：B.emit / B.listen（'away'、'back'、'restored'） */
(function (B) {
  'use strict';
  const bus = new EventTarget();
  B.emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
  B.listen = (type, fn) => {
    const h = e => fn(e.detail);
    bus.addEventListener(type, h);
    return () => bus.removeEventListener(type, h);
  };

  const S = B.Sense = { nav: 'navigate', awayAt: 0, mouse: { x: -1, y: -1, inside: false } };
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type) S.nav = nav.type;
  } catch (e) {}

  B.trackStats = false; // 序章点了"好"之后才开始统计

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      S.awayAt = Date.now();
      B.emit('away');
    } else {
      const ms = S.awayAt ? Date.now() - S.awayAt : 0;
      if (B.trackStats && B.Inst && B.Inst.role === 'main' && ms > 300) {
        const st = B.Save.data.stats;
        st.awayCount++;
        if (ms > st.awayMaxMs) st.awayMaxMs = ms;
        B.Save.write();
      }
      B.emit('back', ms);
    }
  });

  // 游玩时长：只算看得见的时间；电脑睡眠之类的长间隔不算
  let lastTick = Date.now(), sinceSave = 0;
  setInterval(() => {
    const now = Date.now(), dt = now - lastTick;
    lastTick = now;
    if (!B.trackStats || document.hidden || dt > 5000 || !B.Inst || B.Inst.role !== 'main') return;
    B.Save.data.stats.playMs += dt;
    sinceSave += dt;
    if (sinceSave > 10000) { sinceSave = 0; B.Save.write(); }
  }, 1000);

  document.addEventListener('mousemove', e => {
    S.mouse.x = e.clientX; S.mouse.y = e.clientY; S.mouse.inside = true;
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { S.mouse.inside = false; });
  document.documentElement.addEventListener('mouseenter', () => { S.mouse.inside = true; });

  // bfcache 恢复（后退过头又前进回来）
  window.addEventListener('pageshow', e => { if (e.persisted) B.emit('restored'); });
})(window.BGW);
