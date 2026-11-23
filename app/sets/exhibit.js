/* 세트: 작가 전시 — 강이조 Canva 사이트(kangizo.my.canva.site)의 배치 · 글꼴 · 크기를 옮긴 형식.
   첫 페이지(작품 한 점 + 전시 목록) → 전시 페이지 2개(표지 · 작품 · 여백 · 강조 색 · 작은 작품 줄 · 전경 · 약력).
   그림은 샘플, 글은 [자리표시] — 실제 작품 사진과 글은 사용자가 넣음 */
KZ.set({
  id: 'exhibit', name: '작가 전시', desc: '전시 벽처럼 — 작품 한 점씩 크게, 여백, 약력 (Canva 전시 사이트 형식)', siteName: '[작가 이름]',
  style: { theme: 'exhibit', font: 'exhibit', transition: 'fade', speed: 'normal' },
  pages: [
    ['home', '홈', 'exh-work', { bg: 'white' }, { add: [['exh-links', { items: [['#show1', '[전시 1]'], ['#show2', '[전시 2]']] }]] }],
    ['show2', '[전시 2]', 'exh-cover', { img: 3 }, { add: [
      ['exh-work', { bg: 'white', img: 7 }], ['exh-space'], ['exh-work', { bg: 'orange', size: 'l', img: 5 }], ['exh-space'],
      ['exh-row'], ['exh-work', { bg: 'gray', img: 9 }], ['exh-work', { bg: 'gray', img: 10 }], ['exh-work', { bg: 'orange', size: 'l', img: 2 }],
      ['exh-cv'], ['exh-space', { bg: 'black' }]] }],
    ['show1', '[전시 1]', 'exh-cover', { img: 11 }, { add: [
      ['exh-work', { bg: 'gray', img: 4 }], ['exh-space'], ['exh-work', { bg: 'gray', img: 6 }], ['exh-work', { bg: 'gray', img: 8 }],
      ['exh-work', { bg: 'gray', img: 1 }], ['exh-space'], ['exh-photo', { img: 0 }], ['exh-cv'], ['exh-space', { bg: 'black' }]] }]
  ],
  words: [
    ['[큰 제목]<br>[둘째 줄]', '[전시 제목]<br>[둘째 줄]'], ['[장소] , [연도]', '[전시 장소] , [연도]'],
    ['>[이름]<', '>[작가 이름]<'], ['>[제목]<', '>[작품 제목]<'], ['[재료]', '[재료]'], ['[그림 설명]', '[작품 설명]'],
    ['[활동 — 장소, 연도]', '[전시 — 장소, 연도]'], ['[활동 (영문)]', '[전시 (영문)]'], ['[사진 설명]', '[전시 전경 설명]']
  ]
});
