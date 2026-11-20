/* 레이아웃(섹션): 후기 칸 (빈 자리) */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    var v = '<figure class="rv-i" data-anim="fade-up"><blockquote>“[실제로 받은 후기를 그대로 옮겨 주세요]”</blockquote><figcaption>[이름 또는 이니셜] · [날짜]</figcaption></figure>';
    return '<section class="wrap"><h2 class="title">' + (d.title || '후기') + '</h2><div class="rv">' + v + v + v + '</div>' +
      '<p class="cap">받은 후기만 넣어 주세요. 출처(플랫폼 · 날짜)를 함께 적으면 믿음이 갑니다.</p></section>';
  }
  KZ.layout({ id: 'reviews', name: '후기 칸 (빈 자리)', cat: '섹션', slug: 'reviews',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 30, 7, d) + [0, 1, 2].map(i => r(8 + i * 36, 22, 32, 44) + r(12 + i * 36, 28, 20, 3, d) + r(12 + i * 36, 56, 14, 3, k)).join(''); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
