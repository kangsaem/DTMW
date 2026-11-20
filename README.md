# SITE — 웹사이트 편집기

**site.kangyonz.com** 에서 누구나 쓰는 무료 웹사이트 편집기입니다.
Canva처럼 템플릿을 고르고 화면에서 바로 고친 뒤, 완성된 **순수 HTML**을 내려받아 원하는 곳에 올립니다.
서버 · 회원 · 데이터베이스가 없습니다. 작업은 각자 브라우저와 작업 파일(.json)에 저장됩니다.

- 계획서: <https://claude.ai/artifact/GZGMQhi5QK8s6AFJ1VHxVE>
- 현재 상태와 다음 할 일: [HANDOFF.md](HANDOFF.md)
- 변경 내역: [CHANGELOG.md](CHANGELOG.md)

## 폴더 구조

```
app/                  ← 공개되는 편집기 (Cloudflare Pages 출력 폴더)
├─ index.html         편집기 화면 뼈대 + 스크립트 순서
├─ version.js         편집기 버전
├─ editor/            편집기 기능
│   ├─ config.js      테마 · 글꼴 · 효과 목록 · 스타일 패널 구성
│   ├─ ui.js          알림 · 대화상자 · 입력 컨트롤
│   ├─ storage.js     브라우저 저장 · 작업 파일 형식 · 버전 변환
│   ├─ export.js      완성 HTML 만들기 · 파일 받기
│   ├─ layout.js      패널 떼어내기 · 도구 숨기기 (화면 배치)
│   ├─ main.js        편집기 본체 (GrapesJS 초기화 · 패널 · 미리보기)
│   └─ editor.css     편집기 화면 스타일
├─ layouts/           레이아웃: 1종 = 파일 1개 (_helpers.js 공통 도구, _samples.js 샘플 이미지)
├─ sets/              사이트 세트: 1종 = 파일 1개
├─ blocks/            요소 탭 블록
├─ site/              완성 사이트에 들어가는 것
│   ├─ base.css       기본 디자인 · 반응형
│   ├─ motion.css     효과 CSS
│   └─ runtime.js     페이지 전환 · 등장 · 팝업 스크립트
└─ vendor/grapesjs/   GrapesJS 0.23.9 (BSD-3-Clause, 버전 고정)
tests/                자동 점검 (Playwright)
.github/workflows/    GitHub Actions — 올릴 때마다 자동 점검
```

빌드 과정이 없습니다. 파일을 고치면 그대로 반영됩니다.

## 자주 하는 일

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 레이아웃 추가 | `app/layouts/` 에 파일 추가 → `app/index.html` 에 `<script>` 한 줄 |
| 사이트 세트 추가 | `app/sets/` 에 파일 추가 → `app/index.html` 에 `<script>` 한 줄. 형식은 `app/sets/_sets.js` 맨 위 설명 참고 (pages · words · style) |
| 테마 · 글꼴 추가 | `app/editor/config.js` |
| 샘플 이미지 추가 | `app/layouts/_samples.js` 의 SCENES 에 그림 함수 추가 |
| 완성 사이트 디자인 | `app/site/base.css` |
| 효과 동작 | `app/site/runtime.js`, `app/site/motion.css` |
| 작업 파일 형식 변경 | `app/editor/storage.js` 의 `FORMAT` 을 올리고 `migrate()` 에 변환 추가 |
| 버전 올리기 | `app/version.js` + `package.json` + `CHANGELOG.md` |

## 내 컴퓨터에서 열기

```
python3 -m http.server 8080 --directory app
```
브라우저에서 <http://localhost:8080> 을 엽니다. (파일을 더블클릭해 열면 동작하지 않습니다.)

## 자동 점검

```
npm ci
npx playwright install chromium
npx playwright test
```
GitHub에 올리면 Actions가 같은 점검을 자동으로 실행합니다.

## 배포 (GitHub Pages)

`main` 에 올리면 GitHub Actions가 자동 점검을 통과한 경우에만 `app/` 폴더를 GitHub Pages에 배포합니다 (`.github/workflows/check.yml`).

| 설정 | 값 |
|---|---|
| Settings → Pages → Source | **GitHub Actions** |
| Settings → Pages → Custom domain | `site.kangyonz.com` (+ Enforce HTTPS) |
| 가비아 DNS | `site` CNAME → `kangsaem.github.io.` |

광고를 붙이거나 build · html · page · make 리디렉트가 필요해지면 Cloudflare Pages로 옮깁니다 (출력 폴더 `app`, 빌드 명령 없음). 이때는 가비아의 `site` 값만 `<프로젝트>.pages.dev` 로 바꾸면 됩니다.

## Claude가 직접 올릴 수 없을 때 업데이트하는 법

1. Claude가 저장소와 같은 폴더 구조의 ZIP을 줍니다.
2. 압축을 풀고 GitHub 저장소 웹 화면에 폴더째 끌어다 놓은 뒤 Commit 합니다.
3. 지워야 하는 파일이 있으면 Claude가 따로 알려 줍니다 (웹 업로드는 파일을 지우지 않음).

## 라이선스

- GrapesJS: BSD-3-Clause (`app/vendor/grapesjs/LICENSE`)
- 글꼴: Google Fonts (SIL Open Font License)
