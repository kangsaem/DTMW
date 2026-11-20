/* 레이아웃(섹션): 숫자 강조 띠 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    var s = '<div class="st-i" data-anim="fade-up"><b class="st-n">[숫자]</b><span class="st-d">[무엇의 숫자인지]</span></div>';
    return '<section class="st-band"><div class="st">' + s + s + s + s + '</div><p class="st-note">[숫자 기준 · 날짜 — 실제 수치만 적어 주세요]</p></section>';
  }
  KZ.layout({ id: 'stats', name: '숫자 강조 띠', cat: '섹션', slug: 'stats',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(0, 26, 120, 32, k) + [0, 1, 2, 3].map(i => r(10 + i * 28, 33, 18, 9, '#F1EFEA') + r(10 + i * 28, 46, 20, 3, g)).join(''); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
