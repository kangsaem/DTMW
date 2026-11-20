/* 레이아웃(섹션): 연락처 카드 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    var c = function (k, v) { return '<a class="ct-i" href="#" data-anim="fade-up"><span class="ct-k">' + k + '</span><b class="ct-v">' + v + '</b></a>'; };
    return '<section class="wrap"><h2 class="title">' + (d.title || '연락하기') + '</h2><p class="body-p">[문의 받는 시간 · 답변 걸리는 시간 안내]</p>' +
      '<div class="ct">' + c('이메일', '[이메일]') + c('전화', '[전화번호]') + c('SNS', '[@계정]') + c('메신저', '[채널 · 오픈채팅]') + '</div></section>';
  }
  KZ.layout({ id: 'contact', name: '연락처 카드', cat: '섹션', slug: 'contact',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 40, 7, d) + [0, 1, 2, 3].map(i => r(8 + (i % 2) * 54, 24 + Math.floor(i / 2) * 26, 50, 22)).join(''); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
