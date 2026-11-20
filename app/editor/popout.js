/* 패널을 브라우저 창 밖으로 — 항상 위 작은 창(Document Picture-in-Picture, Chrome · Edge PC),
   안 되는 브라우저는 별도 팝업 창. 패널 요소를 그대로 옮기므로 기능 · 이벤트가 유지됩니다.
   창을 닫으면 제자리로 돌아옵니다. 한 번에 한 패널만 (PiP 창은 탭마다 1개). */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var cur = null; // { name, el, mark, win, kind }
  var TITLE = { drawer: '도구', side: '디자인' };

  function copyStyles(doc) {
    [].forEach.call(document.querySelectorAll('link[rel="stylesheet"], style'), function (n) {
      if (n.tagName === 'LINK') { var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = n.href; doc.head.appendChild(l); }
      else { var st = doc.createElement('style'); st.textContent = n.textContent; doc.head.appendChild(st); }
    });
  }
  function openWindow(name, w, h) {
    var usePip = !KZ.forcePopup && 'documentPictureInPicture' in window;
    var p = usePip ? window.documentPictureInPicture.requestWindow({ width: w, height: h }).then(function (win) { return { win: win, kind: 'pip' }; }) : Promise.reject();
    return p.catch(function () {
      var win = window.open('', 'wmw-' + name, 'popup,width=' + w + ',height=' + h);
      if (!win) throw new Error('팝업이 막혀 있습니다. 주소창 오른쪽의 팝업 허용을 눌러 주세요.');
      win.document.open(); win.document.write('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title></title></head><body></body></html>'); win.document.close();
      return { win: win, kind: 'popup' };
    });
  }
  function btnState(name, out) {
    var b = KZ.ui.$('[data-popout="' + name + '"]'); if (!b) return;
    b.textContent = out ? '⇲' : '↗'; b.title = out ? '편집기 안으로 되돌리기' : '브라우저 창 밖으로 (따로 띄우기)'; b.setAttribute('aria-label', b.title);
  }
  function back() {
    if (!cur) return;
    var c = cur; cur = null;
    var i = KZ.ui.docs.indexOf(c.win.document); if (i >= 0) KZ.ui.docs.splice(i, 1);
    c.el.classList.remove('outside');
    if (c.mark.parentNode) { c.mark.parentNode.insertBefore(c.el, c.mark); c.mark.remove(); }
    document.getElementById('main').classList.remove('float-' + c.name);
    btnState(c.name, false);
    if (KZ.popout.onChange) KZ.popout.onChange();
  }
  function out(name) {
    var el = document.getElementById(name); if (!el) return Promise.resolve();
    var st = KZ.layoutUi && KZ.layoutUi.state ? KZ.layoutUi.state() : {};
    if (st[name] && st[name].float) KZ.layoutUi.toggle(name); // 떠 있는 창이면 먼저 제자리에
    var w = Math.max(320, el.offsetWidth || 300), h = Math.min(screen.availHeight - 80, 860);
    return openWindow(name, w, h).then(function (r) {
      var win = r.win, doc = win.document;
      doc.title = 'WMW · ' + TITLE[name]; doc.documentElement.lang = 'ko';
      copyStyles(doc); doc.body.className = 'kz-out';
      var mark = document.createComment('panel:' + name); el.parentNode.insertBefore(mark, el);
      doc.body.appendChild(el); el.classList.add('outside');
      KZ.ui.docs.push(doc);
      cur = { name: name, el: el, mark: mark, win: win, kind: r.kind };
      document.getElementById('main').classList.add('float-' + name);
      btnState(name, true);
      win.addEventListener('pagehide', back);
      if (r.kind === 'popup') { var t = setInterval(function () { if (!cur || cur.win !== win) return clearInterval(t); if (win.closed) { clearInterval(t); back(); } }, 500); }
      if (KZ.popout.onChange) KZ.popout.onChange();
      return r.kind;
    });
  }
  KZ.popout = {
    supported: function () { return typeof window.open === 'function'; },
    current: function () { return cur ? { name: cur.name, kind: cur.kind } : null; },
    toggle: function (name) {
      if (cur && cur.name === name) { try { cur.win.close(); } catch (e) { /* 무시 */ } back(); return Promise.resolve(null); }
      if (cur) { try { cur.win.close(); } catch (e) { /* 무시 */ } back(); }
      return out(name);
    },
    back: back,
    onChange: null
  };
  window.addEventListener('pagehide', function () { if (cur) try { cur.win.close(); } catch (e) { /* 무시 */ } });
})(window.KZ);
