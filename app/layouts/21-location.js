/* 레이아웃(섹션): 위치 · 영업시간 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    return '<section class="wrap"><h2 class="title">' + (d.title || '오시는 길') + '</h2><div class="loc">' +
      '<div class="loc-map" data-anim="fade-up"><img src="' + ph('지도', 900, 640, 7) + '" alt="[지도 · 건물 사진]"><span class="loc-pin">[지도 캡처나 건물 사진으로 바꾸세요]</span></div>' +
      '<div class="loc-info" data-anim="fade-up"><p class="loc-a">[주소]</p><p class="cap">[가까운 역 · 주차 안내]</p>' +
      '<dl class="loc-h"><dt>[월 – 금]</dt><dd>[00:00 – 00:00]</dd><dt>[토]</dt><dd>[00:00 – 00:00]</dd><dt>[일 · 공휴일]</dt><dd>[휴무]</dd></dl>' +
      '<a class="btn-line" href="#">지도에서 보기 →</a></div></div></section>';
  }
  KZ.layout({ id: 'location', name: '위치 · 영업시간', cat: '섹션', slug: 'location',
    thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 10, 58, 64) + "<circle cx='37' cy='40' r='5' fill='" + k + "'/>" + r(74, 12, 38, 6, d) + [0, 1, 2].map(i => r(74, 28 + i * 9, 38, 3)).join('') + r(74, 62, 26, 8, k); },
    section: sec,
    html: function (d) { return nav() + sec(d) + FOOT; } });
})(window.KZ);
