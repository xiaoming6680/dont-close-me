# 冒烟测试：打开页面，看控制台有没有报错，截一张序章的图
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'index.html').as_uri()
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'tests' / 'out'
OUT.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='msedge', headless=False)
        ctx = await b.new_context(viewport={'width': 1100, 'height': 760})
        page = await ctx.new_page()
        logs = []
        page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
        page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        await page.goto(URL + '?dev')
        await page.wait_for_timeout(9000)
        await page.screenshot(path=str(OUT / 'smoke_prologue.png'))
        print('title:', await page.title())
        print('lines:', await page.eval_on_selector_all('#lines .line', 'els => els.map(e => e.textContent)'))
        print('\n'.join(logs))
        await b.close()
asyncio.run(main())
