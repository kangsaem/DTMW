"""캐시 번호 맞추기: app/index.html 의 `?v=…` 를 app/version.js 의 KZ.VERSION 으로 바꿈.
버전은 version.js 한 곳에만 적고, 이 도구가 나머지를 맞춥니다 — GitHub Actions 가 부름(풀기 · 배포 때).
쓰는 법: python tools/stamp_version.py [저장소 폴더] → 바꾼 곳 수 출력. version.js 에서 버전을 못 읽으면 끝 코드 1."""
from __future__ import annotations

import re
import sys
from pathlib import Path


def stamp(repo: Path) -> tuple[str, int]:
    m = re.search(r"KZ\.VERSION\s*=\s*'([0-9][0-9.]*)'", (repo / "app/version.js").read_text(encoding="utf-8"))
    if not m:
        raise SystemExit("app/version.js 에서 KZ.VERSION 을 못 읽음")
    ver = m.group(1)
    idx = repo / "app/index.html"
    s = idx.read_text(encoding="utf-8")
    out, n = re.subn(r"\?v=[0-9][0-9.]*", "?v=" + ver, s)
    changed = sum(1 for a, b in zip(re.findall(r"\?v=[0-9][0-9.]*", s), re.findall(r"\?v=[0-9][0-9.]*", out)) if a != b)
    if out != s:
        idx.write_text(out, encoding="utf-8")
    return ver, changed


if __name__ == "__main__":
    v, n = stamp(Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve())
    print(f"버전 {v} · 캐시 번호 {n}곳 바꿈")
