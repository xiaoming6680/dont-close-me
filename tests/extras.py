# 《别关我》边角流程测试：手机提示、多标签页挡住/搬家、刷新和重新打开的问候、提示+跳过、抽屉、非 dev 模式不暴露命名空间
# 用法：PYTHONUTF8=1 python tests/extras.py [截图目录]
import asyncio, pathlib, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = (ROOT / 'index.html').as_uri()
_base = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--base=')), None)
if _base:
    BASE = _base
DEV = BASE + '?dev&fast'
_pos = [a for a in sys.argv[1:] if not a.startswith('--')]
SHOTS = pathlib.Path(_pos[0]) if _pos else ROOT / 'tests' / 'out'
SHOTS.mkdir(parents=True, exist_ok=True)
R = []


def check(name, ok, info=''):
    R.append((name, ok, info))
    print(('PASS ' if ok else 'FAIL ') + name, '|', info, flush=True)


async def wait_for(page, js, timeout=20.0):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if await page.evaluate(js):
                return True
        except Exception:
            pass
        await asyncio.sleep(0.2)
    return False


async def lines(page):
    return await page.eval_on_selector_all('#lines .line', 'e => e.map(x => x.textContent)')


async def start_game(page, url=DEV):
    await page.goto(url)
    await page.wait_for_selector('#area .btn.primary', timeout=30000)
    await page.click('#area .btn.primary')


