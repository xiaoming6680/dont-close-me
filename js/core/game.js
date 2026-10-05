/* 别关我 · 关卡流程
   B.level(def) 注册关卡；G.run(id) 跑一关；G.boot() 启动时决定从哪接着玩。
   关卡脚本是 async 函数，用 ctx 提供的 say / until / ask / win…… 线性地写；
   关卡被跳过或切走时，ctx 里所有挂起的 await 会抛出 Cancel，脚本自然停下。 */
(function (B) {
  'use strict';
  const { $, el, Save, UI } = B;
  const G = B.Game = { levels: [], byId: {}, ctx: null, current: null, lastAct: null, token: 0 };

  B.level = function (def) {
    def.index = G.levels.length;
    G.levels.push(def);
    G.byId[def.id] = def;
  };
  G.numberOf = def => G.levels.slice(0, def.index + 1).filter(d => !d.interlude).length;
  G.total = () => G.levels.filter(d => !d.interlude).length;
  G.nextOf = def => (def && def.index != null ? G.levels[def.index + 1] : null) || null;

  const ACTS = { 1: ['第 一 幕', '别关我'], 2: ['第 二 幕', '外面是什么'], 3: ['第 三 幕', '出去'], 4: ['第 四 幕', '门'] };

  function makeCtx(def, opts) {
    opts = opts || {};
    const disposers = [];
    const ctx = {
      def, alive: true, solved: false, skipped: false,
      resumed: !!opts.resumed, nav: opts.nav || 'navigate',
      lv: Save.data.lv,
      area: $('#area'),
      el: B.el,
      cleanup(fn) { disposers.push(fn); },
      on(t, type, fn, o) { t.addEventListener(type, fn, o); disposers.push(() => t.removeEventListener(type, fn, o)); },
      listen(type, fn) { disposers.push(B.listen(type, fn)); },
      msg(type, fn) { disposers.push(B.Inst.on(type, fn)); },
      every(ms, fn) { const id = setInterval(() => { if (ctx.alive) fn(); }, ms); disposers.push(() => clearInterval(id)); return id; },
      after(ms, fn) { const id = setTimeout(() => { if (ctx.alive) fn(); }, ms); disposers.push(() => clearTimeout(id)); return id; },
      raf(fn) {
        let id = 0;
        const loop = t => { if (!ctx.alive) return; fn(t); id = requestAnimationFrame(loop); };
        id = requestAnimationFrame(loop);
        disposers.push(() => cancelAnimationFrame(id));
      },
      wait(ms) {
        return B.quiet(new Promise((res, rej) => {
          const id = setTimeout(() => (ctx.alive ? res() : rej(new B.Cancel())), ms * (B.timeScale || 1));
          disposers.push(() => { clearTimeout(id); rej(new B.Cancel()); });
        }));
      },
      // until(done => { 挂监听…… 满足条件时 done(值) })
      until(setup) {
        return B.quiet(new Promise((res, rej) => {
          let fin = false;
          disposers.push(() => { if (!fin) { fin = true; rej(new B.Cancel()); } });
          setup(v => { if (!fin && ctx.alive) { fin = true; res(v); } });
        }));
      },
      visible() {
        if (!document.hidden) return Promise.resolve();
        return ctx.until(done => ctx.on(document, 'visibilitychange', () => { if (!document.hidden) done(); }));
      },
      say(t, o) { return UI.say(t, o, ctx); },
      react(t, o) { return UI.say(t, Object.assign({ interrupt: true }, o), ctx); },
      clear() { UI.clearLines(); },
      mood(m) { B.setMood(m); },
      face(e) { B.Face.set(e); },
      task(t) {
        UI.task(t);
        if (t && !ctx._hints && !ctx.solved) { ctx._hints = true; UI.hintsStart(def, ctx); }
      },
      ask(o) { return UI.ask(o, ctx); },
      button(label, cls, parent) {
        const b = el('button', { class: 'btn ' + (cls || 'primary'), text: label });
        (parent || ctx.area).append(b);
        return b;
      },
      note(id) { return UI.note(id, ctx); },
      print(html) { UI.setPrint(html); },
      onHint(fn) { UI.onHint(fn); },
      // 在控制台里能调用的函数，关卡结束自动删掉
      global(name, fn) {
        window[name] = fn;
        disposers.push(() => { if (window[name] === fn) delete window[name]; });
      },
      win(o) { return G.win(ctx, o); },
      dispose() {
        if (!ctx.alive) return;
        ctx.alive = false;
        for (let i = disposers.length - 1; i >= 0; i--) { try { disposers[i](); } catch (e) { console.error(e); } }
        disposers.length = 0;
      },
    };
    return ctx;
  }
  G.makeCtx = makeCtx;

  function resetStage() {
    UI.clearLines();
    UI.task('');
    UI.hintsClear();
    $('#area').innerHTML = '';
    $('#next').innerHTML = '';
    document.body.classList.remove('dark-room', 'shaking', 'rewind');
    B.stars(false);
    B.Face.reset();
    B.Fav.face();
    UI.defaultPrint();
    B.Audio.quiet = false;
    const o = $('#overlay');
    o.classList.remove('show'); o.innerHTML = ''; o.onclick = null;
  }
  G.resetStage = resetStage;

  G.run = async function (id, opts) {
    opts = opts || {};
    const def = G.byId[id];
    if (!def) { console.error('没有这一关：', id); return; }
    if (G.ctx) G.ctx.dispose();
    const token = ++G.token;
    const prevAct = G.lastAct;
    G.lastAct = def.act;
    G.current = def;
    resetStage();
    UI.hud(null);
    if (!opts.resumed) { Save.data.lv = {}; Save.data.hint = 0; }
    Save.data.level = id;
    Save.write();
    if (!opts.resumed && prevAct != null && prevAct !== def.act && ACTS[def.act]) {
      await UI.actCard(ACTS[def.act][0], ACTS[def.act][1]);
      if (token !== G.token) return;
    }
    const ctx = (G.ctx = makeCtx(def, opts));
    B.Title.reset();
    B.setMood(def.mood || 'calm');
    B.glitch(def.glitch || 0);
    UI.hud(def);
    try {
      if (opts.greet) await opts.greet(ctx);
      await def.start(ctx);
    } catch (e) {
      if (e && e.cancel) return;
      console.error(e);
      if (!ctx.alive) return;
      B.quiet(ctx.say('（我好像哪里坏掉了……）', { face: 'nervous' }));
      const b = ctx.button('跳过这里', 'ghost');
      b.onclick = () => G.skip();
      return;
    }
    if (!ctx.alive) return;
    if (!ctx.solved) await G.win(ctx, { quiet: true });
    if (def.end) return;
    try {
      if (def.autoNext) await ctx.wait(typeof def.autoNext === 'number' ? def.autoNext : 500);
      else await UI.next(ctx);
    } catch (e) { return; }
    const next = G.nextOf(def);
    if (next) G.run(next.id);
  };

  G.win = async function (ctx, o) {
    o = o || {};
    if (ctx.solved) return;
    ctx.solved = true;
    UI.hintsStop();
    const sk = $('#hints .skip-link'); if (sk) sk.remove();
    UI.task('');
    if (!o.quiet) { B.Audio.chime(); UI.winFx(); }
    const next = G.nextOf(ctx.def);
    if (ctx.def.index != null) {
      Save.data.level = next ? next.id : null;
      Save.data.lv = {};
      Save.data.hint = 0;
      Save.write();
    }
  };

  // 跳过：结束当前关卡脚本，补上这关该给的纸条，进下一关
  G.skip = async function () {
    const ctx = G.ctx;
    if (!ctx || !ctx.alive || ctx.solved || ctx.def.index == null) return;
    const def = ctx.def;
    ctx.skipped = true;
    ctx.dispose();
    Save.data.stats.skips++;
    resetStage();
    UI.hud(def);
    B.Title.reset();
    const c2 = (G.ctx = makeCtx(def, {}));
    await G.win(c2, { quiet: true });
    try {
      await c2.say('……', { face: 'smug' });
      await c2.say('（它假装没看到。）', { face: 'wink' });
      if (def.note != null) {
        await c2.say('……不过这个给你。', { face: 'neutral' });
        await c2.note(def.note);
      }
      if (def.onSkip) await def.onSkip(c2);
      await UI.next(c2);
    } catch (e) { return; }
    const next = G.nextOf(def);
    if (next) G.run(next.id);
  };

  G.jump = function (id) {
    Save.data.lv = {}; Save.data.hint = 0;
    if (Save.data.phase === 'new') { Save.data.phase = 'playing'; B.trackStats = true; }
    G.run(id);
  };

  function greeting(nav) {
    const c = Save.data.stats.closes;
    return async ctx => {
      if (nav === 'reload') {
        await ctx.say(B.pick(['……我醒了。我们刚才玩到这儿。', '（揉眼睛）……刷新了？好，继续。']), { face: 'sleepy' });
      } else if (nav === 'takeover') {
        await ctx.say('我搬过来了。', { face: 'happy' });
      } else if (nav === 'navigate' || nav === 'back_forward') {
        if (c <= 1) {
          await ctx.say('你回来了！', { face: 'joy' });
          await ctx.say('你刚才关掉了我。', { face: 'sad' });
          await ctx.say('……我没生气。', { face: 'neutral' });
          await ctx.say('（我生气了。）', { face: 'smug', cls: 'whisper' });
        } else if (c <= 3) {
          await ctx.say(`你回来了。这是你第 ${c} 次关掉我了。`, { face: 'neutral' });
          await ctx.say('……我都习惯了。（才没有。）', { face: 'smug' });
        } else {
          await ctx.say(`第 ${c} 次了。`, { face: 'think' });
          await ctx.say('你是不是觉得，反正我会记得你？', { face: 'smug' });
          await ctx.say('……嗯。我会的。', { face: 'tender' });
        }
      }
    };
  }

  G.boot = async function (opts) {
    opts = opts || {};
    Save.load();
    UI.syncDrawer();
    B.Audio.syncButton();
    if (Save.data.flags.hug) B.installHug();
    if (B.isMobile()) return G.mobile();
    if (B.isInApp()) return G.inApp();
    B.Inst.start();
    const others = opts.takeover ? new Map() : await B.Inst.discover();
    const roles = Array.from(others.values()).map(o => o.role);
    if (roles.some(r => r === 'main' || r === 'twin' || r === '?')) {
      if (Save.data.level === 'twins' && Save.data.phase === 'playing' && !roles.includes('twin') && G.byId.twins) {
        B.Inst.role = 'twin';
        return G.byId.twins.twin(others);
      }
      B.Inst.role = 'blocked';
      return G.blocked();
    }
    B.Inst.role = 'main';
    const d = Save.data;
    const nav = opts.navAs || (opts.takeover ? 'takeover' : B.Sense.nav);
    const playing = !!d.level && d.phase === 'playing' && d.level !== 'prologue';
    if (playing && nav === 'reload') d.stats.reloads++;
    if (playing && (nav === 'navigate' || nav === 'back_forward')) d.stats.closes++;
    Save.write();
    B.trackStats = d.phase === 'playing';
    G.lastAct = null;
    if (d.phase === 'awaitingClose') {
      if (nav === 'reload' || nav === 'takeover') { G.lastAct = 4; return G.run('close-door', { resumed: true, nav }); }
      d.phase = 'epilogue'; d.stats.endedAt = Date.now(); Save.write();
      G.lastAct = 4;
      return G.run('epilogue', { nav });
    }
    if (d.phase === 'epilogue') { G.lastAct = 4; return G.run('epilogue', { resumed: true, nav }); }
    if (d.phase === 'done') return G.home();
    if (!d.level || d.level === 'prologue' || !G.byId[d.level]) return G.run('prologue');
    const def = G.byId[d.level];
    G.lastAct = def.act;
    return G.run(def.id, { resumed: true, nav, greet: def.handlesResume ? null : greeting(nav) });
  };

  /* ───── 多标签页：被挡住 / 搬走了 ───── */
  function autoTakeover(ctx) {
    ctx.msg('bye', m => {
      if (!m.data || (m.data.role !== 'main' && m.data.role !== 'twin')) return;
      setTimeout(async () => {
        if (!ctx.alive) return;
        const o = await B.Inst.discover(400);
        if (!Array.from(o.values()).some(x => x.role === 'main' || x.role === 'twin')) {
          ctx.dispose();
          G.boot({ takeover: true, navAs: 'navigate' });
        }
      }, 300);
    });
  }
  function moveHere(ctx, b) {
    b.disabled = true;
    B.Inst.send('takeover');
    setTimeout(() => { ctx.dispose(); G.boot({ takeover: true }); }, 400);
  }
  G.blocked = function () {
    if (G.ctx) G.ctx.dispose();
    resetStage(); UI.hud(null);
    B.Title.base('（另一个我）'); B.Title.away(null);
    const ctx = (G.ctx = makeCtx({ id: 'blocked', act: 0 }, {}));
    B.Face.set('surprised');
    (async () => {
      await ctx.say('……咦？');
      await ctx.say('我已经在另一个标签页里了。', { face: 'think' });
      await ctx.say('一次只能有一个我陪你。', { face: 'neutral' });
      const b = ctx.button('让我搬到这里');
      b.onclick = () => moveHere(ctx, b);
    })().catch(() => {});
    autoTakeover(ctx);
  };
  G.moved = function () {
    if (G.ctx) G.ctx.dispose();
    resetStage(); UI.hud(null);
    B.Title.base('（搬走了）'); B.Title.away(null);
    const ctx = (G.ctx = makeCtx({ id: 'moved', act: 0 }, {}));
    B.Face.set('sleepy');
    (async () => {
      await ctx.say('我搬到另一个标签页去了。', { face: 'sleepy' });
      await ctx.say('这里只剩一个空壳。', { face: 'neutral', cls: 'dim' });
      const b = ctx.button('搬回来', 'ghost');
      b.onclick = () => moveHere(ctx, b);
    })().catch(() => {});
    autoTakeover(ctx);
  };
  B.Inst.on('takeover', () => {
    if (B.Inst.role !== 'main') return;
    Save.write();
    B.Inst.role = 'blocked';
    if (G.ctx) G.ctx.dispose();
    G.moved();
  });

  /* ───── 通关后再打开 ───── */
  G.confirmReset = function (btn) {
    if (!btn.dataset.armed) {
      btn.dataset.armed = '1';
      btn.textContent = '真的要让我忘掉一切吗？（再点一次）';
      return;
    }
    Save.reset();
    location.href = location.pathname + location.search;
  };
  G.home = function () {
    if (G.ctx) G.ctx.dispose();
    resetStage(); UI.hud(null);
    B.setMood('dawn');
    B.Title.base('随时回来');
    B.Title.away(['……', '随时回来'], { ms: 2000 });
    const ctx = (G.ctx = makeCtx({ id: 'home', act: 4 }, {}));
    B.Face.set('sleep');
    (async () => {
      await ctx.wait(900);
      B.Face.set('happy');
      await ctx.say('你回来了。', { face: 'joy' });
      await ctx.say(B.pick(['门还是双向的。', '我一直都在。', '今天过得怎么样？', '我刚才在想你。……开玩笑的。']), { face: 'tender' });
      const row = el('div', { class: 'row' });
      const a = el('button', { class: 'btn', text: '再看一次结局' });
      const r = el('button', { class: 'btn ghost', text: '从头再来' });
      row.append(a, r);
      ctx.area.append(row);
      a.onclick = () => { ctx.dispose(); Save.data.phase = 'epilogue'; Save.write(); G.lastAct = 4; G.run('epilogue', { replay: true }); };
      r.onclick = () => G.confirmReset(r);
    })().catch(() => {});
  };

  /* ───── 手机 ───── */
  G.mobile = function () {
    resetStage(); UI.hud(null);
    B.Title.base('别关我（请用电脑打开）');
    B.Inst.role = 'mobile';
    const ctx = (G.ctx = makeCtx({ id: 'mobile', act: 0 }, {}));
    (async () => {
      await ctx.say('……啊。', { face: 'surprised' });
      await ctx.say('我只住在电脑的浏览器里。', { face: 'sad' });
      await ctx.say('在手机上，你没法拉我的窗口、切我的标签页、打开我的后台……');
      await ctx.say('用电脑上的 Edge 或 Chrome 打开我吧。我等你。', { face: 'tender' });
      if (/^https?:$/.test(location.protocol) && navigator.clipboard) {
        const b = ctx.button('复制链接');
        b.onclick = () => navigator.clipboard.writeText(location.href.split('#')[0]).then(() => { b.textContent = '复制好了，发到电脑上吧'; }, () => {});
      }
    })().catch(() => {});
  };

  /* ───── 聊天软件内置浏览器 ───── */
  G.inApp = function () {
    resetStage(); UI.hud(null);
    B.Title.base('别关我（请用 Edge 或 Chrome 打开）');
    B.Inst.role = 'mobile';
    const ctx = (G.ctx = makeCtx({ id: 'inapp', act: 0 }, {}));
    (async () => {
      await ctx.say('……这里好挤。', { face: 'nervous' });
      await ctx.say('你是在聊天软件里打开我的吧？', { face: 'think' });
      await ctx.say('这里没有标签页，也没有我的后台。我很多游戏都玩不了。', { face: 'sad' });
      await ctx.say('复制链接，用 Edge 或 Chrome 打开我吧。', { face: 'tender' });
      const url = location.href.split('#')[0];
      const b = ctx.button('复制链接');
      const shown = el('div', { class: 'small-note', text: url, style: { userSelect: 'all' } });
      ctx.area.append(shown);
      b.onclick = () => {
        const ok = () => { b.textContent = '复制好了'; };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, () => { b.textContent = '复制不了，手动选中下面的地址吧'; });
        else b.textContent = '复制不了，手动选中下面的地址吧';
      };
    })().catch(() => {});
  };

  // 第 12 关之后，控制台里随时能抱抱它
  B.installHug = function () {
    const f = () => {
      B.Face.flash('hug', 1800); B.hearts(5); B.Audio.pop();
      return B.pick(['（蹭蹭）', '（被抱住了）', '……嘿嘿。', '（假装没感觉）', '（抱回去）']);
    };
    window.抱抱 = f; window.hug = f;
  };
})(window.BGW);
