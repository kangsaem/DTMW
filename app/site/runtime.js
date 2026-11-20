/* 완성 사이트 런타임 — 페이지 전환 · 스크롤 등장 · 패럴랙스 · 커서 미리보기 · 팝업
   내보낸 index.html 안에 그대로 들어갑니다. 외부 라이브러리 없음. */
(function () {
  var B = document.body, meta = {};
  try { meta = JSON.parse(document.getElementById('rt-meta').textContent); } catch (e) { }
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = { slow: 900, normal: 600, fast: 350 }[B.getAttribute('data-speed')] || 600; if (rm) D = 0;
  document.documentElement.style.setProperty('--d', D + 'ms');
  var pages = [].slice.call(document.querySelectorAll('.rt-page')), cur = null, busy = false;
  var KF = {
    fade: [[{ opacity: 1 }, { opacity: 0 }], [{ opacity: 0 }, { opacity: 1 }]],
    slide: [[{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-8%)' }], [{ opacity: 0, transform: 'translateX(8%)' }, { opacity: 1, transform: 'none' }]],
    blur: [[{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(16px)' }], [{ opacity: 0, filter: 'blur(16px)' }, { opacity: 1, filter: 'blur(0px)' }]],
    zoom: [[{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.05)' }], [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }]]
  };
  // 가림막(mask) 효과는 clip-path 때문에 요소 자체가 '안 보이는' 것으로 계산되므로, 바깥 요소를 대신 관찰합니다
  var waiting = typeof Map === 'function' ? new Map() : null;
  var io = ('IntersectionObserver' in window && waiting) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      (waiting.get(e.target) || []).forEach(function (el) { el.classList.add('in'); });
      waiting.delete(e.target); io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }) : null;
  function arm(p) {
    [].forEach.call(p.querySelectorAll('[data-anim]'), function (el) {
      if (!io || !D) { el.classList.add('in'); return; }
      el.classList.remove('in');
      var watch = el.getAttribute('data-anim') === 'mask' && el.parentElement ? el.parentElement : el;
      var list = waiting.get(watch); if (!list) { list = []; waiting.set(watch, list); io.observe(watch); }
      list.push(el);
    });
  }
  function find(id) { for (var i = 0; i < pages.length; i++) if (pages[i].getAttribute('data-page') === id) return pages[i]; return null; }
  function reveal(p) { p.hidden = false; window.scrollTo(0, 0); arm(p); par(); }
  function go(id, anim) {
    var next = find(id) || pages[0]; if (!next || next === cur || busy) return;
    var prev = cur; cur = next;
    try { history.replaceState(null, '', '#' + next.getAttribute('data-page')); } catch (e) { }
    var t = B.getAttribute('data-transition') || 'fade';
    if (!prev || !anim || !D || t === 'none' || !next.animate) { if (prev) prev.hidden = true; reveal(next); return; }
    busy = true;
    if (t === 'curtain') {
      var c = document.getElementById('rt-curtain'), ez = 'cubic-bezier(.7,0,.3,1)';
      c.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: D * 0.7, easing: ez, fill: 'forwards' }).onfinish = function () {
        prev.hidden = true; reveal(next);
        c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: D * 0.7, easing: ez, fill: 'forwards' }).onfinish = function () { busy = false; };
      };
      return;
    }
    var k = KF[t] || KF.fade;
    prev.animate(k[0], { duration: D * 0.45, easing: 'ease-in', fill: 'forwards' }).onfinish = function () {
      prev.hidden = true; if (prev.getAnimations) prev.getAnimations().forEach(function (a) { a.cancel(); });
      reveal(next); next.animate(k[1], { duration: D * 0.6, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = function () { busy = false; };
    };
  }
  function par() {
    if (!D || !cur) return;
    [].forEach.call(cur.querySelectorAll('[data-scroll="parallax"]'), function (el) {
      var b = (el.parentElement || el).getBoundingClientRect(); var o = (b.top + b.height / 2 - innerHeight / 2) * -0.18;
      el.style.transform = 'translate3d(0,' + o.toFixed(1) + 'px,0) scale(1.12)';
    });
  }
  var tick = false;
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; par(); }); } }, { passive: true });
  addEventListener('resize', par);
  var cp = document.getElementById('rt-cursor');
  document.addEventListener('mousemove', function (e) {
    var t = e.target.closest && e.target.closest('[data-hover="cursor"]');
    if (t && t.getAttribute('data-preview')) { var s = t.getAttribute('data-preview'); if (cp.getAttribute('src') !== s) cp.setAttribute('src', s); cp.classList.add('on'); cp.style.transform = 'translate(' + (e.clientX + 24) + 'px,' + (e.clientY - 120) + 'px)'; }
    else cp.classList.remove('on');
  });
  var ov = document.getElementById('rt-ov'), box = ov.querySelector('.rt-box'), back = ov.querySelector('.rt-back'), lbItems = [], lbI = 0, lastFocus = null;
  var PK = {
    lightbox: [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }],
    panel: [{ transform: 'translateX(100%)' }, { transform: 'none' }],
    sheet: [{ transform: 'translateY(100%)' }, { transform: 'none' }],
    modal: [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }],
    menu: [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }]
  };
  function mk(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }
  function xBtn() { var b = mk('button', 'rt-x', '×'); b.type = 'button'; b.setAttribute('aria-label', '닫기'); b.onclick = close; return b; }
  function srcOf(t) { if (t.getAttribute('data-src')) return t.getAttribute('data-src'); var i = t.tagName === 'IMG' ? t : t.querySelector('img'); return i ? (i.currentSrc || i.src) : ''; }
  function lb(i) {
    lbI = (i + lbItems.length) % lbItems.length; var t = lbItems[lbI];
    box.innerHTML = ''; box.appendChild(xBtn());
    var im = mk('img'); im.src = srcOf(t); im.alt = t.getAttribute('data-title') || ''; box.appendChild(im);
    if (t.getAttribute('data-title')) box.appendChild(mk('p', null, t.getAttribute('data-title')));
    if (lbItems.length > 1) {
      var p = mk('button', 'rt-nav rt-prev', '‹'); p.type = 'button'; p.setAttribute('aria-label', '이전'); p.onclick = function () { lb(lbI - 1); };
      var n = mk('button', 'rt-nav rt-next', '›'); n.type = 'button'; n.setAttribute('aria-label', '다음'); n.onclick = function () { lb(lbI + 1); };
      box.appendChild(p); box.appendChild(n);
    }
  }
  function open(type, t) {
    lastFocus = document.activeElement; ov.setAttribute('data-type', type); box.innerHTML = '';
    if (type === 'lightbox') { lbItems = [].slice.call(cur.querySelectorAll('[data-click="lightbox"]')).filter(function (x) { return srcOf(x); }); if (!lbItems.length) return; lb(Math.max(0, lbItems.indexOf(t))); }
    else if (type === 'menu') { box.appendChild(xBtn()); (meta.pages || []).forEach(function (p) { if (p.menu === false) return; var a = mk('a', p.parent ? 'sub' : null, p.name); a.href = '#' + p.id; box.appendChild(a); }); }
    else {
      box.appendChild(xBtn());
      var im = t.querySelector && t.querySelector('img');
      if (im && type !== 'modal') { var c = mk('img'); c.src = im.currentSrc || im.src; c.alt = ''; box.appendChild(c); }
      box.appendChild(mk('h3', null, t.getAttribute('data-title') || '')); box.appendChild(mk('p', null, t.getAttribute('data-text') || ''));
    }
    ov.hidden = false; document.documentElement.style.overflow = 'hidden';
    if (D && box.animate) { box.animate(PK[type] || PK.modal, { duration: D * 0.8, easing: 'cubic-bezier(.2,.8,.2,1)' }); back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: D * 0.6 }); }
    var x = box.querySelector('.rt-x'); if (x) x.focus();
  }
  function close() {
    if (ov.hidden) return;
    var type = ov.getAttribute('data-type');
    var done = function () { ov.hidden = true; document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); };
    if (D && box.animate) {
      box.animate((PK[type] || PK.modal).slice().reverse(), { duration: D * 0.5, easing: 'ease-in', fill: 'forwards' }).onfinish = function () { box.getAnimations().forEach(function (a) { a.cancel(); }); done(); };
      back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: D * 0.5, fill: 'forwards' }).onfinish = function () { back.getAnimations().forEach(function (a) { a.cancel(); }); };
    } else done();
  }
  back.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (ov.hidden) return;
    if (e.key === 'Escape') close();
    if (ov.getAttribute('data-type') === 'lightbox') { if (e.key === 'ArrowLeft') lb(lbI - 1); if (e.key === 'ArrowRight') lb(lbI + 1); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-click]');
    if (t && !ov.contains(t) && t.getAttribute('data-click') === 'go') {
      // 누르면 → 페이지 이동: #주소 는 사이트 안 페이지, 그 밖의 주소는 새 창
      var g = t.getAttribute('data-go') || ''; e.preventDefault();
      if (g.charAt(0) === '#') { if (g.length > 1) go(g.slice(1), true); }
      else if (/^(https?:|mailto:|tel:)/i.test(g)) { var w = window.open(g, '_blank', 'noopener'); if (w) w.opener = null; }
      return;
    }
    if (t && !ov.contains(t)) { e.preventDefault(); open(t.getAttribute('data-click'), t); return; }
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) { var id = a.getAttribute('href').slice(1); e.preventDefault(); if (!id) return; if (!ov.hidden) { close(); setTimeout(function () { go(id, true); }, D * 0.5); } else go(id, true); }
  });
  // 배경 고정 영상: 화면에 보일 때만 재생 (숨은 페이지 · 화면 밖이면 멈춤). '움직임 줄이기' 설정이면 재생 안 함
  (function () {
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var vids = [].slice.call(document.querySelectorAll('[data-scroll="bgfix"] video'));
    if (!vids.length) return;
    vids.forEach(function (v) { v.muted = true; v.setAttribute('playsinline', ''); if (still) { v.removeAttribute('autoplay'); v.pause(); } });
    if (still || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var v = e.target.querySelector('video'); if (!v) return; if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
    }, { threshold: 0 });
    [].forEach.call(document.querySelectorAll('[data-scroll="bgfix"]'), function (w) { if (w.querySelector('video')) io.observe(w); });
  })();
  var start = (location.hash || '').slice(1); if (!find(start)) start = meta.start; go(start, false);
})();
