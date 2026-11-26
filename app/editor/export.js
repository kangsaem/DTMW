/* 내보내기 — 사이트 CSS · 런타임 불러오기, 완성 HTML 만들기, 파일 받기 */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var ui = KZ.ui;
  KZ.site = { base: '', motion: '', runtime: '', fonts: {} };

  KZ.loadSiteAssets = function () {
    var get = function (p) { return fetch(p + '?v=' + (KZ.VERSION || ''), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(p + ' ' + r.status); return r.text(); }); };
    // 직접 제공하는 글꼴(app/fonts)은 내보낼 때 html 안에 넣도록 미리 읽어 둡니다. 실패해도 편집기는 열림 (그 경우 내보낸 사이트는 대체 글꼴)
    var b64 = function (buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
    var fonts = [];
    Object.keys(KZ.C.FONT_SRC).forEach(function (n) {
      var v = KZ.C.FONT_SRC[n]; if (v.indexOf('local:') !== 0) return;
      ['regular', 'bold'].forEach(function (w) {
        var key = v.slice(6) + '-' + w;
        fonts.push(fetch('fonts/' + key + '.woff2?v=' + (KZ.VERSION || '')).then(function (r) { if (!r.ok) throw new Error(key); return r.arrayBuffer(); })
          .then(function (buf) { KZ.site.fonts[key] = b64(buf); }, function () { /* 글꼴 없음 */ }));
      });
    });
    return Promise.all([get('site/base.css'), get('site/motion.css'), get('site/runtime.js')].concat(fonts)).then(function (t) {
      KZ.site.base = t[0]; KZ.site.motion = t[1]; KZ.site.runtime = t[2];
    });
  };

  // 설명 · 공유 미리보기 · 파비콘. o.shareSrc · o.iconSrc: 고른 사진 주소 (없으면 공유 이미지 없음, 파비콘은 이름 첫 글자)
  KZ.headMeta = function (S, o) {
    var esc = ui.esc, out = '', url = String(S.siteUrl || '').trim().replace(/\/+$/, '');
    if (S.desc) out += '<meta name="description" content="' + esc(S.desc) + '">\n<meta property="og:description" content="' + esc(S.desc) + '">\n';
    out += '<meta property="og:type" content="website">\n<meta property="og:title" content="' + esc(S.siteName || '') + '">\n';
    if (url) out += '<meta property="og:url" content="' + esc(url + '/') + '">\n';
    // 공유 이미지는 전체 주소가 있어야 카카오톡 · 페이스북에서 보임 — ZIP 으로 받으면 media/파일 로 바뀜
    if (url && o.shareSrc) out += '<meta property="og:image" content="' + esc(url) + '/' + o.shareSrc + '">\n';
    var icon = o.iconSrc;
    if (!icon) {
      var ch = (String(S.siteName || 'W').replace(/[\[\]\s]/g, '') || 'W').charAt(0), c = (S.colors || {});
      icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="' + (c.ink || '#1A1A1A') + '"/><text x="32" y="44" font-family="sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="' + (c.bg || '#FFFFFF') + '">' + esc(ch) + '</text></svg>');
    }
    out += '<link rel="icon" href="' + icon + '">\n';
    return out;
  };
  // o: { pages:[{id,name,html}], css, S, startId }
  KZ.buildSite = function (o) {
    var esc = ui.esc, S = o.S;
    var fix = function (html) { return html.replace(/<video\b(?![^>]*\bplaysinline)/g, '<video playsinline muted'); };
    var body = o.pages.map(function (p) { return '<div class="rt-page" data-page="' + esc(p.id) + '" hidden>' + fix(p.html) + '</div>'; }).join('\n');
    var meta = JSON.stringify({ site: S.siteName || '', start: o.startId || (o.pages[0] && o.pages[0].id), pages: o.pages.map(function (p) { var m = { id: p.id, name: p.name }; if (p.parent) m.parent = p.parent; if (p.menu === false) m.menu = false; return m; }) }).replace(/</g, '\\u003c');
    return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(S.siteName) + '</title>\n' + KZ.headMeta(S, o) +
      '<meta name="generator" content="WMW ' + esc(KZ.VERSION) + '">\n' +
      KZ.fontHead(KZ.themeCss(S) + (o.css || '') + body, { embed: true }) + '\n<style>\n' + KZ.themeCss(S) + '\n' + KZ.site.base + '\n' + KZ.site.motion + '\n' + (o.css || '') + '\n</style>\n</head>\n' +
      '<body class="rt" data-transition="' + esc(S.transition) + '" data-speed="' + esc(S.speed) + '">\n' + body + '\n' +
      '<div id="rt-curtain"></div><img id="rt-cursor" alt=""><div id="rt-ov" class="rt-ov" hidden><div class="rt-back"></div><div class="rt-box" role="dialog" aria-modal="true"></div></div>\n' +
      '<script type="application/json" id="rt-meta">' + meta + '<\/script>\n<script>\n' + KZ.site.runtime + '\n<\/script>\n</body>\n</html>';
  };

  // ---------- ZIP 내보내기 (index.html + media/) ----------
  // 올린 사진 · 영상(S.assets)의 data URI 를 media/파일 로 바꿉니다. 샘플 그림 · 글꼴은 html 안에 그대로 둡니다.
  var EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/ogg': 'ogv' };
  function slug(name, fallback) {
    var base = String(name || '').replace(/\.[^.]+$/, '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return /[a-z]/.test(base) ? base : fallback; // 한글 이름 등 영문이 없으면 photo-1 · video-1
  }
  function b64bytes(b64) { var bin = atob(b64), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  KZ.packSite = function (html, assets) {
    var media = [], used = {}, n = { image: 0, video: 0 };
    (assets || []).forEach(function (a) {
      if (!a || !a.src || a.src.indexOf('data:') !== 0 || html.indexOf(a.src) < 0) return;
      var m = a.src.match(/^data:([^;,]+)(;base64)?,/); if (!m || !m[2]) return;
      var kind = a.type === 'video' ? 'video' : 'image'; n[kind]++;
      var name = slug(a.name, kind === 'video' ? 'video-' + n.video : 'photo-' + n.image), ext = EXT[m[1]] || 'bin', file = name + '.' + ext, k = 2;
      while (used[file]) file = name + '-' + (k++) + '.' + ext;
      used[file] = 1;
      var bytes = b64bytes(a.src.slice(m[0].length));
      html = html.split(a.src).join('media/' + file);
      media.push({ path: 'media/' + file, bytes: bytes, size: bytes.length, type: kind });
    });
    return { html: html, media: media };
  };
  // 무압축(store) ZIP — 외부 라이브러리 없음. files: [{ path, bytes(Uint8Array) | text }]
  var CRC = (function () { var t = new Uint32Array(256); for (var i = 0; i < 256; i++) { var c = i; for (var j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  KZ.zip = function (files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0, d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.path), data = f.bytes || enc.encode(f.text || ''), crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    var csize = central.reduce(function (s, x) { return s + x.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    var all = parts.concat(central, [new Uint8Array(e.buffer)]), total = all.reduce(function (s, x) { return s + x.length; }, 0), out = new Uint8Array(total), p = 0;
    all.forEach(function (x) { out.set(x, p); p += x.length; });
    return out;
  };
  KZ.GH_LIMIT = 25 * 1024 * 1024; // GitHub 웹 업로드 · 파일 하나 한도 (25 MiB)

  // 파일 받기: 바로 내려받기, 막히면(다른 사이트 안에 끼워 넣은 경우 등) 복사 창
  function directDownload(name, data, mime) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  KZ.offerFile = function (name, data, mime) {
    var inFrame = window.top !== window.self;
    if (!inFrame) { try { directDownload(name, data, mime); ui.toast(name + ' 을(를) 내려받았습니다'); return Promise.resolve(); } catch (e) { /* 아래 창으로 */ } }
    return fallback();
    function fallback() {
      if (typeof data !== 'string') { return ui.dialog('파일 받기', '<p>이 화면에서는 파일 받기가 막혀 있습니다. 편집기(wmw.scubob.com)를 새 탭으로 열어 다시 시도하세요.</p>'); }
      var h = ui.h, kb = Math.round(data.length / 1024);
      var ta = h('textarea', { readOnly: true, value: data.length > 20000 ? data.slice(0, 20000) + '\n…(미리보기는 앞부분만 표시, 복사하면 전체가 복사됩니다)' : data });
      var body = h('div', {}, [h('p', { innerHTML: '<b>' + ui.esc(name) + '</b> · ' + kb + ' KB<br>파일 저장이 막혀 있으면 [복사]한 뒤 메모장에 붙여 넣어 같은 이름으로 저장하세요.' }), ta]);
      return ui.dialog('파일 받기', body, [['닫기', null], ['복사', function () { (navigator.clipboard ? navigator.clipboard.writeText(data) : Promise.reject()).then(function () { ui.toast('복사했습니다'); }, function () { ta.select(); ui.toast('복사가 막혀 있습니다. 직접 선택해 복사하세요'); }); }], ['파일로 받기', function () { try { directDownload(name, data, mime); } catch (e) { ui.toast('파일 저장이 막혀 있습니다'); } }, 'pri']]);
    }
  };
})(window.KZ);
