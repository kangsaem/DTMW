/* 레이아웃: 가로 스크롤 줄 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't7', name: '가로 스크롤 줄', cat: '목록·갤러리',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 50, 7, d) + [0, 1, 2].map(i => r(8 + i * 46, 24, 42, 22) + r(8 + i * 46, 52, 42, 22)).join('') ; },
  html: () => nav() +
    '<section class="wrap" style="padding-bottom:24px"><h1 class="title" style="margin:0">연도별 보기</h1><p class="cap">옆으로 넘겨 보세요 →</p></section>' +
    [2026, 2025, 2024].map((y, k) => '<p class="hs-y" style="padding:0 5vw">' + y + '</p><div class="hs">' + [0, 1, 2, 3].map(i => '<figure class="hs-card work" data-hover="zoom" data-click="lightbox" data-title="[항목 이름], ' + y + '"><div class="imgbox"><img src="' + ph('이미지', 1000, 720, i + k) + '" alt="[이미지 설명]"></div><figcaption class="cap">[항목 이름], ' + y + '</figcaption></figure>').join('') + '</div>').join('') +
    '<div class="spacer"></div>' + FOOT });
})(window.KZ);
