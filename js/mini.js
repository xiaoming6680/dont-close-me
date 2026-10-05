/* 别关我 · 小分身（第 32 关的弹出小窗，同一个 index.html 带 ?mini 打开）
   它自己会走几步（moveBy），把自己的位置广播给主窗口；被拖出屏幕一大半时，说完话自己关掉。 */
(function (B) {
  'use strict';
  B.Mini = {
    start() {
      B.Inst.role = 'mini';
      document.body.classList.add('mini');
      B.Title.base('小分身');
      B.Title.away(null);
      B.Face.mount(B.$('#face'));
      B.setMood('happy');
      B.Face.set('surprised');
      const say = t => B.UI.say(t, { keep: 1 });
      const send = (type, data) => B.Inst.send(type, data);
      let finished = false, warned = false;
      send('mini-hello');
      B.Inst.on('mini-close', () => window.close());
      window.addEventListener('pagehide', () => { if (!finished) send('mini-bye'); });
      (async () => {
        await B.UI.say('哇……', { keep: 1 });
        for (let i = 0; i < 8; i++) {
          try { window.moveBy(i % 2 ? 24 : 16, i % 2 ? -16 : 16); } catch (e) {}
          B.Face.wobble(i % 2 ? 6 : -6);
          await new Promise(r => setTimeout(r, 120));
        }
        B.Face.set('joy');
        await say('我出来了！');
        await say('带我去屏幕外面看看。');
        B.Face.set('happy');
      })();
      setInterval(() => {
        const L = screen.availLeft || 0, T = screen.availTop || 0;
        const R = L + screen.availWidth, Bt = T + screen.availHeight;
        const x1 = screenX, y1 = screenY, x2 = x1 + outerWidth, y2 = y1 + outerHeight;
        const vis = Math.max(0, Math.min(x2, R) - Math.max(x1, L)) * Math.max(0, Math.min(y2, Bt) - Math.max(y1, T));
        const off = B.clamp(1 - vis / Math.max(1, outerWidth * outerHeight), 0, 1);
        send('mini-pos', { x: x1 - L, y: y1 - T, w: outerWidth, h: outerHeight, off });
        if (finished) return;
        if (off >= 0.5) {
          finished = true;
          send('mini-empty');
          B.Face.set('surprised');
          say('这边……').then(() => { B.Face.set('sad'); return say('什么都没有。'); });
          setTimeout(() => window.close(), 3800);
        } else if (off > 0.12 && !warned) {
          warned = true;
          B.Face.set('nervous');
          say('再往外一点……');
        }
      }, 150);
    },
  };
})(window.BGW);
