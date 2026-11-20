/* 레이아웃(섹션): 배경 고정 창 — 스크롤해도 뒤의 사진 · 영상이 제자리에 남고, 위아래 내용이 그 위로 지나감
   방식(kangyonz.com/proto/v3 와 같음): 섹션을 잘라내기 틀(clip-path)로, 안쪽 사진 · 영상은 화면에 고정(position:fixed). iOS 포함 동작 */
(function (KZ) {
  'use strict';
  var H = KZ.H, nav = H.nav, FOOT = H.FOOT;
  function sec(d) {
    d = d || {};
    return '<section class="bgfix" data-scroll="bgfix" data-bgvideo="1" data-h="100" data-dim="18">' +
      '<div class="bgfix-media"><img src="' + (d.src || KZ.sample(6, 1600, 1000)) + '" alt=""></div>' +
      '<div class="bgfix-cap"><p class="bgfix-eb">' + (d.eyebrow || '[작은 글]') + '</p><h2 class="bgfix-t">' + (d.title || '[한 줄 제목]') + '</h2></div></section>';
  }
  var filler = function (t) { return '<section class="wrap"><h2 class="h2">' + t + '</h2><p class="body-p">[문단 — 스크롤하면 아래 사진 · 영상은 제자리에 있고 이 글이 그 위로 지나갑니다.]</p></section>'; };
  KZ.layout({ id: 'bgfix', name: '배경 고정 창', cat: '섹션', slug: 'bgfix',
    thumb: function (r, C) { var g = C.g, k = C.k; return r(0, 0, 120, 22, '#F1EFEA') + r(8, 8, 50, 5, g) + r(0, 22, 120, 40, k) + r(36, 38, 48, 6, '#eee') + r(0, 62, 120, 26, '#F1EFEA') + r(8, 70, 60, 5, g); },
    section: sec,
    html: function (d) { return nav() + filler('[위쪽 내용]') + sec(d) + filler('[아래쪽 내용]') + FOOT; } });
})(window.KZ);
