/* 别关我 · 小工具
   所有脚本都是普通 <script>（file:// 下不能用 ES Module），共享一个命名空间 BGW。
   非 ?dev 模式下，main.js 启动后会把 window.BGW 删掉，各文件在 IIFE 里自己留着引用。 */
(function () {
  'use strict';
  const B = (window.BGW = window.BGW || {});

  B.$ = (sel, root) => (root || document).querySelector(sel);
  B.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // el('div', {class: 'x', text: '…', onclick: fn}, [子元素])
  B.el = function (tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    if (children != null) for (const c of [].concat(children)) if (c != null) e.append(c);
    return e;
  };

  B.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  B.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  B.pad2 = n => String(n).padStart(2, '0');
  B.decode = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };

  // 答案比较：全半角统一、去空白和标点、小写
  B.norm = s => String(s == null ? '' : s).normalize('NFKC').toLowerCase()
    .replace(/[\s　]+/g, '')
    .replace(/[.,!?;:'"`~、，。！？；：‘’“”…—\-_（）()【】\[\]{}《》<>·「」『』#]/g, '');
  B.match = (input, answers) => {
    const n = B.norm(input);
    return !!n && [].concat(answers).some(a => B.norm(a) === n);
  };

  B.fmtDur = function (ms) {
    const s = Math.max(0, ms) / 1000;
    if (s < 10) return s.toFixed(1) + ' 秒';
    if (s < 60) return Math.round(s) + ' 秒';
    const m = Math.floor(s / 60), r = Math.round(s % 60);
    if (m < 60) return r ? `${m} 分 ${r} 秒` : `${m} 分钟`;
    const h = Math.floor(m / 60);
    return `${h} 小时 ${m % 60} 分`;
  };

  // 调试面板只在本地（双击打开或本机服务器）能开，线上加 ?dev 没用——面板里有全部关卡名，等于剧透
  B.isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  B.isDev = B.isLocal && /[?&]dev\b/.test(location.search);
  B.isMini = /[?&]mini\b/.test(location.search);
  B.isMobile = () => /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|OpenHarmony/i.test(navigator.userAgent) ||
    (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches);
  // 聊天软件的内置浏览器（电脑版微信、企业微信、钉钉、飞书……）：没有标签页、没有 F12，很多关卡玩不了
  B.isInApp = () => /MicroMessenger|WindowsWechat|MacWechat|wxwork|DingTalk|Lark\/|Feishu|QQ\//i.test(navigator.userAgent);
  B.isChromium = () => !!(navigator.userAgentData && navigator.userAgentData.brands &&
    navigator.userAgentData.brands.some(b => /Chromium|Chrome|Edge/.test(b.brand))) || /Chrome\/|Edg\//.test(navigator.userAgent);

  // 带样式的控制台输出：B.log([['文字', 'css'], ...])
  B.log = function (lines) {
    const fmt = lines.map(l => '%c' + l[0]).join('\n');
    console.log(fmt, ...lines.map(l => (l[1] || 'font-size:14px') + ';line-height:1.8'));
  };
})();
