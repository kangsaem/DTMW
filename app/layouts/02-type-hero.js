/* 레이아웃: 타이포 히어로 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't12', name: '타이포 히어로', cat: '첫 화면',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 12, 80, 16, k) + [0, 1, 2, 3].map(i => r(8, 36 + i * 9, 34, 5, d)).join(''); },
  html: () =>
    '<section class="th"><div><h1 class="th-name" data-anim="mask">[사이트 이름]</h1>' +
    '<nav class="th-menu"><a href="#gallery" data-anim="fade-up">갤러리</a><a href="#news" data-anim="fade-up">소식</a><a href="#journal" data-anim="fade-up">글</a><a href="#about" data-anim="fade-up">소개</a></nav></div>' +
    '<div class="th-foot"><a href="#news" style="text-decoration:none">[알림 한 줄] — [제목] · [날짜]</a><span>KR · EN · JP</span></div></section>' });
})(window.KZ);
