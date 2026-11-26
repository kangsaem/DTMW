"""zip 하나로 고치기: 저장소 `update/` 에 올라온 zip 을 풀어 제자리에 넣음 — GitHub Actions 가 부름(사람이 직접 안 돌려도 됨).
DTMC(kangsaem/DTMC) 의 같은 이름 도구를 그대로 가져옴(v0.17.4).
- zip 안 = 저장소와 같은 폴더 구조(app/… · tests/… · docs/… 등). 맨 위에 폴더 하나로 싸여 있으면(예: SITE/app/…) 그 껍데기는 벗김.
- `_delete.txt`(zip 맨 위) = 지울 파일 목록(한 줄에 하나, 저장소 기준 경로).
- 막는 것: 저장소 밖(절대 경로 · '..') · `.git/` · `.github/`(워크플로 — GitHub 도 토큰으로 못 바꿈, 웹에서 직접) · `update/` 자체.
- 다 넣은 뒤 zip 은 지움. 결과는 표준 출력 + GITHUB_STEP_SUMMARY.
쓰는 법: python tools/apply_update.py [저장소 폴더]  → 바뀐 것이 없으면 '없음' 출력, 끝 코드 0 · 막힌 경로가 있으면 끝 코드 2(아무것도 안 바꿈)."""
from __future__ import annotations

import os
import sys
import zipfile
from pathlib import Path, PurePosixPath

BLOCK = (".git", ".github", "update")


def _clean(name: str) -> PurePosixPath | None:
    """zip 안 이름 → 저장소 기준 경로(막히면 None)."""
    n = name.replace("\\", "/").lstrip("/")
    p = PurePosixPath(n)
    if not n or n.endswith("/") or p.is_absolute() or ".." in p.parts or ":" in p.parts[0]:
        return None
    if p.parts[0] in BLOCK:
        return None
    return p


def _strip_root(names: list[str], repo: Path) -> int:
    """모두 같은 맨 위 폴더(저장소에 없는 이름)로 싸여 있으면 1(벗김), 아니면 0."""
    tops = {n.replace("\\", "/").lstrip("/").split("/", 1)[0] for n in names if n.strip("/")}
    if len(tops) == 1:
        top = next(iter(tops))
        if not (repo / top).exists() and all("/" in n.replace("\\", "/").lstrip("/") for n in names if not n.endswith("/")):
            return 1
    return 0


def apply(zip_path: Path, repo: Path) -> tuple[list[str], list[str], list[str]]:
    """→ (넣은 파일, 지운 파일, 막힌 이름). 막힌 이름이 하나라도 있으면 아무것도 안 바꿈."""
    written, deleted, blocked = [], [], []
    with zipfile.ZipFile(zip_path) as z:
        infos = [i for i in z.infolist() if not i.is_dir()]
        names = [i.filename for i in infos]
        cut = _strip_root(names, repo)
        plan = []
        dels = []
        for i in infos:
            parts = i.filename.replace("\\", "/").lstrip("/").split("/")[cut:]
            rel = "/".join(parts)
            if rel == "_delete.txt":
                for line in z.read(i).decode("utf-8-sig").splitlines():
                    line = line.split("#", 1)[0].strip()
                    if not line:
                        continue
                    p = _clean(line)
                    (dels.append(p) if p else blocked.append("지우기: " + line))
                continue
            if rel.startswith("__MACOSX/") or rel.endswith(".DS_Store"):
                continue
            p = _clean(rel)
            if p is None:
                blocked.append(i.filename)
                continue
            plan.append((p, i))
        if blocked:
            return [], [], blocked
        for p, i in plan:
            dst = repo / Path(*p.parts)
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(z.read(i))
            written.append(str(p))
        for p in dels:
            dst = repo / Path(*p.parts)
            if dst.is_file():
                dst.unlink()
                deleted.append(str(p))
    return written, deleted, blocked


def main() -> int:
    repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    zips = sorted((repo / "update").glob("*.zip"))
    if not zips:
        print("없음")
        return 0
    lines, rc = [], 0
    for zp in zips:
        w, d, b = apply(zp, repo)
        if b:
            rc = 2
            lines.append(f"### {zp.name} — 막힘(아무것도 안 바꿈)\n" + "\n".join(f"- {x}" for x in b))
            print(f"막힘 {zp.name}: {b}")
            continue
        zp.unlink()
        lines.append(f"### {zp.name}\n넣음 {len(w)}개 · 지움 {len(d)}개\n" + "\n".join(f"- {x}" for x in w) +
                     ("\n" + "\n".join(f"- (지움) {x}" for x in d) if d else ""))
        print(f"{zp.name}: 넣음 {len(w)} · 지움 {len(d)}")
        for x in w:
            print("  +", x)
        for x in d:
            print("  -", x)
    summ = os.environ.get("GITHUB_STEP_SUMMARY")
    if summ:
        with open(summ, "a", encoding="utf-8") as f:
            f.write("## zip 하나로 고치기\n" + "\n\n".join(lines) + "\n")
    return rc


if __name__ == "__main__":
    sys.exit(main())
