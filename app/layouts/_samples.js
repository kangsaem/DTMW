/* 샘플 이미지 12종 — 직접 그린 SVG 일러스트 (저작권 걱정 없음, 외부 파일 없음)
   KZ.sample(i, w, h, label?) → data URI. 1200×900 화면에 그린 뒤 비율에 맞춰 가운데를 잘라 씁니다.
   새 그림 추가: SCENES 배열에 함수 하나를 더합니다. */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  function lin(id, a, b, x2, y2) { return "<linearGradient id='" + id + "' x1='0' y1='0' x2='" + (x2 || 0) + "' y2='" + (y2 == null ? 1 : y2) + "'><stop offset='0' stop-color='" + a + "'/><stop offset='1' stop-color='" + b + "'/></linearGradient>"; }
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  var SCENES = [
    // 0 노을 언덕
    function () { return '<defs>' + lin('a', '#F2D7B6', '#E59A74') + '</defs><rect width="1200" height="900" fill="url(#a)"/><circle cx="790" cy="360" r="95" fill="#F8ECD6"/>' +
      '<path d="M0 560 C220 470 380 520 560 480 S900 430 1200 500 V900 H0Z" fill="#C98B6B"/><path d="M0 650 C260 580 420 640 640 600 S980 560 1200 620 V900 H0Z" fill="#9C6A55"/><path d="M0 760 C300 700 520 760 760 720 S1060 700 1200 730 V900 H0Z" fill="#5E4A44"/>'; },
    // 1 바다 수평선
    function () { var r = ''; for (var i = 0; i < 7; i++) r += '<rect x="' + (560 - i * 14) + '" y="' + (540 + i * 34) + '" width="' + (80 + i * 28) + '" height="6" rx="3" fill="#F4E3C3" opacity="' + (0.8 - i * 0.1) + '"/>';
      return '<defs>' + lin('a', '#BFD3DA', '#EDE3D3') + lin('b', '#5F8494', '#26404D') + '</defs><rect width="1200" height="520" fill="url(#a)"/><circle cx="600" cy="470" r="70" fill="#F7E6C6"/><rect y="510" width="1200" height="390" fill="url(#b)"/>' + r; },
    // 2 정물
    function () { return '<rect width="1200" height="900" fill="#E7DED1"/><rect y="600" width="1200" height="300" fill="#B79C80"/><ellipse cx="560" cy="610" rx="300" ry="26" fill="#8E765F" opacity=".5"/>' +
      '<path d="M420 600 C380 520 380 420 430 360 L430 300 L490 300 L490 360 C540 420 540 520 500 600Z" fill="#3F5B66"/><ellipse cx="700" cy="575" rx="120" ry="40" fill="#EFE8DE"/><path d="M580 575 Q700 650 820 575Z" fill="#D8CFC3"/>' +
      '<circle cx="660" cy="540" r="42" fill="#D8893E"/><circle cx="730" cy="545" r="38" fill="#C2553B"/><circle cx="700" cy="505" r="34" fill="#E2B84A"/><path d="M462 300 C440 230 470 180 520 160" stroke="#5E7A55" stroke-width="10" fill="none"/>'; },
    // 3 건축
    function () { var w = ''; for (var i = 0; i < 4; i++) w += '<path d="M' + (300 + i * 150) + ' 720 V560 a55 55 0 0 1 110 0 V720Z" fill="#B9AE9F"/>';
      return '<defs>' + lin('a', '#D6DEE4', '#EEF1F3') + '</defs><rect width="1200" height="900" fill="url(#a)"/><rect x="250" y="300" width="700" height="460" fill="#EDE7DF"/><rect x="950" y="360" width="120" height="400" fill="#CFC6BA"/><polygon points="250,300 600,170 950,300" fill="#D9CFC3"/>' + w + '<rect y="760" width="1200" height="140" fill="#A79C8F"/>'; },
    // 4 추상 원
    function () { return '<rect width="1200" height="900" fill="#1F2A36"/><circle cx="480" cy="420" r="230" fill="#E76F51" opacity=".85"/><circle cx="720" cy="470" r="200" fill="#2A9D8F" opacity=".8"/><circle cx="600" cy="300" r="140" fill="#E9C46A" opacity=".85"/><circle cx="850" cy="260" r="60" fill="#F4A261"/>'; },
    // 5 식물
    function () { var l = '', c = ['#6E8B5E', '#4E6E4A', '#9DB58A', '#5B7B52']; for (var i = 0; i < 9; i++) { var a = -70 + i * 17; l += '<ellipse cx="600" cy="330" rx="46" ry="170" fill="' + c[i % 4] + '" transform="rotate(' + a + ' 600 520)"/>'; }
      return '<rect width="1200" height="900" fill="#E4E9DF"/>' + l + '<path d="M500 560 H700 L670 760 H530Z" fill="#C7835E"/><rect x="490" y="545" width="220" height="30" rx="6" fill="#B06E4C"/>'; },
    // 6 커피 (위에서)
    function () { var s = ''; for (var i = 0; i < 9; i++) s += '<rect y="' + i * 100 + '" width="1200" height="48" fill="#9C7352" opacity=".35"/>';
      return '<rect width="1200" height="900" fill="#A9805E"/>' + s + '<circle cx="600" cy="450" r="250" fill="#F3EEE8"/><circle cx="600" cy="450" r="170" fill="#FFFFFF"/><circle cx="600" cy="450" r="140" fill="#6B4226"/>' +
      '<path d="M540 450 C540 400 660 400 660 450 C660 490 600 500 600 470 C600 445 630 445 630 460" stroke="#C99A6C" stroke-width="12" fill="none" stroke-linecap="round"/><rect x="860" y="430" width="200" height="22" rx="11" fill="#D7D2CB" transform="rotate(-20 860 440)"/>'; },
    // 7 도시 야경
    function () { var r = rnd(7), b = '', x = 60; while (x < 1150) { var bw = 70 + Math.floor(r() * 90), bh = 220 + Math.floor(r() * 360); b += '<rect x="' + x + '" y="' + (800 - bh) + '" width="' + bw + '" height="' + bh + '" fill="#262C47"/>';
        for (var wy = 820 - bh; wy < 780; wy += 34) for (var wx = x + 12; wx < x + bw - 16; wx += 26) if (r() > 0.55) b += '<rect x="' + wx + '" y="' + wy + '" width="12" height="16" fill="#F2C46D" opacity="' + (0.6 + r() * 0.4).toFixed(2) + '"/>';
        x += bw + 14; }
      return '<defs>' + lin('a', '#151C34', '#3B3F6B') + '</defs><rect width="1200" height="900" fill="url(#a)"/><circle cx="930" cy="190" r="56" fill="#F4ECD8"/>' + b + '<rect y="800" width="1200" height="100" fill="#141829"/>'; },
    // 8 사막 언덕
    function () { return '<rect width="1200" height="900" fill="#F3E3C9"/><circle cx="330" cy="260" r="60" fill="#F7F0E2"/><path d="M0 520 Q300 400 620 520 T1200 480 V900 H0Z" fill="#E0B07A"/><path d="M0 640 Q360 520 760 650 T1200 620 V900 H0Z" fill="#C98E57"/><path d="M0 770 Q420 680 820 780 T1200 760 V900 H0Z" fill="#A9693E"/>'; },
    // 9 색면 구성
    function () { return '<rect width="1200" height="900" fill="#EFE8DC"/><circle cx="460" cy="400" r="200" fill="#D2483E"/><rect x="620" y="250" width="320" height="420" fill="#2D4A7A"/><polygon points="300,760 520,480 740,760" fill="#E8B83C"/><rect x="180" y="200" width="840" height="10" fill="#1E1E1E"/><rect x="900" y="160" width="10" height="620" fill="#1E1E1E"/>'; },
    // 10 설산과 호수
    function () { return '<defs>' + lin('a', '#C7D7E5', '#EAF0F4') + '</defs><rect width="1200" height="900" fill="url(#a)"/><polygon points="120,620 460,220 800,620" fill="#6F7F8E"/><polygon points="460,220 380,315 420,300 460,330 500,300 540,315" fill="#FFFFFF"/>' +
      '<polygon points="520,620 820,300 1120,620" fill="#57687A"/><polygon points="820,300 760,370 800,360 830,380 860,360 880,370" fill="#F4F7F9"/><rect y="620" width="1200" height="280" fill="#7E9AAE"/><rect y="620" width="1200" height="280" fill="#FFFFFF" opacity=".15"/>'; },
    // 11 꽃
    function () { var f = '', pts = [[380, 380, '#D96C7B'], [620, 300, '#F0A6B0'], [820, 420, '#D96C7B'], [520, 520, '#F0A6B0']];
      pts.forEach(function (p) { f += '<path d="M' + p[0] + ' ' + (p[1] + 40) + ' C' + (p[0] - 10) + ' 650 ' + (p[0] + 10) + ' 760 ' + p[0] + ' 900" stroke="#6E8B5E" stroke-width="10" fill="none"/>';
        for (var k = 0; k < 6; k++) f += '<ellipse cx="' + p[0] + '" cy="' + (p[1] - 45) + '" rx="30" ry="50" fill="' + p[2] + '" transform="rotate(' + k * 60 + ' ' + p[0] + ' ' + p[1] + ')"/>';
        f += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="24" fill="#F2C14E"/>'; });
      return '<rect width="1200" height="900" fill="#F2E4E1"/>' + f; }
  ];

  var cache = {};
  KZ.sampleCount = SCENES.length;
  KZ.sample = function (i, w, h, label) {
    var n = ((i % SCENES.length) + SCENES.length) % SCENES.length;
    var key = n + ':' + w + ':' + h + ':' + (label || '');
    if (cache[key]) return cache[key];
    var pill = label ? '<g><rect x="' + (600 - label.length * 24 - 36) + '" y="404" width="' + (label.length * 48 + 72) + '" height="92" rx="46" fill="#000000" opacity=".55"/><text x="600" y="465" font-family="sans-serif" font-size="44" fill="#FFFFFF" text-anchor="middle">' + label + '</text></g>' : '';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">' + SCENES[n]() + pill + '</svg>';
    return (cache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  };
})(window.KZ);
