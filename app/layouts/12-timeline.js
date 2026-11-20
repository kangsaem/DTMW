/* 레이아웃: 세로 타임라인 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't10', name: '세로 타임라인', cat: '글·소개',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(14, 8, 1, 68, d) + [0, 1, 2, 3].map(i => "<circle cx='14.5' cy='" + (14 + i * 17) + "' r='3' fill='" + k + "'/>" + r(24, 11 + i * 17, 70 - i * 8, 6)).join(''); },
  html: () => nav() +
    '<section class="wrap"><h1 class="title">CV</h1><div class="tl">' +
    [[2026, '개인전'], [2026, '단체전'], [2025, '레지던시'], [2024, '개인전'], [2023, '수상']].map((r, i) => '<div class="tl-item" data-anim="' + (i % 2 ? 'slide-right' : 'slide-left') + '"><p class="tl-y">' + r[0] + '</p><p class="tl-b"><b>' + r[1] + '</b> — [제목], [장소], [도시]</p></div>').join('') +
    '</div><div class="cv3"><div><h3>학력</h3><p>[학교 · 전공 · 연도]</p></div><div><h3>수상 · 지원</h3><p>[수상명 · 연도]</p></div><div><h3>소장처</h3><p>[기관명]</p></div></div></section>' + FOOT });
})(window.KZ);
