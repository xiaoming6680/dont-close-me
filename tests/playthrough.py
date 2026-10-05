# 《别关我》全流程自动化测试：Edge（有界面）打开 file:// 的 index.html，从序章一路玩到尾声。
# 能用真实输入的尽量用真实输入（鼠标、键盘、窗口移动/缩放/最小化、刷新、后退、断网、多标签页、弹窗、beforeunload……），
# Playwright 做不到的浏览器自带功能（地址栏、Ctrl+F 查找栏、打印预览、浏览器缩放快捷键、开发者工具面板）用等价的页面事件代替，
# 结果里会标明 real / equiv / simulated。
#
# 用法：PYTHONUTF8=1 python tests/playthrough.py [截图目录]
import asyncio, json, pathlib, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = (ROOT / 'index.html').as_uri()
# --base=http://127.0.0.1:8765/ 可以换成本地服务器（模拟线上根路径部署）
_base = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--base=')), None)
if _base:
    BASE = _base
URL = BASE + '?dev&fast'
_pos = [a for a in sys.argv[1:] if not a.startswith('--')]
SHOTS = pathlib.Path(_pos[0]) if _pos else ROOT / 'tests' / 'out'
SHOTS.mkdir(parents=True, exist_ok=True)

results = []
AUTO = {'on': True}
LOGS = []


def J(v):
    return json.dumps(v, ensure_ascii=False)


async def wait_for(page, js, timeout=30.0, every=0.2):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if await page.evaluate(js):
                return True
        except Exception:
            pass
        await asyncio.sleep(every)
    return False


async def wait_level(page, lid, timeout=40):
    return await wait_for(page, f"!!(window.BGW && BGW.Game.ctx && BGW.Game.ctx.def.id === {J(lid)})", timeout)


async def wait_task(page, timeout=40):
    return await wait_for(page, "document.querySelector('#task').textContent.trim().length > 0", timeout)


async def wait_solved(page, timeout=30):
    return await wait_for(page, "!!(BGW.Game.ctx && BGW.Game.ctx.solved)", timeout)


async def autoclick(get_page, stop):
    """自动点"收进抽屉""继续"和幕卡。"""
    while not stop.is_set():
        page = get_page()
        try:
            if AUTO['on'] and page and not page.is_closed():
                for sel in ['.note-wrap .btn', '#next .btn.next', '.actcard']:
                    loc = page.locator(sel)
                    if await loc.count() and await loc.first.is_visible():
                        await loc.first.click(timeout=800)
                        break
        except Exception:
            pass
        await asyncio.sleep(0.35)


class Win:
    """用 CDP 操作真实浏览器窗口（移动、缩放、最小化、全屏）。"""

    def __init__(self, page):
        self.page = page
        self.cdp = None
        self.wid = None

    async def init(self):
        self.cdp = await self.page.context.new_cdp_session(self.page)
        # Playwright 默认让页面永远"有焦点"，关掉它，blur / hasFocus 才是真的
        await self.cdp.send('Emulation.setFocusEmulationEnabled', {'enabled': False})
        r = await self.cdp.send('Browser.getWindowForTarget')
        self.wid = r['windowId']
        return self

    async def bounds(self, **b):
        await self.cdp.send('Browser.setWindowBounds', {'windowId': self.wid, 'bounds': {'windowState': 'normal'}})
        await self.cdp.send('Browser.setWindowBounds', {'windowId': self.wid, 'bounds': b})

    async def state(self, s):
        await self.cdp.send('Browser.setWindowBounds', {'windowId': self.wid, 'bounds': {'windowState': s}})


async def set_hidden(page, h):
    """自动化环境里页面永远是 visible（实测最小化、切标签都不变），只能覆盖 document.hidden 来模拟切走。"""
    await page.evaluate("""h => { const d = document;
        Object.defineProperty(d, 'hidden', {configurable: true, get: () => h});
        Object.defineProperty(d, 'visibilityState', {configurable: true, get: () => h ? 'hidden' : 'visible'});
        d.dispatchEvent(new Event('visibilitychange')); }""", h)


async def answer(page, text, sel='#area .ask input'):
    await page.wait_for_selector(sel, timeout=15000)
    loc = page.locator(sel).last
    await loc.click()
    await loc.fill(text)
    await loc.press('Enter')


