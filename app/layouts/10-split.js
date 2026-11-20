/* 레이아웃: 스플릿 (고정 글 + 스크롤 이미지) */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't6', name: '스플릿 (고정 글 + 스크롤 이미지)', cat: '상세',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 10, 40, 8, d) + r(8, 22, 36, 4) + r(8, 30, 30, 4) + r(60, 6, 52, 32) + r(60, 42, 52, 34); },
  html: () => nav() +
    '<section class="split"><div class="split-l"><p class="cap" style="margin:0">Series · 2026</p><h1 class="title" style="margin:0">[시리즈 제목]</h1><p class="body-p">[시리즈 소개 — 작업 배경과 의도를 2~4문장으로 적어 주세요.]</p><a class="btn-line" href="#works" style="align-self:flex-start">다른 시리즈 보기</a></div>' +
    '<div class="split-r">' + [0, 1, 2, 3].map(i => fig(i, 2026, { anim: 'fade-up', w: 1000, h: [1200, 800, 1100, 900][i] })).join('') + '</div></section>' + FOOT });
})(window.KZ);
