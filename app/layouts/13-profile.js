/* 레이아웃: 소개 (이미지 + 정보) */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't13', name: '소개 (이미지 + 정보)', cat: '글·소개',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 44, 66) + r(60, 10, 46, 8, d) + [0, 1, 2, 3, 4].map(i => r(60, 26 + i * 8, 50, 3)).join('') + r(60, 66, 22, 8, k); },
  html: () => nav() +
    '<section class="wrap"><div class="prof"><div class="par" style="height:640px"><img data-scroll="parallax" src="' + ph('작가 사진', 900, 1200, 2) + '" alt="[작가 사진]" style="width:100%;height:100%;object-fit:cover"></div>' +
    '<div><h1 class="title">[작가명]</h1><p class="body-p">[작가 소개 — 작업의 주제와 매체를 3~5문장으로 적어 주세요.]</p>' +
    '<dl><dt>출생</dt><dd>[연도], [도시]</dd><dt>학력</dt><dd>[학교 · 전공]</dd><dt>주요 개인전</dt><dd>[전시명], [장소], 2026</dd><dt>소장</dt><dd>[기관명]</dd></dl>' +
    '<div class="fx-btns"><a class="btn" href="#" data-click="modal" data-title="Contact" data-text="[이메일]&#10;[갤러리 · 연락처]&#10;Instagram [@계정]">연락하기</a><a class="btn-line" href="#exhibitions">전체 CV</a></div></div></div></section>' + FOOT });
})(window.KZ);
