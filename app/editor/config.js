/* 편집기 설정값 — 테마 · 글꼴 · 효과 목록 · 스타일 패널 구성
   새 테마나 글꼴을 추가할 때는 이 파일만 고치면 됩니다. */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var C = {};
  C.FONT_LINK = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@400;600&family=Gowun+Batang&family=Nanum+Myeongjo&display=swap';
  C.THEMES = {
    white: { name: '갤러리 화이트', bg: '#F4F2EE', ink: '#1A1A1A', sub: '#5E5E5E', line: '#D2CFC8', accent: '#1A1A1A' },
    dark: { name: '갤러리 다크', bg: '#141414', ink: '#F1EFEA', sub: '#A7A39B', line: '#34322E', accent: '#F1EFEA' },
    paper: { name: '종이', bg: '#EDE6D9', ink: '#2A251E', sub: '#6B6255', line: '#CFC4B1', accent: '#7A3B1E' },
    concrete: { name: '콘크리트', bg: '#DCDDDB', ink: '#151515', sub: '#4E504D', line: '#B9BBB7', accent: '#151515' }
  };
  C.COLOR_KEYS = [['bg', '배경'], ['ink', '글자'], ['sub', '보조 글자'], ['line', '선'], ['accent', '강조 (버튼)']];
  C.FONTS = {
    serif: { name: '명조 제목 + 고딕 본문', h: "'Noto Serif KR',serif", b: "'Noto Sans KR',sans-serif" },
    sans: { name: '고딕 (Noto Sans KR)', h: "'Noto Sans KR',sans-serif", b: "'Noto Sans KR',sans-serif" },
    gowun: { name: '고운바탕 (부드러운 명조)', h: "'Gowun Batang',serif", b: "'Gowun Batang',serif" },
    nanum: { name: '나눔명조 + 고딕', h: "'Nanum Myeongjo',serif", b: "'Noto Sans KR',sans-serif" },
    inter: { name: 'Inter + 고딕 (모던)', h: "Inter,'Noto Sans KR',sans-serif", b: "Inter,'Noto Sans KR',sans-serif" }
  };
  C.TRANS = [['none', '없음'], ['fade', '페이드'], ['slide', '슬라이드'], ['curtain', '커튼'], ['blur', '블러'], ['zoom', '확대']];
  C.SPEED = { slow: 900, normal: 600, fast: 350 };
  C.ANIMS = [['', '없음'], ['fade-up', '떠오르기'], ['fade', '페이드'], ['zoom-in', '확대 등장'], ['slide-left', '오른쪽에서'], ['slide-right', '왼쪽에서'], ['blur-in', '흐림 해제'], ['mask', '가림막 열림']];
  C.HOVERS = [['', '없음'], ['zoom', '이미지 확대'], ['gray', '흑백→컬러'], ['caption', '캡션 올라옴'], ['lift', '떠오름'], ['cursor', '커서 미리보기']];
  C.SCROLLS = [['', '없음'], ['parallax', '패럴랙스'], ['sticky', '화면 고정']];
  C.CLICKS = [['', '없음'], ['lightbox', '라이트박스'], ['panel', '측면 패널'], ['sheet', '하단 시트'], ['modal', '중앙 모달'], ['menu', '전체화면 메뉴']];
  C.ENTER_KF = {
    'fade-up': [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    'zoom-in': [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }],
    'slide-left': [{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'none' }],
    'slide-right': [{ opacity: 0, transform: 'translateX(-60px)' }, { opacity: 1, transform: 'none' }],
    'blur-in': [{ opacity: 0, filter: 'blur(14px)' }, { opacity: 1, filter: 'blur(0px)' }],
    mask: [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }]
  };
  C.DEFAULT_SET = 'kangizo';
  C.DEFAULT_S = function () {
    return { siteName: 'kangizo', theme: 'white', colors: Object.assign({}, C.THEMES.white), font: 'serif', transition: 'fade', speed: 'normal', assets: [] };
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
  C.ISSUES_URL = 'https://github.com/kangsaem/SITE/issues/new';
  KZ.C = C;

  KZ.themeCss = function (S) {
    var c = S.colors, f = C.FONTS[S.font] || C.FONTS.serif;
    return ':root{--bg:' + c.bg + ';--ink:' + c.ink + ';--sub:' + c.sub + ';--line:' + c.line + ';--accent:' + c.accent + ';--fh:' + f.h + ';--fb:' + f.b + ';--d:' + C.SPEED[S.speed] + 'ms}';
  };
})(window.KZ);
