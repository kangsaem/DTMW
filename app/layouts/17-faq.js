/* 레이아웃(섹션): 자주 묻는 질문 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    var q = function (open) { return '<details class="faq-i"' + (open ? ' open' : '') + '><summary>[질문]</summary><p>[답변 — 2~3문장으로 적어 주세요.]</p></details>'; };
    return '<section class="wrap faq-w"><h2 class="title">' + (d.title || '자주 묻는 질문') + '</h2><div class="faq" data-anim="fade-up">' + q(true) + q() + q() + q() + q() + '</div></section>';
  }
  KZ.layout({ id: 'faq', name: '자주 묻는 질문', cat: '섹션', slug: 'faq',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 50, 7, d) + [0, 1, 2, 3, 4].map(i => r(8, 22 + i * 12, 104, 8, i === 0 ? d : g)).join(''); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
