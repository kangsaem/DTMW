/* 레이아웃: 카드 + 상세 시트 */
(function (KZ) {
  'use strict';
  var H = KZ.H, ph = H.ph, nav = H.nav, fig = H.fig, exRow = H.exRow, FOOT = H.FOOT, MENU_BTN = H.MENU_BTN;
  KZ.layout({ id: 't5', name: '카드 + 상세 시트', cat: '목록·갤러리',
  thumb: function (r, C) { var g = C.g, d = C.d, k = C.k; return r(8, 8, 60, 8, d) + [0, 1, 2, 3, 4].map(i => r(8 + i * 21.5, 26, 18, 30, '#fff') + r(10 + i * 21.5, 28, 7, 7)).join('') + r(8, 62, 104, 14, '#fff'); },
  html: () => {
    const apps = [
      ['MONEY PIE', '자산 배분 추적 · 월별 기록 (웹)', 1, '자산 배분 추적 (계좌 · 섹터 · 지역별)&#10;월별 기록&#10;규칙 기반 매매 메모 · 관심 종목&#10;데이터는 브라우저에 저장, Excel · JSON 백업'],
      ['DTMD', '잠수 계획 · 다이브 로그 (웹 앱)', 1, '잠수 계획 · 다이브 로그 가져오기&#10;지도 · 깊이 그래프 · 사진 · 메모&#10;9개 언어'],
      ['DTMC', '데스크톱 음악 작곡기', 0, '준비 중'],
      ['MOSCO', '사진 보정', 0, '준비 중'],
      ['DTME', '잠수 영상 편집기 (Windows)', 1, '자동 편집 · 색보정 · 렌더링&#10;Windows 10/11']];
    return '<header class="nav"><a class="brand" href="#home">KANGYONZ</a><nav class="links"><a href="#home">Apps</a><a href="#effects">효과 샘플</a></nav><div class="lang"><a href="#" class="on">KR</a><a href="#">EN</a><a href="#">JP</a></div>' + MENU_BTN + '</header>' +
      '<section class="wrap"><p class="cap" style="margin:0 0 10px">About</p><h1 class="title">Things I made for my own use.</h1><div class="apps">' +
      apps.map(a => '<a class="app" href="#" data-hover="lift" data-anim="fade-up" data-click="sheet" data-title="' + a[0] + '" data-text="' + a[3] + '"><span class="app-ico"></span><span class="app-n">' + a[0] + '</span><span class="app-d">' + a[1] + '</span><span class="badge' + (a[2] ? ' on' : '') + '">' + (a[2] ? '사용 가능' : '준비 중') + '</span></a>').join('') +
      '</div></section><footer class="foot"><span>[이메일]</span><span>PROTO v3</span></footer>';
  } });
})(window.KZ);
