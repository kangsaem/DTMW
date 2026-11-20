/* 레이아웃: 그룹 목록 (연도·분류별) */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't2', name: '그룹 목록 (연도·분류별)', cat: '목록·갤러리',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 40, 7, d) + [0, 1, 2, 3, 4].map(i => r(8, 22 + i * 11, 14, 5, d) + r(30, 22 + i * 11, 82, 5)).join(''); },
  html: () => nav() +
    '<section class="wrap"><h1 class="title">소식 · 일정</h1><div class="chips"><a class="chip on" href="#">전체</a><a class="chip" href="#">[분류 A]</a><a class="chip" href="#">[분류 B]</a><a class="chip" href="#about">연혁</a></div>' +
    '<div class="yr"><h2 class="yr-n">2026</h2><div>' + exRow('[분류 A]') + exRow('[분류 B]') + '</div></div>' +
    '<div class="yr"><h2 class="yr-n">2025</h2><div>' + exRow('[분류 A]') + exRow('[분류 B]') + exRow('[분류 B]') + '</div></div>' +
    '<div class="yr"><h2 class="yr-n">2024</h2><div>' + exRow('[분류 A]') + '</div></div></section>' + FOOT });
})(window.KZ);
