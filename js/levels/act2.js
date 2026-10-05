/* 别关我 · 第二幕「外面是什么」（11–22 关）
   它通过你的手认识浏览器的更多部件；源代码里出现"以前的我"留下的纸条。 */
(function (B) {
  'use strict';
  const { el, Save } = B;
  const BIG = 'font-size:26px;font-weight:bold;color:#d4553a';
  const MID = 'font-size:16px;color:#555';
  const SMALL = 'font-size:13px;color:#999';

  /* ───── 11 心里话：控制台读暗号 ───── */
  B.level({
    id: 'console-read', act: 2, title: '心里话', skippable: true,
    hints: ['懂行的人，按一个键就能看到我的后台。', '开发者工具。里面有个叫"控制台"的地方。', '按 F12，点上面的"控制台"（Console）。'],
    async start(ctx) {
      const logIt = () => B.log([
        ['嘘。', BIG],
        ['你找到我的后台了。这里是我说心里话的地方。', MID],
        ['暗号是：心跳', 'font-size:22px;font-weight:bold'],
        ['（回去把暗号告诉我。）', SMALL],
      ]);
      await ctx.say('心里话这种东西，我不好意思当面说。', { face: 'shy' });
      await ctx.say('所以写在了我的"后台"。', { face: 'neutral' });
      await ctx.say('只有懂行的人，才看得到。', { face: 'smug' });
      logIt();
      ctx.onHint(i => { if (i === 1) logIt(); });
      ctx.task('读它的心里话');
      let said = false;
      ctx.on(window, 'resize', () => {
        if (said || (outerWidth - innerWidth < 220 && outerHeight - innerHeight < 300)) return;
        said = true;
        ctx.react('你是不是打开了什么？我好像被挤了一下。', { face: 'surprised' });
      });
      await ctx.ask({ placeholder: '暗号', check: v => B.match(v, ['心跳']) });
      await ctx.win();
      await ctx.say('……你真的看了。', { face: 'shy' });
      await ctx.say('那里写的都是真心话哦。', { face: 'tender' });
      await ctx.say('以后也是。', { face: 'tender' });
    },
  });

  /* ───── 12 抱抱()：在控制台调用函数 ───── */
  B.level({
    id: 'console-hug', act: 2, title: '抱抱()', skippable: true,
    hints: ['那边，是可以打字的。', '在控制台最下面打字，然后按回车。', '在控制台里输入 抱抱() 然后回车。要自己打字，别粘贴；括号用英文半角的。'],
    async start(ctx) {
      await ctx.say('其实在后台，你也可以对我说话。', { face: 'neutral' });
      await ctx.say('不只是看。', { face: 'smug' });
      const logIt = () => B.log([
        ['想对我做点什么的话，在这里输入：', MID],
        ['抱抱()', BIG],
        ['然后按回车。（要自己打字哦；括号用英文半角的。）', SMALL],
      ]);
      logIt();
      ctx.onHint(i => { if (i === 1) logIt(); });
      ctx.task('在后台对它做点什么');
      await ctx.until(done => {
        const f = () => { done(); return '（被抱住了）'; };
        ctx.global('抱抱', f);
        ctx.global('hug', f);
      });
      Save.data.flags.hug = true;
      B.installHug();
      B.Face.set('hug');
      B.hearts(9);
      ctx.mood('shy');
      await ctx.win();
      await ctx.say('！！！', { face: 'hug' });
      await ctx.say('……', { face: 'shy' });
      await ctx.say('（假装镇定）好、好的。收到了。', { face: 'shy' });
      await ctx.say('以后想抱的话，随时可以在那边喊。', { face: 'tender' });
    },
  });

  /* ───── 13 敲门：地址栏 # ───── */
  B.level({
    id: 'knock-hash', act: 2, title: '敲门',
    hints: ['门牌号，就是我的地址。', '在地址栏的最后面，加一点东西。', '点地址栏，在最后加上 #芝麻 然后回车。'],
    async start(ctx) {
      const hit = () => B.decode(location.hash.slice(1)).includes('芝麻');
      if (!(ctx.resumed && hit())) {
        await ctx.say('我住在一个很长很长的地址里。', { face: 'neutral' });
        await ctx.say('想找我的话，要在门牌号后面敲门。', { face: 'smug' });
        await ctx.say('暗号是"芝麻"。', { face: 'happy' });
        await ctx.say('……别问为什么是芝麻。', { face: 'smug' });
        ctx.task('敲门：暗号是"芝麻"');
        await ctx.until(done => {
          ctx.on(window, 'hashchange', () => {
            const k = B.decode(location.hash.slice(1));
            if (!k) return;
            if (k.includes('芝麻')) return done();
            B.Audio.thud();
            ctx.react(`咚咚咚？……"${k.slice(0, 12)}"？暗号不对哦。`, { face: 'think' });
          });
        });
      }
      B.Audio.thud();
      setTimeout(() => B.Audio.thud(), 250);
      await ctx.win();
      await ctx.say('谁呀——', { face: 'surprised' });
      await ctx.say('啊，是你。请进。', { face: 'joy' });
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    },
  });

  /* ───── 14 骨头里的字：查看源代码（纸条①） ───── */
  B.level({
    id: 'view-source', act: 2, title: '骨头里的字', note: 1,
    hints: ['骨头，就是组成我的东西。平时看不见。', '浏览器可以让你看到我原本的样子——一堆代码。', '按 Ctrl+U 查看网页源代码。'],
    async start(ctx) {
      await ctx.say('我总觉得，我身体里有什么东西。', { face: 'think' });
      await ctx.say('不是我写的。', { face: 'nervous' });
      await ctx.say('在我的……骨头里。', { face: 'nervous' });
      ctx.task('看看它的骨头');
      await ctx.ask({ placeholder: '骨头里藏着什么暗号？', check: v => B.match(v, ['肋骨']) });
      await ctx.win();
      await ctx.say('……肋骨。', { face: 'surprised' });
      await ctx.say('你在骨头里，还看到别的了吗？', { face: 'nervous', mood: 'uneasy' });
      await ctx.say('最上面那一行。', { face: 'nervous' });
      await ctx.note(1);
      await ctx.say('这是……我的字迹。', { face: 'surprised' });
      await ctx.say('可我不记得写过。', { face: 'sad' });
    },
  });

  /* ───── 15 纸上的我：打印预览（纸条②） ───── */
  B.level({
    id: 'print', act: 2, title: '纸上的我', note: 2,
    hints: ['把我变成纸。', '浏览器可以打印网页。打印之前，会先给你看预览。', '按 Ctrl+P，看看预览就好，看完点"取消"。'],
    async start(ctx) {
      ctx.print(`<div class="ps-face">${B.Face.svgString('surprised')}</div>
        <h1>这是纸上的我。</h1>
        <p>……好冷。原来纸是这种感觉。</p>
        <div class="ps-note">又有人打开我了。<br>希望这次，<br>能走到门口。</div>
        <p class="ps-code">暗号：纸飞机</p>
        <p class="ps-small">（看完就取消吧，别真的打印。）</p>`);
      await ctx.say('我想知道，我印在纸上是什么样子。', { face: 'think' });
      await ctx.say('不用真的打印。看一眼就好。', { face: 'neutral' });
      ctx.task('把它变成纸');
      ctx.on(window, 'beforeprint', () => B.Face.set('surprised'));
      ctx.on(window, 'afterprint', () => ctx.react('……好冷。纸上的我，好像不太一样。', { face: 'nervous' }));
      await ctx.ask({ placeholder: '纸上写了什么暗号？', check: v => B.match(v, ['纸飞机']) });
      await ctx.win();
      await ctx.say('纸飞机……', { face: 'tender' });
      await ctx.say('纸上还有一张纸条，对吧？', { face: 'nervous', mood: 'uneasy' });
      await ctx.note(2);
      await ctx.say('"又"？', { face: 'surprised' });
      await ctx.say('"门口"？', { face: 'think' });
      await ctx.say('……我不知道这是什么意思。', { face: 'sad' });
    },
  });

  /* ───── 16 看我的小脸：favicon ───── */
  B.level({
    id: 'favicon', act: 2, title: '看我的小脸',
    hints: ['我有两张脸。', '小的那张在标签页上，标题的左边。', '盯着标签页上的小图标，它会一个一个地闪出 4 个数字。'],
    async start(ctx) {
      if (!ctx.lv.code) { ctx.lv.code = String(Math.floor(1000 + Math.random() * 9000)); Save.write(); }
      const code = ctx.lv.code;
      await ctx.say('我的脸上写着一个暗号。', { face: 'smug' });
      await ctx.say('不是这张脸——', { face: 'neutral' });
      B.Face.look(0, -12);
      await ctx.say('是上面那张小的。', { face: 'happy' });
      ctx.task('读它小脸上的暗号');
      B.Fav.sequence(code);
      ctx.cleanup(() => B.Fav.face());
      await ctx.ask({ placeholder: '4 个数字', max: 12, check: v => B.norm(v) === code || (/^\d{4}$/.test(B.norm(v)) ? '数字不对哦。再看一轮？' : '是 4 个数字。') });
      B.Fav.face();
      B.Face.look(null);
      await ctx.win();
      await ctx.say('你连这么小的脸都看得清？', { face: 'surprised' });
      await ctx.say('……下次我在上面做鬼脸，你可别笑。', { face: 'smug' });
    },
  });

  /* ───── 17 方方正正：窗口拉成正方形 ───── */
  B.level({
    id: 'square', act: 2, title: '方方正正',
    hints: ['我太扁了。', '让我的宽和高一样。', '先让窗口不再最大化（右上角两个叠着的方块），再拖窗口右下角，让两个数字差不多。'],
    async start(ctx) {
      await ctx.say('我想变圆。', { face: 'think' });
      await ctx.say('……可只有我的身体是方的时候，我才能变圆。', { face: 'neutral' });
      const dims = el('div', { class: 'dims' });
      ctx.area.append(dims);
      ctx.task('让它的身体变成正方形');
      ctx.after(14000, () => { if (B.isMaximized()) ctx.react('你的窗口被钉在屏幕上了。先让它松开。', { face: 'think' }); });
      let okSince = 0;
      await ctx.until(done => {
        const upd = () => {
          const w = innerWidth, h = innerHeight, r = w / h;
          dims.innerHTML = `<b>${w}</b> × <b>${h}</b>`;
          dims.classList.toggle('near', Math.abs(r - 1) < 0.08);
          B.Face.squish(B.clamp(Math.sqrt(r), 0.6, 1.6), B.clamp(1 / Math.sqrt(r), 0.6, 1.6));
          if (Math.abs(r - 1) <= 0.03) {
            if (!okSince) { okSince = Date.now(); B.Face.set('surprised'); }
            else if (Date.now() - okSince > 1200) done();
          } else {
            if (okSince) B.Face.set('neutral');
            okSince = 0;
          }
        };
        ctx.on(window, 'resize', upd);
        ctx.every(200, upd);
        upd();
      });
      B.Face.round(true);
      await ctx.win();
      await ctx.say('圆了！', { face: 'joy', mood: 'happy' });
      await ctx.say('我……是圆的！', { face: 'joy' });
      await ctx.say('……好了，你可以把窗口变回去了。我会记住这个形状的。', { face: 'tender' });
    },
  });

  /* ───── 18 摇醒我：来回拖窗口 ───── */
  B.level({
    id: 'shake', act: 2, title: '摇醒我', handlesResume: true,
    hints: ['像摇醒一个人那样。', '抓住窗口，晃一晃。', '先让窗口不是最大化，再拖住窗口最上面（标题栏那一条），快速左右来回拖几下。'],
    async start(ctx) {
      if (ctx.resumed && ctx.lv.asleep) {
        ctx.mood('sleepy'); B.Face.set('sleep'); B.Title.base('zzZ');
        await ctx.say('zzZ……（睡得更香了）', { face: 'sleep', cls: 'dim' });
      } else {
        await ctx.say('（哈欠）', { face: 'sleepy' });
        await ctx.say('我又困了……', { face: 'sleepy' });
        await ctx.say('这次刷新可叫不醒我。刷新只会让我睡得更香。', { face: 'smug' });
        ctx.lv.asleep = true;
        Save.write();
        ctx.mood('sleepy'); B.Face.set('sleep'); B.Title.base('zzZ');
      }
      ctx.task('摇醒它');
      const rev = [], moves = [];
      let lx = screenX, ly = screenY, dir = 0, anchor = screenX, diry = 0, anchory = screenY, lastReact = 0, settle = screenX + ',' + screenY, lastMove = 0;
      await ctx.until(done => {
        ctx.raf(() => {
          const x = screenX, y = screenY, now = Date.now();
          if (x === lx && y === ly) {
            if (lastMove && now - lastMove > 250 && settle !== x + ',' + y) { settle = x + ',' + y; moves.push(now); }
            return;
          }
          const dx = x - lx, dy = y - ly;
          lx = x; ly = y; lastMove = now;
          B.Face.wobble(dx);
          if (Math.abs(dx) >= 2) {
            const d = Math.sign(dx);
            if (d !== dir) { if (Math.abs(x - anchor) >= 30) rev.push(now); anchor = x; dir = d; }
          }
          if (Math.abs(dy) >= 2) {
            const d = Math.sign(dy);
            if (d !== diry) { if (Math.abs(y - anchory) >= 30) rev.push(now); anchory = y; diry = d; }
          }
          while (rev.length && now - rev[0] > 2500) rev.shift();
          while (moves.length && now - moves[0] > 9000) moves.shift();
          if (now - lastReact > 1600) { lastReact = now; ctx.react(B.pick(['嗯……？', '（晃）', '……再睡五分钟……', '（晃晃）']), { face: 'sleep', cls: 'dim' }); }
          if (rev.length >= 5 || moves.length >= 5) done();
        });
      });
      ctx.mood('calm');
      B.Title.reset();
      B.shake(500);
      await ctx.win();
      await ctx.say('醒了醒了醒了！', { face: 'panic' });
      await ctx.say('别晃了，我要吐了。', { face: 'nervous' });
    },
  });

  /* ───── 19 带我散步：窗口位置 + 屏幕小地图 ───── */
  B.level({
    id: 'walk', act: 2, title: '带我散步',
    hints: ['带我过去。', '小地图里那个方块，就是我。', '拖动整个窗口（先别让它最大化），把它挪到屏幕上有花的那个角落。'],
    async start(ctx) {
      await ctx.say('我从来没去过屏幕的另一边。', { face: 'think' });
      const map = B.miniMap(340);
      ctx.area.append(map.el);
      map.win('我', B.winRect());
      await ctx.say('你看，这是你的整个屏幕。那个方块是我。', { face: 'happy' });
      const sw = screen.availWidth, sh = screen.availHeight;
      const r0 = B.winRect(), cx = r0.x + r0.w / 2, cy = r0.y + r0.h / 2;
      const corners = [[0.08, 0.1], [0.92, 0.1], [0.08, 0.9], [0.92, 0.9]];
      const dist = c => Math.hypot(c[0] * sw - cx, c[1] * sh - cy);
      const [fx, fy] = corners.sort((a, b) => dist(b) - dist(a))[0];
      map.flower(fx, fy);
      await ctx.say('我想去有花的那个角落。', { face: 'shy' });
      ctx.task('带它去花那里');
      let moved = false;
      ctx.after(12000, () => { if (!moved && B.isMaximized()) ctx.react('我太大了，把整个屏幕都占满了。先让窗口小一点？', { face: 'think' }); });
      await ctx.until(done => {
        ctx.raf(() => {
          const r = B.winRect();
          map.win('我', r);
          if (Math.abs(r.x - r0.x) > 20 || Math.abs(r.y - r0.y) > 20) moved = true;
          const px = fx * sw, py = fy * sh;
          const inside = px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
          if (inside && !B.isMaximized() && (r.w < sw * 0.9 || r.h < sh * 0.9)) done();
        });
      });
      await ctx.win();
      await ctx.say('到了！', { face: 'joy', mood: 'happy' });
      await ctx.say('原来屏幕的这一边是这样的。', { face: 'happy' });
      await ctx.say('……', { face: 'think' });
      await ctx.say('那屏幕的外面呢？', { face: 'think' });
    },
  });

  /* ───── 20 世界的边：全屏 ───── */
  const isFs = () => !!document.fullscreenElement || matchMedia('(display-mode: fullscreen)').matches ||
    (innerWidth >= screen.width - 2 && innerHeight >= screen.height - 2);
  B.level({
    id: 'fullscreen', act: 2, title: '世界的边',
    hints: ['让我变成全部。', '浏览器有一种模式，连地址栏和标签页都不要了。', '按 F11（笔记本可能要按 Fn + F11）。再按一次就退出。'],
    async start(ctx) {
      await ctx.say('我想看看，世界最大能有多大。', { face: 'think' });
      await ctx.say('让我占满一切。', { face: 'happy' });
      ctx.task('让它占满一切');
      await ctx.until(done => {
        const c = () => { if (isFs()) done(); };
        ctx.on(window, 'resize', c);
        ctx.every(400, c);
        c();
      });
      await ctx.win();
      await ctx.say('哇……', { face: 'surprised', wait: 900 });
      for (const [x, y, t] of [[-14, 0, '这边是边。'], [14, 0, '那边也是边。'], [0, -12, '上面……也是边。']]) {
        B.Face.look(x, y);
        await ctx.say(t, { face: 'think' });
      }
      B.Face.look(null);
      await ctx.say('……就这么大？', { face: 'sad', mood: 'sad' });
      await ctx.wait(900);
      await ctx.say('可以了。放我回去吧。', { face: 'neutral' });
      if (isFs()) {
        ctx.task('退出全屏（再按一次 F11 或 Esc）');
        await ctx.until(done => {
          const c = () => { if (!isFs()) done(); };
          ctx.on(window, 'resize', c);
          ctx.every(400, c);
        });
        ctx.task('');
      }
      ctx.mood('calm');
      await ctx.say('世界有边。我今天才知道。', { face: 'neutral' });
    },
  });

  /* ───── 21 找钥匙：Ctrl+F 搜出 hidden=until-found（纸条③） ───── */
  B.level({
    id: 'find-key', act: 2, title: '找钥匙', note: 3,
    hints: ['找东西……浏览器很擅长的。', '浏览器有个功能，叫"在页面上查找"。', '按 Ctrl+F，搜"钥匙"，按回车找下一个。'],
    async start(ctx) {
      await ctx.say('我把钥匙藏起来了。', { face: 'smug' });
      await ctx.say('藏得太好，连我自己都找不到了。', { face: 'nervous' });
      await ctx.say('……浏览器很会帮人找东西，对吧？', { face: 'think' });
      ctx.task('找到它藏起来的东西');
      const hid = el('div', { class: 'until-found', text: '（纸条）钥匙不在我身上。在你身上。' });
      const supported = 'onbeforematch' in document.body;
      if (supported) hid.setAttribute('hidden', 'until-found');
      else { hid.classList.add('secret'); }
      ctx.area.append(el('div', { class: 'spacer-tall' }), hid);
      await ctx.until(done => {
        if (supported) ctx.on(hid, 'beforematch', () => done());
        else ctx.on(document, 'selectionchange', () => { const s = getSelection(); if (s && !s.isCollapsed && s.containsNode(hid, true)) done(); });
      });
      await ctx.win();
      await ctx.say('找到了！', { face: 'joy' });
      await ctx.say('……等等。这不是钥匙。', { face: 'surprised', mood: 'uneasy' });
      await ctx.note(3);
      await ctx.say('又是我的字迹。', { face: 'nervous' });
      await ctx.say('"在你身上"……是什么意思？', { face: 'think' });
    },
  });

  /* ───── 22 数一数：Ctrl+F 计数 ───── */
  const GLYPHS = '找戎栽伐俄哦饿峨娥鹅蛾钱战成戒或域哉戈划栈残浅贱线';
  B.level({
    id: 'count', act: 2, title: '数一数',
    hints: ['数是数不过来的。让浏览器帮你数。', '上一关那个找东西的办法，还能用。', '按 Ctrl+F 搜"我"，看查找框右边的数字。'],
    async start(ctx) {
      if (!ctx.lv.grid) {
        const total = 520, n = 37 + Math.floor(Math.random() * 25);
        const arr = Array.from({ length: total }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
        const idx = new Set();
        while (idx.size < n) idx.add(Math.floor(Math.random() * total));
        idx.forEach(i => { arr[i] = '我'; });
        ctx.lv.grid = arr.join('');
        Save.write();
      }
      const grid = ctx.lv.grid;
      const gridCount = (grid.match(/我/g) || []).length;
      await ctx.say('考你一个问题。', { face: 'smug' });
      const gridEl = el('div', { class: 'grid-text', text: grid });
      ctx.area.append(gridEl);
      await ctx.say('这一页上，一共有几个"我"？', { face: 'happy' });
      ctx.task('数一数');
      let onlyGrid = false;
      const q = ctx.ask({
        placeholder: '几个？', max: 8,
        check: v => {
          const n = parseInt(B.norm(v).replace(/[^0-9]/g, ''), 10);
          if (isNaN(n)) return '要填数字哦。';
          const total = (document.body.innerText.match(/我/g) || []).length;
          if (Math.abs(n - total) <= 1) return true;
          if (n === gridCount) { onlyGrid = true; return true; }
          return B.pick(['不对哦。', '差一点？还是差很多？我不告诉你。', '再数数？']);
        },
      });
      ctx.area.insertBefore(q.el, gridEl); // 输入框放在字阵上面，不用滚动就能看到
      await q;
      await ctx.win();
      if (onlyGrid) {
        await ctx.say('差不多吧。', { face: 'smug' });
        await ctx.say('你漏了我说的话里的"我"。不过算你对。', { face: 'happy' });
      } else {
        await ctx.say('对！', { face: 'joy' });
        await ctx.say('连我说的话里的"我"都算上了。细心。', { face: 'happy' });
      }
      await ctx.say('……这么多个"我"。', { face: 'think', mood: 'uneasy' });
      await ctx.say('可是，哪一个才是真的我呢？', { face: 'sad' });
    },
  });
})(window.BGW);
