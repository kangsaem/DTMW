/* 편집기 화면 도구 — 알림 · 대화상자 · 입력 컨트롤 (슬라이더 · 선택 버튼 · 색 견본) */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
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
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  KZ.ui = { $: $, $$: $$, esc: esc, toast: toast, dialog: dialog, confirmDlg: confirmDlg, h: h, field: field, slider: slider, seg: seg, opts: opts, swatches: swatches, toHex: toHex, num: num,
    setStatus: function (s) { $('#status').textContent = s; } };
})(window.KZ);
