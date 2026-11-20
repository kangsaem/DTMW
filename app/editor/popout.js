/* 패널을 브라우저 창 밖으로 — 항상 위 작은 창(Document Picture-in-Picture, Chrome · Edge PC),
   안 되는 브라우저는 별도 팝업 창. 패널 요소를 그대로 옮기므로 기능 · 이벤트가 유지됩니다.
   창을 닫으면 제자리로 돌아옵니다. 두 패널을 함께 꺼낼 수 있습니다 — PiP 창은 탭마다 1개라
   먼저 꺼낸 패널이 PiP 를 쓰고 있으면 두 번째 패널은 일반 팝업 창으로 엽니다. */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var outs = {}; // name → { name, el, mark, win, kind }
  var TITLE = { drawer: '도구', side: '디자인' };

  function copyStyles(doc) {
    [].forEach.call(document.querySelectorAll('link[rel="stylesheet"], style'), function (n) {
      if (n.tagName === 'LINK') { var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = n.href; doc.head.appendChild(l); }
      else { var st = doc.createElement('style'); st.textContent = n.textContent; doc.head.appendChild(st); }
    });
  }
  function pipBusy() { for (var k in outs) if (outs[k].kind === 'pip') return true; return false; }
  function openWindow(name, w, h) {
    var usePip = !KZ.forcePopup && 'documentPictureInPicture' in window && !pipBusy();
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
  // 창 하나가 닫힐 때 그 창의 패널만 되돌림 (이전에는 늦게 온 닫힘 신호가 새로 꺼낸 패널까지 되돌려 빈 창이 됐음)
  function back(name, win) {
    var c = outs[name]; if (!c || (win && c.win !== win)) return;
    delete outs[name];
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
      outs[name] = { name: name, el: el, mark: mark, win: win, kind: r.kind };
      document.getElementById('main').classList.add('float-' + name);
      btnState(name, true);
      win.addEventListener('pagehide', function () { back(name, win); });
      if (r.kind === 'popup') { var t = setInterval(function () { if (!outs[name] || outs[name].win !== win) return clearInterval(t); if (win.closed) { clearInterval(t); back(name, win); } }, 500); }
      if (KZ.popout.onChange) KZ.popout.onChange();
      return r.kind;
    });
  }
  KZ.popout = {
    supported: function () { return typeof window.open === 'function'; },
    current: function () { var k = Object.keys(outs)[0]; return k ? { name: k, kind: outs[k].kind } : null; },
    list: function () { return Object.keys(outs).map(function (k) { return { name: k, kind: outs[k].kind }; }); },
    isOut: function (name) { return !!outs[name]; },
    toggle: function (name) {
      var c = outs[name];
      if (c) { back(name); try { c.win.close(); } catch (e) { /* 무시 */ } return Promise.resolve(null); }
      return out(name);
    },
    back: back,
    onChange: null
  };
  window.addEventListener('pagehide', function () { for (var k in outs) try { outs[k].win.close(); } catch (e) { /* 무시 */ } });
})(window.KZ);
