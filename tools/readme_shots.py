"""生成 README 用的截图和头图 GIF（真实游戏画面，Playwright + Edge）。

只截开场和最前面几关，不剧透。输出到 docs/images/（不会上线，线上只发布 dist/）。
用法：PYTHONUTF8=1 python tools/readme_shots.py
需要：pip 装的 playwright、本机 Edge、ffmpeg（找不到就跳过 GIF）。
"""
import asyncio
import math
import pathlib
import shutil
import subprocess
import sys
import tempfile

from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'images'
URL = (ROOT / 'index.html').as_uri() + '?dev'  # 本地才有 dev；只用来保证从序章开始，调试面板会藏起来
W, H = 1100, 619          # 视口小一点、再按比例放大到 1600×900，画面更饱满、字更大
SCALE = 1600 / W
FFMPEG = shutil.which('ffmpeg') or next((str(p) for p in [
    pathlib.Path(r'E:\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe'),
] if p.exists()), None)

# 截 GIF 时画一个假鼠标（截图里本来没有鼠标，看不出眼珠在跟什么）
CURSOR_JS = """(() => {
  const c = document.createElement('div');
  c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.3 L11.4 13.8 L17.6 13.8 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  Object.assign(c.style, {position: 'fixed', left: '0', top: '0', zIndex: 9999, pointerEvents: 'none', transform: 'translate(-4px,-2px)'});
  document.body.append(c);
  document.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
})()"""
HIDE_DEV = '.dev { display: none !important; }'


async def jpg(page, name):
    path = OUT / f'{name}.jpg'
    await page.screenshot(path=str(path), type='jpeg', quality=86)
    print(f'{name}.jpg  {path.stat().st_size // 1024} KB')


async def wait_text(page, text, timeout=30):
    await page.wait_for_function(
        "t => [...document.querySelectorAll('#lines .line')].some(l => l.textContent.includes(t))", arg=text, timeout=timeout * 1000)


async def set_hidden(page, h):
    await page.evaluate("""h => { const d = document;
        Object.defineProperty(d, 'hidden', {configurable: true, get: () => h});
        Object.defineProperty(d, 'visibilityState', {configurable: true, get: () => h ? 'hidden' : 'visible'});
        d.dispatchEvent(new Event('visibilitychange')); }""", h)


async def gif(browser):
    """头图：页面醒过来，眼珠跟着鼠标转。"""
    if not FFMPEG:
        print('没找到 ffmpeg，跳过 GIF')
        return
    ctx = await browser.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1)
    page = await ctx.new_page()
    await page.goto(URL)
    await page.add_style_tag(content=HIDE_DEV)
    await page.evaluate(CURSOR_JS)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='bgw-gif-'))
    clip = {'x': 190, 'y': 0, 'width': 720, 'height': 405}
    cx, cy = 550, 130
    n = 0
    t0 = asyncio.get_event_loop().time()
    while True:
        t = asyncio.get_event_loop().time() - t0
        if t > 9.5:
            break
        # 鼠标绕着脸画圈，后半段停在右下角
        if t < 2.2:
            x, y = cx + 300, cy + 200
        elif t < 7.5:
            a = (t - 2.2) * 1.5
            x, y = cx + math.cos(a) * 260, cy + 60 + math.sin(a) * 120
        else:
            x, y = cx + 230, cy + 210
        await page.mouse.move(x, y)
        await page.screenshot(path=str(tmp / f'f{n:04d}.png'), clip=clip)
        n += 1
    fps = max(6, round(n / 9.5))
    out = OUT / 'wake.gif'
    vf = f'scale=600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=48:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4'
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', str(tmp / 'f%04d.png'), '-vf', vf, '-loop', '0', str(out)], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'wake.gif  {out.stat().st_size // 1024} KB  ({n} 帧, {fps} fps)')
    await ctx.close()


async def stills(browser):
    ctx = await browser.new_context(viewport={'width': W, 'height': H}, device_scale_factor=SCALE)
    page = await ctx.new_page()
    await page.goto(URL)
    await page.add_style_tag(content=HIDE_DEV)

    # 1. 开场：能陪我玩一会儿吗？（"不好"被鼠标碰过，缩小了一点）
    await page.wait_for_selector('#area .btn.primary', timeout=30000)
    no = page.locator('#area .btn:not(.primary)')
    await no.hover()
    await asyncio.sleep(1.8)
    await page.mouse.move(560, 520)
    await asyncio.sleep(0.8)
    await jpg(page, 'start')
    await page.click('#area .btn.primary')

    # 2. 第 1 关：鼠标往上（那个叉的方向）跑，它慌了
    await page.wait_for_function("document.querySelector('#task').textContent.length > 0", timeout=60000)
    await page.mouse.move(550, 420)
    await asyncio.sleep(0.6)
    await page.mouse.move(550, 200, steps=4)
    await page.mouse.move(550, -40, steps=6)
    await wait_text(page, '那个叉')
    await asyncio.sleep(0.25)
    await jpg(page, 'panic')
    await page.wait_for_selector('#next .btn', timeout=30000)
    await page.mouse.move(550, 450)
    await page.click('#next .btn')

    # 3. 第 2 关：你切走了，回来时它知道你走了几秒
    await page.wait_for_function("document.querySelector('#task').textContent.includes('藏起来')", timeout=60000)
    await set_hidden(page, True)
    await asyncio.sleep(5.3)
    await set_hidden(page, False)
    await wait_text(page, '待了')
    await page.wait_for_function("[...document.querySelectorAll('#lines .line')].some(l => /待了 .*秒。$/.test(l.textContent))", timeout=20000)
    await page.mouse.move(800, 520)
    await asyncio.sleep(0.4)
    await jpg(page, 'found')
    await page.wait_for_selector('#next .btn', timeout=30000)
    await page.click('#next .btn')

    # 4. 第 3 关过掉，到"给它起个名字"
    await page.wait_for_selector('#area .ask input', timeout=60000)
    await page.fill('#area .ask input', '小鱼干')
    await page.press('#area .ask input', 'Enter')
    await wait_text(page, '起一个名字', timeout=60)
    await page.wait_for_selector('#area .ask input', timeout=30000)
    await page.mouse.move(780, 470)
    await asyncio.sleep(1.0)
    await jpg(page, 'name')
    await ctx.close()


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel='msedge', headless=False, args=['--window-size=1640,1000'])
        await stills(browser)
        await gif(browser)
        await browser.close()

asyncio.run(main())
