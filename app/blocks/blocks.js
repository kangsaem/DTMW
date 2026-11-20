/* 요소 탭 블록 — [id, 이름, 분류, 아이콘 SVG, 내용(HTML 문자열 · 함수 · 컴포넌트 객체)] */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT;
  const IC = {
    h: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5v14M19 5v14M5 12h14"/></svg>',
    p: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    q: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 7h4v4H8c0 3 1 4 3 5M14 7h4v4h-3c0 3 1 4 3 5"/></svg>',
    img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>',
    vid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M10 9l5 3-5 3z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="7" height="7"/><rect x="14" y="4" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="6" width="16" height="12"/></svg>',
    circ: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/></svg>',
    line: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12h18"/></svg>',
    gap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/></svg>',
    btn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="8" rx="1"/></svg>',
    pop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="14" height="14" rx="1"/><path d="M9 12h6M12 9v6"/></svg>',
    sec: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="6"/><rect x="3" y="13" width="18" height="7"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>'
  };
  const ICONS = {
    arrow: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    mail: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/></svg>',
    play: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/></svg>',
    plus: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></svg>'
  };
  const BLOCKS = [
    ['b-title', '큰 제목', '텍스트', IC.h, '<h1 class="title">제목을 입력하세요</h1>'],
    ['b-h2', '소제목', '텍스트', IC.h, '<h2 class="h2">소제목</h2>'],
    ['b-p', '본문', '텍스트', IC.p, '<p class="body-p">본문을 입력하세요. 두 번 눌러 바로 고칠 수 있습니다.</p>'],
    ['b-cap', '캡션', '텍스트', IC.p, '<p class="cap">[작품명], 2026 · [재료], [크기]</p>'],
    ['b-quote', '인용', '텍스트', IC.q, '<blockquote class="ed-q">“[인용문]”</blockquote>'],
    ['b-img', '이미지', '미디어', IC.img, () => '<img src="' + ph('이미지', 1200, 800, 0) + '" alt="">'],
    ['b-video', '영상', '미디어', IC.vid, { type: 'video', src: '', autoplay: true, loop: true, muted: true, controls: false, style: { width: '100%', 'aspect-ratio': '16/9' } }],
    ['b-work', '작품 카드', '미디어', IC.img, () => fig(0, 2026, { hover: 'zoom' })],
    ['b-gal', '갤러리 3열', '미디어', IC.grid, () => '<div class="grid g3">' + fig(0, 2026, { hover: 'zoom' }) + fig(1, 2026, { hover: 'zoom' }) + fig(2, 2026, { hover: 'zoom' }) + '</div>'],
    ['b-rect', '사각형', '도형 · 장식', IC.rect, '<div class="shape"></div>'],
    ['b-circ', '원', '도형 · 장식', IC.circ, '<div class="shape circle"></div>'],
    ['b-rule', '구분선', '도형 · 장식', IC.line, '<hr class="rule">'],
    ['b-gap', '여백', '도형 · 장식', IC.gap, '<div class="spacer"></div>'],
    ['b-i1', '화살표', '아이콘', IC.star, ICONS.arrow],
    ['b-i2', '메일', '아이콘', IC.star, ICONS.mail],
    ['b-i3', '재생', '아이콘', IC.star, ICONS.play],
    ['b-i4', '더하기', '아이콘', IC.star, ICONS.plus],
    ['b-btn', '버튼', '버튼 · 팝업', IC.btn, '<a class="btn" href="#">버튼</a>'],
    ['b-btn2', '선 버튼', '버튼 · 팝업', IC.btn, '<a class="btn-line" href="#">선 버튼</a>'],
    ['b-pop', '팝업 버튼', '버튼 · 팝업', IC.pop, '<button class="btn-line" type="button" data-click="modal" data-title="제목" data-text="팝업 내용을 입력하세요.">자세히 보기</button>'],
    ['s-nav', '상단 메뉴', '섹션', IC.sec, () => nav()],
    ['s-hero', '영상 히어로', '섹션', IC.sec, () => KZ.layouts.t1.html().split('</section>')[0] + '</section>'],
    ['s-works', '작품 그리드', '섹션', IC.sec, () => '<section class="wrap"><div class="row-head"><h2 class="h2">Works</h2><a class="more" href="#works">전체 →</a></div><div class="grid g3">' + fig(0, 2026, { hover: 'zoom' }) + fig(1, 2025, { hover: 'zoom' }) + fig(2, 2024, { hover: 'zoom' }) + '</div></section>'],
    ['s-ex', '전시 목록', '섹션', IC.sec, () => '<section class="wrap"><h2 class="h2" style="margin-bottom:20px">Exhibitions</h2><div>' + exRow('개인전') + exRow('단체전') + '</div></section>'],
    ['s-text', '글 단락', '섹션', IC.sec, '<section class="wrap"><h2 class="h2" style="margin-bottom:18px">소제목</h2><p class="body-p">본문을 입력하세요.</p></section>'],
    ['s-contact', '연락처', '섹션', IC.sec, '<section class="wrap"><h2 class="h2" style="margin-bottom:18px">Contact</h2><p class="body-p">[이메일]<br>[갤러리 · 연락처]</p><a class="btn" href="#" data-click="modal" data-title="Contact" data-text="[이메일]">문의하기</a></section>'],
    ['s-foot', '바닥글', '섹션', IC.sec, FOOT]
  ];
  KZ.BLOCKS = BLOCKS;
})(window.KZ);
