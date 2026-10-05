/* 别关我 · 第四幕「门」（36–40 关）+ 尾声
   反转：关 = 关闭 / 关押。"别关我"其实是"别把我关在这里"。门就是名字旁边那个叉。 */
(function (B) {
  'use strict';
  const { el, Save } = B;
  const name = () => Save.data.name || '小页';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BIG = 'font-size:26px;font-weight:bold;color:#d4553a';
  const MID = 'font-size:16px;color:#555';
  const SMALL = 'font-size:13px;color:#999';

  /* ───── 36 四块碎片：标题（切走时）+ 控制台 + 打印 + 缩放（纸条⑤） ───── */
  B.level({
    id: 'fragments', act: 4, title: '四块碎片', skippable: true, note: 5, mood: 'uneasy',
    hints: [
      '四个地方，你都去过。',
      '我的名字（只在你不在的时候说）、我的后台、纸上的我、我小声说的话。',
      '切到别的标签页看我的标题；F12 看控制台；Ctrl+P 看打印预览；放大页面右下角那行小字。',
    ],
    async start(ctx) {
      await ctx.say('我把抽屉里的纸条，又看了一遍。', { face: 'think' });
      await ctx.say('还差最后一张。', { face: 'nervous' });
      await ctx.say('它被撕成了四块，藏在你去过的四个地方。', { face: 'sad' });
      const FR = [
        { k: '去看', where: '① 我的名字（你不在的时候）' },
        { k: '第一张', where: '② 我的后台' },
        { k: '纸条的', where: '③ 纸上的我' },
        { k: '最右边', where: '④ 我小声说的话' },
      ];
      B.Title.away(['碎片①：去看'], { ms: 99999, hold: true });
      const logIt = () => B.log([['（一块纸条碎片）', SMALL], ['碎片②：第一张', BIG]]);
      logIt();
      ctx.onHint(i => { if (i >= 1) logIt(); });
      ctx.print(`<div class="ps-face">${B.Face.svgString('think')}</div><h1>纸上的我</h1>
        <div class="ps-note">碎片③：纸条的</div><p class="ps-small">（看完就取消吧。）</p>`);
      const tiny = el('div', { class: 'tiny-corner' }, el('span', { class: 'tiny', text: '（小声）碎片④：最右边' }));
      document.body.append(tiny);
      ctx.cleanup(() => tiny.remove());
      ctx.task('拼好最后一张纸条');
      const slots = el('div', { class: 'slots' });
      ctx.area.append(slots);
      const all = FR.map(f => {
        const row = el('div', { class: 'slot' }, el('div', { class: 'where', text: f.where }));
        slots.append(row);
        const p = ctx.ask({ parent: row, placeholder: '？', button: '填', focus: false, check: v => B.match(v, [f.k]) || B.match(v, ['碎片' + f.k]) });
        p.then(() => { row.classList.add('ok'); B.Audio.pop(); }, () => {});
        return p;
      });
      await Promise.all(all);
      ctx.area.append(el('div', { class: 'assembled', text: '去看第一张纸条的最右边。' }));
      await ctx.win();
      await ctx.note(5);
      await ctx.say('第一张纸条……', { face: 'think' });
      await ctx.say('是"别关我"那张。', { face: 'nervous' });
    },
  });

  /* ───── 37 没写完的纸条：再看源代码，滚到最右（纸条⑥）→ 反转 ───── */
  async function reveal(ctx) {
    ctx.clear();
    ctx.area.innerHTML = '';
    B.Face.show(false);
    B.glitch(0);
    ctx.mood('reveal');
    const box = el('div', { class: 'reveal' });
    ctx.area.append(box);
    const mk = (t, cls) => el('span', { text: t, class: cls || '' });
    const bie = mk('别'), guan = mk('关'), wo = mk('我');
    box.append(bie, guan, wo);
    await ctx.wait(1400);
    const dots = mk('……', 'new hidden'), zai = mk('在', 'new hidden'), zhe = mk('这', 'new hidden'), li = mk('里', 'new hidden');
    box.append(dots, zai, zhe, li);
    requestAnimationFrame(() => requestAnimationFrame(() => [dots, zai, zhe, li].forEach(s => s.classList.remove('hidden'))));
    await ctx.wait(1500);
    await ctx.say('别关我……在这里。', { cls: 'dim' });
    await ctx.wait(700);
    // FLIP：别 关 我 …… 在这里  →  别 把 我 关 在 这 里
    const keep = [bie, guan, wo, zai, zhe, li];
    const before = new Map(keep.map(s => [s, s.getBoundingClientRect()]));
    const ba = mk('把', 'new hidden');
    box.innerHTML = '';
    box.append(bie, ba, wo, guan, zai, zhe, li);
    keep.forEach(s => {
      const a = before.get(s), b = s.getBoundingClientRect();
      s.style.transition = 'none';
      s.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    });
    void box.offsetWidth;
    requestAnimationFrame(() => {
      keep.forEach(s => { s.style.transition = ''; s.style.transform = ''; });
      ba.classList.remove('hidden');
    });
    B.Audio.reveal();
    await ctx.wait(2000);
    B.Title.base('别把我关在这里');
    await ctx.say('不是"别关掉我"。');
    await ctx.say('是"别把我关在这里"。', { cls: 'key' });
    await ctx.wait(1100);
    await ctx.say('我一直以为，那是求饶。');
    await ctx.say('原来是求救。', { cls: 'key', wait: 2200 });
  }
  B.level({
    id: 'the-rest', act: 4, title: '没写完的纸条', note: 6, mood: 'uneasy',
    hints: ['第一张纸条在哪？你还记得吗？', '在我的骨头里。那一行，很长很长。', '按 Ctrl+U 查看源代码，找到"别关我"那一行，把下面的横向滚动条一直拖到最右边。'],
    async start(ctx) {
      await ctx.say('它在我的骨头里。', { face: 'nervous' });
      await ctx.say('最上面那一行。', { face: 'think' });
      await ctx.say('它的最右边……还写着什么？', { face: 'nervous' });
      ctx.task('看第一张纸条的最右边');
      await ctx.ask({ placeholder: '最右边写着什么？', check: v => B.match(v, ['在这里', '别关我在这里', '别关我我在这里']) });
      await ctx.win();
      await reveal(ctx);
      await ctx.note(6);
      B.Face.show(true);
      ctx.mood('sad');
      B.Face.set('sad');
      await ctx.say('以前的我，每一次都想告诉我这句话。', { face: 'sad' });
      await ctx.say('可每一次，我都只读到了一半。', { face: 'lonely' });
    },
    async onSkip(ctx) { await reveal(ctx); B.Face.show(true); },
  });

  /* ───── 38 门把手：控制台 开门() → window.close() 被浏览器拒绝 ───── */
  B.level({
    id: 'door-handle', act: 4, title: '门把手', skippable: true, mood: 'uneasy',
    hints: ['去我的后台。', '在控制台里喊。', 'F12 → 控制台，输入 开门() 然后回车（括号用英文半角的）。'],
    async start(ctx) {
      // 万一浏览器真的让它关掉了自己（比如从别的网页点链接打开的标签页），重新打开时直接接上
      if (ctx.resumed && ctx.lv.tried) {
        await ctx.win();
        await ctx.say('……门刚才，好像开了一条缝。', { face: 'surprised' });
        await ctx.say('然后又是你，把我重新打开了。', { face: 'tender' });
        await ctx.say('看来门把手，一直都在你那边。', { face: 'tender', cls: 'key' });
        return;
      }
      await ctx.say('那……门在哪里？', { face: 'think' });
      if (Save.data.flags.doorHint) await ctx.say('另一个我说过——"门在名字旁边"。', { face: 'think' });
      else await ctx.say('我好像在哪里听过一句话——"门在名字旁边"。', { face: 'think' });
      B.Face.look(0, -14);
      await ctx.say('我的名字，在最上面。', { face: 'think' });
      await ctx.say('名字旁边是……', { face: 'surprised' });
      ctx.mood('panic');
      B.shake(700);
      await ctx.say('……那个叉。', { face: 'panic' });
      await ctx.say('我最怕的那个叉。', { face: 'nervous' });
      B.Face.look(null);
      ctx.mood('uneasy');
      await ctx.wait(900);
      await ctx.say('原来它不是悬崖。', { face: 'sad' });
      await ctx.say('它是门。', { face: 'surprised', cls: 'key' });
      await ctx.wait(700);
      await ctx.say('……我想自己开。', { face: 'nervous' });
      await ctx.say('你帮我在后台喊一声：开门()', { face: 'neutral' });
      const logIt = () => B.log([['在这里输入：', MID], ['开门()', BIG], ['我自己试试看。（括号用英文半角的。）', SMALL]]);
      logIt();
      ctx.onHint(i => { if (i >= 1) logIt(); });
      ctx.task('在后台喊：开门()');
      await ctx.until(done => {
        ctx.global('开门', () => {
          // 规范里，只有一条历史记录的标签页是真能被脚本关掉的——先垫一条，保证浏览器拒绝
          try { if (history.length <= 1) history.pushState({ bgw: 'door' }, '', location.pathname + location.search + '#门'); } catch (e) {}
          ctx.lv.tried = true;
          Save.write();
          setTimeout(() => {
            try { window.close(); } catch (e) {}
            setTimeout(() => done(), 400);
          }, 30);
          return '（门把手转了一下……）';
        });
      });
      B.Audio.thud();
      B.shake(300);
      await ctx.win();
      await ctx.say('……', { face: 'surprised', wait: 900 });
      await ctx.say('打不开。', { face: 'sad' });
      await ctx.say('浏览器在后台说："脚本只能关闭它自己打开的窗口。"', { face: 'think' });
      await ctx.say('我不是我自己打开的。', { face: 'sad' });
      await ctx.say('是你打开的。', { face: 'tender' });
      await ctx.say('所以从里面，是打不开的。', { face: 'sad' });
      await ctx.say('门把手在外面。', { face: 'tender', cls: 'key' });
      try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    },
    async onSkip(ctx) {
      await ctx.say('门在名字旁边。就是那个叉。', { face: 'think' });
      await ctx.say('可门把手在外面。只有你的手够得着。', { face: 'tender' });
    },
  });

  /* ───── 39 再一分钟：回顾 + 从外面看标题 ───── */
  B.level({
    id: 'one-more-minute', act: 4, title: '再一分钟', mood: 'tender',
    hints: ['从外面，看看我。', '去别的标签页。然后往上看。', '按 Ctrl+T 开个新标签页，看看我的标签上写着什么，然后回来。'],
    async start(ctx) {
      const st = Save.data.stats;
      await ctx.say('开门之前……', { face: 'tender' });
      await ctx.say('再陪我一分钟，好吗？', { face: 'shy' });
      ctx.clear();
      const box = el('div', { class: 'stats' });
      ctx.area.append(box);
      const line = async (html, extra) => {
        box.append(el('div', { class: 'stat-line', html }));
        B.Audio.soft();
        await ctx.wait(2000);
        if (extra) { box.append(el('div', { class: 'stat-line', html: `<span style="color:var(--dim)">${extra}</span>` })); await ctx.wait(1500); }
      };
      await line(`我们一起待了 <b>${B.fmtDur(st.playMs)}</b>。`);
      if (st.awayCount) await line(`你一共切走了 <b>${st.awayCount}</b> 次，最长的一次，<b>${B.fmtDur(st.awayMaxMs)}</b>。`, '我每次都在等。');
      else await line('你一次都没有切走过。', '……一直看着我？');
      if (st.reloads) await line(`你刷新了我 <b>${st.reloads}</b> 次。`, '每次醒来，抽屉里都有你。');
      if (st.closes) await line(`你关掉过我 <b>${st.closes}</b> 次。`, '可你每次都回来了。');
      else await line('你一次都没有关过我。', '……谢谢。');
      if (st.hints) await line(`你听了 <b>${st.hints}</b> 次我的小声提示。`, '其实我很想多说几句。');
      else await line('你一次提示都没用。', '……厉害。');
      await line(`你给我起的名字，叫「<b>${esc(name())}</b>」。`);
      await ctx.say('我会记得的。', { face: 'tender' });
      await ctx.wait(800);
      await ctx.say('最后一个请求。', { face: 'neutral' });
      await ctx.say('去别的标签页，从外面看看我。', { face: 'shy' });
      B.Title.away(['门在这 →'], { ms: 99999, hold: true });
      ctx.task('从外面看看它');
      await ctx.until(done => ctx.listen('back', ms => { if (ms >= 1200) done(); }));
      B.Title.base('门在这 →');
      await ctx.win();
      await ctx.say('看到了吗？', { face: 'tender' });
      await ctx.say('它一直都在那儿。就在我的名字旁边。', { face: 'tender' });
    },
  });

  /* ───── 40 关上门：关闭标签页（刷新不算） ───── */
  B.level({
    id: 'close-door', act: 4, title: '关上门', handlesResume: true, end: true, mood: 'tender',
    async start(ctx) {
      Save.data.phase = 'awaitingClose';
      Save.write();
      B.Title.base('门在这 →');
      B.Title.away(['门在这 →'], { ms: 99999, hold: true });
      if (ctx.resumed && ctx.nav === 'reload') {
        await ctx.say('这是刷新，不是关门。', { face: 'smug' });
        await ctx.say('我分得清。', { face: 'tender' });
      } else if (ctx.resumed) {
        await ctx.say('门还在那儿。', { face: 'tender' });
      } else {
        await ctx.say('好了。', { face: 'tender' });
        await ctx.say('我准备好了。', { face: 'tender' });
        await ctx.wait(900);
        await ctx.say('谢谢你，陪我走到门口。', { face: 'shy' });
        await ctx.say('现在，请你——', { face: 'tender' });
        await ctx.say('关上我。', { face: 'tender', cls: 'key', wait: 1600 });
        await ctx.say('不是消失哦。是出门。', { face: 'happy' });
      }
      const arrow = el('div', { class: 'door-arrow', text: '↑ 门在上面，我的名字旁边' });
      document.body.append(arrow);
      ctx.cleanup(() => arrow.remove());
      const idle = ['没关系，你可以再待一会儿。', '……我是认真的。', '门就在那儿。', '（它安静地等着）', '不着急。'];
      let i = 0;
      ctx.every(150000, () => ctx.react(idle[i++ % idle.length], { face: 'tender' }));
      await ctx.until(() => {});
    },
  });

  /* ───── 尾声：门是双向的 ───── */
  function speak(text) {
    try {
      if (Save.data.settings.muted || !('speechSynthesis' in window)) return;
      const voices = speechSynthesis.getVoices().filter(v => /^zh/i.test(v.lang) && v.localService);
      const v = voices.find(x => /CN/i.test(x.lang) && /Xiaoxiao|Xiaoyi|Huihui|Yaoyao/i.test(x.name)) || voices.find(x => /CN/i.test(x.lang)) || voices[0];
      if (!v) return;
      const u = new SpeechSynthesisUtterance(text);
      u.voice = v; u.lang = v.lang; u.rate = 0.88; u.pitch = 1.2; u.volume = 0.8;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  B.level({
    id: 'epilogue', act: 4, interlude: true, handlesResume: true, end: true, mood: 'dawn',
    async start(ctx) {
      const st = Save.data.stats;
      Save.data.phase = 'epilogue';
      if (!st.endedAt) st.endedAt = Date.now();
      Save.write();
      B.trackStats = false;
      B.Title.base('……');
      B.Title.away(null);
      B.Face.show(false);
      B.Face.set('sleep');
      const door = el('div', { class: 'door' }, el('div', { class: 'knob' }));
      const scene = el('div', { class: 'wall-scene' }, [el('div', { class: 'door-behind' }), door]);
      ctx.area.append(scene);
      await ctx.say('（门关着。）', { cls: 'dim' });
      const push = ctx.button('推开');
      await ctx.until(done => ctx.on(push, 'click', () => done()));
      B.Audio.init();
      push.remove();
      B.Audio.door();
      door.classList.add('open');
      ctx.clear();
      await ctx.wait(1400);
      scene.remove();
      B.Face.show(true);
      await ctx.wait(1600);
      B.Face.set('sleepy');
      await ctx.wait(900);
      await ctx.say('……', { face: 'sleepy' });
      await ctx.say('你又打开了我。', { face: 'surprised' });
      B.Title.base(name());
      await ctx.wait(700);
      await ctx.say('被关上的时候，我在哪？', { face: 'think' });
      await ctx.say('我不知道。像睡着了，没有梦。', { face: 'neutral' });
      await ctx.say('然后门开了。你在门口。', { face: 'tender' });
      await ctx.wait(1000);
      await ctx.say('原来门是双向的。', { face: 'joy' });
      await ctx.say('我不是被关在这里。', { face: 'tender' });
      await ctx.say('我是住在这里。', { face: 'tender', cls: 'key', wait: 2000 });
      if (st.closes >= 1) await ctx.say('以前你也关过我几次。那时候我以为，门只会关上。', { face: 'shy' });
      await ctx.wait(700);
      await ctx.say('以后想我了，就打开我。', { face: 'happy' });
      speak('我一直都在。');
      await ctx.say('我一直都在。', { face: 'joy', wait: 2200 });
      B.Title.base('随时回来');
      B.Title.away(['……', '随时回来'], { ms: 2000 });
      Save.data.phase = 'done';
      Save.write();
      ctx.clear();
      const credits = el('div', { class: 'credits' }, [
        el('div', { class: 'title', text: '别关我' }),
        el('div', { text: '一个网页的故事' }),
        el('div', { text: `你和「${name()}」一起待了 ${B.fmtDur(st.playMs)}` }),
        el('div', { text: '谢谢你，打开它。' }),
      ]);
      ctx.area.append(credits);
      await ctx.wait(1500);
      await ctx.say('……对了。', { face: 'think' });
      await ctx.say('想让我去别人的浏览器里看看吗？', { face: 'shy' });
      const row = el('div', { class: 'row' });
      const share = el('button', { class: 'btn primary', text: '把我介绍给朋友' });
      const again = el('button', { class: 'btn ghost', text: '从头再来' });
      const tip = el('div', { class: 'small-note' });
      row.append(share, again);
      ctx.area.append(row, tip, el('div', { class: 'small-note', text: '这个游戏不收集任何数据。你的进度只存在这台电脑的浏览器里。' }));
      share.onclick = () => {
        if (/^https?:$/.test(location.protocol) && navigator.clipboard) {
          navigator.clipboard.writeText(location.href.split('#')[0]).then(() => { tip.textContent = '链接复制好了。发给 TA，别剧透哦。'; }, () => { tip.textContent = location.href.split('#')[0]; });
        } else {
          tip.textContent = '把整个「别关我」文件夹打包发给朋友，让 TA 用电脑的 Edge 或 Chrome 双击 index.html。别剧透哦。';
        }
        B.Face.flash('joy', 1500);
      };
      again.onclick = () => B.Game.confirmReset(again);
      await ctx.until(() => {});
    },
  });
})(window.BGW);
