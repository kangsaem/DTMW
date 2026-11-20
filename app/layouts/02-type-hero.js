/* 레이아웃: 타이포 히어로 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't12', name: '타이포 히어로', cat: '첫 화면',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 12, 80, 16, k) + [0, 1, 2, 3].map(i => r(8, 36 + i * 9, 34, 5, d)).join(''); },
  html: () =>
    '<section class="th"><div><h1 class="th-name" data-anim="mask">[작가명]</h1>' +
    '<nav class="th-menu"><a href="#works" data-anim="fade-up">Works</a><a href="#exhibitions" data-anim="fade-up">Exhibitions</a><a href="#texts" data-anim="fade-up">Texts</a><a href="#about" data-anim="fade-up">About</a></nav></div>' +
    '<div class="th-foot"><a href="#exhibitions" style="text-decoration:none">현재 전시 — [전시명] · [장소] · [기간]</a><span>KR · EN · JP</span></div></section>' });
})(window.KZ);
