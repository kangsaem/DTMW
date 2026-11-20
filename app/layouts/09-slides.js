/* 레이아웃: 풀스크린 슬라이드 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't4', name: '풀스크린 슬라이드', cat: '상세',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(24, 8, 72, 56) + r(8, 70, 40, 5, d) + r(96, 70, 16, 5, d); },
  html: () => nav() +
    [1, 2, 3].map(n => '<section class="slide"><div class="slide-img" data-anim="zoom-in"><img src="' + ph('이미지 ' + n, 1200, 900, n) + '" alt="[작품명]"></div>' +
      '<div class="slide-cap"><div><b>[작품명], 2026</b><br>[재료] · [크기]</div><button class="btn-line" type="button" data-click="panel" data-title="[작품명], 2026" data-text="[재료] · [크기]&#10;&#10;작품 설명 · 작가노트를 입력하세요.">작품 설명</button><span class="count">0' + n + ' / 03</span></div></section>').join('') + FOOT });
})(window.KZ);
