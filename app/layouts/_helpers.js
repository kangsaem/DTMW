/* 레이아웃 공통 도구 — 모든 레이아웃 파일보다 먼저 불러옵니다.
   레이아웃 추가 방법: 이 폴더에 파일 하나를 만들고 KZ.layout({...}) 으로 등록한 뒤 index.html 에 <script> 한 줄을 넣습니다. */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  KZ.layouts = {};
  KZ.layoutOrder = [];
  KZ.layout = function (def) {
    if (!def || !def.id || typeof def.html !== 'function') throw new Error('레이아웃 정의가 올바르지 않습니다');
    if (!KZ.layouts[def.id]) KZ.layoutOrder.push(def.id);
    KZ.layouts[def.id] = def;
  };

  // 샘플 이미지 (layouts/_samples.js). label 은 설명용 — 그림에는 표시하지 않음
  function pick(i, w, h) { return (i || 0) * 5 + Math.floor(w / 97) + Math.floor(h / 89); }
  function ph(label, w, h, i) { return KZ.sample(pick(i, w, h), w, h); }
  // 그림 위에 이름표를 띄운 샘플 (효과 샘플 페이지용)
  function phl(label, w, h, i) { return KZ.sample(pick(i, w, h), w, h, label); }

  var MENU_BTN = '<button class="menu-btn" type="button" data-click="menu" aria-label="메뉴 열기">≡</button>';
  function nav(light) {
    return '<header class="nav' + (light ? ' nav--light' : '') + '">' +
      '<a class="brand" href="#home" data-site-name="1">[사이트 이름]</a>' +
      '<nav class="links"><a href="#gallery">갤러리</a><a href="#news">소식</a><a href="#journal">글</a><a href="#about">소개</a><a href="#effects">효과 샘플</a></nav>' +
      '<div class="lang"><a href="#" class="on">KR</a><a href="#">EN</a><a href="#">JP</a></div>' + MENU_BTN + '</header>';
  }
  var FOOT = '<footer class="foot"><span>© <span data-site-name="1">[사이트 이름]</span></span><span>[이메일] · [SNS]</span></footer>';
  function fig(i, year, o) {
    o = o || {};
    var w = o.w || 800, h = o.h || 1000;
    return '<figure class="work"' + (o.hover ? ' data-hover="' + o.hover + '"' : '') + ' data-click="lightbox" data-title="[항목 이름], ' + year + '"' + (o.anim === false ? '' : ' data-anim="' + (o.anim || 'fade-up') + '"') + '>' +
      '<div class="imgbox"><img src="' + ph('이미지', w, h, i) + '" alt="[이미지 설명]"></div>' +
      '<figcaption class="cap">[항목 이름], ' + year + '<br>[짧은 설명]</figcaption></figure>';
  }
  function exRow(kind) {
    return '<a class="ex-row" href="#" data-anim="fade-up" data-click="modal" data-title="[제목]' + (kind ? ' (' + kind + ')' : '') + '" data-text="[장소] · [날짜]&#10;&#10;소개 글을 입력하세요.">' +
      '<span>[제목]' + (kind ? ' (' + kind + ')' : '') + '</span><span>[장소]</span><span>[날짜]</span></a>';
  }

  // 썸네일 SVG: 각 레이아웃의 thumb(r, C) 가 도형을 그립니다
  var C = { g: '#C9C5BD', d: '#8D887F', k: '#3A3833' };
  function r(x, y, w, h, c) { return "<rect x='" + x + "' y='" + y + "' width='" + w + "' height='" + h + "' fill='" + (c || C.g) + "'/>"; }
  KZ.thumbSvg = function (id) {
    var L = KZ.layouts[id], s = '';
    try { s = L && L.thumb ? L.thumb(r, C) : ''; } catch (e) { s = ''; }
    return "<svg viewBox='0 0 120 84' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'><rect width='120' height='84' fill='#F1EFEA'/>" + s + '</svg>';
  };

  // 섹션으로 쓰기: 레이아웃 HTML 에서 상단 메뉴(header.nav)와 바닥글(footer.foot)을 뺀 본문만
  // 레이아웃에 section(data) 가 있으면 그것을, 없으면 html(data) 에서 떼어 냅니다.
  KZ.stripChrome = function (html) {
    var t = document.createElement('template'); t.innerHTML = html;
    [].forEach.call(t.content.querySelectorAll('header.nav, footer.foot'), function (el) { el.remove(); });
    return t.innerHTML.trim();
  };
  KZ.sectionHtml = function (id, data) {
    var L = KZ.layouts[id]; if (!L) throw new Error('레이아웃 없음: ' + id);
    return L.section ? L.section(data) : KZ.stripChrome(L.html(data));
  };

  KZ.H = { ph: ph, phl: phl, nav: nav, FOOT: FOOT, fig: fig, exRow: exRow, MENU_BTN: MENU_BTN };
})(window.KZ);
