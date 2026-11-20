# HANDOFF — 지금 어디까지 왔나

> 새 대화에서 이어서 작업할 때 이 파일부터 읽습니다. 작업이 끝날 때마다 갱신합니다.

- 마지막 갱신: 2026-11-20
- 편집기 버전: 0.13.2
- 계획서: <https://claude.ai/artifact/GZGMQhi5QK8s6AFJ1VHxVE>
- 1차 시제품 (Claude 아티팩트, 참고용): <https://claude.ai/artifact/CCTDpWZBAeYR6UGeBCodmD>

## 확정된 결정

- 이름: **WMW — Web made in web (웹에서 웹을 만든다)** (상단 로고 · 브라우저 탭 제목). 저장소 이름은 SITE 그대로.

- 누구나 쓰는 **무료 공개 편집기**. 회원 · 서버 · DB 없음. 광고는 붙을 수 있음, 유료화 없음.
- 결과물은 **순수 HTML**. 기본은 직접 올리기(한 파일 + media 폴더), GitHub 자동 배포는 선택 기능(3차).
- 넣지 않는 기능: 문의 양식 접수 · 예약 · 로그인 · 댓글 · 결제 · 사이트 검색 · 방문자 통계. (예약 · 문의는 버튼을 네이버 예약 · 카카오톡 채널 · 구글 폼 · 전화로 연결)
- 사용자 올리기 안내는 **GitHub Pages 기준** (2026-11-20 결정 — Netlify는 무료 크레딧 한도 · 사이트 멈춤, Cloudflare Pages는 Workers 쪽으로 방향 전환 · 한국 속도 우려). 안내 페이지 `app/guide/`.
- 내보내기 형식: 올린 사진 · 영상 없으면 index.html 하나, 있으면 ZIP `index.html + media/` (B안 확정)
- 업종 제한 없음. 레이아웃(구조)과 업종 세트(내용 · 색 · 글꼴)를 분리해 조합.
- 편집기 주소: **site.kangyonz.com**. build · html · page · make 리디렉트는 보류 (GitHub Pages는 저장소당 주소 1개 — Cloudflare 이전 때 처리, 코드는 이미 들어 있음).
- 호스팅: GitHub `kangsaem/SITE` + **GitHub Pages** (Actions로 `app/` 배포). 광고 · 리디렉트가 필요해지면 Cloudflare Pages로 이전 (가비아 site 값만 변경).
- 도메인: 가비아 DNS. kangyonz.com 본체(다른 용도로 사용 중)와 kangizo.com(Canva + 가비아 포워딩)은 **건드리지 않음**.
- 참고 사이트: kangyonz.com/proto/v3 (앱 카드형), kangizo.com (작가 소개). **실제 사이트 내용으로 만든 세트는 넣지 않음** — 세트는 업종 무관 · 자리표시 문구만.

## 현재 상태

