/* 레이아웃(섹션): 전시 — 표지 · 작품 한 점 · 작은 작품 줄 · 여백 · 전시 전경 · 약력 · 목록 링크
   Canva 웹사이트(1366 × 768 판)를 옮긴 형식. 1366보다 좁으면 비율대로 줄고, 넓으면 그대로 가운데 (site/base.css .exh).
   모바일(640px 이하)은 따로 배치 — Canva 모바일 보기와 같은 크기 (글자 약 0.79배, 사진 양옆 15px).
   기본 문구는 업종 단어 없이 [자리표시]만. 전시 문구는 세트(sets/exhibit.js)에서 바꿈 */
(function (KZ) {
  'use strict';
  var S = KZ.sample;
  function cap(d, cls) {
    d = d || {};
    return '<div class="exh-cap' + (cls ? ' ' + cls : '') + '">' + (d.noName ? '' : '<p class="exh-cap-a">' + (d.name || '[이름]') + '</p>') +
      '<p class="exh-cap-t">' + (d.title || '[제목]') + '</p><p class="exh-cap-m">' + (d.meta || '[재료]<br>[크기]<br>[연도]') + '</p></div>';
  }
  var L = {
    'exh-cover': { name: '전시 표지', sec: function (d) { d = d || {};
      return '<section class="exh exh-cover"><img class="exh-bg" src="' + (d.src || S(d.img == null ? 3 : d.img, 1500, 1000)) + '" alt="">' +
        '<h1 class="exh-title">' + (d.title || '[큰 제목]<br>[둘째 줄]') + '</h1><p class="exh-sub">' + (d.sub || '[장소] , [연도]') + '</p></section>'; },
      thumb: function (r, C) { return r(0, 0, 120, 88, C.k) + r(36, 34, 48, 7, '#fff') + r(44, 44, 32, 7, '#fff') + r(48, 72, 24, 2, '#999'); } },
    'exh-work': { name: '한 점 크게 (전시 벽)', sec: function (d) { d = d || {};
      return '<section class="exh exh-work" data-bg="' + (d.bg || 'white') + '"' + (d.size ? ' data-size="' + d.size + '"' : '') + '>' +
        '<img class="exh-art" src="' + (d.src || S(d.img == null ? 7 : d.img, 463, 522)) + '" alt="' + (d.alt || '[그림 설명]') + '">' + cap(d) + '</section>'; },
      thumb: function (r, C) { return r(0, 0, 120, 88, '#fff') + r(46, 10, 28, 56, C.g) + r(82, 64, 10, 2, C.d) + r(78, 68, 14, 2, C.d) + r(84, 72, 8, 1, C.d); } },
    'exh-row': { name: '작게 여러 점 한 줄', sec: function (d) { d = d || {};
      var n = d.n || 4, f = '', c = '';
      for (var i = 0; i < n; i++) {
        f += '<img src="' + S(8 + i, 240, 240) + '" alt="[그림 설명]">';
        c += cap({ noName: i < n - 1 }, '');
      }
      return '<section class="exh exh-row" data-bg="' + (d.bg || 'gray') + '"><div class="exh-frames">' + f + '</div><div class="exh-caps">' + c + '</div></section>'; },
      thumb: function (r, C) { return r(0, 0, 120, 88, '#EBEBEB') + r(14, 8, 14, 14, C.g) + r(40, 8, 14, 14, C.g) + r(66, 8, 14, 14, C.g) + r(92, 8, 14, 14, C.g) + r(60, 64, 46, 2, C.d) + r(66, 68, 40, 1, C.d); } },
    'exh-space': { name: '여백 (빈 벽)', sec: function (d) { d = d || {};
      return '<section class="exh exh-space" data-bg="' + (d.bg || 'gray') + '" aria-hidden="true"></section>'; },
      thumb: function (r) { return r(0, 0, 120, 88, '#EBEBEB') + r(50, 42, 20, 1, '#cfcfcf'); } },
    'exh-photo': { name: '전경 사진 (꽉 찬 화면)', sec: function (d) { d = d || {};
      return '<section class="exh exh-photo"><img class="exh-bg" src="' + (d.src || S(d.img == null ? 11 : d.img, 1600, 900)) + '" alt="' + (d.alt || '[사진 설명]') + '"></section>'; },
      thumb: function (r, C) { return r(0, 0, 120, 88, C.g) + r(10, 20, 22, 30, C.d) + r(44, 24, 16, 22, C.d) + r(72, 20, 22, 30, C.d); } },
    'exh-cv': { name: '약력 · 연락처 (검은 바탕)', sec: function (d) { d = d || {};
      var ko = d.ko || ['[학력]', '[학력]', '[활동 — 장소, 연도]', '[활동 — 장소, 연도]', '[활동 — 장소, 연도]'];
      var en = d.en || ['[학력 (영문)]', '[학력 (영문)]', '[활동 (영문)]', '[활동 (영문)]', '[활동 (영문)]'];
      var li = function (a) { return a.map(function (t) { return '<p>' + t + '</p>'; }).join(''); };
      var ic = function (k) {
        return k === 'mail' ? '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="6" fill="#2F80ED"/><path d="M5 8h14v9H5z" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M5 8l7 5 7-5" fill="none" stroke="#fff" stroke-width="1.6"/></svg>'
          : '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="6" fill="#E1306C"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>';
      };
      return '<section class="exh exh-cv" data-bg="black"><div class="exh-cv-in"><p class="exh-cv-name">' + (d.name || '[이름]') + '</p>' +
        '<div class="exh-cv-g">' + li(ko) + '</div><p class="exh-cv-name exh-cv-en">' + (d.nameEn || '[영문 이름]') + '</p><div class="exh-cv-g">' + li(en) + '</div></div>' +
        '<div class="exh-cv-links"><a class="exh-cv-l" href="' + (d.sns || '#') + '"><span class="exh-ic s">' + ic('sns') + '</span><span class="exh-cv-t">' + (d.snsName || '[SNS 계정]') + '</span></a>' +
        '<a class="exh-cv-l" href="' + (d.mail || '#') + '"><span class="exh-ic m">' + ic('mail') + '</span><span class="exh-cv-t">' + (d.mailName || '[이메일]') + '</span></a></div></section>'; },
      thumb: function (r) { return r(0, 0, 120, 88, '#000') + r(34, 12, 18, 3, '#fff') + r(34, 20, 46, 2, '#bbb') + r(34, 24, 40, 2, '#bbb') + r(34, 28, 44, 2, '#bbb') + r(34, 40, 18, 3, '#fff') + r(34, 48, 46, 2, '#bbb') + r(44, 70, 30, 2, '#ddd'); } },
    'exh-links': { name: '목록 링크 (가운데)', sec: function (d) { d = d || {};
      var items = d.items || [['#', '[링크 1]'], ['#', '[링크 2]']];
      return '<section class="exh exh-links" data-bg="' + (d.bg || 'gray') + '"><nav class="exh-ln">' + items.map(function (it) { return '<a href="' + it[0] + '">' + it[1] + '</a>'; }).join('') + '</nav></section>'; },
      thumb: function (r, C) { return r(0, 0, 120, 88, '#D9D9D9') + r(52, 26, 16, 2, C.d) + r(52, 34, 16, 2, C.d); } }
  };
  Object.keys(L).forEach(function (id) {
    var o = L[id];
    KZ.layout({ id: id, name: o.name, cat: '섹션', slug: id, thumb: o.thumb, section: o.sec, html: function (d) { return o.sec(d); } });
  });
})(window.KZ);
