/* 내보내기 — 사이트 CSS · 런타임 불러오기, 완성 HTML 만들기, 파일 받기 */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var ui = KZ.ui;
  KZ.site = { base: '', motion: '', runtime: '' };

  KZ.loadSiteAssets = function () {
    var get = function (p) { return fetch(p + '?v=' + (KZ.VERSION || ''), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(p + ' ' + r.status); return r.text(); }); };
    return Promise.all([get('site/base.css'), get('site/motion.css'), get('site/runtime.js')]).then(function (t) {
      KZ.site.base = t[0]; KZ.site.motion = t[1]; KZ.site.runtime = t[2];
    });
  };

  // o: { pages:[{id,name,html}], css, S, startId }
  KZ.buildSite = function (o) {
    var esc = ui.esc, S = o.S;
    var fix = function (html) { return html.replace(/<video\b(?![^>]*\bplaysinline)/g, '<video playsinline muted'); };
    var body = o.pages.map(function (p) { return '<div class="rt-page" data-page="' + esc(p.id) + '" hidden>' + fix(p.html) + '</div>'; }).join('\n');
    var meta = JSON.stringify({ start: o.startId || (o.pages[0] && o.pages[0].id), pages: o.pages.map(function (p) { var m = { id: p.id, name: p.name }; if (p.parent) m.parent = p.parent; if (p.menu === false) m.menu = false; return m; }) }).replace(/</g, '\\u003c');
    return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(S.siteName) + '</title>\n' +
      '<meta name="generator" content="KZ site editor ' + esc(KZ.VERSION) + '">\n' +
      '<link rel="stylesheet" href="' + KZ.C.FONT_LINK.replace(/&/g, '&amp;') + '">\n<style>\n' + KZ.themeCss(S) + '\n' + KZ.site.base + '\n' + KZ.site.motion + '\n' + (o.css || '') + '\n</style>\n</head>\n' +
      '<body class="rt" data-transition="' + esc(S.transition) + '" data-speed="' + esc(S.speed) + '">\n' + body + '\n' +
      '<div id="rt-curtain"></div><img id="rt-cursor" alt=""><div id="rt-ov" class="rt-ov" hidden><div class="rt-back"></div><div class="rt-box" role="dialog" aria-modal="true"></div></div>\n' +
      '<script type="application/json" id="rt-meta">' + meta + '<\/script>\n<script>\n' + KZ.site.runtime + '\n<\/script>\n</body>\n</html>';
  };

  // 파일 받기: Claude 아티팩트 안이면 downloads 기능, 일반 웹이면 바로 내려받기, 막히면 복사 창
  var DL = null;
  (function () { try { if (window.claude && window.claude.use) window.claude.use('downloads').then(function (d) { DL = d; }, function () { DL = null; }); } catch (e) { DL = null; } })();
  function directDownload(name, data, mime) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  KZ.offerFile = function (name, data, mime) {
    if (DL) { return DL.save({ filename: name, data: data }).then(function () { ui.toast('파일 저장을 요청했습니다'); }, function () { fallback(); }); }
    var inFrame = window.top !== window.self;
    if (!inFrame) { try { directDownload(name, data, mime); ui.toast(name + ' 을(를) 내려받았습니다'); return Promise.resolve(); } catch (e) { /* 아래 창으로 */ } }
    return fallback();
    function fallback() {
      var h = ui.h, kb = Math.round(data.length / 1024);
      var ta = h('textarea', { readOnly: true, value: data.length > 20000 ? data.slice(0, 20000) + '\n…(미리보기는 앞부분만 표시, 복사하면 전체가 복사됩니다)' : data });
      var body = h('div', {}, [h('p', { innerHTML: '<b>' + ui.esc(name) + '</b> · ' + kb + ' KB<br>파일 저장이 막혀 있으면 [복사]한 뒤 메모장에 붙여 넣어 같은 이름으로 저장하세요.' }), ta]);
      return ui.dialog('파일 받기', body, [['닫기', null], ['복사', function () { (navigator.clipboard ? navigator.clipboard.writeText(data) : Promise.reject()).then(function () { ui.toast('복사했습니다'); }, function () { ta.select(); ui.toast('복사가 막혀 있습니다. 직접 선택해 복사하세요'); }); }], ['파일로 받기', function () { try { directDownload(name, data, mime); } catch (e) { ui.toast('파일 저장이 막혀 있습니다'); } }, 'pri']]);
    }
  };
})(window.KZ);
