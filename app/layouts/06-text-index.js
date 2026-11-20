/* 레이아웃: 텍스트 목록 + 커서 미리보기 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't8', name: '텍스트 목록 + 커서 미리보기', cat: '목록·갤러리',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return [0, 1, 2, 3, 4].map(i => r(8, 10 + i * 13, 60 - i * 5, 7, d)).join('') + r(78, 24, 30, 38); },
  html: () => nav() +
    '<section class="wrap"><h1 class="title">목록</h1><p class="cap" style="margin:-12px 0 28px">제목 위에 마우스를 올리면 이미지가 떠오릅니다</p><div>' +
    [2026, 2026, 2025, 2025, 2025, 2024, 2024, 2023].map((y, i) => '<a class="ix-row" href="#detail" data-hover="cursor" data-preview="' + ph('이미지 ' + (i + 1), 440, 560, i) + '"><span class="ix-t">[항목 ' + (i + 1) + ']</span><span class="ix-s">[분류 ' + (i % 2 ? 'B' : 'A') + ']</span><span class="ix-y">' + y + '</span></a>').join('') +
    '</div></section>' + FOOT });
})(window.KZ);