async def shot(page, name):
    try:
        await page.screenshot(path=str(SHOTS / f'{name}.png'))
    except Exception:
        pass


# ───────────────────────── 各关动作 ─────────────────────────
async def L_prologue(S):
    p = S['page']
    await p.wait_for_selector('#area .btn.primary', timeout=30000)
    await shot(p, '00_prologue')
    await p.click('#area .btn.primary')
    return True, 'real'


async def L_hide_hand(S):
    p = S['page']
    await p.mouse.move(600, 400)
    await p.mouse.move(600, 300, steps=3)
    await p.mouse.move(600, -40, steps=6)  # 从上边出去（会触发"那个叉"彩蛋）
    ok = await wait_solved(p, 8)
    how = 'real'
    if not ok:
        await p.evaluate("document.documentElement.dispatchEvent(new MouseEvent('mouseleave', {clientX: 600, clientY: -2}))")
        ok = await wait_solved(p, 8)
        how = 'simulated(mouseleave)'
    await p.mouse.move(600, 400, steps=3)
    return ok, how


async def L_hide_self(S):
    p = S['page']
    await set_hidden(p, True)
    await asyncio.sleep(2.6)
    t1 = await p.evaluate('document.title')
    await asyncio.sleep(2.0)
    t2 = await p.evaluate('document.title')
    await set_hidden(p, False)
    ok = await wait_solved(p, 8)
    return ok, f'simulated(hidden) title_away={t1!r}->{t2!r}'


async def L_where_am_i(S):
    p = S['page']
    seen = set()
    for _ in range(12):
        seen.add(await p.evaluate('document.title'))
        await asyncio.sleep(0.5)
    code = '小鱼干' if any('小鱼干' in t for t in seen) else None
    await answer(p, code or '小鱼干')
    ok = await wait_solved(p, 8)
    return ok, f'real titles={sorted(seen)}'


async def L_naming(S):
    p = S['page']
    await answer(p, '阿页')
    ok = await wait_for(p, "document.title === '阿页'", 8)
    return ok, 'real'


async def L_hug_tight(S):
    p, w = S['page'], S['win']
    await w.bounds(left=80, top=40, width=700, height=860)
    ok = await wait_solved(p, 8)
    await w.bounds(left=80, top=40, width=1200, height=860)
    return ok, 'real(window resize)'


async def L_wake_up(S):
    p = S['page']
    await wait_for(p, "document.title === 'zzZ'", 10)
    await p.mouse.click(600, 600)
    await asyncio.sleep(0.5)
    await p.reload()
    ok = await wait_for(p, "!!document.querySelector('.note-paper')", 15) or await wait_solved(p, 5)
    return ok, 'real(reload)'


async def L_select_all(S):
    p = S['page']
    await p.mouse.click(600, 650)
    await p.keyboard.press('Control+A')
    ok = await wait_solved(p, 6)
    return ok, 'real(Ctrl+A)'


async def L_pocket(S):
    p = S['page']
    await p.wait_for_selector('.star')
    await p.click('.star', click_count=3)
    await p.keyboard.press('Control+C')
    await p.wait_for_selector('.paste-box', timeout=10000)
    await asyncio.sleep(0.3)
    await p.keyboard.press('Control+V')
    ok = await wait_solved(p, 6)
    pasted = await p.evaluate("document.querySelector('.paste-box') && document.querySelector('.paste-box').textContent")
    return ok, f'real(Ctrl+C/Ctrl+V) pasted={pasted!r}'


async def L_whisper(S):
    p = S['page']
    cdp = await p.context.new_cdp_session(p)
    d0 = await p.evaluate('devicePixelRatio')
    await cdp.send('Emulation.setDeviceMetricsOverride', {'width': 0, 'height': 0, 'deviceScaleFactor': d0 * 2.5, 'mobile': False})
    await asyncio.sleep(0.8)
    d1 = await p.evaluate('devicePixelRatio')
    await answer(p, '棉花糖')
    await asyncio.sleep(1.5)
    await cdp.send('Emulation.clearDeviceMetricsOverride')
    ok = await wait_solved(p, 10)
    return ok, f'equiv(CDP dpr {d0}->{d1}->back)'


