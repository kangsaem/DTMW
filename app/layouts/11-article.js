/* 레이아웃: 긴 글 (아티클) */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't11', name: '긴 글 (아티클)', cat: '글·소개',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(30, 6, 60, 8, d) + r(30, 20, 60, 24) + [0, 1, 2, 3].map(i => r(30, 50 + i * 7, 60, 3)).join(''); },
  html: () => nav() +
    '<article class="ed"><p class="ed-k">글 · [분류]</p><h1 class="ed-t">[글 제목]</h1><p class="ed-m">[글쓴이] · 2026</p>' +
    '<figure class="ed-fig" data-anim="mask"><img src="' + ph('이미지', 1400, 900, 1) + '" alt="[이미지 설명]"><figcaption class="cap">[이미지 설명], 2026</figcaption></figure>' +
    '<p class="ed-p dropcap">[본문 첫 문단을 입력하세요.]</p>' +
    '<blockquote class="ed-q" data-anim="fade-up">“[인용하고 싶은 한 문장]”</blockquote>' +
    '<p class="ed-p">[본문 둘째 문단]</p><hr class="rule"><p class="cap">다른 글</p><div>' +
    '<a class="ix-row" href="#journal"><span class="ix-t" style="font-size:22px">[글 제목]</span><span class="ix-s">[분류]</span><span class="ix-y">2025</span></a>' +
    '<a class="ix-row" href="#journal"><span class="ix-t" style="font-size:22px">[글 제목]</span><span class="ix-s">[분류]</span><span class="ix-y">2024</span></a></div></article>' + FOOT });
})(window.KZ);
