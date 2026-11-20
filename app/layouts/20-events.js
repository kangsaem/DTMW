/* 레이아웃(섹션): 일정 · 이벤트 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    var e = '<a class="ev-i" href="#" data-anim="fade-up" data-click="modal" data-title="[일정 이름]" data-text="[날짜 · 시간]&#10;[장소]&#10;&#10;[자세한 안내]">' +
      '<span class="ev-d"><b>[일]</b><small>[월]</small></span><span class="ev-t"><b>[일정 이름]</b><small>[시간] · [장소]</small></span><span class="ev-m">[모집 중 · 마감]</span></a>';
    return '<section class="wrap"><h2 class="title">' + (d.title || '일정') + '</h2><div class="ev">' + e + e + e + e + '</div></section>';
  }
  KZ.layout({ id: 'events', name: '일정 · 이벤트', cat: '섹션', slug: 'events',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 30, 7, d) + [0, 1, 2, 3].map(i => r(8, 22 + i * 15, 12, 11, k) + r(26, 24 + i * 15, 60, 3, d) + r(26, 29 + i * 15, 40, 2)).join(''); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