async def L_right_click(S):
    p = S['page']
    await p.click('.box')
    await p.click('.box', button='right')
    ok = await wait_solved(p, 6)
    return ok, 'real(right click)'


async def L_go_back(S):
    p = S['page']
    h = await p.evaluate('location.hash')
    await p.go_back()
    await asyncio.sleep(0.6)
    await p.go_back()
    ok = await wait_solved(p, 6)
    return ok, f'real(history back) hash_before={h}'


async def L_console_read(S):
    p = S['page']
    seen = any('心跳' in m for m in LOGS)
    await answer(p, '心跳')
    ok = await wait_solved(p, 6)
    return ok, f'equiv(console log seen={seen})'


async def L_console_hug(S):
    p = S['page']
    r = await p.evaluate('抱抱()')
    ok = await wait_solved(p, 6)
    return ok, f'equiv(page eval 抱抱() -> {r!r})'


async def L_knock_hash(S):
    p = S['page']
    await p.evaluate("location.hash = '#瞎敲'")
    await asyncio.sleep(0.5)
    await p.evaluate("location.hash = '#芝麻'")
    ok = await wait_solved(p, 6)
    return ok, 'equiv(set location.hash)'


async def L_view_source(S):
    p = S['page']
    src = (ROOT / 'index.html').read_text(encoding='utf-8')
    has = '肋骨' in src
    await answer(p, '肋骨')
    ok = await wait_solved(p, 6)
    return ok, f'equiv(source has code={has})'


async def L_print(S):
    p = S['page']
    await p.emulate_media(media='print')
    await shot(p, '15_print_preview')
    txt = await p.evaluate("document.querySelector('#print-sheet').innerText")
    await p.emulate_media(media='screen')
    await answer(p, '纸飞机')
    ok = await wait_solved(p, 6)
    return ok, f"equiv(print media) sheet_has_code={'纸飞机' in txt}"


async def L_favicon(S):
    p = S['page']
    hrefs = set()
    for _ in range(14):
        hrefs.add(await p.evaluate("document.getElementById('favicon').href.slice(-40)"))
        await asyncio.sleep(0.4)
    code = await p.evaluate('BGW.Save.data.lv.code')
    await answer(p, code)
    ok = await wait_solved(p, 6)
    return ok, f'real(favicon frames changed={len(hrefs)})'


async def L_square(S):
    p, w = S['page'], S['win']
    await w.bounds(left=200, top=40, width=760, height=760)
    for _ in range(4):
        iw, ih = await p.evaluate('[innerWidth, innerHeight]')
        b = await w.cdp.send('Browser.getWindowBounds', {'windowId': w.wid})
        h = b['bounds']['height'] + (iw - ih)
        await w.bounds(left=200, top=40, width=760, height=h)
        await asyncio.sleep(0.4)
    ok = await wait_solved(p, 8)
    iw, ih = await p.evaluate('[innerWidth, innerHeight]')
    return ok, f'real(window resize to {iw}x{ih})'


async def L_shake(S):
    p, w = S['page'], S['win']
    await w.bounds(left=300, top=60, width=1000, height=800)
    await asyncio.sleep(0.5)
    for i in range(10):
        await w.cdp.send('Browser.setWindowBounds', {'windowId': w.wid, 'bounds': {'left': 300 + (120 if i % 2 == 0 else -120)}})
        await asyncio.sleep(0.12)
    ok = await wait_solved(p, 6)
    return ok, 'real(window move via CDP)'


async def L_walk(S):
    p, w = S['page'], S['win']
    await p.wait_for_selector('.map .flower')
    fx, fy = await p.evaluate("""(() => { const m = document.querySelector('.map'), f = m.querySelector('.flower');
        return [parseFloat(f.style.left) / m.clientWidth, parseFloat(f.style.top) / m.clientHeight]; })()""")
    sw, sh, sl, st = await p.evaluate('[screen.availWidth, screen.availHeight, screen.availLeft, screen.availTop]')
    W, H = 700, 520
    left = int(min(max(fx * sw - W / 2, 0), sw - W)) + sl
    top = int(min(max(fy * sh - H / 2, 0), sh - H)) + st
    await w.bounds(left=left, top=top, width=W, height=H)
    ok = await wait_solved(p, 8)
    await w.bounds(left=80, top=40, width=1200, height=860)
    return ok, f'real(window move to flower {fx:.2f},{fy:.2f})'


