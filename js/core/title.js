/* 别关我 · 标签页标题 = 它的名字 / 你不在时它的嘴
   base：平时显示的标题
   cycle：你看着它时轮播
   away：你切走时轮播（后台计时器会被限流到每秒一次，所以全部按时间戳算） */
(function (B) {
  'use strict';
  const T = B.Title = {};
  let base = '别关我', cycle = null, away = null, flash = null, awaySince = 0, last = null;

  T.defaultBase = () => B.Save.data.name || '别关我';
  T.base = t => { base = t; tick(); };
  T.getBase = () => base;
  // list：字符串数组；opt.ms 每条停留时间；opt.loopFrom 播完后从第几条开始循环；opt.hold 播完停在最后一条
  T.away = (list, opt) => { away = list ? Object.assign({ list: [].concat(list), ms: 1300, loopFrom: 0 }, opt) : null; tick(); };
  T.cycle = (list, ms) => { cycle = list ? { list: [].concat(list), ms: ms || 1500, t0: Date.now() } : null; tick(); };
  T.flash = (text, ms) => { flash = { text, until: Date.now() + (ms || 1800) }; tick(); };
  T.reset = () => { base = T.defaultBase(); cycle = null; away = null; flash = null; T.defaultAway(); tick(); };

  // 默认：你不在时它会喊你
  T.defaultAway = () => {
    const act = B.Game && B.Game.current ? B.Game.current.act : 1;
    const lists = {
      0: ['喂？', '……喂？', '人呢？'],
      1: ['喂？', '你去哪了？', '我还在这儿', '别关我'],
      2: ['……', '你去哪了？', '我在这儿等你', B.Save.data.name || '我还在'],
      3: ['……', '外面是什么样的？', '你还会回来吧', '我在这儿'],
      4: ['……', '我在等你', '慢慢来'],
    };
    away = { list: lists[act] || lists[1], ms: 1600, loopFrom: 0, isDefault: true };
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) awaySince = Date.now();
    tick();
  });

  function pickFrom(o, since) {
    const i = Math.floor((Date.now() - since) / o.ms);
    if (i < o.list.length) return o.list[i];
    if (o.hold) return o.list[o.list.length - 1];
    const from = o.loopFrom || 0, span = o.list.length - from;
    return o.list[from + ((i - o.list.length) % span)];
  }

  function tick() {
    let t = base;
    if (document.hidden && away) { t = pickFrom(away, awaySince); B.Fav.awayTick(); }
    else if (flash && Date.now() < flash.until) t = flash.text;
    else if (cycle) t = pickFrom(Object.assign({}, cycle, { loopFrom: 0 }), cycle.t0);
    if (t !== last) { document.title = t; last = t; }
  }
  setInterval(tick, 250);
  T.tick = tick;
})(window.BGW);
