"""
Pretendard 를 앱에 넣을 크기로 줄인다.

원본: Pretendard 1.3.9 배포판의 web/variable/woff2/PretendardVariable.woff2
      https://github.com/orioncactus/pretendard/releases

두 가지를 줄인다.
1) 굵기 축을 45~930 에서 400~700 으로 좁힌다. 앱이 쓰는 굵기는
   400/500/600/700 네 가지뿐이라 나머지 구간의 보간 정보는 쓸 일이 없다.
2) 글자를 앱에 나올 수 있는 범위로 줄인다. 한자·가나·키릴을 뺀다.

한글은 완성형 11,172자를 통째로 남긴다. 배포사가 함께 주는 2,350자 서브셋은
자주 쓰는 글자만 담고 있어서 '똠' '쀼' 같은 음절이 든 이름이 폴백으로 떨어진다.
그러면 한 화면 안에서 글꼴이 섞인다.

    python scripts/build-pretendard.py <원본.woff2>

두 앱의 src/app/fonts/pretendard.woff2 를 덮어쓴다.
"""

import os
import shutil
import subprocess
import sys
import tempfile

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [
    os.path.join(ROOT, "apps", app, "src", "app", "fonts", "pretendard.woff2")
    for app in ("main", "recruit")
]

# 앱에 나올 수 있는 글자만.
UNICODES = ",".join([
    "U+0020-007E",      # 기본 라틴
    "U+00A0-00FF",      # · × ± ° ©
    "U+0100-017F",      # 라틴 확장 A
    "U+0300-036F",      # 결합 부호
    "U+2010-205E",      # – — … ' ' " " •
    "U+20A9", "U+20AC", # ₩ €
    "U+2190-21FF",      # ← ↑ → ↓ ↗
    "U+2200-22FF",      # ∼ ≈ ≤ ≥
    "U+2300-23FF",      # ⌘ ⏰
    "U+2460-24FF",      # ① ② ③
    "U+25A0-25FF",      # ● ○ ■ ▲ ▼
    "U+2600-26FF",      # ★ ☆ ☎
    "U+2700-27BF",      # ✓ ✔ ✗
    "U+3000-303F",      # 。 、 「 」 ~
    "U+3131-318E",      # ㄱ ㄴ ㅇㅋ (호환 자모)
    "U+AC00-D7A3",      # 한글 완성형 전체
    "U+FF01-FF60",      # ＋ ！ ？ (전각)
])

WEIGHT_MIN, WEIGHT_MAX = 400, 700


def main(src: str) -> None:
    before = os.path.getsize(src)

    with tempfile.TemporaryDirectory() as tmp:
        # 1) 굵기 축 좁히기 — woff2 로는 못 다루니 ttf 로 한 번 내린다
        narrowed = os.path.join(tmp, "narrowed.ttf")
        font = TTFont(src)
        instancer.instantiateVariableFont(
            font, {"wght": (WEIGHT_MIN, WEIGHT_MAX)}, updateFontNames=False
        ).save(narrowed)

        # 2) 글자 줄이고 woff2 로 되돌리기
        out = os.path.join(tmp, "pretendard.woff2")
        subprocess.run([
            sys.executable, "-m", "fontTools.subset", narrowed,
            f"--unicodes={UNICODES}",
            "--layout-features=*",   # 커닝·합자는 남긴다
            "--flavor=woff2",
            "--no-hinting",
            "--desubroutinize",
            f"--output-file={out}",
        ], check=True)

        after = os.path.getsize(out)
        for dst in TARGETS:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copyfile(out, dst)
            print("→", os.path.relpath(dst, ROOT))

    print(f"{before / 1024:.0f} KB → {after / 1024:.0f} KB "
          f"({100 - after * 100 // before}% 감소)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
