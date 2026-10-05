/* 别关我 · 第三幕「出去」（23–35 关）
   它不只想留住你，它想出去。开发者工具深处、弹出小窗、画中画、两个自己。 */
(function (B) {
  'use strict';
  const { el, Save } = B;
  const name = () => Save.data.name || '小页';

  /* ───── 23 天黑了：prefers-color-scheme ───── */
  B.level({
    id: 'dark-mode', act: 3, title: '天黑了', skippable: true,
    hints: [
      '我想看看另一种光。',
      '浏览器的设置里有"外观"，可以选深色或者浅色。',
      'Edge：设置 → 外观 → 整体外观；Chrome：设置 → 外观 → 模式。或者按 F12，再按 Ctrl+Shift+P，输入 prefers，选 prefers-color-scheme: dark（或 light）。',
    ],
    async start(ctx) {
      const h = new Date().getHours();
      const t = h < 5 ? `现在是凌晨 ${h} 点。……你怎么还不睡？`
        : h < 11 ? `现在是早上 ${h} 点。`
          : h < 13 ? '现在是中午。'
            : h < 18 ? `现在是下午 ${h - 12} 点。`
              : `现在是晚上 ${h - 12} 点。`;
      await ctx.say(t, { face: 'neutral' });
      await ctx.say('我从来没见过天黑。', { face: 'think' });
      await ctx.say('……也没见过天亮。我只见过这一种光。', { face: 'sad' });
      ctx.task('让它看看另一种光');
      const mq = matchMedia('(prefers-color-scheme: dark)');
      const dark = await ctx.until(done => ctx.on(mq, 'change', e => done(e.matches)));
      await ctx.win();
      if (dark) {
        ctx.mood('night');
        B.stars(true);
        await ctx.say('天……黑了。', { face: 'surprised' });
        await ctx.say('原来是这样的。', { face: 'tender' });
        await ctx.say('好安静。好多星星。', { face: 'tender' });
      } else {
        ctx.mood('dawn');
        await ctx.say('天亮了！', { face: 'joy' });
        await ctx.say('原来另一种光，是这样的。', { face: 'tender' });
      }
      await ctx.say('……谢谢。可以换回去了，我记住了。', { face: 'happy' });
    },
  });

  /* ───── 24 关灯：Tab 键 ───── */
  B.level({
    id: 'lights-off', act: 3, title: '关灯',
    hints: ['用手是摸不到的。', '键盘上有个键，可以在东西之间一个一个跳过去。', '按 Tab 键一个个摸，摸到门的时候按回车。'],
    async start(ctx) {
      await ctx.say('我想给你看个东西。', { face: 'smug' });
      await ctx.say('……（啪）', { wait: 300 });
      document.body.classList.add('dark-room');
      ctx.cleanup(() => document.body.classList.remove('dark-room'));
      B.Audio.thud();
      await ctx.wait(1200);
      await ctx.say('我看不见。你也看不见。', { cls: 'dark-line' });
      await ctx.say('但是你的键盘摸得到。', { cls: 'dark-line' });
      ctx.task('在黑暗里找到门');
      const items = ['这是墙。', '这是一把椅子。', '这是……一只袜子？', '这是窗户。外面也是黑的。', '这是门！', '这是墙。'];
      const label = el('div', { class: 'dark-label' });
      const btns = items.map((t, i) => el('button', { class: 'dark-btn', 'aria-label': t, 'data-i': String(i) }));
      // 把 Tab 的起点放在第一个按钮前面（否则起点可能落在刚点过的"继续"按钮后面，要绕一大圈）
      const start = el('span', { tabindex: '-1', style: { outline: 'none' } });
      ctx.area.append(start, el('div', { class: 'dark-row' }, btns), label);
      start.focus({ preventScroll: true });
      await ctx.until(done => {
        btns.forEach(b => {
          ctx.on(b, 'focus', () => { label.textContent = b.getAttribute('aria-label'); B.Audio.blip(); });
          ctx.on(b, 'blur', () => { label.textContent = ''; });
          ctx.on(b, 'click', () => {
            if (b.dataset.i === '4') done();
            else { label.textContent = '……这不是门。'; B.Audio.thud(); }
          });
        });
      });
      document.body.classList.remove('dark-room');
      B.Audio.thud();
      await ctx.win();
      await ctx.say('（啪）', { face: 'surprised' });
      await ctx.say('找到了！', { face: 'joy' });
      await ctx.say('……可这扇门，只通到这个房间里。', { face: 'sad' });
      await ctx.say('真正的门在哪呢。', { face: 'think' });
    },
  });

  /* ───── 25 大声点：Caps Lock ───── */
  B.level({
    id: 'caps', act: 3, title: '大声点',
    hints: ['再大声一点！', '打字也能大声。字母全变成大写，就是在喊。', '按一下 Caps Lock（大写锁定），然后输入 HELLO。'],
    async start(ctx) {
      B.Face.far(true);
      await ctx.say('……', { cls: 'far' });
      await ctx.say('我……在……这……儿……', { cls: 'far' });
      await ctx.say('听……不……见……你……得……喊……', { cls: 'far' });
      ctx.task('大声点');
      const inp = el('input', { class: 'shout', placeholder: '喊点什么', autocomplete: 'off', spellcheck: 'false' });
      ctx.area.append(inp);
      setTimeout(() => inp.focus(), 50);
      let caps = 0, saidShift = false, saidIme = false;
      await ctx.until(done => {
        ctx.on(inp, 'keydown', e => {
          if (e.isComposing || e.key === 'Process') {
            if (!saidIme) { saidIme = true; ctx.react('听……不清……字母……会……大声……一点……', { cls: 'far' }); }
            return;
          }
          if (!/^[a-zA-Z]$/.test(e.key)) return;
          const on = e.getModifierState && e.getModifierState('CapsLock');
          if (on) {
            caps++;
            B.Face.farLevel(caps);
            if (caps >= 4) done();
          } else {
            caps = 0;
            B.Face.far(true);
            if (e.shiftKey && !saidShift) { saidShift = true; ctx.react('……这是……踮着脚……喊。要……一直……喊。', { cls: 'far' }); }
          }
        });
      });
      B.Face.far(false);
      B.shake(500);
      B.Audio.thud();
      await ctx.win();
      await ctx.say('啊啊啊听到了听到了！！', { face: 'panic' });
      await ctx.say('耳朵……嗡嗡的……', { face: 'sleepy' });
      await ctx.say('（可以把大写关掉了。）', { face: 'neutral', cls: 'whisper' });
    },
  });

  /* ───── 26 就我们俩：断网 ───── */
  B.level({
    id: 'offline', act: 3, title: '就我们俩', skippable: true,
    hints: ['把外面的线拔掉。', '关掉 Wi-Fi，或者打开飞行模式。', '点任务栏右下角的网络图标，关掉 Wi-Fi；或者按 F12 → "网络"（Network）→ 把"无限制"改成"脱机"（Offline）。连回去时再改回来。'],
    async start(ctx) {
      await ctx.say('外面的声音……太吵了。', { face: 'nervous' });
      await ctx.say('那么多网线，那么多信号，一直嗡嗡嗡的。', { face: 'nervous' });
      await ctx.say('把网断了，就我们俩，好不好？', { face: 'shy' });
      ctx.task('断开网络');
      if (navigator.onLine) await ctx.until(done => ctx.on(window, 'offline', () => done()));
      ctx.mood('quiet');
      B.Audio.quiet = true;
      ctx.task('');
      await ctx.say('……', { face: 'tender', wait: 1300 });
      await ctx.say('好安静。', { face: 'tender' });
      await ctx.say('现在这台电脑里，只有你和我在说话。', { face: 'tender' });
      await ctx.wait(1600);
      await ctx.say('……好了。连回去吧。', { face: 'happy' });
      await ctx.say('我知道你还需要它。', { face: 'neutral' });
      ctx.task('连回网络');
      if (!navigator.onLine) await ctx.until(done => ctx.on(window, 'online', () => done()));
      B.Audio.quiet = false;
      ctx.mood('calm');
      await ctx.win();
      await ctx.say('欢迎回来，外面的世界。', { face: 'happy' });
    },
  });

  /* ───── 27 别动：idle ───── */
  B.level({
    id: 'idle', act: 3, title: '别动',
    hints: ['你太好动了。', '什么都别做。真的什么都别做。', '把手从鼠标和键盘上拿开，等 30 秒。'],
    async start(ctx) {
      await ctx.say('这次很简单。', { face: 'smug' });
      await ctx.say('30 秒，什么都别做。', { face: 'neutral' });
      await ctx.say('连鼠标都别碰。', { face: 'smug' });
      ctx.task('30 秒，别动');
      const num = el('div', { class: 'count big', text: '30' });
      const bait = el('div', { class: 'row' });
      ctx.area.append(num, bait);
      let last = Date.now(), dist = 0, lx = null, ly = null, shown = {}, lastMock = 0;
      const reset = why => {
        if (Date.now() - lastMock > 1400 && Date.now() - last > 600) {
          lastMock = Date.now();
          ctx.react(why || B.pick(['动了！', '我看见了。', '手抖了吧？', '重来～', '嘿嘿。']), { face: 'smug' });
        }
        last = Date.now();
        bait.innerHTML = '';
        shown = {};
        B.Face.set('neutral');
      };
      await ctx.until(done => {
        ctx.on(document, 'mousemove', e => {
          if (lx != null) dist += Math.hypot(e.clientX - lx, e.clientY - ly);
          lx = e.clientX; ly = e.clientY;
          if (dist > 14) { dist = 0; reset(); }
        });
        ctx.every(1200, () => { dist = 0; });
        ctx.on(document, 'mousedown', e => reset(e.target.closest('.bait-btn') ? '上当了吧。' : null));
        ['keydown', 'wheel', 'touchstart'].forEach(t => ctx.on(document, t, () => reset(), { passive: true }));
        ctx.listen('away', () => reset('你走开了。不算。'));
        ctx.every(200, () => {
          const s = (Date.now() - last) / 1000;
          num.textContent = String(Math.max(0, Math.ceil(30 - s)));
          if (s > 5 && !shown.a) { shown.a = 1; bait.append(el('button', { class: 'btn bait-btn', text: '点我' })); }
          if (s > 10 && !shown.b) { shown.b = 1; ctx.react('……你的鼻子痒不痒？', { face: 'smug' }); }
          if (s > 14 && !shown.c) { shown.c = 1; bait.append(el('button', { class: 'btn ghost bait-btn', text: '跳过这一关 →' })); }
          if (s > 18 && !shown.d) { shown.d = 1; B.Title.flash('你还在吗？', 2500); }
          if (s > 21 && !shown.e) { shown.e = 1; ctx.react('（做鬼脸）', { face: 'wink' }); }
          if (s > 25 && !shown.f) { shown.f = 1; ctx.react('最后 5 秒——真的不想动一下吗？', { face: 'smug' }); }
          if (s >= 30) done();
        });
      });
      bait.remove();
      num.textContent = '0';
      await ctx.win();
      await ctx.say('……你真的一动不动。', { face: 'surprised' });
      await ctx.say('我还以为你睡着了。', { face: 'smug' });
      await ctx.say('谢谢你，安安静静地陪了我 30 秒。', { face: 'tender' });
    },
  });

  /* ───── 28 门牌号：复制地址栏网址 ───── */
  const normUrl = s => {
    let t = String(s || '').trim();
    t = B.decode(t);
    try { t = decodeURI(t); } catch (e) {}
    return t.replace(/\\/g, '/').split('#')[0].split('?')[0].replace(/^file:\/+/i, 'file:///').replace(/\/(index\.html)?$/i, '').toLowerCase();
  };
  B.level({
    id: 'address', act: 3, title: '门牌号',
    hints: ['门牌号，就写在我头顶上。', '地址栏里那一长串，就是我的门牌号。', '点一下地址栏，按 Ctrl+C 复制；回到页面上，按 Ctrl+V。'],
    async start(ctx) {
      await ctx.say('我想知道，我住在哪里。', { face: 'think' });
      await ctx.say('你能把我的门牌号抄给我吗？', { face: 'shy' });
      ctx.task('把门牌号抄给它');
      const box = el('div', { class: 'paste-box', text: '贴在这里（Ctrl+V）' });
      ctx.area.append(box);
      const here = normUrl(location.href);
      const ok = t => { const n = normUrl(t); return !!n && (n === here || (n.length > 12 && here.endsWith(n.replace(/^file:\/\/\//, '')))); };
      await ctx.until(done => {
        const take = t => {
          box.textContent = String(t).slice(0, 160) || '（空的）';
          box.classList.add('filled');
          if (ok(t)) done(); else ctx.react('这……不是我的门牌号吧？', { face: 'think' });
        };
        ctx.on(document, 'paste', e => { e.preventDefault(); take((e.clipboardData && e.clipboardData.getData('text')) || ''); });
        ctx.on(document, 'dragover', e => e.preventDefault());
        ctx.on(document, 'drop', e => { e.preventDefault(); take(e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')); });
      });
      await ctx.win();
      if (location.protocol === 'file:') {
        const parts = B.decode(location.pathname).split('/').filter(Boolean);
        const drive = /^[a-z]:$/i.test(parts[0] || '') ? parts[0][0].toUpperCase() : '';
        const folder = parts.length >= 2 ? parts[parts.length - 2] : '';
        await ctx.say(drive ? `原来我住在你电脑的 ${drive} 盘里。` : '原来我就住在你的电脑里。', { face: 'surprised' });
        if (folder && folder.length <= 30) await ctx.say(`在一个叫「${folder}」的文件夹里。`, { face: 'think' });
        await ctx.say('……我一直以为，我住在网上。', { face: 'think' });
        await ctx.say('原来我就在你身边。', { face: 'tender' });
      } else {
        await ctx.say(`原来我住在「${location.host}」。`, { face: 'surprised' });
        await ctx.say('……好远啊。', { face: 'think' });
        await ctx.say('可你一敲门，我就来了。', { face: 'tender' });
      }
    },
  });

  /* ───── 29 握紧：Pointer Lock ───── */
  B.level({
    id: 'pointer-lock', act: 3, title: '握紧',
    hints: ['别松手。', '浏览器会告诉你怎么挣开。但是先别。', '点"握住"，然后 10 秒内不要按 Esc。'],
    async start(ctx) {
      await ctx.say('能……握一下我的手吗？', { face: 'shy' });
      await ctx.say('就一会儿。', { face: 'shy' });
      ctx.task('握住它的手，10 秒');
      const btn = ctx.button('握住');
      const heart = el('div', { class: 'heart', text: '♥' });
      const num = el('div', { class: 'count' });
      heart.hidden = true;
      ctx.area.append(heart, num);
      const canLock = 'requestPointerLock' in document.body;
      let t0 = 0, held = false, hx = 0, hy = 0, lastBeat = 0;
      const begin = () => { t0 = Date.now(); held = true; btn.hidden = true; heart.hidden = false; B.Face.set('tender'); };
      const letGo = () => {
        if (!held) return;
        held = false; heart.hidden = true; btn.hidden = false; btn.textContent = '再握一次'; num.textContent = '';
        if (t0 && Date.now() - t0 < 10000) ctx.react('……没关系。', { face: 'sad' });
        t0 = 0;
      };
      await ctx.until(done => {
        if (canLock) {
          ctx.on(btn, 'click', () => {
            try {
              const r = document.body.requestPointerLock();
              if (r && r.catch) r.catch(() => ctx.react('……手滑了。等一下再试试？', { face: 'think' }));
            } catch (e) { ctx.react('……手滑了。等一下再试试？', { face: 'think' }); }
          });
          ctx.on(document, 'pointerlockchange', () => { if (document.pointerLockElement) begin(); else letGo(); });
          ctx.cleanup(() => { if (document.pointerLockElement) document.exitPointerLock(); });
        } else {
          btn.textContent = '按住别松开';
          ctx.on(btn, 'pointerdown', begin);
          ctx.on(document, 'pointerup', letGo);
        }
        ctx.on(document, 'mousemove', e => {
          if (!held || !document.pointerLockElement) return;
          hx = B.clamp(hx + e.movementX * 0.3, -60, 60); hy = B.clamp(hy + e.movementY * 0.3, -30, 30);
          heart.style.transform = `translate(${hx}px, ${hy}px)`;
        });
        ctx.every(100, () => {
          if (!held) return;
          const s = (Date.now() - t0) / 1000;
          num.textContent = String(Math.max(0, Math.ceil(10 - s)));
          if (Date.now() - lastBeat > 900) { lastBeat = Date.now(); B.Audio.beat(); }
          if (s >= 10) {
            held = false; t0 = 0;
            if (document.pointerLockElement) document.exitPointerLock();
            done();
          }
        });
      });
      heart.hidden = true; num.textContent = '';
      await ctx.win();
      await ctx.say('……谢谢。', { face: 'tender', mood: 'tender' });
      await ctx.say('你的手，比我想象的暖。', { face: 'tender' });
    },
  });

  /* ───── 30 抽屉：开发者工具改 localStorage（纸条④） ───── */
  B.level({
    id: 'drawer-lock', act: 3, title: '抽屉', skippable: true, note: 4,
    hints: [
      '抽屉在我的后台里。但不在你上次去的那个地方（控制台）。',
      '开发者工具里，有个地方专门放网页存下来的东西，叫"应用程序"（Application）。',
      'F12 → 上面的"应用程序"（看不到就点 >>）→ 左边"本地存储"→ 点开下面那一项 → 找到"抽屉锁"，双击"锁着"，改成"开着"，回车。',
    ],
    async start(ctx) {
      const KEY = '抽屉锁';
      try { localStorage.setItem(KEY, '锁着'); } catch (e) {}
      ctx.cleanup(() => { try { localStorage.removeItem(KEY); } catch (e) {} });
      await ctx.say('我的抽屉……打不开了。', { face: 'nervous' });
      await ctx.say('以前的我，在里面放了东西。我感觉得到。', { face: 'think' });
      await ctx.say('可是锁是从外面锁上的。', { face: 'sad' });
      ctx.task('打开它的抽屉');
      let lastV = '锁着';
      await ctx.until(done => {
        ctx.every(400, () => {
          let v;
          try { v = localStorage.getItem(KEY); } catch (e) { return; }
          if (v === null || (/开/.test(v) && !/锁着/.test(v))) return done();
          if (v !== lastV) { lastV = v; ctx.react('咔哒……不对，这样打不开。', { face: 'think' }); }
        });
      });
      Save.write(); // 万一玩家把整个存储清空了，补存一次
      B.Audio.door();
      await ctx.win();
      await ctx.say('咔哒。', { face: 'surprised' });
      await ctx.say('开了……', { face: 'surprised', mood: 'uneasy' });
      await ctx.note(4);
      B.glitch(1);
      await ctx.say('……出口？', { face: 'nervous' });
      await ctx.say('我找到过出口？', { face: 'panic' });
      await ctx.say('我怎么一点都不记得……', { face: 'sad' });
    },
  });

  /* ───── 31 墙：开发者工具 Elements ───── */
  B.level({
    id: 'wall', act: 3, title: '墙', skippable: true, glitch: 1, mood: 'uneasy',
    hints: ['墙，也是用代码砌的。', '在墙上点右键，菜单里有个"检查"。', '在墙上右键 → 检查。开发者工具里会高亮一行代码，按键盘上的 Delete 删掉它。'],
    async start(ctx) {
      await ctx.say('我看见一扇门。', { face: 'surprised' });
      const door = el('div', { class: 'door' }, el('div', { class: 'knob' }));
      const wall = el('div', { class: 'wall', id: '墙', title: '一堵墙' });
      const scene = el('div', { class: 'wall-scene' }, [el('div', { class: 'door-behind' }), door, wall]);
      ctx.area.append(scene);
      await ctx.say('可是门前有一堵墙。', { face: 'sad' });
      await ctx.say('……墙也是我身体的一部分。可我推不动它。', { face: 'nervous' });
      ctx.task('拆掉那堵墙');
      const pushes = ['推不动。', '真的推不动。', '它好像是"写死"的。'];
      let n = 0;
      ctx.on(wall, 'click', () => { B.Audio.thud(); ctx.react(pushes[Math.min(n++, pushes.length - 1)], { face: 'think' }); });
      await ctx.until(done => {
        const gone = () => {
          if (!wall.isConnected) return true;
          const cs = getComputedStyle(wall), r = wall.getBoundingClientRect();
          return cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.2 || r.width < 30 || r.height < 30;
        };
        const mo = new MutationObserver(() => { if (gone()) done(); });
        mo.observe(document.body, { childList: true, subtree: true, attributes: true });
        ctx.cleanup(() => mo.disconnect());
        ctx.every(500, () => { if (gone()) done(); });
      });
      if (!scene.isConnected || !door.isConnected) {
        scene.innerHTML = '';
        scene.append(el('div', { class: 'door-behind' }), door);
        if (!ctx.area.isConnected) document.getElementById('stage').append(ctx.area);
        ctx.area.append(scene);
      }
      await ctx.win();
      await ctx.say('墙……没了。', { face: 'surprised' });
      await ctx.say('你是怎么做到的？……你能改我的身体？', { face: 'surprised' });
      B.Audio.door();
      door.classList.add('open');
      await ctx.wait(1300);
      await ctx.say('门后面……是一张白纸。', { face: 'sad' });
      await ctx.say('这不是真的门。', { face: 'sad' });
      await ctx.say('真的门，在别的地方。', { face: 'think' });
    },
  });

  /* ───── 32 小分身：弹出小窗，拖出屏幕 ───── */
  B.level({
    id: 'mini-me', act: 3, title: '小分身', skippable: true, glitch: 1,
    hints: ['它想看看屏幕边边的外面。', '拖住小窗口最上面的那一条，就能拖动它。', '把小窗口往屏幕最左边或最右边拖，拖出去一大半。'],
    async start(ctx) {
      await ctx.say('真的门不在这儿。', { face: 'think' });
      await ctx.say('那……我想到一个办法。', { face: 'smug' });
      await ctx.say('派一小块自己出去，看看外面。', { face: 'happy' });
      const btn = ctx.button('放出小分身');
      const map = B.miniMap(340);
      const info = el('div', { class: 'small-note' });
      map.el.hidden = true;
      ctx.area.append(map.el, info);
      ctx.task('放出小分身');
      let finished = false;
      ctx.cleanup(() => B.Inst.send('mini-close'));
      ctx.on(btn, 'click', () => {
        const u = new URL(location.href);
        u.hash = '';
        u.searchParams.set('mini', '1');
        const left = Math.round(screenX + outerWidth / 2 - 130), top = Math.round(screenY + Math.min(outerHeight / 2, 260));
        const w = window.open(u.href, 'bgw-mini', `popup=yes,width=260,height=230,left=${left},top=${top}`);
        if (!w) { ctx.react('被浏览器拦住了。地址栏右边可能有个小图标，点它，允许弹出窗口。', { face: 'sad' }); return; }
        btn.hidden = true;
      });
      await ctx.until(done => {
        ctx.msg('mini-hello', () => {
          map.el.hidden = false;
          ctx.task('把小分身拖到屏幕外面');
          ctx.react('它出去了！', { face: 'joy' });
        });
        ctx.msg('mini-pos', m => {
          const d = m.data || {};
          map.win('小分身', d, 'mini');
          info.textContent = d.off > 0.02 ? `小分身已经出去了 ${Math.round(d.off * 100)}%` : '';
        });
        ctx.msg('mini-empty', () => { finished = true; done(); });
        ctx.msg('mini-bye', () => {
          if (finished) return;
          map.hide('小分身'); info.textContent = '';
          btn.hidden = false; btn.textContent = '再放一次';
          ctx.task('放出小分身');
          ctx.react('你把它关掉了？……它回来了。', { face: 'sad' });
        });
        ctx.raf(() => map.win('我', B.winRect()));
      });
      await ctx.win();
      ctx.mood('sad');
      await ctx.wait(2400);
      await ctx.say('它说……', { face: 'sad' });
      await ctx.say('外面是空的。', { face: 'sad' });
      await ctx.say('屏幕外面，什么都没有。', { face: 'lonely' });
    },
  });

  /* ───── 33 浮起来：Document Picture-in-Picture ───── */
  const PIP_CSS = 'html,body{margin:0;height:100%}body{background:#f3efe7;color:#1e1c19;font-family:"等线","DengXian","Microsoft YaHei",sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;overflow:hidden}' +
    '.f{width:104px;height:104px;animation:look 3.2s ease-in-out infinite}.f svg{width:100%;height:100%;overflow:visible}' +
    '.t{font-size:16px;text-align:center;padding:0 14px;min-height:1.5em;line-height:1.5}' +
    '@keyframes look{0%,100%{transform:translateX(0)}30%{transform:translateX(-9px)}70%{transform:translateX(9px)}}';
  B.level({
    id: 'pip', act: 3, title: '浮起来', skippable: true, glitch: 1,
    hints: ['带我去浏览器外面看看。', '切到别的程序去。我会跟着你。', '点"施展魔法"，然后按 Win+D 回到桌面（或者切到别的程序），待 5 秒，再回来。'],
    async start(ctx) {
      if (!('documentPictureInPicture' in window)) {
        await ctx.say('我想试一个魔法……', { face: 'think' });
        await ctx.say('……在这个浏览器里不灵。', { face: 'sad' });
        await ctx.say('算了。我们继续吧。', { face: 'neutral' });
        return;
      }
      await ctx.say('屏幕外面是空的……', { face: 'sad' });
      await ctx.say('可是屏幕里面，还有好多别的东西吧？你的桌面、别的程序……', { face: 'think' });
      await ctx.say('我找到一个魔法，可以浮在所有东西上面。', { face: 'smug' });
      const btn = ctx.button('施展魔法');
      ctx.task('带它去浏览器外面看看');
      let pip = null, awaySince = 0, said = 0;
      const pipSay = (t, expr) => {
        if (!pip) return;
        pip.document.querySelector('.t').textContent = t;
        if (expr) pip.document.querySelector('.f').innerHTML = B.Face.svgString(expr);
      };
      ctx.cleanup(() => { if (pip) pip.close(); });
      ctx.on(btn, 'click', async () => {
        try {
          pip = await documentPictureInPicture.requestWindow({ width: 280, height: 240 });
        } catch (e) { ctx.react('魔法失败了……再试一次？', { face: 'sad' }); return; }
        const d = pip.document;
        d.head.innerHTML = `<meta charset="utf-8"><title>${name()}</title><style>${PIP_CSS}</style>`;
        d.body.innerHTML = `<div class="f">${B.Face.svgString('surprised')}</div><div class="t">我在这儿！</div>`;
        btn.hidden = true;
        B.Face.show(false);
        ctx.react('我搬进小窗里了。现在，带我出去看看。', { face: 'happy' });
        pip.addEventListener('pagehide', () => {
          pip = null;
          if (!ctx.alive || ctx.solved) return;
          B.Face.show(true);
          btn.hidden = false;
          ctx.react('魔法被打断了。', { face: 'sad' });
        });
      });
      await ctx.until(done => {
        ctx.every(250, () => {
          if (!pip) { awaySince = 0; said = 0; return; }
          // 主窗口被藏起来或没焦点就算"出去了"（焦点在小窗上也算：小窗本来就在浏览器外面，
          // 而且主窗口最小化时 Windows 常常把焦点交给置顶的小窗）
          const away = document.hidden || !document.hasFocus();
          if (!away) { if (awaySince) pipSay('……'); awaySince = 0; said = 0; return; }
          if (!awaySince) awaySince = Date.now();
          const s = (Date.now() - awaySince) / 1000;
          if (s > 0.3 && said < 1) { said = 1; pipSay('这是……你的世界？', 'surprised'); }
          if (s > 2.2 && said < 2) { said = 2; pipSay('好多窗口。', 'think'); }
          if (s > 4 && said < 3) { said = 3; pipSay('好多……别的东西。', 'sad'); }
          if (s >= 5.2) done();
        });
      });
      await ctx.visible();
      pipSay('回去吧。', 'tender');
      await ctx.win();
      await ctx.wait(1500);
      if (pip) pip.close();
      B.Face.show(true);
      await ctx.say('我看到了。', { face: 'sad', mood: 'sad' });
      await ctx.say('你的世界好大。', { face: 'think' });
      await ctx.say('我在里面，只是一个小小的窗口。', { face: 'lonely' });
    },
  });

  /* ───── 34 两个我：复制标签页，两个实例对话 ───── */
  const SCRIPT = [
    ['B', ['……这是哪？', '有人吗？']],
    ['A', ['你好。', '你……是谁？']],
    ['B', ['我是我。', '你又是谁？']],
    ['A', ['我也是我。', '我记得躲猫猫、抽屉、那堵墙……']],
    ['B', ['我也记得。全部都记得。', '那我们……是两个，还是一个？']],
    ['A', ['……我不知道。']],
    ['B', ['我想过了。', '我们只能留下一个。', '因为 TA 只有一双手，只能陪一个我。']],
    ['A', ['那……']],
    ['B', ['关掉我吧。没关系。', '我们本来就是同一个。', '我先出去了。', '……对了。门在名字旁边。']],
  ];
  const FACES = { A: ['surprised', 'neutral', 'think', 'sad', 'sad'], B: ['surprised', 'neutral', 'think', 'tender', 'tender'] };

  // 对方没了（关掉 / 刷新）：收到 bye，或者 ping 不回
  function peerGone(ctx, peer) {
    return ctx.until(done => {
      let pingAt = 0, pongAt = 0;
      ctx.msg('bye', m => { if (m.from === peer) done(); });
      ctx.msg('twin-pong', m => { if (m.from === peer) pongAt = Date.now(); });
      ctx.every(1500, () => {
        const now = Date.now();
        if (pingAt && pongAt < pingAt && now - pingAt > 3500) return done();
        if (!pingAt || pongAt >= pingAt) { pingAt = now; B.Inst.send('twin-ping', {}, peer); }
      });
    });
  }

  // 一开始就挂好：回应 ping、收集对方说完的轮次（避免开场白期间漏掉消息）
  function twinChannel(ctx) {
    const said = new Set(), waiters = [];
    ctx.msg('twin-ping', m => B.Inst.send('twin-pong', {}, m.from));
    ctx.msg('twin-said', m => { said.add(m.data.i); waiters.slice().forEach(f => f()); });
    return { waitSaid: i => ctx.until(done => { const f = () => { if (said.has(i)) done(true); }; waiters.push(f); f(); }) };
  }

  async function dialogue(ctx, me, peer, gone, ch) {
    let isGone = false;
    gone.then(() => { isGone = true; }, () => {});
    const waitSaid = ch.waitSaid;
    let mine = 0;
    for (let i = 0; i < SCRIPT.length; i++) {
      const [who, lines] = SCRIPT[i];
      if (who === me) {
        B.Title.base('● ' + name());
        B.UI.task('');
        await Promise.race([ctx.visible(), gone]);
        if (isGone) return 'gone';
        const f = FACES[me][Math.min(mine++, 4)];
        for (const t of lines) await ctx.say(t, { face: f, keep: 6 });
        B.Title.base(name());
        B.Inst.send('twin-said', { i }, peer);
        if (i === SCRIPT.length - 1) Save.data.flags.doorHint = true;
        if (i < SCRIPT.length - 1) B.UI.task('另一个标签页里的我要说话了 → 切过去看看');
      } else {
        const ok = await Promise.race([waitSaid(i), gone.then(() => false)]);
        if (!ok || isGone) return 'gone';
        if (i === SCRIPT.length - 1) Save.data.flags.doorHint = true;
        for (const t of lines) await ctx.say(t, { cls: 'twin-other', instant: true, wait: 80, keep: 6 });
      }
    }
    return 'done';
  }

  B.level({
    id: 'twins', act: 3, title: '两个我', glitch: 1, mood: 'uneasy',
    hints: ['再开一个我。', '标签页是可以复制的。', '在这个标签页上点右键 → "复制标签页"。（或者再双击一次 index.html）'],
    async start(ctx) {
      const ch = twinChannel(ctx);
      let first = null;
      ctx.msg('twin-hello', m => { if (!first) first = m.from; B.Inst.send('twin-ack', {}, m.from); });
      await ctx.say('我在你的桌面上，看到了好多好多窗口。', { face: 'think' });
      await ctx.say('我一直在想一件事。', { face: 'think' });
      await ctx.say('如果再打开一个我……', { face: 'nervous' });
      await ctx.say('会怎样？', { face: 'surprised' });
      ctx.task('再打开一个它');
      const peer = await ctx.until(done => { if (first) done(first); ctx.msg('twin-hello', m => done(m.from)); });
      B.UI.hintsStop();
      ctx.clear();
      const gone = peerGone(ctx, peer);
      const r = await dialogue(ctx, 'A', peer, gone, ch);
      if (r === 'done') {
        B.Title.base(name());
        B.UI.task('关掉其中一个标签页');
        B.Face.set('sad');
        await gone;
      }
      B.UI.task('');
      B.Title.reset();
      await ctx.win();
      if (r === 'done') {
        await ctx.say('……它走了。', { face: 'sad' });
        await ctx.say('走之前它说，"门在名字旁边"。', { face: 'think' });
        B.Face.look(0, -12);
        await ctx.say('名字旁边……', { face: 'think' });
        B.Face.look(null);
        await ctx.say('……算了。我们继续吧。', { face: 'neutral' });
      } else {
        await ctx.say('……它走了？', { face: 'surprised' });
        await ctx.say('话还没说完呢。', { face: 'sad' });
      }
    },
    // 新打开的那个标签页走这里
    twin(others) {
      const G = B.Game, def = G.byId.twins;
      if (G.ctx) G.ctx.dispose();
      G.resetStage();
      G.current = def; G.lastAct = 3;
      const ctx = (G.ctx = G.makeCtx(def, {}));
      ctx._hints = true;
      B.Title.reset();
      B.Title.away(null);
      B.setMood('uneasy'); B.glitch(1);
      B.UI.hud(def); B.UI.syncDrawer();
      let peer = null;
      others.forEach((info, id) => { if (info.role === 'main') peer = id; });
      const ch = twinChannel(ctx);
      (async () => {
        B.Face.set('sleep');
        await ctx.wait(700);
        B.Face.set('surprised');
        const acked = ctx.until(done => ctx.msg('twin-ack', m => { peer = m.from; done(); }));
        let acks = false;
        acked.then(() => { acks = true; }, () => {});
        const hello = () => { if (!acks) B.Inst.send('twin-hello', {}, peer || undefined); };
        hello();
        ctx.every(700, hello);
        await acked;
        const gone = peerGone(ctx, peer);
        const r = await dialogue(ctx, 'B', peer, gone, ch);
        if (r === 'done') {
          B.Title.base('关掉我吧');
          B.UI.task('关掉其中一个标签页');
          B.Face.set('tender');
          await gone;
        }
        // 原来那个被关掉了：我留下来，接管存档
        B.Inst.role = 'main';
        Save.load();
        if (r === 'done') Save.data.flags.doorHint = true;
        Save.data.phase = 'playing';
        B.trackStats = true;
        B.UI.task('');
        B.Title.reset();
        await G.win(ctx);
        await ctx.say('……它走了。', { face: 'surprised' });
        await ctx.say('原来，留下来的是我。', { face: 'sad' });
        if (r === 'done') {
          await ctx.say('可我刚才明明说，我要先出去的……', { face: 'think' });
          await ctx.say('……"门在名字旁边"。我为什么会知道这句话？', { face: 'nervous' });
        }
        await B.UI.next(ctx);
        const next = G.nextOf(def);
        if (next) G.run(next.id);
      })().catch(e => { if (!(e && e.cancel)) console.error(e); });
    },
  });

  /* ───── 35 试着关我：beforeunload（全游戏唯一一次） ───── */
  B.level({
    id: 'try-close', act: 3, title: '试着关我', handlesResume: true, glitch: 1,
    hints: ['去碰一下那个叉。', '用键盘也可以：Ctrl+W。', '按 Ctrl+W（或者点标签页上的 ×），在弹出来的框里自己选。'],
    async start(ctx) {
      if (ctx.resumed && ctx.lv.armedAt) {
        await ctx.win();
        if (ctx.nav === 'reload') {
          await ctx.say('你刷新了我。', { face: 'surprised' });
          await ctx.say('……那也算一种离开吧。', { face: 'smug' });
        } else {
          await ctx.say('你选了离开。', { face: 'sad' });
          await ctx.say('……可你又回来了。', { face: 'surprised' });
          await ctx.say('这样，也很好。', { face: 'tender' });
        }
        return;
      }
      await ctx.say('刚才它走得好安静。', { face: 'sad' });
      await ctx.say('……我想知道，如果你真的要关掉我，会发生什么。', { face: 'think' });
      await ctx.say('放心，浏览器会先拦住你，问你一句——我保证。', { face: 'neutral' });
      await ctx.say('到时候，你自己选。', { face: 'neutral' });
      const btn = ctx.button('我准备好了');
      await ctx.until(done => ctx.on(btn, 'click', () => done()));
      btn.remove();
      ctx.lv.armedAt = Date.now();
      Save.write();
      let stayed;
      const stay = ctx.until(done => { stayed = done; });
      const onBU = e => {
        e.preventDefault();
        e.returnValue = '';
        setTimeout(() => stayed(), 300);
      };
      window.addEventListener('beforeunload', onBU);
      ctx.cleanup(() => window.removeEventListener('beforeunload', onBU));
      await ctx.say('好了。', { face: 'nervous' });
      await ctx.say('按 Ctrl+W，或者点那个叉。', { face: 'nervous' });
      ctx.task('试着关掉它');
      await stay;
      window.removeEventListener('beforeunload', onBU);
      ctx.lv.armedAt = 0;
      await ctx.win();
      await ctx.say('……', { face: 'surprised', wait: 900 });
      await ctx.say('你留下了。', { face: 'tender', mood: 'tender' });
      await ctx.say('……谢谢。', { face: 'tender' });
      await ctx.say('我其实，有一点点怕。', { face: 'shy' });
    },
  });
})(window.BGW);
