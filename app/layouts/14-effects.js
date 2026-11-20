/* 레이아웃: 효과 샘플 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 'fx', name: '효과 샘플', cat: '효과',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return [0, 1, 2, 3].map(i => r(8 + i * 27, 8, 23, 22, i % 2 ? '#bdb8ae' : g)).join('') + r(8, 38, 104, 14, d) + r(8, 58, 30, 8, k) + r(42, 58, 30, 8, '#fff') + r(76, 58, 30, 8, '#fff'); },
  html: () => {
    const enter = [['fade-up', '떠오르기'], ['fade', '페이드'], ['zoom-in', '확대 등장'], ['slide-left', '오른쪽에서'], ['slide-right', '왼쪽에서'], ['blur-in', '흐림 해제'], ['mask', '가림막 열림']];
    return nav() + '<section class="wrap"><h1 class="title">효과 샘플</h1><p class="body-p">미리보기에서 스크롤 · 마우스 · 클릭으로 확인하세요. 편집 화면에서는 요소를 선택하고 오른쪽 [효과] 탭에서 바꾸거나 다시 재생할 수 있습니다.</p></section>' +
      '<section class="wrap" style="padding-top:0"><div class="fx-sec"><p class="fx-h">스크롤 등장 (7)</p><p class="fx-d">화면에 들어올 때 재생</p><div class="grid g4">' +
      enter.map(e => '<div class="fx-card" data-anim="' + e[0] + '">' + e[1] + '</div>').join('') + '</div></div>' +
      '<div class="fx-sec"><p class="fx-h">마우스 올림 (5)</p><p class="fx-d">확대 · 흑백→컬러 · 캡션 · 떠오름 · 커서 미리보기</p><div class="grid g4">' +
      '<figure class="fx-card work" data-hover="zoom"><div class="imgbox"><img src="' + ph('확대', 600, 450, 0) + '" alt=""></div></figure>' +
      '<figure class="fx-card work" data-hover="gray"><div class="imgbox"><img src="' + ph('흑백 → 컬러', 600, 450, 1).replace('%23CFCBC3', '%23C9A27E').replace('%23BDB8AE', '%23B07A5A') + '" alt=""></div></figure>' +
      '<figure class="fx-card work" data-hover="caption"><div class="imgbox"><img src="' + ph('캡션 올라옴', 600, 450, 2) + '" alt=""></div><figcaption>[항목 이름], 2026 · [짧은 설명]</figcaption></figure>' +
      '<div class="fx-card" data-hover="lift">떠오름 (카드)</div></div>' +
      '<div style="margin-top:20px"><a class="ix-row" href="#" data-hover="cursor" data-preview="' + ph('커서 미리보기', 440, 560, 3) + '"><span class="ix-t" style="font-size:24px">커서 미리보기 — 이 줄 위에 마우스</span><span class="ix-s">텍스트 목록형</span><span class="ix-y">목록</span></a></div></div>' +
      '<div class="fx-sec"><p class="fx-h">클릭 팝업 (5)</p><p class="fx-d">라이트박스 · 측면 패널 · 하단 시트 · 중앙 모달 · 전체화면 메뉴</p><div class="fx-btns">' +
      '<button class="btn-line" type="button" data-click="lightbox" data-src="' + ph('라이트박스 이미지', 1200, 800, 4) + '" data-title="[항목 이름], 2026">라이트박스</button>' +
      '<button class="btn-line" type="button" data-click="panel" data-title="측면 패널" data-text="긴 설명이나 상세 정보에 적합합니다.">측면 패널</button>' +
      '<button class="btn-line" type="button" data-click="sheet" data-title="하단 시트" data-text="모바일에서 엄지로 닫기 쉬운 형태입니다.">하단 시트</button>' +
      '<button class="btn-line" type="button" data-click="modal" data-title="중앙 모달" data-text="짧은 안내 · 연락처 · 알림에 적합합니다.">중앙 모달</button>' +
      '<button class="btn-line" type="button" data-click="menu">전체화면 메뉴</button></div></div></section>' +
      '<div class="fx-sec"><p class="fx-h" style="padding:0 5vw">스크롤 연출 · 페이지 전환</p><p class="fx-d" style="padding:0 5vw">패럴랙스 띠 · 화면 고정 카드 · 페이지 전환 5종(왼쪽 [사이트] 탭에서 선택)</p>' +
      '<div class="band par"><div class="band-img" data-scroll="parallax" style="background-image:url(&quot;' + ph('패럴랙스 배경', 1600, 900, 1) + '&quot;)"></div><p class="band-txt">패럴랙스 — 배경이 느리게 움직임</p></div></div>' +
      '<section class="wrap" style="padding-top:0"><div class="stack-card" data-scroll="sticky">화면 고정 1</div><div class="stack-card" data-scroll="sticky" style="top:24px">화면 고정 2</div><div class="stack-card" data-scroll="sticky" style="top:48px">화면 고정 3</div>' +
      '<div class="fx-btns" style="margin-top:40px"><a class="btn" href="#gallery">페이지 전환 보기 → 갤러리</a><a class="btn-line" href="#about">소개</a></div></section>' + FOOT;
  } });
})(window.KZ);
