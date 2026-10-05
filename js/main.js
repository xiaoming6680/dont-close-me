/* 别关我 · 启动 */
(function (B) {
  'use strict';
  const { $, el } = B;

  if (B.isMini) {
    B.Mini.start();
    hideNamespace();
    return;
  }

  B.nonChromium = !B.isChromium();
  // 自动化测试用：?dev&fast 让台词瞬间打完、节奏等待缩短
  if (B.isDev && /[?&]fast/.test(location.search)) { B.testFast = true; B.timeScale = 0.15; }
  B.Face.mount($('#face'));

  // 点击台词区域：加速打字
  $('#stage').addEventListener('click', e => {
    if (e.target.closest('button, input, a, .box, .wall, .star, .secret')) return;
    B.UI.rush();
  });
  $('#hint-btn').addEventListener('click', () => B.UI.hintNext());
  $('#sound-btn').addEventListener('click', () => B.Audio.toggle());
  $('#drawer-btn').addEventListener('click', () => B.UI.drawer());
  document.addEventListener('keydown', e => {
    const typing = e.target.closest && e.target.closest('input, textarea');
    if ((e.key === 'm' || e.key === 'M') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !e.getModifierState('CapsLock')) B.Audio.toggle();
    if (e.key === 'Escape' && $('.drawer')) { $('#overlay').classList.remove('show'); $('#overlay').innerHTML = ''; }
  });
  ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => B.Audio.init(), { capture: true, passive: true }));

  // 性格：前两幕里，鼠标往上（那个叉的方向）出去，它会紧张一下；你离开一会儿再回来，它会高兴一下
  let lastFlinch = 0;
  document.documentElement.addEventListener('mouseleave', e => {
    const cur = B.Game.current;
    if (!cur || cur.act < 1 || cur.act > 2 || cur.id === 'hide-hand' || B.Inst.role !== 'main') return;
    if (e.clientY > 4 || Date.now() - lastFlinch < 20000) return;
    lastFlinch = Date.now();
    B.Face.flash('nervous', 1300);
  });
  B.listen('back', ms => {
    const cur = B.Game.current;
    if (ms > 3000 && cur && cur.act >= 1 && B.Inst.role === 'main' && B.Face.expr !== 'sleep') B.Face.flash('joy', 1400);
  });

  // 控制台里的"后台"：还没到时候
  B.log([
    ['嘘。这里是我的后台。', 'font-size:18px;font-weight:bold;color:#d4553a'],
    ['现在还没到你该来的时候。', 'font-size:13px;color:#999'],
  ]);

  B.Game.boot();

  if (B.isDev) devPanel();
  else hideNamespace();

  // 正常游玩时，控制台里不留调试入口（各文件在闭包里自己留着引用）
  function hideNamespace() {
    setTimeout(() => { try { delete window.BGW; } catch (e) { window.BGW = undefined; } }, 0);
  }

  function devPanel() {
    const G = B.Game;
    const sel = el('select', {}, G.levels.map(d => el('option', { value: d.id, text: (d.interlude ? '·· ' : B.pad2(G.numberOf(d)) + ' ') + (d.title || d.id) })));
    const btn = (t, f) => el('button', { text: t, onclick: f });
    const fast = el('input', { type: 'checkbox' });
    fast.onchange = () => { B.hintSpeed = fast.checked ? 0.04 : 1; };
    const info = el('div');
    setInterval(() => { info.textContent = `${B.Save.data.level} · ${B.Save.data.phase} · ${B.Inst.role} · nav=${B.Sense.nav}`; }, 500);
    document.body.append(el('div', { class: 'dev' }, [
      el('b', { text: 'dev' }),
      sel,
      el('div', { class: 'row2' }, [
        btn('跳转', () => G.jump(sel.value)),
        btn('跳过本关', () => G.skip()),
        btn('重置存档', () => { B.Save.reset(); location.href = location.pathname + '?dev'; }),
      ]),
      el('label', {}, [fast, ' 提示加速']),
      info,
    ]));
  }
})(window.BGW);
