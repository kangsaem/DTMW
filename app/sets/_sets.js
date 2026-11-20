/* 사이트 세트 등록 도구 — 세트 = 페이지 구성 + (2차) 업종별 색 · 글꼴 · 문구
   세트 추가 방법: 이 폴더에 파일 하나를 만들고 KZ.set({...}) 으로 등록한 뒤 index.html 에 <script> 한 줄을 넣습니다. */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  KZ.sets = {};
  KZ.set = function (def) {
    if (!def || !def.id || !Array.isArray(def.pages)) throw new Error('세트 정의가 올바르지 않습니다');
    KZ.sets[def.id] = def;
  };
})(window.KZ);
