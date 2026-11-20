/* 레이아웃(섹션): 요금 · 상품표 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    var col = function (on) {
      return '<div class="pr-col' + (on ? ' on' : '') + '" data-anim="fade-up">' + (on ? '<span class="pr-tag">[추천]</span>' : '') +
        '<h3 class="pr-n">[상품 이름]</h3><p class="pr-p">[가격]<small> / [기간 · 단위]</small></p><p class="pr-d">[누구에게 맞는지 한 줄]</p>' +
        '<ul class="pr-l"><li>[포함 내용 1]</li><li>[포함 내용 2]</li><li>[포함 내용 3]</li></ul>' +
        '<a class="' + (on ? 'btn' : 'btn-line') + '" href="#">[신청 · 문의]</a></div>';
    };
    return '<section class="wrap"><h2 class="title">' + (d.title || '요금 안내') + '</h2><p class="body-p">[가격 기준 · 부가세 포함 여부 등 안내 한 줄]</p>' +
      '<div class="pr">' + col(false) + col(true) + col(false) + '</div></section>';
  }
  KZ.layout({ id: 'pricing', name: '요금 · 상품표', cat: '섹션', slug: 'pricing',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 40, 7, d) + [0, 1, 2].map(i => r(8 + i * 36, 22, 32, 54, i === 1 ? k : g)).join(''); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
