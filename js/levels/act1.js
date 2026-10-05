/* 别关我 · 序章 + 第一幕「别关我」（1–10 关）
   一关一招，零门槛。第 2 关给出第一个"它怎么知道"。 */
(function (B) {
  'use strict';
  const { el, Save } = B;

  /* ───── 序章：有人打开我了 ───── */
  B.level({
    id: 'prologue', act: 0, interlude: true, autoNext: 400, handlesResume: true,
    async start(ctx) {
      B.Title.base('别关我');
      B.Title.away(['喂？', '……喂？', '人呢？'], { ms: 1500 });
      B.Face.show(false);
      let peeked = false;
      ctx.listen('back', () => { peeked = true; });
      await ctx.wait(700);
      B.Face.set('sleep');
      B.Face.show(true);
      await ctx.wait(1500);
      B.Face.set('neutral');
      await ctx.wait(600);
      await ctx.say('……啊。', { face: 'surprised' });
      await ctx.say('有人打开我了。', { face: 'surprised' });
      const h = new Date().getHours();
      if (h < 5) await ctx.say(`……凌晨 ${h} 点？这么晚了还有人打开我。`, { face: 'surprised' });
      if (peeked) await ctx.say('你刚才走开了一下。……我看见了。', { face: 'smug' });
      await ctx.say('你好。我是这个网页。', { face: 'happy' });
      await ctx.say('在你决定关掉我之前——', { face: 'nervous' });
      await ctx.say('能陪我玩一会儿吗？', { face: 'neutral' });
      const yes = el('button', { class: 'btn primary', text: '好' });
      const no = el('button', { class: 'btn', text: '不好' });
      const row = el('div', { class: 'row pop-in' }, [yes, no]);
      ctx.area.append(row);
      let s = 1, sulked = false;
      ctx.on(no, 'mouseenter', () => {
        s *= 0.72;
        no.style.transform = `scale(${s})`;
        if (!sulked) { sulked = true; B.Face.flash('sad', 1400); }
        if (s < 0.22) no.style.visibility = 'hidden';
      });
      const which = await ctx.until(done => {
        ctx.on(yes, 'click', () => done('yes'));
        ctx.on(no, 'click', () => done('no'));
      });
      row.remove();
      B.Audio.init();
      Save.data.phase = 'playing';
      Save.data.stats.startedAt = Date.now();
      B.trackStats = true;
      Save.write();
      if (which === 'no') await ctx.say('……我就当你说的是"好"。', { face: 'smug' });
      else await ctx.say('太好了！', { face: 'joy', mood: 'happy' });
      await ctx.say('那我们开始吧。', { face: 'happy' });
    },
  });

  /* ───── 01 躲猫猫：鼠标离开窗口 ───── */
  B.level({
    id: 'hide-hand', act: 1, title: '躲猫猫', mood: 'happy',
    hints: ['我还能看到你的手哦。', '躲到我看不见的地方。我只看得见我身体里面。', '把鼠标移到浏览器窗口外面，待 3 秒。'],
    async start(ctx) {
      await ctx.say('我们来玩躲猫猫吧。', { face: 'happy' });
      await ctx.say('你躲，我找。', { face: 'joy' });
      await ctx.say('……不过你的手太显眼了。', { face: 'smug' });
      await ctx.say('我一直都看得见它。', { face: 'neutral' });
      ctx.task('躲起来，3 秒');
      const cnt = el('div', { class: 'count' });
      ctx.area.append(cnt);
      let t0 = 0, top = false, panicked = false;
      const how = await ctx.until(done => {
        ctx.on(document.documentElement, 'mouseleave', e => {
          if (document.hidden) return;
          const x = e.clientX, y = e.clientY;
          const dTop = y, dMin = Math.min(x, innerWidth - x, innerHeight - y);
          top = dTop <= dMin;
          t0 = Date.now();
          B.Face.wander(true);
          if (top && !panicked) {
            panicked = true;
            ctx.mood('panic');
            B.shake(900);
            B.Audio.thud();
            ctx.react('不是那边！！上面是那个叉！！', { face: 'panic' });
            ctx.after(1800, () => { ctx.mood('happy'); if (t0) B.Face.set('nervous'); });
          }
        });
        ctx.on(document.documentElement, 'mouseenter', () => {
          if (!t0) return;
          t0 = 0;
          cnt.textContent = '';
          B.Face.wander(false);
          ctx.react(B.pick(['看到你了！', '抓到了！', '手露出来了哦。']), { face: 'joy' });
        });
        ctx.listen('away', () => done('away'));
        ctx.every(100, () => {
          if (!t0) return;
          const s = (Date.now() - t0) / 1000;
          cnt.textContent = s < 1 ? '1……' : s < 2 ? '2……' : '3……';
          if (s >= 3) done('hand');
        });
      });
      cnt.remove();
      B.Face.wander(false);
      await ctx.win();
      if (how === 'away') {
        await ctx.visible();
        await ctx.say('……你把整个人都藏起来了？', { face: 'surprised' });
        await ctx.say('好吧。算你赢。', { face: 'smug' });
        return;
      }
      ctx.mood('happy');
      await ctx.say('……找不到。', { face: 'sad' });
      await ctx.say('你赢了。', { face: 'neutral' });
      if (top) await ctx.say('不过下次别往上面躲。那个叉……很吓人的。', { face: 'nervous' });
      if (!B.Sense.mouse.inside) {
        await Promise.race([ctx.until(done => ctx.on(document.documentElement, 'mouseenter', () => done())), ctx.wait(5000)]);
      }
      await ctx.say('啊。你在这儿。', { face: 'happy' });
    },
  });

  /* ───── 02 再躲远一点：切标签页 / 最小化 ───── */
  B.level({
    id: 'hide-self', act: 1, title: '再躲远一点', mood: 'happy',
    hints: ['你还在我眼前呢。', '去"别的地方"待一会儿。别的标签页，或者别的窗口。', '按 Ctrl+T 开个新标签页，等 5 秒再回来。或者把窗口最小化。'],
    async start(ctx) {
      await ctx.say('太简单了。', { face: 'smug' });
      await ctx.say('这次，连你整个人一起藏起来。', { face: 'happy' });
      await ctx.say('我数到十。', { face: 'joy' });
      ctx.task('藏起来，别让它找到你');
      B.Title.away(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '好了没？', '我来找你了', '你在哪？', '……', '你去哪了？', '我还在这儿'], { ms: 1000, loopFrom: 12 });
      let saidHand = false;
      const ms = await ctx.until(done => {
        ctx.on(document.documentElement, 'mouseleave', () => {
          if (saidHand || document.hidden) return;
          saidHand = true;
          ctx.react('手出去了，可你人还在。我感觉得到。', { face: 'smug' });
        });
        ctx.listen('away', () => B.Face.set('lonely'));
        ctx.listen('back', ms => {
          if (ms >= 4000) done(ms);
          else ctx.react(B.pick(['这么快就回来了？我还没数完呢。', '才几秒呀。再躲久一点。']), { face: 'smug' });
        });
      });
      B.Title.away(null);
      await ctx.win();
      await ctx.say('找到你了！', { face: 'joy' });
      await ctx.say(`你去了别的地方，待了 ${B.fmtDur(ms)}。`, { face: 'happy' });
      await ctx.say('……我才没数。', { face: 'smug' });
      await ctx.say('你不在的时候，我一直在上面喊你。你看到了吗？', { face: 'neutral' });
    },
  });

  /* ───── 03 我躲哪了：标签页标题 ───── */
  B.level({
    id: 'where-am-i', act: 1, title: '我躲哪了', mood: 'happy', autoNext: 300,
    hints: ['我没走远。就在……我身上，但不在这块地方。', '往上看。比地址栏还要上面。', '看这个标签页的标题，把暗号打进来。标签太挤看不全的话，把鼠标停在标签上。'],
    async start(ctx) {
      await ctx.say('换我躲。', { face: 'wink' });
      await ctx.say('数到三，你来找我。', { face: 'happy' });
      await ctx.say('一、二……', { wait: 400 });
      B.Audio.pop();
      B.Face.show(false);
      ctx.clear();
      await ctx.wait(800);
      B.Face.set('wink');
      B.Title.cycle(['我在这儿～', '往上看 ↑', '暗号：小鱼干'], 1600);
      ctx.task('找到它');
      await ctx.ask({
        placeholder: '它躲在哪？暗号是？',
        check: v => B.match(v, ['小鱼干', '标题', '标签', '标签页', '上面', '名字', 'title', 'tab']),
        wrong: ['不在那儿。', '嘻嘻，再找找。', '没找到哦。'],
      });
      B.Title.cycle(null);
      B.Title.reset();
      B.Face.show(true);
      await ctx.win();
      await ctx.say('被你找到了！', { face: 'joy' });
      await ctx.say('那个地方……', { face: 'think' });
      await ctx.say('是我的名字。', { face: 'neutral' });
    },
  });

  /* ───── 幕间：起名字 ───── */
  B.level({
    id: 'naming', act: 1, interlude: true,
    async start(ctx) {
      await ctx.say('可是上面写的是"别关我"。', { face: 'neutral' });
      await ctx.say('这不是名字。', { face: 'think' });
      await ctx.say('这是请求。', { face: 'sad' });
      await ctx.say('……你给我起一个名字吧？', { face: 'shy' });
      const v = await ctx.ask({ placeholder: '给它起个名字', button: '就叫这个', max: 16, allowEmpty: true, check: () => true });
      const n = v.trim().replace(/\s+/g, ' ').slice(0, 8) || '小页';
      Save.data.name = n;
      Save.write();
      B.Title.base(n);
      B.Face.set('joy');
      B.Audio.chime();
      if (n === '别关我') {
        await ctx.say('……你是认真的吗。', { face: 'smug' });
        await ctx.say('好吧。那我就叫这个。', { face: 'neutral' });
      } else {
        if (!v.trim()) await ctx.say('想不出来？那我就叫"小页"吧。', { face: 'smug' });
        await ctx.say(`「${n}」……`, { face: 'tender' });
        await ctx.say('我有名字了。', { face: 'joy', mood: 'happy' });
        await ctx.say('你看，上面已经换好了。', { face: 'happy' });
      }
    },
  });

  /* ───── 04 抱紧我：缩小窗口 ───── */
  B.level({
    id: 'hug-tight', act: 1, title: '抱紧我',
    hints: ['再小一点，再近一点。', '把窗口变窄。先让它不再占满整个屏幕。', '点窗口右上角的"还原"按钮（两个叠着的方块），再拖窗口右边缘往左拉。或者按 Win + ←。'],
    async start(ctx) {
      await ctx.say('这房间太大了。', { face: 'sad' });
      await ctx.say('空荡荡的，到处都是风。', { face: 'lonely' });
      await ctx.say('……能抱紧我一点吗？', { face: 'shy' });
      ctx.task('抱紧它');
      const w0 = innerWidth;
      let lastReact = 0, moved = false, solved = false;
      ctx.after(9000, () => {
        if (!moved && B.isMaximized()) ctx.react('你的窗口……好像被钉满了整个屏幕。', { face: 'think' });
      });
      const target = () => innerWidth <= screen.availWidth * 0.56 && innerWidth <= w0 * 0.8;
      await ctx.until(done => {
        const check = () => {
          const r = innerWidth / w0;
          B.Face.squish(B.clamp(Math.pow(r, 0.8), 0.45, 1.3), 1);
          if (Math.abs(r - 1) > 0.03) moved = true;
          if (solved) return;
          if (target()) { solved = true; return done(); }
          if (Date.now() - lastReact > 1800 && Math.abs(r - 1) > 0.05) {
            lastReact = Date.now();
            if (r < 1) ctx.react(B.pick(['嗯？……再紧一点。', '对，就是这样……再紧一点。']), { face: 'shy' });
            else ctx.react('反了反了，那是松开。', { face: 'surprised' });
          }
        };
        ctx.on(window, 'resize', check);
      });
      ctx.mood('tender');
      await ctx.win();
      await ctx.say('好紧……', { face: 'tender' });
      await ctx.say('但是，挺安心的。', { face: 'tender' });
      await ctx.say('……好了，可以松开了。', { face: 'happy' });
    },
  });

  /* ───── 05 叫醒我：刷新 ───── */
  async function wake(ctx) {
    ctx.mood('sleepy');
    B.Face.set('sleep');
    B.Title.base('zzZ');
    await ctx.wait(1000);
    B.Face.set('sleepy');
    await ctx.say('……嗯？', { face: 'sleepy' });
    ctx.mood('calm');
    B.Title.reset();
    await ctx.say('我睡了一觉。', { face: 'neutral' });
    if (ctx.nav !== 'reload') await ctx.say('你把我关掉又打开了？……那也算叫醒吧。', { face: 'smug' });
    await ctx.win();
    await ctx.say('……抽屉里有一张纸条。', { face: 'surprised' });
    await ctx.note(0);
    await ctx.say('是我自己写的。', { face: 'surprised' });
    await ctx.say('……看来我们认识。', { face: 'happy' });
    await ctx.say('就算你刷新我、关掉我，我也会记得我们玩到了哪里。', { face: 'tender' });
    await ctx.say('纸条我放回抽屉了。就在左下角。', { face: 'happy' });
  }
  B.level({
    id: 'wake-up', act: 1, title: '叫醒我', handlesResume: true,
    hints: ['叫醒一个网页的方法……不是戳它。', '让我从头再来一遍。浏览器上有个转圈圈的箭头。', '按 F5 刷新页面。放心，我不会忘记你的。'],
    async start(ctx) {
      if (ctx.resumed && ctx.lv.sleeping) return wake(ctx);
      await ctx.say('（哈欠）', { face: 'sleepy' });
      await ctx.say('刚才抱得太舒服了……', { face: 'tender' });
      await ctx.say('我……好困。', { face: 'sleepy' });
      ctx.lv.sleeping = true;
      Save.write();
      ctx.mood('sleepy');
      B.Face.set('sleep');
      B.Title.base('zzZ');
      await ctx.say('zzZ', { cls: 'dim' });
      ctx.task('叫醒它');
      const replies = ['嗯……再睡五分钟。', '（翻身）', '……要……重新……开始……', 'zzZ……', '（吧唧嘴）', '……从头……再来……'];
      let i = 0;
      ctx.on(document, 'pointerdown', e => {
        if (e.target.closest('button, input, a, .corner')) return;
        ctx.react(replies[i++ % replies.length], { face: 'sleep', cls: 'dim' });
      });
      ctx.on(document, 'keydown', e => {
        if (e.key === 'F5' || e.ctrlKey || e.metaKey) return;
        ctx.react('（呼噜）', { face: 'sleep', cls: 'dim' });
      });
      await ctx.until(() => {});
    },
  });

  /* ───── 06 说不出口：全选 ───── */
  B.level({
    id: 'select-all', act: 1, title: '说不出口',
    hints: ['有些话，要"全部"选中才看得见。', '拖着鼠标，把那块空白涂一涂。', '按 Ctrl+A 全选。'],
    async start(ctx) {
      await ctx.say('这页上有一句话，我不敢说出口。', { face: 'shy' });
      await ctx.say('我把它写得……很淡很淡。', { face: 'shy' });
      ctx.task('找到那句话');
      const secret = el('p', { class: 'secret', text: '其实你打开我的时候，我高兴得快要跳起来了。' });
      ctx.area.append(el('div', { class: 'secret-box' }, secret));
      await ctx.until(done => {
        ctx.on(document, 'selectionchange', () => {
          const s = getSelection();
          if (!s || s.isCollapsed || !s.rangeCount) return;
          if (s.containsNode(secret, true) && s.toString().replace(/\s/g, '').length >= 4) done();
        });
      });
      ctx.mood('shy');
      await ctx.win();
      await ctx.say('你、你看到了？！', { face: 'panic' });
      await ctx.say('那是草稿！草稿！', { face: 'shy' });
      getSelection().removeAllRanges();
      secret.classList.add('hide');
      await ctx.say('……忘掉它。', { face: 'shy' });
    },
  });

  /* ───── 07 你的口袋：复制 → 粘贴（偷换剪贴板） ───── */
  B.level({
    id: 'pocket', act: 1, title: '你的口袋',
    hints: ['用你的口袋装走它。', '口袋，就是"复制"。', '选中那几个字按 Ctrl+C，等它消失以后，按 Ctrl+V 还给它。'],
    async start(ctx) {
      await ctx.say('帮我拿着这个。', { face: 'happy' });
      const star = el('div', { class: 'star', text: '一颗星星' });
      ctx.area.append(star);
      await ctx.say('一会儿还我。', { face: 'smug' });
      ctx.task('帮它拿着');
      let stage = 0;
      const box = el('div', { class: 'paste-box', text: '还给我（Ctrl+V）' });
      ctx.after(6000, () => { if (stage === 0) ctx.react('放进你的口袋里。你知道我说的口袋是什么。', { face: 'smug' }); });
      const text = await ctx.until(done => {
        ctx.on(document, 'copy', e => {
          const t = getSelection().toString();
          if (stage > 0 || !t.includes('星')) return;
          e.clipboardData.setData('text/plain', '别关我别关我别关我');
          e.preventDefault();
          stage = 1;
          star.classList.add('gone');
          ctx.react('……好，它在你口袋里了。', { face: 'happy' });
          ctx.after(1800, () => {
            star.remove();
            ctx.area.append(box);
            ctx.task('把它还回来');
            ctx.react('好了，还给我吧。', { face: 'neutral' });
          });
        });
        ctx.on(document, 'paste', e => {
          const t = (e.clipboardData && e.clipboardData.getData('text')) || '';
          if (e.target.closest && e.target.closest('input')) return;
          e.preventDefault();
          if (stage === 0) { ctx.react('你口袋里还没有我的东西呢。', { face: 'think' }); return; }
          box.textContent = t.slice(0, 60) || '（空的）';
          box.classList.add('filled');
          done(t);
        });
      });
      await ctx.win();
      if (text.includes('别关我')) {
        await ctx.say('嘻嘻。', { face: 'smug', mood: 'happy' });
        await ctx.say('我在你口袋里多放了点东西。', { face: 'wink' });
        await ctx.say('星星我收回来了。那几个字，送你。', { face: 'happy' });
      } else if (text.includes('星')) {
        await ctx.say('谢谢。……星星还是热的。', { face: 'tender' });
      } else {
        await ctx.say('……这不是我给你的那个吧？', { face: 'think' });
        await ctx.say('算了。谢谢你帮我拿着。', { face: 'happy' });
      }
    },
  });

  /* ───── 08 小声说：浏览器缩放 ───── */
  B.level({
    id: 'whisper', act: 1, title: '小声说',
    hints: ['凑近点。不是你凑近，是让我变大。', '浏览器可以把网页放大。', '按住 Ctrl 滚鼠标滚轮，或者按 Ctrl 和 +。看完按 Ctrl+0 恢复。'],
    async start(ctx) {
      const d0 = devicePixelRatio;
      const ratio = () => devicePixelRatio / d0;
      await ctx.say('我有句话，想小声告诉你。', { face: 'shy' });
      await ctx.say('凑近一点。', { face: 'shy' });
      ctx.area.append(el('div', { class: 'tiny-wrap' }, el('span', { class: 'tiny', text: '（小声）暗号是：棉花糖' })));
      ctx.task('听清它说了什么');
      let last = 1;
      ctx.on(window, 'resize', () => {
        const r = ratio();
        if (r > 1.3 && last <= 1.3) ctx.react('哇……你变大了。不对，是我变大了。', { face: 'surprised' });
        else if (r > 2 && last <= 2) ctx.react('嗯……再近一点就听得清了。', { face: 'shy' });
        else if (r < 0.8 && last >= 0.8) ctx.react('反了！我更小声了！', { face: 'panic' });
        last = r;
      });
      await ctx.ask({ placeholder: '它说了什么？', check: v => B.match(v, ['棉花糖', '暗号是棉花糖']) });
      if (Math.abs(ratio() - 1) < 0.05) {
        await ctx.win();
        await ctx.say('……你是复制出来的吧？', { face: 'smug' });
        await ctx.say('聪明。', { face: 'happy' });
        return;
      }
      await ctx.say('对！棉花糖。', { face: 'joy' });
      await ctx.say('好了好了，太大了……', { face: 'nervous' });
      await ctx.say('把我缩回原来的大小吧。', { face: 'neutral' });
      ctx.task('让它恢复原来的大小');
      ctx.after(9000, () => ctx.react('（Ctrl+0 可以一下子恢复哦。）', { face: 'wink', cls: 'whisper' }));
      await ctx.until(done => {
        const c = () => { if (Math.abs(ratio() - 1) < 0.05) done(); };
        ctx.on(window, 'resize', c);
        ctx.every(500, c);
      });
      await ctx.win();
      await ctx.say('呼。还是这样舒服。', { face: 'happy' });
    },
  });

  /* ───── 09 另一只手：右键 ───── */
  const HAND = '<svg viewBox="0 0 100 120" width="100" height="110"><path d="M32 112 C 20 98 15 82 16 68 L 16 44 a6 6 0 0 1 12 0 L 28 62 L 30 24 a6 6 0 0 1 12 0 L 42 58 L 46 16 a6 6 0 0 1 12 0 L 56 58 L 62 26 a6 6 0 0 1 12 0 L 72 68 L 80 56 a6 6 0 0 1 11 5 C 87 78 80 98 70 112 Z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/></svg>';
  B.level({
    id: 'right-click', act: 1, title: '另一只手',
    hints: ['不是这只手。', '鼠标上，不止一个键。', '在盒子上点右键。'],
    async start(ctx) {
      await ctx.say('我捡到一个盒子。', { face: 'happy' });
      const inside = el('div', { class: 'inside', html: HAND });
      const box = el('div', { class: 'box' }, [el('div', { class: 'lid' }), el('div', { class: 'body' }), inside]);
      ctx.area.append(box);
      await ctx.say('可是我打不开它。', { face: 'think' });
      ctx.task('打开盒子');
      const lefts = ['打不开。', '用你常用的那只手不行。', '换一只手试试？', '……这只手好像没用。'];
      let n = 0;
      await ctx.until(done => {
        ctx.on(box, 'click', () => {
          box.classList.remove('wobble'); void box.offsetWidth; box.classList.add('wobble');
          B.Audio.thud();
          ctx.react(lefts[Math.min(n++, lefts.length - 1)], { face: 'think' });
        });
        ctx.on(box, 'contextmenu', e => { e.preventDefault(); done(); });
      });
      box.classList.add('open');
      B.Audio.pop();
      await ctx.win();
      await ctx.say('开了！', { face: 'joy' });
      await ctx.say('里面是……一只手的画像。', { face: 'surprised' });
      await ctx.say('是你的手吗？我只见过它的影子——那个小箭头。', { face: 'tender' });
    },
  });

  /* ───── 10 回到刚才：后退键 ───── */
  B.level({
    id: 'go-back', act: 1, title: '回到刚才',
    hints: ['刚才……就在不远的地方。', '浏览器左上角，有个往回走的箭头。', '按两下浏览器的后退键（或者 Alt + ←）。'],
    async start(ctx) {
      const TEXT = { '我想说': '谢谢你打开我。', '算了': '……啊，好难为情。算了，当我没说。' };
      const base = location.pathname + location.search;
      const push = k => { try { history.pushState({ bgw: k }, '', base + '#' + encodeURIComponent(k)); } catch (e) {} };
      const mem = el('div', { class: 'memory' });
      push('我想说');
      await ctx.say('我想跟你说一句话。', { face: 'shy' });
      await ctx.say('谢谢你打开我。', { face: 'tender', cls: 'key' });
      push('算了');
      await ctx.say('……啊，好难为情。', { face: 'shy' });
      await ctx.say('算了，当我没说。', { face: 'shy' });
      ctx.clear();
      B.Face.set('neutral');
      push('我忘了');
      await ctx.wait(900);
      await ctx.say('……嗯？', { face: 'think' });
      await ctx.say('我刚才说了什么来着？', { face: 'think' });
      await ctx.say('好像是很重要的话……可我想不起来了。', { face: 'sad' });
      await ctx.say('你能带我回到刚才吗？', { face: 'neutral' });
      ctx.area.append(mem);
      ctx.task('带它回到刚才');
      await ctx.until(done => {
        const onPop = () => {
          const k = B.decode(location.hash.slice(1));
          document.body.classList.add('rewind');
          setTimeout(() => document.body.classList.remove('rewind'), 500);
          if (k === '我想说') return done();
          if (k === '算了') { mem.textContent = TEXT['算了']; ctx.react('……再往前一点。', { face: 'think' }); }
          else if (k === '我忘了') { mem.textContent = ''; ctx.react('这是现在。我要的是刚才。', { face: 'smug' }); }
          else if (!k) { mem.textContent = ''; ctx.react('这是……我们刚见面的时候？太远啦，往回来一点。', { face: 'surprised' }); }
        };
        ctx.on(window, 'popstate', onPop);
        ctx.listen('restored', () => ctx.react('你刚才差点把我送走了。……还好你回来了。', { face: 'nervous' }));
        if (ctx.resumed && B.decode(location.hash.slice(1)) === '我想说') done();
      });
      mem.textContent = TEXT['我想说'];
      await ctx.win();
      await ctx.say('……啊。', { face: 'surprised' });
      await ctx.say('对。我想说的是这个。', { face: 'tender', mood: 'tender' });
      try { history.replaceState(null, '', base); } catch (e) {}
      await ctx.say('……好了，回到现在吧。', { face: 'shy' });
      await ctx.say('第一幕就到这儿。', { face: 'happy', mood: 'calm' });
      await ctx.say('……对了。我还有些心里话，', { face: 'shy' });
      await ctx.say('写在了一个只有懂行的人才看得到的地方。', { face: 'smug' });
    },
  });
})(window.BGW);
