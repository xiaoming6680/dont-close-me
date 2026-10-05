"""打包线上产物：把 index.html、css/、js/ 复制到 dist/（Cloudflare Pages 直接上传这个目录）。

docs/ 里是完整剧透，tests/ 是测试，都不能上线，所以不是整个目录原样上传。
用法：python tools/dist.py
"""
import pathlib
import shutil
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
ITEMS = ['index.html', 'css', 'js']

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
for name in ITEMS:
    src = ROOT / name
    if src.is_dir():
        shutil.copytree(src, DIST / name)
    else:
        shutil.copy2(src, DIST / name)

files = sorted(p.relative_to(DIST).as_posix() for p in DIST.rglob('*') if p.is_file())
print(f'dist/ 共 {len(files)} 个文件：')
for f in files:
    print('  ' + f)
