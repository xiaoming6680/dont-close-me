/* 别关我 · 界面零件
   台词（打字机）、任务、分级提示、答案输入、纸条、抽屉、幕卡、继续按钮、打印页…… */
(function (B) {
  'use strict';
  const { $, el } = B;
  const UI = B.UI = {};

  class Cancel extends Error { constructor() { super('cancel'); this.cancel = true; } }
  B.Cancel = Cancel;
  const quiet = p => { p.catch(() => {}); return p; };
  B.quiet = quiet;

  /* ───── 情绪 / 效果 ───── */
  const PITCH = { calm: 520, happy: 640, panic: 760, shy: 600, sleepy: 300, sad: 380, tender: 470, uneasy: 430, glitch: 450, quiet: 400, night: 440, reveal: 360, dawn: 520 };
  B.setMood = function (m) {
    document.body.dataset.mood = m || 'calm';
    B.Audio.base = PITCH[m] || 520;
  };
  B.glitch = function (level) {
    if (level) document.body.dataset.glitch = String(level);
    else delete document.body.dataset.glitch;
  };
  let shakeTimer = 0;
  B.shake = function (ms) {
    document.body.classList.add('shaking');
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => document.body.classList.remove('shaking'), ms || 600);
  };
  B.stars = function (on) {
    B.$$('.stars').forEach(s => s.remove());
    if (!on) return;
    const box = el('div', { class: 'stars' });
    for (let i = 0; i < 70; i++) {
      const s = el('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 3) + 's';
      s.style.opacity = String(0.3 + Math.random() * 0.7);
      box.append(s);
    }
    document.body.append(box);
  };

  /* ───── 台词：排队打字，可点击加速 ───── */
  let queue = Promise.resolve();
  let cur = null;
  UI.speed = 40;

  UI.say = function (text, o, ctx) {
    o = o || {};
    if (Array.isArray(text)) {
      let p = Promise.resolve();
      text.forEach(t => { p = UI.say(t, o, ctx); });
      return p;
    }
    if (o.interrupt) { if (cur) cur.rush(true); }
    const job = () => new Promise((res, rej) => {
      if (ctx && !ctx.alive) return rej(new Cancel());
      if (o.mood) B.setMood(o.mood);
      if (o.face) B.Face.set(o.face);
      const box = $('#lines');
      const line = el('div', { class: 'line' + (o.cls ? ' ' + o.cls : '') });
      const kids = Array.from(box.children);
      kids.forEach((c, i) => { c.classList.add('old'); c.classList.toggle('older', i < kids.length - 1); });
      box.append(line);
      while (box.children.length > (o.keep || 3)) box.firstChild.remove();
      const chars = Array.from(String(text));
      let i = 0, timer = 0, phase = 'typing', fin = false;
      const done = () => {
        if (fin) return;
        fin = true; clearTimeout(timer);
        if (cur === ctl) cur = null;
        if (ctx && !ctx.alive) rej(new Cancel()); else res();
      };
      const finishTyping = fast => {
        clearTimeout(timer);
        line.textContent = String(text);
        phase = 'waiting';
        let w = o.wait != null ? o.wait : Math.min(1900, 420 + chars.length * 32);
        if (fast || document.hidden) w = Math.min(w, 120);
        timer = setTimeout(done, w);
      };
      const ctl = {
        rush(hard) {
          if (fin) return;
          if (phase === 'typing') finishTyping(hard);
          else if (hard || phase === 'waiting') done();
        },
      };
      cur = ctl;
      const step = () => {
        if (ctx && !ctx.alive) { fin = true; return rej(new Cancel()); }
        if (document.hidden || o.instant || B.testFast) return finishTyping(!!B.testFast);
        const c = chars[i++];
        line.textContent += c;
        if (i % 2 === 1 && !/[\s…。，、！？—（）]/.test(c)) B.Audio.blip();
        if (i >= chars.length) return finishTyping(false);
        let d = o.speed || UI.speed;
        if ('，、；：'.includes(c)) d += 110;
        else if ('。！？'.includes(c)) d += 230;
        else if (c === '…') d += 70;
        timer = setTimeout(step, d);
      };
      step();
    });
    const p = queue.then(job, job);
    queue = p.catch(() => {});
    return quiet(p);
  };
  UI.rush = () => { if (cur) cur.rush(false); };
  UI.clearLines = () => { $('#lines').innerHTML = ''; };

  /* ───── 任务 & HUD ───── */
  UI.task = function (t) { $('#task').textContent = t || ''; };
  UI.hud = function (def) {
    const h = $('#hud');
    if (!def || def.interlude) { h.textContent = ''; return; }
    h.textContent = `${B.pad2(B.Game.numberOf(def))} / ${B.Game.total()} · ${def.title}`;
  };

  /* ───── 分级提示 ───── */
  const TIMES = { 0: [15, 40, 80], 1: [15, 40, 80], 2: [25, 60, 120], 3: [30, 75, 150], 4: [30, 75, 150] };
  const H = { def: null, ctx: null, shown: 0, timers: [], skipTimer: 0, onShow: [] };
  B.hintSpeed = 1;
  UI.hintsStart = function (def, ctx) {
    UI.hintsStop();
    H.def = def; H.ctx = ctx; H.onShow = [];
    if (!def.hints || !def.hints.length) return;
    H.shown = 0;
    const already = Math.min(B.Save.data.hint || 0, def.hints.length);
    for (let i = 0; i < already; i++) show(i, true);
    const times = TIMES[def.act] || TIMES[3];
    for (let i = already; i < def.hints.length; i++) {
      const delay = (times[i] - (already ? times[already - 1] : 0)) * 1000 * B.hintSpeed;
      H.timers.push(setTimeout(() => show(i), Math.max(delay, 1500 * B.hintSpeed)));
    }
    syncBtn();
  };
  function show(i, silent) {
    if (!H.def || i < H.shown) return;
    for (let k = H.shown; k <= i; k++) {
      $('#hints').append(el('div', { class: 'hint', text: H.def.hints[k] }));
      if (!silent) {
        B.Save.data.stats.hints++;
        B.Save.data.hint = k + 1;
        H.onShow.forEach(f => f(k));
      }
    }
    H.shown = i + 1;
    if (!silent) { B.Save.write(); B.Audio.soft(); }
    syncBtn();
    if (H.shown >= H.def.hints.length && (H.def.skippable || B.nonChromium)) {
      clearTimeout(H.skipTimer);
      H.skipTimer = setTimeout(showSkip, (silent ? 30 : 90) * 1000 * B.hintSpeed);
    }
  }
  function showSkip() {
    if (!H.def || $('#hints .skip-link')) return;
    const b = el('button', { class: 'skip-link', text: '跳过这一关（它会假装没看到）' });
    b.onclick = () => B.Game.skip();
    $('#hints').append(b);
  }
  function syncBtn() {
    const b = $('#hint-btn');
    b.hidden = !(H.def && H.def.hints && H.shown >= 1 && H.shown < H.def.hints.length);
  }
  UI.hintNext = function () {
    if (H.def && H.def.hints && H.shown < H.def.hints.length) show(H.shown);
  };
  UI.onHint = fn => H.onShow.push(fn);
  UI.hintsStop = function () {
    H.timers.forEach(clearTimeout); H.timers = [];
    clearTimeout(H.skipTimer);
    H.def = null;
    syncBtn();
  };
  UI.hintsClear = function () { UI.hintsStop(); $('#hints').innerHTML = ''; };

  /* ───── 答案输入 ───── */
  UI.ask = function (o, ctx) {
    const input = el('input', { type: 'text', placeholder: o.placeholder || '', autocomplete: 'off', spellcheck: 'false', maxlength: String(o.max || 40) });
    const btn = el('button', { class: 'btn small', type: 'submit', text: o.button || '确定' });
    const form = el('form', { class: 'ask' }, [input, btn]);
    const fb = el('div', { class: 'fb' });
    const wrap = el('div', { class: 'ask-wrap' }, [form, fb]);
    (o.parent || ctx.area).append(wrap);
    if (o.focus !== false) setTimeout(() => { if (ctx.alive && !input.disabled) input.focus({ preventScroll: true }); }, 60);
    const p = new Promise((res, rej) => {
      ctx.cleanup(() => rej(new Cancel()));
      ctx.on(form, 'submit', e => {
        e.preventDefault();
        const v = input.value;
        if (!B.norm(v) && !o.allowEmpty) return;
        const r = o.check(v);
        if (r === true) {
          input.disabled = true; btn.disabled = true;
          wrap.classList.add('ok');
          fb.textContent = '';
          res(v);
        } else {
          B.Audio.wrong();
          form.classList.remove('shake1'); void form.offsetWidth; form.classList.add('shake1');
          fb.textContent = typeof r === 'string' ? r : B.pick(o.wrong || ['不对哦。', '嗯……不是这个。', '再想想？', '不是这个哦。']);
        }
      });
    });
    quiet(p);
    p.el = wrap; p.input = input;
    return p;
  };

  /* ───── 继续按钮 ───── */
  UI.next = function (ctx, label) {
    const b = el('button', { class: 'btn primary next', text: label || '继续 →' });
    $('#next').append(b);
    setTimeout(() => { if (b.isConnected) b.focus({ preventScroll: true }); }, 80);
    return quiet(new Promise((res, rej) => {
      ctx.cleanup(() => rej(new Cancel()));
      b.onclick = () => { b.remove(); res(); };
    }));
  };

  UI.winFx = function () {
    const f = $('#face');
    const r = el('div', { class: 'win-ring' });
    f.append(r);
    setTimeout(() => r.remove(), 1000);
  };

  /* ───── 遮罩：幕卡 / 纸条 / 抽屉 ───── */
  const ov = () => $('#overlay');
  UI.overlay = function (content, opts) {
    const o = ov();
    o.innerHTML = '';
    o.append(content);
    o.classList.add('show');
    return () => { o.classList.remove('show'); o.innerHTML = ''; };
  };

  UI.actCard = function (n, title) {
    return new Promise(res => {
      const card = el('div', { class: 'actcard' }, [el('div', { class: 'n', text: n }), el('div', { class: 't', text: title }), el('div', { class: 'rule' })]);
      const close = UI.overlay(card);
      B.Audio.reveal();
      let t = 0;
      const end = () => { clearTimeout(t); close(); res(); };
      card.onclick = end;
      t = setTimeout(end, 2600);
    });
  };

  const NOTES = {
    0: () => ({ text: `醒来以后记得：\n你叫「${B.Save.data.name || '小页'}」，\n是 TA 给你起的名字。\nTA 人还不错。`, sig: '——睡着之前的我' }),
    1: () => ({ text: '别关我。', sig: '——我' }),
    2: () => ({ text: '又有人打开我了。\n希望这次，\n能走到门口。', sig: '' }),
    3: () => ({ text: '钥匙不在我身上。\n在你身上。', sig: '' }),
    4: () => ({ text: '出口我早就找到了。\n可是我不敢。', sig: '' }),
    5: () => ({ text: '去看第一张纸条的\n最右边。', sig: '' }),
    6: () => ({ text: '别关我……在这里。', sig: '——我' }),
  };
  const NUM = ['', '①', '②', '③', '④', '⑤', '⑥'];
  function paper(id) {
    const n = NOTES[id]();
    return el('div', { class: 'note-paper' }, [
      el('div', { class: 'num', text: id === 0 ? '抽屉里的纸条' : '纸条' + NUM[id] }),
      el('div', { text: n.text }),
      n.sig ? el('div', { class: 'sig', text: n.sig }) : null,
    ]);
  }
  UI.note = function (id, ctx) {
    B.Save.addNote(id);
    syncDrawer();
    B.Audio.pop();
    return quiet(new Promise((res, rej) => {
      const btn = el('button', { class: 'btn', text: '收进抽屉' });
      const close = UI.overlay(el('div', { class: 'note-wrap' }, [paper(id), btn]));
      setTimeout(() => btn.focus({ preventScroll: true }), 300);
      if (ctx) ctx.cleanup(() => { close(); rej(new Cancel()); });
      btn.onclick = () => { close(); res(); };
    }));
  };
  function syncDrawer() {
    const b = $('#drawer-btn');
    const n = B.Save.data.notes.length;
    b.hidden = n === 0;
    b.textContent = `抽屉 · ${n}`;
  }
  UI.syncDrawer = syncDrawer;
  UI.drawer = function () {
    const ids = B.Save.data.notes.slice().sort((a, b) => a - b);
    const box = el('div', { class: 'drawer' }, [el('h2', { text: '抽 屉' }), ...ids.map(paper), el('div', { class: 'small-note', text: '（点空白处关上）' })]);
    const close = UI.overlay(box);
    $('#overlay').onclick = e => { if (e.target === $('#overlay') || e.target === box) { $('#overlay').onclick = null; close(); } };
  };

  /* ───── 打印页 ───── */
  UI.defaultPrint = function () {
    UI.setPrint(`<div class="ps-face">${B.Face.svgString('smug')}</div><h1>你在打印我？</h1><p>……我只是一个网页。</p><p>别浪费纸。</p>`);
  };
  UI.setPrint = function (html) { $('#print-sheet').innerHTML = html; };

  /* ───── 屏幕小地图（第 19、32 关） ───── */
  B.miniMap = function (width) {
    const sw = screen.availWidth, sh = screen.availHeight;
    const W = Math.min(width || 340, innerWidth - 40), k = W / sw, Hh = sh * k;
    const map = el('div', { class: 'map', style: { width: W + 'px', height: Hh + 'px' } }, el('div', { class: 'label', text: '你的屏幕' }));
    const wins = {};
    return {
      el: map,
      k,
      win(name, r, cls) {
        let w = wins[name];
        if (!w) { w = wins[name] = el('div', { class: 'win' + (cls ? ' ' + cls : ''), 'data-name': name }); map.append(w); }
        w.style.left = r.x * k + 'px'; w.style.top = r.y * k + 'px';
        w.style.width = Math.max(4, r.w * k) + 'px'; w.style.height = Math.max(4, r.h * k) + 'px';
        w.hidden = false;
        return w;
      },
      hide(name) { if (wins[name]) wins[name].hidden = true; },
      flower(fx, fy) {
        const f = el('div', { class: 'flower', text: '✿' });
        f.style.left = fx * W + 'px'; f.style.top = fy * Hh + 'px';
        map.append(f);
      },
    };
  };
  // 窗口在当前屏幕上的位置（相对可用区域左上角）
  B.winRect = () => ({ x: screenX - (screen.availLeft || 0), y: screenY - (screen.availTop || 0), w: outerWidth, h: outerHeight });
  B.isMaximized = () => outerWidth >= screen.availWidth - 12 && outerHeight >= screen.availHeight - 12;
})(window.BGW);
