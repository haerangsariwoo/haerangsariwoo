"""
InkLipquid 원본(2.1MB)에서 필요한 글자만 남겨 woff2 로 줄인다.

담는 범위:
  1) 앱 소스에 실제로 등장하는 한글 전부 (제목·라벨·문구)
  2) 이름에 흔히 쓰이는 음절 (부원 이름은 데이터라 소스에 없다)
  3) 영문·숫자·문장부호

UI 문구를 새로 추가하면 이 스크립트를 다시 돌려야 한다.
"""
import glob
import io
import os
import re
import subprocess
import sys

SRC = r"C:\Windows\Fonts\THEFACESHOP INKLIPQUID.ttf"
APP = r"C:\HSU\Project\HaeRang-redesign\apps\main"
OUT = os.path.join(APP, "src", "app", "fonts", "inklipquid-subset.woff2")

# 1) 앱 소스의 한글
used = set()
for pattern in ("**/*.tsx", "**/*.ts"):
    for path in glob.glob(os.path.join(APP, "src", pattern), recursive=True):
        used |= set(re.findall(r"[가-힣]", io.open(path, encoding="utf-8").read()))

# 2) 이름 음절 — 부원 이름은 DB 에서 오므로 소스에 없다
name_syllables = (
    "가강개건경계고관광구권규근금기김나남노다단대덕도동두라래로루린만명모무문미민"
    "박반방배백범별보복본부빈사산상새서석선설섭성세소솔수숙순슬승시신실심아안애야양"
    "어언연영예오온완요용우운원월유윤은의이익인일임자장재정제조종주준지진찬창채천철"
    "청초최추춘태택하한해현형혜호홍화환효희"
)

latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
digits = "0123456789"
punct = " !,.?~-()[]{}:;/@#%&*+=<>'\"" + "·–—…‘’“”·"

text = "".join(sorted(set("".join(used) + name_syllables + latin + digits + punct)))

txt_path = os.path.join(os.path.dirname(__file__), "_subset.txt")
io.open(txt_path, "w", encoding="utf-8").write(text)

cmd = [
    sys.executable, "-m", "fontTools.subset", SRC,
    "--text-file=" + txt_path,
    "--output-file=" + OUT,
    "--flavor=woff2",
    "--layout-features=*",
    "--no-hinting",
]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("ERR:", r.stderr[-600:])
    sys.exit(1)
os.remove(txt_path)

print("포함 문자 수:", len(text), "(앱 한글", len(used), "+ 이름 음절", len(set(name_syllables)), ")")
print("서브셋:", f"{os.path.getsize(OUT):,}", "bytes")
