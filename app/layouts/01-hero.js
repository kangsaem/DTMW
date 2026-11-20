/* 레이아웃: 풀스크린 히어로 (영상·사진) */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't1', name: '풀스크린 히어로 (영상·사진)', cat: '첫 화면',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(0, 0, 120, 52, k) + r(8, 36, 40, 6, '#eee') + r(8, 45, 28, 3, '#bbb') + [0, 1, 2].map(i => r(8 + i * 36, 58, 32, 20)).join(''); },
  html: () =>
    '<section class="hero" data-bgvideo="1"><div class="hero-bg"></div><div class="hero-shade"></div>' + nav(true) +
    '<p class="hero-note">배경 영상 자리 — 이 영역을 선택하고 업로드 탭에서 영상을 고르세요</p>' +
    '<div class="hero-txt"><h1 class="hero-name" data-anim="fade-up">[작가명]</h1><a class="hero-now" href="#exhibitions" data-anim="fade-up">현재 전시 — [전시명] · [장소] · [기간] →</a></div></section>' +
    '<section class="wrap"><div class="row-head"><h2 class="h2">Selected Works</h2><a class="more" href="#works">전체 작품 →</a></div>' +
    '<div class="grid g3">' + fig(0, 2026, { hover: 'zoom' }) + fig(1, 2025, { hover: 'zoom' }) + fig(2, 2024, { hover: 'zoom' }) + '</div></section>' +
    '<section class="wrap"><div class="row-head"><h2 class="h2">Exhibitions</h2><a class="more" href="#exhibitions">전체 이력 →</a></div><div>' + exRow('개인전') + exRow('단체전') + exRow('개인전') + '</div></section>' + FOOT });
})(window.KZ);
