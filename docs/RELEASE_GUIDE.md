# 새 버전 내는 법(Claude Code 없이) — WMW 편집기

DTMC 와 같은 규칙입니다.

## 한 번에: zip 하나 올리기
1. Claude 채팅에서 고친 파일을 **zip 하나**로 받습니다(저장소와 같은 폴더 구조). 배포하려면 `app/version.js` 의 버전도 올려 달라고 하기.
2. GitHub 저장소(DTMW) → `update` 폴더 → **Add file → Upload files** → zip 을 끌어다 놓기 → **Commit changes**.
3. 끝. Actions 가 알아서:
   - zip 을 풀어 제자리에 넣고(`_delete.txt` 에 적힌 파일은 지움), `index.html` 의 캐시 번호(`?v=`)를 버전에 맞추고, zip 은 지운 뒤 커밋,
   - 같은 실행 안에서 자동 점검(편집기를 실제로 띄워 90여 가지 확인),
   - **버전이 지금 배포된 것(GitHub Pages 설정의 주소 — 지금 wmw.scubob.com — 의 version.js)보다 높으면** 사이트에 배포하고 태그 `v<버전>` 을 붙임.
   - 버전이 그대로면 점검만(사이트는 그대로).
4. 확인: 저장소 → **Actions** → 맨 위 '점검 · 배포'. 초록 ✓ = 끝. 빨강 ✗ = 실패(배포 안 됨 — GitHub 가 메일로도 알림).

## zip 규칙
- zip 안 = 저장소와 같은 폴더 구조(`app/…`, `tests/…`, `docs/…`). 맨 위가 폴더 하나로 싸여 있어도 됨(껍데기는 벗김).
- 지울 파일 = zip 맨 위 `_delete.txt` 에 한 줄씩(예: `app/editor/old.js`).
- 거부(아무것도 안 바뀜): 저장소 밖 경로(`..` · 절대 경로) · `.github/`(워크플로) · `.git/` · `update/`.
- 워크플로(`.github/workflows/check.yml`)를 고쳐야 하면 GitHub 웹에서 그 파일을 열어 직접 고침(드묾).
- 버전은 `app/version.js` 한 곳에만. `index.html` 의 `?v=` 는 Actions 가 맞춤.

## 실패했을 때
- Actions → 실패한 실행 → 빨간 단계를 열면 까닭이 보입니다.
  - 'zip 풀기' 단계 = zip 안에 막힌 경로(요약 화면에 목록).
  - '자동 점검' 단계 = 점검 실패 → 그 글(또는 실행 화면의 playwright-report 파일)을 Claude 에 붙여 넣고 고친 zip 을 다시 받기.
- 같은 버전으로 다시 배포하고 싶으면: Actions → 점검 · 배포 → **Run workflow** → 'deploy' 체크.
