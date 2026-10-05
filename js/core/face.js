/* 别关我 · 脸
   页面上一张极简 SVG 脸（两只眼睛 + 一张嘴），眼珠跟着鼠标转；
   标签页上的 favicon 用 canvas 画同一张"小脸"，表情同步。 */
(function (B) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  const MOUTH = {
    neutral: 'M -14 32 Q 0 36 14 32',
    smile: 'M -18 27 Q 0 44 18 27',
    grin: 'M -22 25 Q 0 53 22 25',
    small: 'M -8 33 Q 0 38 8 33',
    flat: 'M -12 34 Q 0 34 12 34',
    sad: 'M -14 38 Q 0 27 14 38',
    pout: 'M -9 36 Q 0 30 9 36',
    smug: 'M -14 33 Q 6 40 16 27',
    o: 'M -7 34 Q -7 26 0 26 Q 7 26 7 34 Q 7 42 0 42 Q -7 42 -7 34',
    wavy: 'M -20 34 Q -15 28 -10 34 Q -5 40 0 34 Q 5 28 10 34 Q 15 40 20 34',
  };

  // eyes: open / wide / half / closed / arc / wink
  const EXPR = {
    neutral: { mouth: 'neutral', eyes: 'open' },
    happy: { mouth: 'smile', eyes: 'open' },
    joy: { mouth: 'grin', eyes: 'arc' },
    tender: { mouth: 'small', eyes: 'arc' },
    shy: { mouth: 'small', eyes: 'open', blush: 1, look: [0, 7] },
    nervous: { mouth: 'flat', eyes: 'open', sweat: 1 },
    panic: { mouth: 'wavy', eyes: 'wide', sweat: 1 },
    surprised: { mouth: 'o', eyes: 'wide' },
    sad: { mouth: 'sad', eyes: 'open', look: [0, 7] },
    sleep: { mouth: 'flat', eyes: 'closed', zzz: 1 },
    sleepy: { mouth: 'small', eyes: 'half' },
    smug: { mouth: 'smug', eyes: 'half' },
    wink: { mouth: 'smile', eyes: 'wink' },
    think: { mouth: 'pout', eyes: 'open', look: [9, -9] },
    lonely: { mouth: 'sad', eyes: 'half', look: [-10, 3] },
    hug: { mouth: 'grin', eyes: 'arc', blush: 1 },
  };

  const eyeMode = (e, side) => e.eyes === 'wink' ? (side === 'l' ? 'open' : 'arc') : e.eyes;

  function markup(exprName) {
    const e = EXPR[exprName] || EXPR.neutral;
    const eye = side => `<g class="eye ${side}" data-m="${eyeMode(e, side)}" transform="translate(${side === 'l' ? -34 : 34},-6)">` +
      '<ellipse class="eo" cx="0" cy="0" rx="9" ry="13"/>' +
      '<path class="ec" d="M -11 0 Q 0 8 11 0"/>' +
      '<path class="ea" d="M -11 4 Q 0 -9 11 4"/></g>';
    return `<svg viewBox="-100 -100 200 200" xmlns="${NS}" aria-hidden="true">` +
      '<circle class="outline" cx="0" cy="0" r="92"/>' +
      `<g class="eyes">${eye('l')}${eye('r')}</g>` +
      '<ellipse class="blush" cx="-54" cy="20" rx="13" ry="6.5"/><ellipse class="blush" cx="54" cy="20" rx="13" ry="6.5"/>' +
      `<path class="mouth" d="${MOUTH[e.mouth]}"/>` +
      '<path class="sweat" d="M 64 -48 Q 73 -33 64 -29 Q 55 -33 64 -48 Z"/>' +
      '<text class="zzz" x="50" y="-44">z</text><text class="zzz z2" x="66" y="-62">z</text>' +
      '</svg>';
  }

  // 不依赖样式表的静态 SVG（打印页、画中画小窗用）
  function staticSvg(exprName, color) {
    const e = EXPR[exprName] || EXPR.neutral;
    const c = color || '#1e1c19';
    const eye = side => {
      const x = side === 'l' ? -34 : 34, m = eyeMode(e, side);
      if (m === 'closed') return `<path d="M ${x - 11} -6 Q ${x} 2 ${x + 11} -6" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
      if (m === 'arc') return `<path d="M ${x - 11} -2 Q ${x} -15 ${x + 11} -2" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
      const ry = m === 'wide' ? 16 : m === 'half' ? 6 : 13, rx = m === 'wide' ? 11 : 9;
      return `<ellipse cx="${x}" cy="-6" rx="${rx}" ry="${ry}" fill="${c}"/>`;
    };
    return `<svg viewBox="-100 -100 200 200" xmlns="${NS}">${eye('l')}${eye('r')}` +
      (e.blush ? '<ellipse cx="-54" cy="20" rx="13" ry="6.5" fill="#e0637a" opacity=".35"/><ellipse cx="54" cy="20" rx="13" ry="6.5" fill="#e0637a" opacity=".35"/>' : '') +
      `<path d="${MOUTH[e.mouth]}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`;
  }

  const F = B.Face = { expr: 'neutral', state: { lx: 0, ly: 0 } };
  let root, squishEl, swayEl, svg, eyesG, mouthEl, eyeL, eyeR;
  let lookOverride = null, wander = false, sx = 1, sy = 1, far = 1, sway = 0, visible = true;

  F.mount = function (container) {
    root = container;
    root.innerHTML = '';
    squishEl = B.el('div', { class: 'squish' });
    swayEl = B.el('div', { class: 'sway' });
    swayEl.innerHTML = markup('neutral');
    squishEl.append(swayEl);
    root.append(squishEl, B.el('div', { class: 'hearts' }));
    svg = swayEl.querySelector('svg');
    eyesG = svg.querySelector('.eyes');
    mouthEl = svg.querySelector('.mouth');
    eyeL = svg.querySelector('.eye.l');
    eyeR = svg.querySelector('.eye.r');
    F.set('neutral');
    blinkLoop();
    requestAnimationFrame(lookLoop);
  };

  let flashTimer = 0;
  // fromFlash：闪一下表情时内部调用；别人设表情时取消"闪完恢复"，免得盖掉关卡刚设的表情
  F.set = function (name, fromFlash) {
    const e = EXPR[name];
    if (!e || !svg) return;
    if (!fromFlash) clearTimeout(flashTimer);
    F.expr = name;
    eyeL.setAttribute('data-m', eyeMode(e, 'l'));
    eyeR.setAttribute('data-m', eyeMode(e, 'r'));
    const d = MOUTH[e.mouth];
    mouthEl.setAttribute('d', d);
    mouthEl.style.d = `path("${d}")`;
    svg.classList.toggle('face-on-blush', !!e.blush);
    svg.classList.toggle('face-on-sweat', !!e.sweat);
    svg.classList.toggle('face-on-zzz', !!e.zzz);
    B.Fav.dirty();
  };

  F.flash = function (name, ms) {
    const prev = F.expr;
    F.set(name, true);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => F.set(prev, true), ms || 1600);
  };

  F.show = function (on) {
    visible = on !== false;
    if (root) root.classList.toggle('hidden', !visible);
  };
  F.look = function (x, y) { lookOverride = x == null ? null : [x, y]; };
  F.wander = function (on) { wander = !!on; };
  F.squish = function (x, y) { sx = x; sy = y == null ? 1 : y; apply(); };
  F.far = function (on) { far = on ? 0.16 : 1; if (squishEl) squishEl.style.transition = 'transform .8s ease'; apply(); };
  F.farLevel = function (n) { far = Math.min(1, 0.16 + n * 0.21); apply(); };
  F.round = function (on) { if (svg) svg.classList.toggle('face-on-round', !!on); };
  F.wobble = function (dx) { sway = B.clamp(sway + dx * 0.6, -18, 18); };
  F.reset = function () {
    lookOverride = null; wander = false; sx = sy = far = 1; sway = 0;
    if (squishEl) squishEl.style.transition = '';
    apply(); F.round(false); F.show(true); F.set('neutral');
  };
  F.markup = markup;
  F.svgString = staticSvg;

  function apply() {
    if (!squishEl) return;
    const ty = far < 1 ? -(1 - far) * 60 : 0;
    squishEl.style.transform = `translateY(${ty}px) scale(${sx * far}, ${sy * far})`;
  }

  function blinkLoop() {
    setTimeout(() => {
      const m = eyeL && eyeL.getAttribute('data-m');
      if (svg && (m === 'open' || m === 'wide' || m === 'half') && !document.hidden) {
        svg.classList.add('blinking');
        setTimeout(() => svg.classList.remove('blinking'), 110);
      }
      blinkLoop();
    }, 2200 + Math.random() * 3800);
  }

  // 眼珠：跟鼠标 / 被关卡指定方向 / 东张西望
  let cx = 0, cy = 0;
  function lookLoop(t) {
    requestAnimationFrame(lookLoop);
    if (!svg) return;
    let tx = 0, ty = 0;
    const e = EXPR[F.expr] || EXPR.neutral;
    if (lookOverride) { tx = lookOverride[0]; ty = lookOverride[1]; }
    else if (wander) { tx = Math.sin(t / 520) * 11; ty = Math.cos(t / 830) * 4 - 2; }
    else if (B.Sense.mouse.inside && root && visible) {
      const r = root.getBoundingClientRect();
      const dx = B.Sense.mouse.x - (r.left + r.width / 2), dy = B.Sense.mouse.y - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1, k = Math.min(1, dist / 260);
      tx = dx / dist * 11 * k; ty = dy / dist * 9 * k;
    }
    if (e.look && !lookOverride) { tx = tx * 0.4 + e.look[0]; ty = ty * 0.4 + e.look[1]; }
    cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
    eyesG.setAttribute('transform', `translate(${cx.toFixed(2)},${cy.toFixed(2)})`);
    mouthEl.setAttribute('transform', `translate(${(cx * 0.35).toFixed(2)},${(cy * 0.3).toFixed(2)})`);
    sway *= 0.9;
    swayEl.style.transform = Math.abs(sway) > 0.1 ? `rotate(${sway.toFixed(2)}deg)` : '';
    if (Math.round(cx / 3) !== F.state.lx || Math.round(cy / 3) !== F.state.ly) {
      F.state.lx = Math.round(cx / 3); F.state.ly = Math.round(cy / 3);
      B.Fav.dirty();
    }
  }

  // 漂浮的小心心
  B.hearts = function (n) {
    const box = root && root.querySelector('.hearts');
    if (!box) return;
    for (let i = 0; i < (n || 7); i++) {
      setTimeout(() => {
        const h = B.el('span', { class: 'heart-float', text: '♥' });
        h.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
        h.style.fontSize = (16 + Math.random() * 16) + 'px';
        box.append(h);
        setTimeout(() => h.remove(), 1900);
      }, i * 110);
    }
  };

  /* ───── favicon：标签页上的小脸 ───── */
  const Fav = B.Fav = {};
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  let mode = { type: 'face' }, dirty = true, awayLook = 0, seqTimer = 0;
  const link = () => document.getElementById('favicon');

  Fav.dirty = () => { dirty = true; };
  Fav.face = () => { clearInterval(seqTimer); mode = { type: 'face' }; dirty = true; };
  Fav.digit = d => { mode = { type: 'digit', d: String(d) }; dirty = true; };
  Fav.blank = () => { mode = { type: 'blank' }; dirty = true; };
  // 一个字一个字地闪：每个 0.9 秒，间隔 0.25 秒，一轮结束露脸 1.8 秒
  Fav.sequence = function (str) {
    clearInterval(seqTimer);
    const chars = Array.from(str), t0 = Date.now(), per = 1150, cycle = chars.length * per + 1800;
    let last = '';
    const tick = () => {
      const t = (Date.now() - t0) % cycle, i = Math.floor(t / per);
      const key = i < chars.length ? (t % per < 900 ? 'd' + i : 'b' + i) : 'face';
      if (key === last) return;
      last = key;
      if (key === 'face') mode = { type: 'face' };
      else if (key[0] === 'b') mode = { type: 'blank' };
      else mode = { type: 'digit', d: chars[i] };
      dirty = true; draw();
    };
    seqTimer = setInterval(tick, 80);
    tick();
  };
  // 你不在的时候，小脸东张西望
  Fav.awayTick = function () { awayLook = (awayLook + 1) % 4; dirty = true; };

  function roundRect(x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function draw() {
    if (!dirty) return;
    dirty = false;
    const ink = '#1e1c19', paper = '#f3efe7', accent = '#d4553a';
    g.clearRect(0, 0, 64, 64);
    if (mode.type === 'digit') {
      roundRect(2, 2, 60, 60, 16); g.fillStyle = accent; g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 50px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(mode.d, 32, 35);
    } else {
      roundRect(3, 3, 58, 58, 16); g.fillStyle = paper; g.fill();
      g.lineWidth = 3; g.strokeStyle = ink; g.stroke();
      if (mode.type === 'face') {
        const e = EXPR[F.expr] || EXPR.neutral;
        let lx = F.state.lx * 1.2, ly = F.state.ly * 1.2;
        if (document.hidden) { lx = [-4, 0, 4, 0][awayLook]; ly = 0; }
        g.save(); g.translate(32, 33);
        g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round'; g.lineWidth = 3.6;
        for (const side of ['l', 'r']) {
          const m = eyeMode(e, side), x = (side === 'l' ? -10 : 10) + lx, y = -4 + ly;
          g.beginPath();
          if (m === 'closed') { g.moveTo(x - 5, y); g.quadraticCurveTo(x, y + 4, x + 5, y); g.stroke(); }
          else if (m === 'arc') { g.moveTo(x - 5, y + 2); g.quadraticCurveTo(x, y - 5, x + 5, y + 2); g.stroke(); }
          else { g.ellipse(x, y, m === 'wide' ? 5.5 : 4.5, m === 'half' ? 3 : m === 'wide' ? 8 : 7, 0, 0, Math.PI * 2); g.fill(); }
        }
        if (e.blush) { g.fillStyle = 'rgba(224,99,122,.45)'; g.beginPath(); g.ellipse(-17, 7, 5, 2.6, 0, 0, 7); g.ellipse(17, 7, 5, 2.6, 0, 0, 7); g.fill(); }
        g.translate(lx * 0.4, ly * 0.3); g.scale(0.32, 0.32); g.lineWidth = 11;
        g.stroke(new Path2D(MOUTH[e.mouth]));
        g.restore();
      }
    }
    const l = link();
    if (l) l.href = cv.toDataURL('image/png');
  }
  setInterval(draw, 120);
  Fav.drawNow = () => { dirty = true; draw(); };
})(window.BGW);