async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(channel='msedge', headless=False)

        # 1. 手机
        m = await b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True,
                                user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 EdgA/140.0')
        p = await m.new_page()
        await p.goto(BASE)
        ok = await wait_for(p, "[...document.querySelectorAll('#lines .line')].some(l => l.textContent.includes('电脑'))", 15)
        await p.screenshot(path=str(SHOTS / 'x_mobile.png'))
        check('手机提示', ok, str(await lines(p)))
        await m.close()

        # 1b. 电脑版微信内置浏览器
        w = await b.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63090c33) XWEB/14185 Flue')
        p = await w.new_page()
        await p.goto(BASE)
        ok = await wait_for(p, "[...document.querySelectorAll('#lines .line')].some(l => l.textContent.includes('Edge 或 Chrome'))", 15)
        await p.screenshot(path=str(SHOTS / 'x_inapp.png'))
        check('微信内置浏览器提示', ok, str(await lines(p)))
        await w.close()

        # 2. 非 dev 模式：控制台里没有 BGW
        c = await b.new_context()
        p = await c.new_page()
        await p.goto(BASE)
        await asyncio.sleep(1.5)
        check('非 dev 不暴露 BGW', await p.evaluate('typeof window.BGW') == 'undefined')
        await c.close()

        # 3. 多标签页：第二个被挡住 → 搬家
        c = await b.new_context()
        a = await c.new_page()
        await start_game(a)
        await wait_for(a, "BGW.Game.ctx && BGW.Game.ctx.def.id === 'hide-hand'", 30)
        bb = await c.new_page()
        await bb.goto(DEV)
        blocked = await wait_for(bb, "BGW.Inst.role === 'blocked' && [...document.querySelectorAll('#lines .line')].some(l => l.textContent.includes('另一个标签页'))", 15)
        await bb.screenshot(path=str(SHOTS / 'x_blocked.png'))
        check('第二个标签页被挡住', blocked)
        await bb.click('#area .btn.primary')
        moved = await wait_for(a, "BGW.Inst.role === 'blocked' && [...document.querySelectorAll('#lines .line')].some(l => l.textContent.includes('搬到另一个标签页'))", 10)
        took = await wait_for(bb, "BGW.Inst.role === 'main' && BGW.Game.ctx && BGW.Game.ctx.def.id === 'hide-hand'", 10)
        check('搬家：新标签页接管、旧的显示搬走了', moved and took)
        # 关掉现在的主实例，剩下那个自动接管
        await bb.close()
        auto = await wait_for(a, "BGW.Inst.role === 'main' && BGW.Game.ctx && BGW.Game.ctx.def.id === 'hide-hand'", 10)
        check('主实例关掉后，剩下的自动接管', auto)

        # 4. 刷新问候 + 统计
        await a.evaluate("BGW.Game.jump('pocket')")
        await wait_for(a, "BGW.Game.ctx && BGW.Game.ctx.def.id === 'pocket' && document.querySelector('#task').textContent.length > 0", 20)
        r0 = await a.evaluate('BGW.Save.data.stats.reloads')
        await a.reload()
        greet = await wait_for(a, "[...document.querySelectorAll('#lines .line')].some(l => /醒了|刷新了/.test(l.textContent))", 10)
        r1 = await a.evaluate('BGW.Save.data.stats.reloads')
        check('刷新后问候 + 刷新次数 +1', greet and r1 == r0 + 1, f'{r0}->{r1} {await lines(a)}')

        # 5. 关掉再打开的问候
        await a.close()
        a = await c.new_page()
        await a.goto(DEV)
        back = await wait_for(a, "[...document.querySelectorAll('#lines .line')].some(l => l.textContent.includes('回来'))", 15)
        closes = await a.evaluate('BGW.Save.data.stats.closes')
        check('重新打开问候 + 关闭次数', back and closes >= 1, f'closes={closes} {await lines(a)}')

        # 6. 提示阶梯 + 跳过（第 23 关可跳过），跳过有纸条的关会补纸条（第 30 关）
        await a.evaluate("BGW.hintSpeed = 0.02; BGW.Game.jump('drawer-lock')")
        hints = await wait_for(a, "document.querySelectorAll('#hints .hint').length === 3", 30)
        await a.screenshot(path=str(SHOTS / 'x_hints.png'))
        skip = await wait_for(a, "!!document.querySelector('#hints .skip-link')", 20)
        check('三级提示依次出现 + 出现跳过', hints and skip)
        notes0 = await a.evaluate('BGW.Save.data.notes.length')
        await a.click('#hints .skip-link')
        gotnote = await wait_for(a, "!!document.querySelector('.note-wrap')", 10)
        if gotnote:
            await a.click('.note-wrap .btn')
        nxt = await wait_for(a, "!!document.querySelector('#next .btn')", 10)
        notes1 = await a.evaluate('BGW.Save.data.notes.length')
        lk = await a.evaluate("localStorage.getItem('抽屉锁')")
        check('跳过：补纸条、进下一关、清掉抽屉锁', gotnote and nxt and notes1 == notes0 + 1 and lk is None, f'notes {notes0}->{notes1}, 抽屉锁={lk!r}')
        await a.click('#next .btn')
        nextlv = await wait_for(a, "BGW.Game.ctx.def.id === 'wall'", 10)
        check('跳过后到了下一关', nextlv)

        # 7. 抽屉
        await a.evaluate("BGW.hintSpeed = 1")
        await a.click('#drawer-btn')
        drawer = await wait_for(a, "document.querySelectorAll('.drawer .note-paper').length >= 1", 5)
        await a.screenshot(path=str(SHOTS / 'x_drawer.png'))
        await a.keyboard.press('Escape')
        closed = await wait_for(a, "!document.querySelector('.drawer')", 5)
        check('抽屉打开/关闭', drawer and closed)

        # 8. 声音开关
        m0 = await a.evaluate('BGW.Save.data.settings.muted')
        await a.click('#sound-btn')
        m1 = await a.evaluate('BGW.Save.data.settings.muted')
        await a.click('#sound-btn')
        check('声音开关', m0 != m1)
        await c.close()

        # 9. 控制台关卡之外：抱抱() 在第 12 关之后一直能用
        c = await b.new_context()
        p = await c.new_page()
        await start_game(p)
        await p.evaluate("BGW.Save.data.flags.hug = true; BGW.installHug()")
        r = await p.evaluate('抱抱()')
        check('第 12 关之后 抱抱() 仍可用', isinstance(r, str), r)
        await c.close()

        await b.close()
    print('\n==== 总结 ====')
    print(f"通过 {sum(1 for r in R if r[1])} / {len(R)}")
    for r in R:
        print(('✔' if r[1] else '✘'), r[0], '|', r[2])

asyncio.run(main())
