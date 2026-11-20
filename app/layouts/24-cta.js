/* 레이아웃(섹션): 행동 유도 배너 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    return '<section class="cta" data-anim="fade-up"><h2 class="cta-t">' + (d.title || '[행동을 이끄는 한 문장]') + '</h2><p class="cta-d">[한 줄 덧붙임 — 무엇을 얻는지]</p>' +
      '<div class="fx-btns"><a class="btn" href="' + (d.href || '#') + '">' + (d.btn || '[버튼 문구]') + '</a></div></section>';
  }
  KZ.layout({ id: 'cta', name: '행동 유도 배너', cat: '섹션', slug: 'cta',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(0, 18, 120, 48, k) + r(24, 30, 72, 8, '#F1EFEA') + r(36, 44, 48, 3, g) + r(46, 52, 28, 8, g); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
