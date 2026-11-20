/* 세트: 앱 · 제품 소개 (kangyonz.com/proto/v3 재현 예시) — 레이아웃 t5 에 실제 내용을 넣습니다 */
KZ.set({
  id: 'kangyonz', name: '앱 소개 · proto v3', desc: '앱 카드 + 상세 시트 · 효과 샘플', siteName: 'kangyonz',
  pages: [
    ['home', 'Apps', 't5', {
      brand: 'KANGYONZ', kicker: 'About', title: 'Things I made for my own use.', footL: '[이메일]', footR: 'PROTO v3',
      badgeOn: '사용 가능', badgeOff: '준비 중',
      items: [
        ['MONEY PIE', '자산 배분 추적 · 월별 기록 (웹)', 1, '자산 배분 추적 (계좌 · 섹터 · 지역별)&#10;월별 기록&#10;규칙 기반 매매 메모 · 관심 종목&#10;데이터는 브라우저에 저장, Excel · JSON 백업'],
        ['DTMD', '잠수 계획 · 다이브 로그 (웹 앱)', 1, '잠수 계획 · 다이브 로그 가져오기&#10;지도 · 깊이 그래프 · 사진 · 메모&#10;9개 언어'],
        ['DTMC', '데스크톱 음악 작곡기', 0, '준비 중'],
        ['MOSCO', '사진 보정', 0, '준비 중'],
        ['DTME', '잠수 영상 편집기 (Windows)', 1, '자동 편집 · 색보정 · 렌더링&#10;Windows 10/11']
      ]
    }],
    ['effects', '효과 샘플', 'fx']
  ]
});
