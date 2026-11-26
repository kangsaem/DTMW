/* 편집기 설정값 — 테마 · 글꼴 · 효과 목록 · 스타일 패널 구성
   새 테마나 글꼴을 추가할 때는 이 파일만 고치면 됩니다. */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var C = {};
  // 글꼴 출처 — 이름: 'g:Google Fonts 값' | 'css:주소' | 'local:파일 이름 앞부분 (app/fonts/)'
  // 내보낸 사이트에는 실제로 쓴 글꼴만 넣습니다 (KZ.fontHead). 편집 화면은 모두 불러옵니다 (CSS만, 글꼴 파일은 쓸 때 받음).
  C.FONT_SRC = {
    'Noto Sans KR': 'g:Noto+Sans+KR:wght@300;400;500;700',
    'Noto Serif KR': 'g:Noto+Serif+KR:wght@400;600',
    'Gowun Batang': 'g:Gowun+Batang:wght@400;700',
    'Gowun Dodum': 'g:Gowun+Dodum',
    'Nanum Myeongjo': 'g:Nanum+Myeongjo:wght@400;700',
    'Inter': 'g:Inter:wght@400;500;600',
    'IBM Plex Sans KR': 'g:IBM+Plex+Sans+KR:wght@300;400;500;600',
    'Playfair Display': 'g:Playfair+Display:wght@400;600',
    'Figtree': 'g:Figtree:wght@400;800',
    'Poppins': 'g:Poppins:wght@400;500',
    'Pretendard Variable': 'css:https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
    'WMW Heros': 'local:wmw-heros' // 헬베티카풍 — TeX Gyre Heros 파생본 (app/fonts/README.md)
  };
  C.THEMES = {
    white: { name: '갤러리 화이트', bg: '#F4F2EE', ink: '#1A1A1A', sub: '#5E5E5E', line: '#D2CFC8', accent: '#1A1A1A' },
    dark: { name: '갤러리 다크', bg: '#141414', ink: '#F1EFEA', sub: '#A7A39B', line: '#34322E', accent: '#F1EFEA' },
    paper: { name: '종이', bg: '#EDE6D9', ink: '#2A251E', sub: '#6B6255', line: '#CFC4B1', accent: '#7A3B1E' },
    concrete: { name: '콘크리트', bg: '#DCDDDB', ink: '#151515', sub: '#4E504D', line: '#B9BBB7', accent: '#151515' },
    // 0.9.0 — 글자 · 버튼 명암 대비 4.5:1 이상 (자동 점검)
    navy: { name: '네이비', bg: '#F3F4F6', ink: '#14213D', sub: '#55607A', line: '#D3D7E0', accent: '#1F3A8A' },
    sage: { name: '세이지', bg: '#E9EDE6', ink: '#1F2A22', sub: '#56625A', line: '#C9D1C5', accent: '#3F5E44' },
    terracotta: { name: '테라코타', bg: '#F3E9E1', ink: '#2B1D16', sub: '#6E5A4E', line: '#DCCBBD', accent: '#A3462A' },
    butter: { name: '크림 버터', bg: '#FBF5E6', ink: '#2A2620', sub: '#6A6152', line: '#E6DCC3', accent: '#8A5A00' },
    lavender: { name: '라벤더', bg: '#F1EEF6', ink: '#231F2E', sub: '#625B72', line: '#D8D2E4', accent: '#5D4E8C' },
    inkgold: { name: '먹 · 금', bg: '#111111', ink: '#EDE8DC', sub: '#A8A293', line: '#2E2C28', accent: '#C8A55A' },
    lime: { name: '블랙 · 라임', bg: '#0E0E0E', ink: '#F2F2F2', sub: '#A3A3A3', line: '#2B2B2B', accent: '#C6F432' },
    exhibit: { name: '전시 회색', bg: '#EBEBEB', ink: '#1A1A1A', sub: '#535353', line: '#D2D2D2', accent: '#1A1A1A' },
    blueprint: { name: '블루프린트', bg: '#EAF1FB', ink: '#0B2545', sub: '#4A5D78', line: '#C8D6EA', accent: '#1D4ED8' }
  };
  C.COLOR_KEYS = [['bg', '배경'], ['ink', '글자'], ['sub', '보조 글자'], ['line', '선'], ['accent', '강조 (버튼)']];
  C.FONTS = {
    serif: { name: '명조 제목 + 고딕 본문', h: "'Noto Serif KR',serif", b: "'Noto Sans KR',sans-serif" },
    sans: { name: '고딕 (Noto Sans KR)', h: "'Noto Sans KR',sans-serif", b: "'Noto Sans KR',sans-serif" },
    gowun: { name: '고운바탕 (부드러운 명조)', h: "'Gowun Batang',serif", b: "'Gowun Batang',serif" },
    nanum: { name: '나눔명조 + 고딕', h: "'Nanum Myeongjo',serif", b: "'Noto Sans KR',sans-serif" },
    inter: { name: 'Inter + 고딕 (모던)', h: "Inter,'Noto Sans KR',sans-serif", b: "Inter,'Noto Sans KR',sans-serif" },
    heros: { name: '헬베티카풍 + Pretendard', h: "'WMW Heros','Pretendard Variable',sans-serif", b: "'WMW Heros','Pretendard Variable',sans-serif" },
    pretendard: { name: 'Pretendard (요즘 고딕)', h: "'Pretendard Variable',sans-serif", b: "'Pretendard Variable',sans-serif" },
    dodum: { name: '고운돋움 (부드러운 고딕)', h: "'Gowun Dodum',sans-serif", b: "'Gowun Dodum',sans-serif" },
    plex: { name: 'IBM Plex Sans KR (기술 · 서비스)', h: "'IBM Plex Sans KR',sans-serif", b: "'IBM Plex Sans KR',sans-serif" },
    exhibit: { name: 'Figtree + 가는 고딕 (전시)', h: "Figtree,'Noto Sans KR',sans-serif", b: "'Noto Sans KR',sans-serif", x: "Poppins,'Noto Sans KR',sans-serif" },
    playfair: { name: 'Playfair Display + 명조 (잡지)', h: "'Playfair Display','Noto Serif KR',serif", b: "'Noto Sans KR',sans-serif" }
  };
  C.TRANS = [['none', '없음'], ['fade', '페이드'], ['slide', '슬라이드'], ['curtain', '커튼'], ['blur', '블러'], ['zoom', '확대']];
  C.SPEED = { slow: 900, normal: 600, fast: 350 };
  C.ANIMS = [['', '없음'], ['fade-up', '떠오르기'], ['fade', '페이드'], ['zoom-in', '확대 등장'], ['slide-left', '오른쪽에서'], ['slide-right', '왼쪽에서'], ['blur-in', '흐림 해제'], ['mask', '가림막 열림']];
  C.HOVERS = [['', '없음'], ['zoom', '이미지 확대'], ['gray', '흑백→컬러'], ['caption', '캡션 올라옴'], ['lift', '떠오름'], ['cursor', '커서 미리보기']];
  C.SCROLLS = [['', '없음'], ['parallax', '패럴랙스'], ['sticky', '화면 고정'], ['bgfix', '배경 고정']];
  C.CLICKS = [['', '없음'], ['lightbox', '라이트박스'], ['panel', '측면 패널'], ['sheet', '하단 시트'], ['modal', '중앙 모달'], ['menu', '전체화면 메뉴'], ['go', '페이지 이동']];
  C.ENTER_KF = {
    'fade-up': [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    'zoom-in': [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }],
    'slide-left': [{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'none' }],
    'slide-right': [{ opacity: 0, transform: 'translateX(-60px)' }, { opacity: 1, transform: 'none' }],
    'blur-in': [{ opacity: 0, filter: 'blur(14px)' }, { opacity: 1, filter: 'blur(0px)' }],
    mask: [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }]
  };
  C.DEFAULT_SET = 'basic';
  C.DEFAULT_S = function () {
    return { siteName: '내 사이트', theme: 'white', colors: Object.assign({}, C.THEMES.white), font: 'serif', transition: 'fade', speed: 'normal', assets: [] };
  };
  C.SECTORS = [
    { name: '배치 · 크기', open: false, properties: ['display', 'position', 'top', 'right', 'left', 'bottom', 'width', 'height', 'max-width', 'min-height', 'margin', 'padding', 'z-index'] },
    { name: '플렉스 정렬', open: false, properties: ['flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'flex-basis', 'flex-grow', 'order'] },
    { name: '글자', open: false, properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow'] },
    { name: '배경 · 테두리', open: false, properties: ['background-color', 'background', 'border-radius', 'border', 'box-shadow', 'opacity'] },
    { name: '변형 · 전환', open: false, properties: ['transform', 'transition', 'cursor', 'overflow'] }
  ];
  C.DEVICES = [
    { id: 'desktop', name: 'PC', width: '' },
    { id: 'tablet', name: '태블릿', width: '820px', widthMedia: '992px' },
    { id: 'mobile', name: '모바일', width: '390px', widthMedia: '640px' }
  ];
  C.ISSUES_URL = 'https://github.com/kangsaem/DTMW/issues/new';
  KZ.C = C;

  // 편집기 조각 등록: editor/*.js 가 KZ.part(function (X) {...}) 로 자기를 등록하고, main.js 가 순서대로 실행
  KZ.parts = [];
  KZ.part = function (fn) { KZ.parts.push(fn); };

  // 글꼴 불러오기 HTML: text 안에 이름이 나온 글꼴만 (all=true 면 모두). embed=true 면 local 글꼴을 data URI 로 넣음
  KZ.fontHead = function (text, o) {
    o = o || {};
    var names = Object.keys(C.FONT_SRC).filter(function (n) { return o.all || String(text || '').indexOf(n) >= 0; });
    var g = [], out = [];
    names.forEach(function (n) {
      var v = C.FONT_SRC[n], k = v.slice(0, v.indexOf(':')), x = v.slice(v.indexOf(':') + 1);
      if (k === 'g') g.push('family=' + x);
      else if (k === 'css') out.push('<link rel="stylesheet" href="' + x + '">');
      else if (k === 'local') {
        var src = function (w) {
          var data = o.embed && KZ.site && KZ.site.fonts && KZ.site.fonts[x + '-' + w];
          return data ? 'url(data:font/woff2;base64,' + data + ') format("woff2")' : 'url("' + (o.base || '') + 'fonts/' + x + '-' + w + '.woff2") format("woff2")';
        };
        out.push('<style>@font-face{font-family:\'' + n + '\';src:' + src('regular') + ';font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:\'' + n + '\';src:' + src('bold') + ';font-weight:700;font-style:normal;font-display:swap}</style>');
      }
    });
    if (g.length) out.unshift('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + g.join('&amp;') + '&amp;display=swap">');
    return out.join('\n');
  };

  KZ.themeCss = function (S) {
    var c = S.colors, f = C.FONTS[S.font] || C.FONTS.serif;
    return ':root{--bg:' + c.bg + ';--ink:' + c.ink + ';--sub:' + c.sub + ';--line:' + c.line + ';--accent:' + c.accent + ';--fh:' + f.h + ';--fb:' + f.b + ';--fx:' + (f.x || f.b) + ';--d:' + C.SPEED[S.speed] + 'ms}';
  };
})(window.KZ);
