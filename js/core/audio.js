/* 别关我 · 声音：全部用 Web Audio 实时合成，没有音频文件 */
(function (B) {
  'use strict';
  let ctx = null, master = null;
  const A = B.Audio = { base: 520, quiet: false };

  A.init = function () {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.16;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { /* 没声音也能玩 */ }
  };

  const off = () => !ctx || ctx.state !== 'running' || B.Save.data.settings.muted || document.hidden;

  function tone(freq, dur, type, vol, when, slideTo) {
    if (off()) return;
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const v = (vol == null ? 1 : vol) * (A.quiet ? 0.35 : 1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  A.blip = () => tone(A.base * (0.93 + Math.random() * 0.14), 0.045, 'triangle', 0.3);
  A.chime = () => [660, 830, 990, 1320].forEach((f, i) => tone(f, 0.7 - i * 0.08, 'sine', 0.45, i * 0.08));
  A.soft = () => tone(560, 0.3, 'sine', 0.25);
  A.wrong = () => { tone(240, 0.14, 'square', 0.12); tone(200, 0.2, 'square', 0.12, 0.1); };
  A.thud = () => tone(110, 0.3, 'sine', 0.9, 0, 45);
  A.pop = () => tone(700, 0.1, 'sine', 0.4, 0, 1400);
  A.beat = () => { tone(68, 0.14, 'sine', 1, 0, 40); tone(62, 0.16, 'sine', 0.8, 0.19, 38); };
  A.sad = () => { tone(523, 0.5, 'sine', 0.35); tone(440, 0.6, 'sine', 0.35, 0.25); tone(349, 1, 'sine', 0.35, 0.5); };
  A.door = () => { tone(180, 0.6, 'sawtooth', 0.06, 0, 120); tone(90, 0.5, 'sine', 0.5, 0.5, 60); };
  A.reveal = () => [262, 330, 392, 523, 659].forEach((f, i) => tone(f, 2.2 - i * 0.2, 'sine', 0.3, i * 0.18));

  A.toggle = function () {
    const s = B.Save.data.settings;
    s.muted = !s.muted;
    B.Save.write();
    A.syncButton();
    if (!s.muted) { A.init(); A.soft(); }
  };
  A.syncButton = function () {
    const b = B.$('#sound-btn');
    if (b) b.classList.toggle('muted', !!B.Save.data.settings.muted);
  };
})(window.BGW);
