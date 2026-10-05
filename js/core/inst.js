/* 别关我 · 多标签页
   一个世界里一次只能有一个"我"推进游戏（main）；再开的标签页显示"我已经在另一个标签页里了"（blocked），
   第 34 关例外（twin）。小分身弹窗是 mini，不参与。
   通信：BroadcastChannel（实测 file:// 下可用）；localStorage 心跳兜底发现。 */
(function (B) {
  'use strict';
  const PRE = '别关我.inst.';
  const I = B.Inst = { id: Math.random().toString(36).slice(2, 10), role: 'starting', handlers: {} };
  let bc = null;
  try { bc = new BroadcastChannel('别关我'); } catch (e) {}

  function deliver(msg) {
    if (!msg || msg.from === I.id || (msg.to && msg.to !== I.id)) return;
    (I.handlers[msg.type] || []).slice().forEach(f => { try { f(msg); } catch (e) { console.error(e); } });
  }
  if (bc) bc.onmessage = e => deliver(e.data);
  else {
    window.addEventListener('storage', e => {
      if (e.key === '别关我.msg' && e.newValue) { try { deliver(JSON.parse(e.newValue)); } catch (_) {} }
    });
  }

  I.send = function (type, data, to) {
    const msg = { type, data, to, from: I.id, t: Date.now(), r: Math.random() };
    if (bc) bc.postMessage(msg);
    else { try { localStorage.setItem('别关我.msg', JSON.stringify(msg)); } catch (e) {} }
  };
  I.on = function (type, fn) {
    (I.handlers[type] = I.handlers[type] || []).push(fn);
    return () => { const a = I.handlers[type]; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
  };

  const beat = () => { try { localStorage.setItem(PRE + I.id, String(Date.now())); } catch (e) {} };
  let started = false;
  I.start = function () {
    if (started) return;
    started = true;
    beat();
    setInterval(beat, 1000);
    window.addEventListener('pagehide', () => {
      I.send('bye', { role: I.role });
      try { localStorage.removeItem(PRE + I.id); } catch (e) {}
    });
    I.on('ping', m => {
      if (I.role === 'mini') return;
      I.send('pong', { role: I.role, level: B.Save.data.level }, m.from);
    });
  };

  // 问一圈"有人在吗"，返回 Map(id -> {role, level})
  I.discover = function (ms) {
    return new Promise(res => {
      const found = new Map();
      const off = I.on('pong', m => found.set(m.from, m.data || {}));
      I.send('ping');
      setTimeout(() => {
        off();
        if (!bc) {
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (!k || !k.startsWith(PRE) || k === PRE + I.id) continue;
              const age = Date.now() - Number(localStorage.getItem(k));
              if (age < 3500) found.set(k.slice(PRE.length), { role: '?' });
              else if (age > 120000) localStorage.removeItem(k);
            }
          } catch (e) {}
        }
        res(found);
      }, ms || 450);
    });
  };
})(window.BGW);
