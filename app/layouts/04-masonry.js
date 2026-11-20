/* 레이아웃: 메이슨리 갤러리 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't9', name: '메이슨리 갤러리', cat: '목록·갤러리',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 6, 32, 30) + r(8, 40, 32, 38) + r(44, 6, 32, 44) + r(44, 54, 32, 24) + r(80, 6, 32, 26) + r(80, 36, 32, 42); },
  html: () => nav() +
    '<section class="wrap"><h1 class="title">Works</h1><div class="mas">' +
    [1100, 760, 900, 1250, 820, 1000, 700, 1150, 880].map((h, i) => fig(i, 2026 - (i % 3), { hover: 'gray', w: 800, h: h })).join('') + '</div></section>' + FOOT });
})(window.KZ);
