/* 편집기 화면 도구 — 알림 · 대화상자 · 입력 컨트롤 (슬라이더 · 선택 버튼 · 색 견본) */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  // 바깥 창(패널을 창 밖으로 꺼냈을 때)의 document 도 함께 찾습니다 — KZ.ui.docs 에 등록
  var docs = [];
  var $ = function (s, r) {
    if (r) return r.querySelector(s);
    var x = document.querySelector(s);
    for (var i = 0; !x && i < docs.length; i++) { try { x = docs[i].querySelector(s); } catch (e) { /* 닫힌 창 */ } }
    return x;
  };
  var $$ = function (s, r) {
    if (r) return Array.prototype.slice.call(r.querySelectorAll(s));
    var out = Array.prototype.slice.call(document.querySelectorAll(s));
    docs.forEach(function (d) { try { out = out.concat(Array.prototype.slice.call(d.querySelectorAll(s))); } catch (e) { /* 닫힌 창 */ } });
    return out;
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var toastT;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600); }

  // buttons: [[이름, 값 또는 function(done), 'pri'?], ...] → Promise(값)
  function dialog(title, body, buttons) {
    return new Promise(function (res) {
      var back = $('#dlg');
      $('#dlgT').textContent = title;
      var b = $('#dlgB'); b.innerHTML = ''; if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
      var f = $('#dlgF'); f.innerHTML = '';
      var onKey = function (e) { if (e.key === 'Escape') done(null); };
      var done = function (v) { back.classList.remove('open'); document.removeEventListener('keydown', onKey); res(v); };
      (buttons || [['확인', true, 'pri']]).forEach(function (bt) {
        var x = document.createElement('button'); x.className = 'btn ' + (bt[2] || ''); x.textContent = bt[0];
        x.onclick = function () { return typeof bt[1] === 'function' ? bt[1](done) : done(bt[1]); }; f.appendChild(x);
      });
      back.classList.add('open'); document.addEventListener('keydown', onKey);
      back.onclick = function (e) { if (e.target === back) done(null); };
      var first = f.querySelector('.pri') || f.lastChild; if (first) first.focus();
    });
  }
  function confirmDlg(title, msg, ok) { return dialog(title, '<p>' + msg + '</p>', [['취소', false], [ok || '확인', true, 'pri']]); }

  function h(tag, props, kids) {
    var e = document.createElement(tag); Object.assign(e, props || {});
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }
  function field(label, ctl) { return h('div', { className: 'field' }, [h('span', { className: 'lbl', textContent: label }), ctl]); }
  function slider(label, min, max, step, cur, fmt, onInput) {
    var out = h('output', { textContent: fmt(cur) });
    var r = h('input', { type: 'range', min: min, max: max, step: step, value: cur });
    r.setAttribute('aria-label', label);
    r.oninput = function () { out.textContent = fmt(+r.value); onInput(+r.value); };
    // 숫자를 눌러 직접 입력 (정확한 값으로 맞출 때)
    out.title = '눌러서 숫자 입력'; out.tabIndex = 0; out.setAttribute('role', 'button');
    out.onclick = out.onkeydown = function (e) {
      if (e.type === 'keydown' && e.key !== 'Enter') return;
      var inp = h('input', { type: 'number', className: 'num-in', step: step, value: r.value });
      var done = false, apply = function (ok) {
        if (done) return; done = true;
        if (ok && inp.value !== '' && !isNaN(+inp.value)) { var v = Math.max(+min, Math.min(+max, +inp.value)); r.value = v; out.textContent = fmt(v); onInput(v); }
        inp.replaceWith(out);
      };
      inp.onkeydown = function (ev) { if (ev.key === 'Enter') apply(true); if (ev.key === 'Escape') apply(false); ev.stopPropagation(); };
      inp.onblur = function () { apply(true); };
      out.replaceWith(inp); inp.focus(); inp.select();
    };
    return field(label, h('div', { className: 'slider' }, [r, out]));
  }
  function seg(label, items, cur, on) {
    var box = h('div', { className: 'seg' });
    items.forEach(function (it) { var b = h('button', { textContent: it[1], className: it[0] === cur ? 'on' : '' }); b.onclick = function () { $$('button', box).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); on(it[0]); }; box.appendChild(b); });
    return label ? field(label, box) : box;
  }
  function opts(items, cur, on) {
    var box = h('div', { className: 'opts' });
    items.forEach(function (it) { var b = h('button', { textContent: it[1], className: it[0] === cur ? 'on' : '' }); b.onclick = function () { $$('button', box).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); on(it[0]); }; box.appendChild(b); });
    return box;
  }
  function toHex(c) { if (!c) return ''; if (/^#[0-9a-f]{6}$/i.test(c)) return c; var m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); return m ? '#' + [m[1], m[2], m[3]].map(function (x) { return (+x).toString(16).padStart(2, '0'); }).join('') : ''; }
  // colors: 현재 테마 색 (S.colors)
  function swatches(label, cur, on, allowNone, colors) {
    var box = h('div', { className: 'sw' });
    var list = [['var(--ink)', colors.ink], ['var(--bg)', colors.bg], ['var(--accent)', colors.accent], ['var(--sub)', colors.sub], ['var(--line)', colors.line], ['#FFFFFF', '#FFFFFF'], ['#000000', '#000000']];
    if (allowNone) { var n = h('button', { className: 'none', title: '없음' }); n.setAttribute('aria-label', '색 없음'); n.onclick = function () { on(''); }; box.appendChild(n); }
    list.forEach(function (it) { var b = h('button', { title: it[0].indexOf('var') === 0 ? '테마 색' : it[1] }); b.style.background = it[1]; b.setAttribute('aria-label', '색 ' + it[1]); b.onclick = function () { on(it[0]); }; box.appendChild(b); });
    var pick = h('input', { type: 'color', value: toHex(cur) || '#888888', title: '직접 고르기' }); pick.setAttribute('aria-label', '직접 색 고르기');
    pick.oninput = function () { on(pick.value); }; box.appendChild(pick);
    return field(label, box);
  }
  // 반응형 글자 크기 min(48px, 7.03vw) 는 앞의 px 값으로 읽음
  function num(v, d) { var m = /^min\(\s*(-?[\d.]+)px/.exec(String(v || '')); var n = m ? +m[1] : parseFloat(v); return isNaN(n) ? d : n; }

  // 붙여넣기 정리: 서식 · 클래스 · 글꼴은 버리고 글 · 굵게 · 기울임 · 줄바꿈 · 링크(http · mailto · tel · #)만. inLink 면 링크도 뺌(링크 안 링크 방지)
  KZ.cleanPaste = function (html, text, inLink) {
    if (!html) return esc(text || '').replace(/\r?\n/g, '<br>');
    var t = document.createElement('template'); t.innerHTML = html.replace(/<!--[\s\S]*?-->/g, '');
    var BLOCK = /^(P|DIV|LI|H[1-6]|TR|BLOCKQUOTE|PRE|SECTION|ARTICLE|UL|OL|TABLE|FIGURE|HEADER|FOOTER)$/;
    function walk(n, link) {
      var out = '';
      n.childNodes.forEach(function (c) {
        if (c.nodeType === 3) { out += esc(c.nodeValue.replace(/\s+/g, ' ')); return; }
        if (c.nodeType !== 1) return;
        var tg = c.tagName;
        if (/^(STYLE|SCRIPT|META|LINK|TITLE|XML|O:P|HEAD)$/.test(tg)) return;
        if (tg === 'BR') { out += '<br>'; return; }
        var inner = walk(c, link || tg === 'A');
        var fw = c.style && c.style.fontWeight, fs = c.style && c.style.fontStyle;
        if (tg === 'B' || tg === 'STRONG' || fw === 'bold' || +fw >= 600) inner = inner.trim() ? '<b>' + inner + '</b>' : inner;
        if (tg === 'I' || tg === 'EM' || fs === 'italic') inner = inner.trim() ? '<i>' + inner + '</i>' : inner;
        if (tg === 'A' && !link && !inLink) {
          var h = c.getAttribute('href') || '';
          if (!inner.trim()) inner = ''; else if (/^(https?:|mailto:|tel:|#)/i.test(h)) inner = '<a href="' + esc(h) + '">' + inner + '</a>';
        }
        if (BLOCK.test(tg)) inner = inner.replace(/^\s+|\s+$/g, '') + '<br>';
        out += inner;
      });
      return out;
    }
    var r = walk(t.content, false).replace(/(<br>\s*){3,}/g, '<br><br>').replace(/^(\s|<br>)+|(\s|<br>)+$/g, '');
    return r || esc(text || '').replace(/\r?\n/g, '<br>');
  };
  KZ.ui = { docs: docs, $: $, $$: $$, esc: esc, toast: toast, dialog: dialog, confirmDlg: confirmDlg, h: h, field: field, slider: slider, seg: seg, opts: opts, swatches: swatches, toHex: toHex, num: num,
    setStatus: function (s, bad) { var e = $('#status'); e.textContent = s; e.classList.toggle('bad', !!bad); } };
})(window.KZ);
