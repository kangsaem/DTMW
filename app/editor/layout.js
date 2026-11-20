/* 화면 배치 — 패널 떼어내기(떠 있는 창) · 다시 붙이기 · 도구 숨기기(Tab)
   위치와 상태는 이 브라우저에 기억합니다 (localStorage, 실패해도 동작). */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var KEY = 'kz-ui-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function store(u) { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch (e) { /* 저장 불가 */ } }

  KZ.layoutUi = {
    init: function (editor) {
      var $ = KZ.ui.$, main = $('#main'), app = $('.app');
      var U = load();
      var refresh = function () { setTimeout(function () { try { editor.refresh(); } catch (e) { /* 무시 */ } }, 60); };
      var panels = { drawer: $('#drawer'), side: $('#side') };

      function place(name) {
        var el = panels[name], st = U[name] || {};
        // 창 밖으로 꺼낸 패널(popout)이면 그 자리를 비운 상태를 유지 — 창 크기를 바꿀 때 빈 칸이 다시 생기던 문제
        var outside = KZ.popout && KZ.popout.isOut && KZ.popout.isOut(name);
        main.classList.toggle('float-' + name, !!st.float || !!outside);
        el.classList.toggle('floating', !!st.float);
        if (st.float) {
          var r = main.getBoundingClientRect();
          var w = el.offsetWidth || 300, hgt = el.offsetHeight || 400;
          var x = Math.max(8, Math.min(st.x == null ? (name === 'side' ? r.width - w - 24 : 80) : st.x, r.width - w - 8));
          var y = Math.max(8, Math.min(st.y == null ? 16 : st.y, Math.max(8, r.height - Math.min(hgt, 160))));
          el.style.left = x + 'px'; el.style.top = y + 'px';
        } else { el.style.left = ''; el.style.top = ''; }
        var b = el.querySelector('[data-detach]');
        if (b) { b.textContent = st.float ? '⇥' : '⧉'; b.title = st.float ? '제자리에 붙이기' : '떼어내서 떠 있는 창으로'; b.setAttribute('aria-label', b.title); }
      }
      function toggle(name) {
        U[name] = U[name] || {}; U[name].float = !U[name].float; store(U);
        if (name === 'drawer' && U[name].float) main.classList.remove('no-drawer');
        place(name); refresh();
      }
      Object.keys(panels).forEach(function (name) {
        var el = panels[name];
        var b = el.querySelector('[data-detach]'); if (b) b.onclick = function () { toggle(name); };
        var head = el.querySelector('.panel-head');
        if (head) head.addEventListener('mousedown', function (e) {
          if (!U[name] || !U[name].float || e.target.closest('button')) return;
          e.preventDefault();
          var sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
          var mv = function (ev) { U[name].x = ox + ev.clientX - sx; U[name].y = oy + ev.clientY - sy; place(name); };
          var up = function () { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); store(U); };
          document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
        });
        place(name);
      });
      window.addEventListener('resize', function () { place('drawer'); place('side'); });

      // 도구 숨기기
      function zen(on) { app.classList.toggle('zen', on); $('#zenBtn').classList.toggle('on', on); $('#zenBtn').setAttribute('aria-pressed', on ? 'true' : 'false'); refresh(); }
      $('#zenBtn').onclick = function () { zen(!app.classList.contains('zen')); };
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
        var a = document.activeElement, typing = a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
        if (typing || document.querySelector('.dlg-back.open') || document.querySelector('.pv.open')) return;
        // 편집 화면(iframe) 안에서 글을 고치는 중이면 Tab 은 글 쪽에 맡김 (도구 숨기기 안 함)
        var ed = window.__kzEditor;
        if (ed && ed.getEditing && ed.getEditing()) return;
        if (a && a.tagName === 'IFRAME') { try { var ia = a.contentDocument && a.contentDocument.activeElement; if (ia && ia.isContentEditable) return; } catch (er) { /* 다른 출처 */ } }
        if (a && a !== document.body && a.tagName !== 'IFRAME') return; // 키보드로 버튼을 옮겨 다닐 때는 원래 Tab 동작
        e.preventDefault(); zen(!app.classList.contains('zen'));
      });
      KZ.layoutUi.state = function () { return JSON.parse(JSON.stringify(U)); };
      KZ.layoutUi.toggle = toggle;
    }
  };
})(window.KZ);