- [x] 1차 시제품: Canva식 화면, 레이아웃 14종, 효과(등장 7 · 마우스 5 · 팝업 5 · 패럴랙스 · 고정 · 전환 5), 모바일 따로 조정, 한 파일 내보내기
- [x] 0.2.0: 저장소 구조 정리, 레이아웃 이름 중립화, 작업 파일 버전 변환, 자동 점검(Playwright 6개), 주소 리디렉트
- [x] 0.3.0: 기본 문구 업종 무관화, 기본 세트 '기본 사이트', 세트별 내용 주입(pages 4번째 값), 실제 사이트 기반 세트 제거
- [x] 0.4.0: 사이트 세트 8종 (기본 · 포트폴리오 · 카페 · 클래스 · 행사 · 이력 · 매거진 · 서비스), 세트별 스타일, mask 효과 버그 수정
- [x] 0.5.0: 샘플 이미지 12종(직접 그린 SVG), 히어로 샘플 배경
- [x] 0.6.0: 편집 화면 A안(DTME 배색) · 패널 떼어내기 · 도구 숨기기(Tab), 페이지 트리 + 자동 메뉴, 페이지 선택 · 페이지 띠 · Alt+클릭 이동, 샘플 사이트 접기
- [x] 0.6.1~0.6.3: 이름 WMW, 패널 떼어낼 때 편집 화면/디자인 패널이 사라지던 문제 수정(떠 있는 창은 `.main > .floating{grid-column:auto}`), 파일 주소 `?v=버전`으로 캐시 문제 방지. 자동 점검 16개
- [x] 0.7.0: 섹션으로 추가 · 섹션 위로/아래로, 누르면 → 페이지 이동(`data-click="go" data-go`), 효과 표시(노란 점선, 편집 화면만), 작업 파일 미저장 표시
- [x] 0.8.0: 섹션 레이아웃 10종(요금 · 메뉴판 · FAQ · 팀 · 숫자 띠 · 일정 · 위치 · 연락처 · 후기 칸 · 배너), 세트 섹션 이어 붙이기, 세트 보강, 새 세트 3종(숙소 · 비영리 · 동네 가게). 자동 점검 24개
- [x] 0.9.0: 색 테마 12종(명암 대비 점검), 글꼴 10종(헬베티카풍 WMW Heros = TeX Gyre Heros 파생본, Pretendard 등), 내보낼 때 쓴 글꼴만. 자동 점검 26개
- [x] 0.9.1: 페이지 복제 시 스타일 사라짐 고침. 실제 배포 시험용 샘플 사이트 **site.kangyonz.com/demo/** (동네 가게 세트, noindex) — Chrome에서 페이지 이동 · 페이지 이동 효과 · FAQ · 팝업 · 글꼴 · 콘솔 오류 없음 확인. 자동 점검 27개
- [x] 0.10.0: ZIP 내보내기(index.html + media/), 내보내기 창(25MB · 연결 안 된 버튼 경고), GitHub 안내 페이지 /guide/, 링크 빠른 입력, 히어로 안내 문구 숨김, 영문 파일 이름. 자동 점검 32개
- [x] 0.11.0: 패널을 브라우저 창 밖으로(PiP · 팝업), 블록 누르기로 넣기. 자동 점검 35개
- [x] 0.12.0: 점검에서 찾은 문제 수정 — 작업 손실 방지(읽기 실패 백업 · 세트 적용 경고 · 두 탭 · 닫기 전 저장), 편집 중 Tab, 상단 줄 반응형, 좁은 편집 화면 알림, 언어 버튼 숨김, PC 사용 안내, 창 밖 패널 두 개 · 빈 창 버그, 로고 · 파비콘. 자동 점검 47개
- [x] 0.13.0: 배경 고정 효과(섹션 레이아웃 '배경 고정 창' · 효과 탭 '배경 고정' · 효과 충돌 처리 · 영상 보일 때만 재생), 창 밖 패널 다시 한 번에 하나, 짧은 로고. 자동 점검 50개
- [x] 0.13.1: 창 밖 패널 + 창 크기 변경 시 빈 칸 버그. 자동 점검 51개
- [x] 0.13.2: 닫을 때 저장 즉시 확정(commit), 점검 안정화
- [x] 가비아 DNS에 site CNAME 추가 (사용자 완료)
- [x] GitHub Actions 배포 설정 (점검 통과 시에만 배포)
- [x] GitHub Settings → Pages: Source = GitHub Actions, Custom domain = site.kangyonz.com (사용자 완료) → site.kangyonz.com 공개 중

## 다음 할 일

### C. 언어 · 내보내기 — **보류 (안 할 수도 있음, 2026-11-20)**. 당분간 버그 · 사용 편의 개선에 집중

(아래는 기록용 메모)

1. **다국어 자동 표시** — 기준은 DTMD(kangsaem/DTMD, scuba.kangyonz.com)와 같게.
   - 언어 9개: 한국어 · 영어 · 일본어 · 중국어 간체 · 중국어 번체(대만식) · 독일어 · 스페인어 · 프랑스어 · 이탈리아어. 사이트마다 쓸 언어를 고름 (처음엔 한국어만)
   - 고르는 순서: ① 주소 `#en` 등 ② 방문자가 고른 언어(localStorage) ③ 브라우저 언어 `navigator.languages` (zh-TW · HK · MO · Hant → 번체) ④ 없으면 **사이트 기본 언어** (DTMD는 영어 — 여기서는 기본 언어로 바꿈). 검색 로봇도 기본 언어
   - 언어 버튼: `[KR ▾]` 하나 → 목록. 일본어 · 중국어(간체 · 번체) 글꼴 자동
   - 범위(안): 만든 사이트만. 편집기 화면 번역은 나중에 따로
   - 입력(안): 편집 화면 위에서 언어를 바꿔 같은 화면에서 고쳐 씀. 번역 안 한 글은 기본 언어로 표시. 자동 번역 없음(서버 · 키 필요)
2. ~~내보내기 B: ZIP~~ → **0.10.0에서 완료** (아래는 기록용). 남은 일: 언어별 html 파일을 ZIP에 함께 넣기.
   - 현재: 사진은 WebP(가로 1920) data URI, 영상은 원본 data URI → 한 파일. 영상이면 약 1.33배 · 첫 화면 늦음 · IndexedDB 빨리 참
   - 할 일: 내보내기 창에 'ZIP' 추가, data URI → media/파일명, 영상 있으면 ZIP 추천. ZIP은 외부 라이브러리 없이 무압축(store)
   - 언어와 함께: 한 파일 = 모든 언어를 넣고 스크립트로 전환, ZIP = 언어별 html + hreflang(DTMD 방식, 검색 노출)
3. (그 뒤) 3차: GitHub 자동 배포 선택 기능

배경 고정 메모 (0.13.0): CSS `site/motion.css` `[data-scroll="bgfix"]` (clip-path:inset(0)) + 바로 아래 고정 층 `.bgfix-media · .hero-photo · .hero-video · .hero-bg · .band-img` 을 position:fixed. 레이아웃 `layouts/25-bgfix.js` (`.bgfix`, data-h 100/70/50, data-dim 0/18/35/55). 편집기 `main.js` applyBgfix · FIX_BAD_ANIM(페이드 외 등장 효과) · FIX_BAD_HOVER(떠오름). 영상 재생은 `runtime.js` IntersectionObserver. 한계: 페이지 전환 애니메이션 중 잠깐 흔들림, 바깥 요소(조상)에 transform 이 남는 효과가 있으면 고정이 풀림.

저장 메모 (0.12.0): `main.js` save/writeNow — 0.9초 모아 저장, beforeunload · 탭 숨김 때 바로 저장. 두 탭은 BroadcastChannel `wmw-editor` (claim 을 받은 탭은 passive = 저장 안 함). 저장본 읽기 실패 시 IndexedDB `backup-날짜` 에 보관. `setStatus(글, true)` 는 좁은 화면에서도 보이는 경고. 로고 · 파비콘은 `app/img/` (logo.svg 원본색, logo-light.svg 어두운 바탕용, favicon.svg = 가운데 자른 C안).

글꼴 메모 (0.9.0): 출처는 `C.FONT_SRC` (g: Google Fonts, css: 주소, local: app/fonts). `KZ.fontHead(text, {all, embed, base})` — 편집 화면은 all, 내보내기는 쓴 글꼴만 + local 글꼴은 data URI. 새 글꼴은 FONT_SRC 와 FONTS 두 곳에 추가.

창 밖 패널 메모 (0.11.0 · 0.13.0): `editor/popout.js`. 패널별 상태 `outs[name]` 이지만 **한 번에 하나만** (toggle 이 다른 패널을 먼저 되돌림 — 두 번째 창은 일반 팝업이라 창 머리가 달라서, 2026-11-20 결정). 닫힘 처리는 `back(name, win)` 으로 그 창만 (늦게 온 닫힘 신호가 새 패널을 되돌리던 빈 창 버그 방지). 패널 요소를 바깥 창 document 로 옮기고(이벤트 유지), 편집기 CSS 를 복사. `KZ.ui.docs` 에 바깥 document 를 등록해 `$ · $$` 가 함께 찾음 — 새 코드도 `document.querySelector` 대신 `$` 를 쓸 것. 시험은 `KZ.forcePopup = true` 로 팝업 경로. 한계: 고급 탭 색 고르기 창 등 GrapesJS 가 띄우는 작은 창은 편집기 쪽에 뜰 수 있음, 창 사이 끌어다 놓기는 보장 안 함.

화면 구조 메모 (0.8.0): 섹션 = 페이지 바로 아래 요소. 레이아웃 `section(d)` 가 있으면 그것, 없으면 `KZ.stripChrome(html)` 로 메뉴 · 바닥글을 뺀 본문. 세트 페이지 다섯째 값 `{ add: [...] }` 로 섹션을 바닥글 위에 이어 붙임.

화면 구조 메모 (0.6.0): 페이지 트리는 `S.tree[id] = {parent, order, menu}` (작업 파일에 저장). 자동 메뉴는 `syncMenus()` 가 `nav.links` 를 다시 씀 — 직접 고친 메뉴를 유지하려면 사이트 탭에서 자동 메뉴를 끔. 패널 상태는 localStorage `kz-ui-v1`.

## 작업 방식

- 큰 변경은 브랜치 → PR(자동 점검) → 로컬에서 화면 확인 → main 합치기 (main에 합치면 바로 배포됨).
- 올리기 전 `npx playwright test` 통과 확인. Actions가 같은 점검을 실행.
- 버전을 올리면 `app/version.js`, `package.json`, `CHANGELOG.md`, 그리고 `app/index.html` 의 `?v=` (브라우저 캐시 무효화) 함께 수정. 자동 점검이 `?v=` 와 버전이 같은지 확인함.
- 사용자 선호: 한국어, 간결 · 객관적, 근거와 한계를 함께. 구체 작업 전에는 선택지와 추천을 먼저 보여주고 "ㄱㄱ"면 진행. 화면은 단순하게.

## 알려진 한계

- 브라우저 저장만 있어 데이터 삭제 시 작업이 사라짐 → 작업 파일 저장 안내 강화 필요.
- 사진이 index.html 안에 들어가 파일이 커짐 → 내보내기 B에서 해결.
- 언어 버튼(KR · EN · JP)은 0.12.0부터 `base.css` 에서 숨김(`.nav .lang{display:none}`) → C-1에서 다시 보이게.
- 세트 적용은 되돌리기(Ctrl+Z)가 안 됨 (적용 창에서 작업 파일 받기로 대신).
- 휴대폰 편집은 지원하지 않음 (안내만).
- 섹션 레이아웃의 FAQ는 `<details>` 라 편집 화면에서 질문을 누르면 펼쳐지고 접힘 (글 고치기는 두 번 누르기).
- 지도는 링크만 (지도 삽입 없음 — 외부 의존 · 무게 때문).
