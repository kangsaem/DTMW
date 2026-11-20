/* 세트: 매거진 · 블로그 · 뉴스레터 */
KZ.set({
  id: 'magazine', name: '매거진 · 블로그', desc: '글 목록 · 글 · 소개 — 종이 색, 나눔명조', siteName: '내 매거진',
  style: { theme: 'paper', font: 'nanum', transition: 'fade', speed: 'slow' },
  pages: [['home', '홈', 't12'], ['gallery', '글 목록', 't8'], ['journal', '최근 글', 't11'], ['about', '소개', 't13']],
  words: [].concat(KZ.W.noEffects, KZ.W.noNews,
    KZ.W.profileDl([['발행', '[주기]'], ['주제', '[다루는 주제]'], ['편집', '[이름]'], ['구독', '[방법]']]),
    [['href="#news"', 'href="#journal"'], ['[사이트 이름]', '[매거진 이름]'], ['>갤러리<', '>글 목록<'], ['>글<', '>최근 글<'],
     ['[알림 한 줄]', '새 글'], ['<h1 class="title">목록</h1>', '<h1 class="title">글 목록</h1>'], [/\[항목 (\d)\]/g, '[글 제목 $1]'],
     ['[분류 A]', '[주제 A]'], ['[분류 B]', '[주제 B]'], ['href="#detail"', 'href="#journal"'], ['글 · [분류]', '[주제]'],
     ['<h1 class="title">[이름]</h1>', '<h1 class="title">[매거진 이름]</h1>'],
     ['[소개 — 무엇을 하는지 3~5문장으로 적어 주세요.]', '[매거진 소개 — 무엇을 왜 쓰는지 2~3문장으로]'], ['소식 보기', '글 보기']])
});
