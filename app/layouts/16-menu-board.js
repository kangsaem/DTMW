/* 레이아웃(섹션): 메뉴판 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    var item = '<li class="mb-i"><span class="mb-n">[메뉴 이름]</span><span class="mb-dot"></span><span class="mb-p">[가격]</span><small class="mb-d">[한 줄 설명]</small></li>';
    var grp = function (n) { return '<div class="mb-g" data-anim="fade-up"><h3 class="mb-h">[메뉴 분류 ' + n + ']</h3><ul class="mb-l">' + item + item + item + item + '</ul></div>'; };
    return '<section class="wrap"><h2 class="title">' + (d.title || '메뉴') + '</h2><div class="mb">' + grp(1) + grp(2) + '</div>' +
      '<p class="cap">[가격 · 원산지 · 알레르기 안내]</p></section>';
  }
  KZ.layout({ id: 'menuboard', name: '메뉴판', cat: '섹션', slug: 'menu',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 36, 7, d) + [0, 1].map(j => r(8 + j * 56, 22, 22, 4, k) + [0, 1, 2, 3].map(i => r(8 + j * 56, 32 + i * 11, 48, 3)).join('')).join(''); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