async def L_fullscreen(S):
    p, w = S['page'], S['win']
    await w.state('fullscreen')
    ok = await wait_solved(p, 8)
    await asyncio.sleep(2.5)
    await w.state('normal')
    await w.bounds(left=80, top=40, width=1200, height=860)
    exited = await wait_for(p, "document.querySelector('#next .btn') !== null", 15)
    return ok and exited, 'real(window fullscreen via CDP)'


async def L_find_key(S):
    p = S['page']
    found = await p.evaluate("window.find('钥匙') && window.find('钥匙') && window.find('钥匙')")
    ok = await wait_solved(p, 3)
    how = f'real(window.find)'
    if not ok:
        await p.evaluate("(() => { const h = document.querySelector('.until-found'); h.dispatchEvent(new Event('beforematch')); h.removeAttribute('hidden'); })()")
        ok = await wait_solved(p, 5)
        how = 'simulated(beforematch)'
    return ok, how


async def L_count(S):
    p = S['page']
    await p.wait_for_selector('.grid-text')
    n = await p.evaluate("(document.body.innerText.match(/我/g) || []).length")
    await answer(p, str(n))
    ok = await wait_solved(p, 6)
    return ok, f'equiv(count={n})'


async def L_dark_mode(S):
    p = S['page']
    await p.emulate_media(color_scheme='dark')
    ok = await wait_solved(p, 6)
    await asyncio.sleep(0.8)
    await shot(p, '23_dark')
    await p.emulate_media(color_scheme='light')
    return ok, 'equiv(emulate prefers-color-scheme)'


async def L_lights_off(S):
    p = S['page']
    await wait_for(p, "document.body.classList.contains('dark-room')", 10)
    await shot(p, '24_dark_room')
    for _ in range(5):
        await p.keyboard.press('Tab')
        await asyncio.sleep(0.15)
    label = await p.evaluate("document.querySelector('.dark-label').textContent")
    await p.keyboard.press('Enter')
    ok = await wait_solved(p, 6)
    return ok, f'real(Tab x5, label={label!r})'


async def L_caps(S):
    p = S['page']
    await p.wait_for_selector('.shout')
    await p.click('.shout')
    await p.keyboard.press('CapsLock')
    await p.keyboard.type('HELLO', delay=60)
    ok = await wait_solved(p, 3)
    how = 'real(CapsLock)'
    if not ok:
        await p.evaluate("""(() => { const i = document.querySelector('.shout');
            for (const k of 'HELLO') i.dispatchEvent(new KeyboardEvent('keydown', {key: k, modifierCapsLock: true, bubbles: true})); })()""")
        ok = await wait_solved(p, 4)
        how = 'simulated(keydown modifierCapsLock)'
    try:
        await p.keyboard.press('CapsLock')
    except Exception:
        pass
    return ok, how


async def L_offline(S):
    p = S['page']
    await S['ctx'].set_offline(True)
    await wait_for(p, "document.querySelector('#task').textContent.includes('连回')", 15)
    await S['ctx'].set_offline(False)
    ok = await wait_solved(p, 8)
    return ok, 'real(context offline)'


async def L_idle(S):
    p = S['page']
    AUTO['on'] = False
    t0 = time.time()
    ok = await wait_solved(p, 45)
    AUTO['on'] = True
    return ok, f'real(idle {time.time() - t0:.0f}s)'


async def L_address(S):
    p = S['page']
    await p.evaluate("""(() => { const dt = new DataTransfer(); dt.setData('text/plain', decodeURI(location.href));
        document.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true, cancelable: true})); })()""")
    ok = await wait_solved(p, 6)
    return ok, 'simulated(paste decoded URL)'


async def L_pointer_lock(S):
    p = S['page']
    AUTO['on'] = False
    await p.click('#area .btn.primary')
    locked = await wait_for(p, '!!document.pointerLockElement', 3)
    how = 'real(pointer lock)'
    if not locked:
        # 拿不到锁定（自动化窗口没有系统焦点时会这样）→ 再点一次，触发游戏里的"按住别松开"兜底
        await asyncio.sleep(1.6)
        await p.click('#area .btn.primary')
        locked = await wait_for(p, '!!document.pointerLockElement', 3)
        if not locked:
            await wait_for(p, "document.querySelector('#area .btn.primary').textContent.includes('按住')", 5)
            box = await p.locator('#area .btn.primary').bounding_box()
            await p.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
            await p.mouse.down()
            await asyncio.sleep(11)
            await p.mouse.up()
            how = 'real(fallback: hold mouse 10s)'
    ok = await wait_solved(p, 14)
    AUTO['on'] = True
    return ok, how


