/* 레이아웃: 세로 타임라인 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't10', name: '세로 타임라인', cat: '글·소개',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(14, 8, 1, 68, d) + [0, 1, 2, 3].map(i => "<circle cx='14.5' cy='" + (14 + i * 17) + "' r='3' fill='" + k + "'/>" + r(24, 11 + i * 17, 70 - i * 8, 6)).join(''); },
  html: () => nav() +
    '<section class="wrap"><h1 class="title">연혁</h1><div class="tl">' +
    [[2026, '[분류]'], [2026, '[분류]'], [2025, '[분류]'], [2024, '[분류]'], [2023, '[분류]']].map((r, i) => '<div class="tl-item" data-anim="' + (i % 2 ? 'slide-right' : 'slide-left') + '"><p class="tl-y">' + r[0] + '</p><p class="tl-b"><b>' + r[1] + '</b> — [제목], [장소]</p></div>').join('') +
    '</div><div class="cv3"><div><h3>분야</h3><p>[분야 · 전문 영역]</p></div><div><h3>수상 · 인증</h3><p>[이름 · 연도]</p></div><div><h3>함께한 곳</h3><p>[기관 · 고객 이름]</p></div></div></section>' + FOOT });
})(window.KZ);
