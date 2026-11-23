/* 세트: 작가 전시 — 강이조 Canva 사이트(kangizo.my.canva.site)의 배치 · 글꼴 · 크기를 옮긴 형식.
   첫 페이지(작품 한 점 + 전시 목록) → 전시 페이지 2개. 0.16.0 부터 섹션 변형(꽉 찬 · 폭 맞춤 표지, 세로 크게 · 넘치게 · 가로 작품, 사진 한 장 줄, 폭 맞춤 전경)으로 구성.
   그림은 샘플, 글은 [자리표시] — 실제 작품 사진과 글은 사용자가 넣음 */
KZ.set({
  id: 'exhibit', name: '작가 전시', desc: '전시 벽처럼 — 작품 한 점씩 크게, 여백, 약력 (Canva 전시 사이트 형식)', siteName: '[작가 이름]',
  style: { theme: 'exhibit', font: 'exhibit', transition: 'fade', speed: 'normal' },
  pages: [
    ['home', '홈', 'exh-work', { bg: 'white' }, { add: [['exh-links', { items: [['#show1', '[전시 1]'], ['#show2', '[전시 2]']] }]] }],
    ['show2', '[전시 2]', 'exh-cover', { img: 3 }, { add: [
      ['exh-work', { bg: 'white', img: 7 }], ['exh-space'], ['exh-work-over'], ['exh-space'],
      ['exh-row-one'], ['exh-work', { bg: 'gray', img: 9 }], ['exh-work', { bg: 'gray', img: 10 }], ['exh-work-wide'],
      ['exh-cv'], ['exh-space', { bg: 'black' }]] }],
    ['show1', '[전시 1]', 'exh-cover-fit', {}, { add: [
      ['exh-work-tall'], ['exh-space'], ['exh-work', { bg: 'gray', img: 6 }], ['exh-work', { bg: 'gray', img: 8 }],
      ['exh-work', { bg: 'gray', img: 1 }], ['exh-photo-fit'], ['exh-cv'], ['exh-photo-fit', { bg: 'black', src: KZ.sample(0, 1600, 900) }]] }]
  ],
  words: [
    ['[큰 제목]<br>[둘째 줄]', '[전시 제목]<br>[둘째 줄]'], ['[큰 제목]', '[전시 제목]'], ['[장소] , [연도]', '[전시 장소] , [연도]'],
    ['>[이름]<', '>[작가 이름]<'], ['>[제목]<', '>[작품 제목]<'], ['[재료]', '[재료]'], ['[그림 설명]', '[작품 설명]'],
    ['[활동 — 장소, 연도]', '[전시 — 장소, 연도]'], ['[활동 (영문)]', '[전시 (영문)]'], ['[사진 설명]', '[전시 전경 설명]']
  ]
});