async def L_drawer_lock(S):
    p = S['page']
    v = await p.evaluate("localStorage.getItem('抽屉锁')")
    await p.evaluate("localStorage.setItem('抽屉锁', '开着')")
    ok = await wait_solved(p, 6)
    return ok, f'equiv(localStorage edit, was {v!r})'


async def L_wall(S):
    p = S['page']
    await p.click('.wall')
    await p.evaluate("document.getElementById('墙').remove()")
    ok = await wait_solved(p, 6)
    return ok, 'equiv(remove element)'


async def L_mini_me(S):
    p, ctx = S['page'], S['ctx']
    async with ctx.expect_page() as pi:
        await p.click('#area .btn.primary')
    mini = await pi.value
    await mini.wait_for_load_state()
    await asyncio.sleep(2.5)
    mw = await Win(mini).init()
    sw = await p.evaluate('screen.availWidth')
    await mw.cdp.send('Browser.setWindowBounds', {'windowId': mw.wid, 'bounds': {'left': sw - 60}})
    await asyncio.sleep(0.6)
    ok = await wait_solved(p, 10)
    closed = False
    for _ in range(20):
        if mini.is_closed():
            closed = True
            break
        await asyncio.sleep(0.3)
    return ok, f'real(popup + move off-screen; popup closed itself={closed})'


async def L_pip(S):
    p, ctx = S['page'], S['ctx']
    n0 = len(ctx.pages)
    await p.click('#area .btn.primary')
    opened = await wait_for(p, "!!(window.documentPictureInPicture && documentPictureInPicture.window)", 5)
    await asyncio.sleep(0.5)
    # 画中画小窗也被 Playwright 当成页面接管了，同样要关掉它的"永远有焦点"
    for pg in ctx.pages[n0:]:
        try:
            c = await ctx.new_cdp_session(pg)
            await c.send('Emulation.setFocusEmulationEnabled', {'enabled': False})
        except Exception as e:
            print('pip cdp', e)
    pipfocus0 = await p.evaluate("documentPictureInPicture.window.document.hasFocus()")
    # 最小化主窗口：系统层面一定会让它失去焦点（比"把别的窗口提到前面"可靠，后者会被 Windows 的防抢焦点拦住）
    await S['win'].state('minimized')
    await asyncio.sleep(1.0)
    focus = await p.evaluate('document.hasFocus()')
    how = 'real(minimize)'
    if focus:  # 用户正在用电脑时，系统焦点规则会让最小化也拿不到失焦，退回模拟切走
        await set_hidden(p, True)
        how = 'simulated(hidden)'
    await asyncio.sleep(5.5)
    if how.startswith('simulated'):
        await set_hidden(p, False)
    await S['win'].state('normal')
    await p.bring_to_front()
    ok = await wait_solved(p, 8)
    return ok, f'PiP real(opened={opened}); away {how}'


async def L_twins(S):
    p, ctx = S['page'], S['ctx']
    await wait_task(p)
    b = await ctx.new_page()
    await b.goto(URL)
    role = None
    for _ in range(20):
        try:
            role = await b.evaluate('BGW.Inst.role')
        except Exception:
            pass
        if role == 'twin':
            break
        await asyncio.sleep(0.3)
    # 两个窗口都可见，对话自己往下走；等到"关掉其中一个"
    done = await wait_for(p, "document.querySelector('#task').textContent.includes('关掉其中一个')", 60)
    await shot(b, '34_twin_B')
    await shot(p, '34_twin_A')
    await b.close()
    ok = await wait_solved(p, 10)
    return ok, f'real(second tab role={role}, dialogue finished={done})'


