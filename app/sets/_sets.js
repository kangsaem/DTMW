/* 사이트 세트(패키지) 등록 도구
   세트 = 페이지 구성 + 업종 문구 + 색 테마 · 글꼴 · 전환 효과.
   세트 추가: 이 폴더에 파일 하나를 만들고 KZ.set({...}) 로 등록 → index.html 에 <script> 한 줄.

   KZ.set({
     id, name, desc, siteName,
     style: { theme: 'white'|'dark'|'paper'|'concrete', font: 'serif'|'sans'|'gowun'|'nanum'|'inter', transition, speed },
     pages: [[주소, 페이지 이름, 레이아웃 id, (선택) 레이아웃 데이터], ...],   // 첫 줄이 첫 페이지
     words: [[찾을 문구 또는 정규식, 바꿀 문구], ...]                         // 모든 페이지에 순서대로 적용
   });
   자리표시 문구는 [대괄호]로만 씁니다. 가짜 후기 · 수치 · 실제 상호는 넣지 않습니다. */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  KZ.sets = {};
  KZ.setOrder = [];
  KZ.set = function (def) {
    if (!def || !def.id || !Array.isArray(def.pages) || !def.pages.length) throw new Error('세트 정의가 올바르지 않습니다');
    if (!KZ.sets[def.id]) KZ.setOrder.push(def.id);
    KZ.sets[def.id] = def;
  };
  KZ.applyWords = function (html, words) {
    (words || []).forEach(function (w) {
      html = w[0] instanceof RegExp ? html.replace(w[0], w[1]) : html.split(w[0]).join(w[1]);
    });
    return html;
  };
  KZ.setPageHtml = function (set, page) {
    var L = KZ.layouts[page[2]];
    if (!L) throw new Error('레이아웃 없음: ' + page[2]);
    return KZ.applyWords(L.html(page[3]), set.words);
  };
  // 여러 세트에서 쓰는 문구 묶음
  KZ.W = {
    noEffects: [['<a href="#effects">효과 샘플</a>', '']],
    noJournal: [['<a href="#journal">글</a>', ''], ['<a href="#journal" data-anim="fade-up">글</a>', '']],
    noNews: [['<a href="#news">소식</a>', ''], ['<a href="#news" data-anim="fade-up">소식</a>', '']],
    profileDl: function (rows) {
      return [['<dt>시작</dt><dd>[연도], [도시]</dd><dt>분야</dt><dd>[분야]</dd><dt>주요 활동</dt><dd>[제목], [장소], 2026</dd><dt>함께한 곳</dt><dd>[이름]</dd>',
        rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('')]];
    }
  };
})(window.KZ);
