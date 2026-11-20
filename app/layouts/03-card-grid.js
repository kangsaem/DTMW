/* 레이아웃: 카드 그리드 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't3', name: '카드 그리드', cat: '목록·갤러리',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 36, 7, d) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => r(8 + (i % 4) * 27, 22 + Math.floor(i / 4) * 30, 23, 26)).join(''); },
  html: () => {
    const ys = [2026, 2026, 2026, 2025, 2025, 2025, 2024, 2024];
    const hs = [1000, 820, 1100, 900, 800, 1050, 950, 860];
    return nav() + '<section class="wrap"><h1 class="title">갤러리</h1><div class="chips"><a class="chip on" href="#">전체</a><a class="chip" href="#">2026</a><a class="chip" href="#">2025</a><a class="chip" href="#">2024</a><a class="chip" href="#">[분류 A]</a><a class="chip" href="#">[분류 B]</a></div>' +
      '<div class="grid g4">' + ys.map((y, i) => fig(i, y, { hover: 'zoom', h: hs[i] })).join('') + '</div></section>' + FOOT;
  } });
})(window.KZ);
