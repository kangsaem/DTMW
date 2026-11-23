/* 레이아웃: 카드 + 상세 시트 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't5', name: '카드 + 상세 시트', cat: '목록·갤러리',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 60, 8, d) + [0, 1, 2, 3, 4].map(i => r(8 + i * 21.5, 26, 18, 30, '#fff') + r(10 + i * 21.5, 28, 7, 7)).join('') + r(8, 62, 104, 14, '#fff'); },
  // data 로 내용을 바꿀 수 있음 (세트에서 사용): { kicker, title, items:[[이름, 한 줄, 사용가능여부, 상세]], footL, footR }
  html: (data) => {
    const D = Object.assign({
      kicker: '소개', title: '[한 줄 소개]', footL: '[이메일]', footR: '© <span data-site-name="1">[사이트 이름]</span>',
      badgeOn: '[상태 A]', badgeOff: '[상태 B]',
      items: [1, 2, 3, 4, 5].map(n => ['[항목 ' + n + ']', '[한 줄 설명]', n < 4 ? 1 : 0, '[자세한 설명 — 줄바꿈 가능]'])
    }, data || {});
    return '<header class="nav"><a class="brand" href="#home" data-site-name="1">[사이트 이름]</a><nav class="links"><a href="#home">홈</a><a href="#effects">효과 샘플</a></nav>' + MENU_BTN + '</header>' +
      '<section class="wrap"><p class="cap" style="margin:0 0 10px">' + D.kicker + '</p><h1 class="title">' + D.title + '</h1><div class="apps">' +
      D.items.map(a => '<a class="app" href="#" data-hover="lift" data-anim="fade-up" data-click="sheet" data-title="' + a[0] + '" data-text="' + a[3] + '"><span class="app-ico"></span><span class="app-n">' + a[0] + '</span><span class="app-d">' + a[1] + '</span><span class="badge' + (a[2] ? ' on' : '') + '">' + (a[2] ? D.badgeOn : D.badgeOff) + '</span></a>').join('') +
      '</div></section><footer class="foot"><span>' + D.footL + '</span><span>' + D.footR + '</span></footer>';
  } });
})(window.KZ);
