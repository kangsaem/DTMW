/* 세트: 기본 사이트 — 업종 무관 예시 (효과 샘플 페이지 포함) */
KZ.set({
  id: 'basic', name: '기본 사이트', desc: '홈 · 갤러리 · 상세 · 소식 · 글 · 소개 · 효과 샘플', siteName: '내 사이트',
  style: { theme: 'white', font: 'serif', transition: 'fade', speed: 'normal' },
  pages: [['home', '홈', 't1'], ['gallery', '갤러리', 't3'], ['detail', '상세', 't4', null, {parent:'gallery'}], ['news', '소식', 't2'], ['journal', '글', 't11'], ['about', '소개', 't13', null, { add: ['contact'] }], ['effects', '효과 샘플', 'fx']]
});