async def L_try_close(S):
    p = S['page']
    await p.wait_for_selector('#area .btn.primary')
    await p.click('#area .btn.primary')
    await wait_task(p)
    got = {}

    async def on_dialog(d):
        got['type'] = d.type
        await d.dismiss()
    p.once('dialog', lambda d: asyncio.ensure_future(on_dialog(d)))
    await p.close(run_before_unload=True)
    ok = await wait_solved(p, 8)
    return ok, f"real(beforeunload dialog={got.get('type')}, dismissed)"


async def L_fragments(S):
    p = S['page']
    await p.wait_for_selector('.slot input')
    await set_hidden(p, True)
    await asyncio.sleep(0.8)
    t = await p.evaluate('document.title')
    await set_hidden(p, False)
    await p.emulate_media(media='print')
    pr = await p.evaluate("document.querySelector('#print-sheet').innerText")
    await p.emulate_media(media='screen')
    for i, k in enumerate(['去看', '第一张', '纸条的', '最右边']):
        loc = p.locator('.slot input').nth(i)
        await loc.fill(k)
        await loc.press('Enter')
        await asyncio.sleep(0.2)
    ok = await wait_solved(p, 6)
    return ok, f"real+equiv(title_away={t!r}, print_has={'纸条的' in pr})"


async def L_the_rest(S):
    p = S['page']
    line2 = (ROOT / 'index.html').read_text(encoding='utf-8').splitlines()[1]
    await answer(p, '在这里')
    ok = await wait_solved(p, 6)
    await asyncio.sleep(4)
    await shot(p, '37_reveal')
    return ok, f"equiv(source line2 ends with {line2.strip()[-12:]!r}, len={len(line2)})"


async def L_door_handle(S):
    p = S['page']
    hl = await p.evaluate('history.length')
    r = await p.evaluate('开门()')
    ok = await wait_solved(p, 6)
    warned = any('Scripts may close only' in m for m in LOGS)
    return ok and not p.is_closed(), f'equiv(eval 开门() -> {r!r}; history.length={hl}; browser refused={warned})'


async def L_one_more_minute(S):
    p = S['page']
    await wait_task(p, 60)
    await set_hidden(p, True)
    await asyncio.sleep(2.0)
    t = await p.evaluate('document.title')
    await set_hidden(p, False)
    ok = await wait_solved(p, 8)
    return ok, f'simulated(hidden; title_away={t!r})'


LEVELS = [
    ('prologue', L_prologue), ('hide-hand', L_hide_hand), ('hide-self', L_hide_self), ('where-am-i', L_where_am_i),
    ('naming', L_naming), ('hug-tight', L_hug_tight), ('wake-up', L_wake_up), ('select-all', L_select_all),
    ('pocket', L_pocket), ('whisper', L_whisper), ('right-click', L_right_click), ('go-back', L_go_back),
    ('console-read', L_console_read), ('console-hug', L_console_hug), ('knock-hash', L_knock_hash),
    ('view-source', L_view_source), ('print', L_print), ('favicon', L_favicon), ('square', L_square),
    ('shake', L_shake), ('walk', L_walk), ('fullscreen', L_fullscreen), ('find-key', L_find_key), ('count', L_count),
    ('dark-mode', L_dark_mode), ('lights-off', L_lights_off), ('caps', L_caps), ('offline', L_offline),
    ('idle', L_idle), ('address', L_address), ('pointer-lock', L_pointer_lock), ('drawer-lock', L_drawer_lock),
    ('wall', L_wall), ('mini-me', L_mini_me), ('pip', L_pip), ('twins', L_twins), ('try-close', L_try_close),
    ('fragments', L_fragments), ('the-rest', L_the_rest), ('door-handle', L_door_handle),
    ('one-more-minute', L_one_more_minute),
]


