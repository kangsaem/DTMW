/* 레이아웃(섹션): 팀 · 사람 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    var p = function (i) { return '<figure class="tm-p" data-anim="fade-up"><img src="' + ph('사람', 480, 480, i + 3) + '" alt="[사진 설명]"><figcaption><b>[이름]</b><span>[역할]</span></figcaption></figure>'; };
    return '<section class="wrap"><h2 class="title">' + (d.title || '함께하는 사람') + '</h2><div class="tm">' + p(0) + p(1) + p(2) + p(3) + '</div></section>';
  }
  KZ.layout({ id: 'team', name: '팀 · 사람', cat: '섹션', slug: 'team',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 44, 7, d) + [0, 1, 2, 3].map(i => "<circle cx='" + (21 + i * 27) + "' cy='42' r='11' fill='" + g + "'/>" + r(12 + i * 27, 58, 18, 3, d)).join(''); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