async def main():
    only_from = None
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel='msedge', headless=False,
                                           args=['--window-position=80,40', '--window-size=1200,860', '--autoplay-policy=no-user-gesture-required'])
        ctx = await browser.new_context(no_viewport=True)
        page = await ctx.new_page()
        S = {'ctx': ctx, 'page': page}

        def hook(pg):
            pg.on('console', lambda m: LOGS.append(m.text))
            pg.on('pageerror', lambda e: LOGS.append(f'[pageerror] {e}'))
        hook(page)
        await page.goto(URL)
        S['win'] = await Win(page).init()
        stop = asyncio.Event()
        clicker = asyncio.ensure_future(autoclick(lambda: S['page'], stop))
        todo = LEVELS
        start_from = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--from=')), None)
        if start_from:
            idx = [l for l, _ in LEVELS].index(start_from)
            todo = LEVELS[idx:]
            await page.wait_for_selector('#area .btn.primary', timeout=30000)
            await page.evaluate(f"BGW.Save.data.name = '阿页'; BGW.Game.jump({J(start_from)})")

        for lid, fn in todo:
            t0 = time.time()
            if not await wait_level(page, lid, 60):
                cur = await page.evaluate('BGW.Game.ctx && BGW.Game.ctx.def.id')
                results.append((lid, False, f'never reached (current={cur})', 0))
                print('FAIL reach', lid, cur, flush=True)
                await shot(page, f'FAIL_reach_{lid}')
                print('台词：', await page.eval_on_selector_all('#lines .line', 'e => e.map(x => x.textContent)'))
                print('next 按钮：', await page.evaluate("document.querySelector('#next').innerHTML"), 'overlay:', await page.evaluate("document.querySelector('#overlay').className"))
                print('最近的控制台输出：', LOGS[-8:])
                break
            if lid == 'idle':
                AUTO['on'] = False
                await page.mouse.move(30, 420)
            if lid not in ('prologue', 'naming'):
                await wait_task(page, 40)
                await shot(page, f'{len(results):02d}_{lid}')
            try:
                ok, how = await fn(S)
            except Exception as e:
                ok, how = False, f'exception: {e!r}'
            dt = time.time() - t0
            results.append((lid, ok, how, dt))
            print(('PASS ' if ok else 'FAIL ') + lid, '|', how, f'({dt:.1f}s)', flush=True)
            if not ok:
                await shot(page, f'FAIL_{lid}')
                print('最近的控制台输出：', LOGS[-12:])
                print('页面：', [(pg.url[-40:], pg.is_closed()) for pg in ctx.pages], 'main closed:', page.is_closed())
                break

        # 第 40 关：刷新不算，关掉再打开才算
        if all(r[1] for r in results) and len(results) == len(todo):
            ok = await wait_level(page, 'close-door', 60)
            await wait_for(page, "BGW.Save.data.phase === 'awaitingClose'", 20)
            await shot(page, '40_close_door')
            await page.reload()
            await asyncio.sleep(2.5)
            lines = await page.eval_on_selector_all('#lines .line', 'e => e.map(x => x.textContent)')
            still = await page.evaluate('BGW.Save.data.phase')
            refused = any('刷新' in l for l in lines) and still == 'awaitingClose'
            results.append(('close-door(reload)', refused, f'lines={lines}', 0))
            print(('PASS ' if refused else 'FAIL ') + 'close-door(reload)', lines, flush=True)
            await page.close()
            page = await ctx.new_page()
            hook(page)
            S['page'] = page
            await page.goto(URL)
            ok = await wait_level(page, 'epilogue', 20)
            await page.wait_for_selector('#area .btn.primary', timeout=20000)
            await page.click('#area .btn.primary')
            done = await wait_for(page, "BGW.Save.data.phase === 'done' && !!document.querySelector('.credits')", 60)
            await asyncio.sleep(2)
            await shot(page, '41_epilogue')
            results.append(('close-door → epilogue', ok and done, 'real(close tab + reopen)', 0))
            print(('PASS ' if ok and done else 'FAIL ') + 'epilogue', flush=True)
            await page.close()
            page = await ctx.new_page()
            hook(page)
            S['page'] = page
            await page.goto(URL)
            home = await wait_for(page, "[...document.querySelectorAll('#lines .line')].some(l => l.textContent.includes('你回来了'))", 15)
            await shot(page, '42_home')
            results.append(('home after done', home, 'real(reopen)', 0))
            print(('PASS ' if home else 'FAIL ') + 'home', flush=True)

        stop.set()
        await clicker
        errs = [m for m in LOGS if 'pageerror' in m or 'Error' in m]
        print('\n==== 总结 ====')
        print(f"通过 {sum(1 for r in results if r[1])} / {len(results)}")
        for r in results:
            print(('✔' if r[1] else '✘'), r[0], '|', r[2])
        print('页面错误：', errs if errs else '无')
        (SHOTS / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding='utf-8')
        await browser.close()

asyncio.run(main())
