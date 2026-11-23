/* 전시 섹션 배치 — 섹션 변수(site/base.css .exh)로 위치 · 크기를 PC · 모바일 따로
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, attr, hasCls, topOf } = X;
  const { toast, h, field, slider, seg } = KZ.ui;

  // ---------- 전시 섹션 배치 (섹션 변수: site/base.css .exh 참고) ----------
  function exhUnit(top) { const el = top.getEl(); const W = el ? el.getBoundingClientRect().width : 1366; return editor.getDevice() === 'mobile' ? W / 375 : Math.min(1, W / 1366); }
  function exhVars(top) { const r = editor.Css.getRule('#' + top.getId()); return r ? r.getStyle() : {}; }
  function exhSet(top, obj) {
    const st = Object.assign({}, exhVars(top));
    Object.entries(obj).forEach(([k, v]) => { if (v === '' || v == null) delete st['--' + k]; else st['--' + k] = String(v); });
    editor.Css.setRule('#' + top.getId(), st);
  }
  function autoMobileFont(sel, top, v) {
    const mo = { atRuleType: 'media', atRuleParams: '(max-width: 640px)' };
    const mr = editor.Css.getRule('#' + sel.getId(), mo); if (mr && mr.getStyle()['--fsm']) return; // 모바일에서 직접 정한 크기는 그대로
    const el = sel.getEl(); if (!el) return;
    setTimeout(() => {
      const U = exhUnit(top), wBoard = el.scrollWidth / U;   // PC 판 단위 글 폭
      const m = +Math.min(v * 0.79, wBoard > 0 ? v * 340 / wBoard : v).toFixed(1);   // Canva 모바일 비율(0.79), 단 375 판의 340 안에 들어가게
      const st = Object.assign({}, mr ? mr.getStyle() : {}, { 'font-size': 'calc(var(--u) * ' + m + ')' });
      editor.Css.setRule('#' + sel.getId(), st, mo);
    }, 60);
  }
  // 작은 작품 줄: 칸 여러 개 ↔ 사진 한 장 (액자 여러 점을 한 장으로 찍은 사진 등)
  function rowMode(top, mode) {
    if (mode === 'one') {
      const fr = top.find('.exh-frames')[0]; if (!fr) return;
      const first = fr.find('img')[0], src = first ? first.get('src') : '';
      fr.replaceWith({ type: 'image', tagName: 'img', classes: ['exh-art', 'exh-pos'], attributes: { src, alt: '[그림 설명]' } });
      exhSet(top, { ah: 200, aw: 200, ax: -100 });
      toast('사진 한 장 방식 — 그림을 누르고 업로드 탭에서 사진을 고르세요. 크기 · 위치는 전시 배치 칸에서');
    } else {
      const art = top.find('.exh-art')[0]; if (!art) return;
      const t = document.createElement('template'); t.innerHTML = KZ.sectionHtml('exh-row');
      art.replaceWith(t.content.querySelector('.exh-frames').outerHTML);
      exhSet(top, { ah: '', aw: '', ax: '', at: '' });
    }
  }
  // 위치를 정한 그림(.exh-pos)의 사진을 바꾸면 높이는 두고 폭을 새 사진 비율에 맞춤
  function fitPosArt(img) {
    if (!img || !img.getClasses().includes('exh-pos')) return;
    const top = topOf(img); if (!top || !hasCls(top, 'exh')) return;
    const im = new Image(); im.onload = () => {
      const V = exhVars(top), ah = parseFloat(V['--ah']) || 200, ax = parseFloat(V['--ax']), aw0 = parseFloat(V['--aw']) || ah;
      const aw = +(ah * im.naturalWidth / im.naturalHeight).toFixed(1), c = isNaN(ax) ? 0 : ax + aw0 / 2;
      exhSet(top, { aw, ax: +(c - aw / 2).toFixed(1) });
    };
    im.src = img.get('src');
  }
  function exhPanel(top, box, sec) {
    const isM = editor.getDevice() === 'mobile', el = top.getEl(); if (!el) return;
    const U = exhUnit(top), R = el.getBoundingClientRect(), V = exhVars(top);
    const rel = q => { const e = el.querySelector(q); return e ? e.getBoundingClientRect() : null; };
    const cur = (name, measured) => V['--' + name] != null && V['--' + name] !== '' ? parseFloat(V['--' + name]) : +(measured || 0).toFixed(1);
    const S = (label, name, min, max, measured, step) => slider(label, min, max, step || 0.5, Math.max(min, Math.min(max, cur(name, measured))), v => v, v => exhSet(top, { [name]: v }));
    const cls = top.getClasses(), has = k => cls.includes(k);
    sec('전시 배치 — ' + (isM ? '모바일 (375 판)' : 'PC (1366 판)'));
    box.appendChild(h('p', { className: 'hint', textContent: '값은 판 단위입니다. PC 와 모바일은 따로 저장됩니다 — 위쪽 PC · 모바일 버튼으로 바꿔 가며 맞추세요.' }));
    // 배경 빠른 선택 (두 화면 공통)
    const bgSel = h('select', { className: 'inp' });
    [['', '테마 배경'], ['white', '흰색'], ['gray', '연회색'], ['gray2', '회색'], ['orange', '주황'], ['black', '검정']].forEach(([v, t]) => bgSel.appendChild(h('option', { value: v, textContent: t })));
    bgSel.value = attr(top, 'data-bg') || ''; bgSel.onchange = () => { if (bgSel.value) top.addAttributes({ 'data-bg': bgSel.value }); else top.removeAttributes('data-bg'); };
    box.appendChild(field('배경', bgSel));
    box.appendChild(S('섹션 높이', isM ? 'mh' : 'h', 50, 1400, R.height / U, 1));
    const art = rel('.exh-art'), cap = rel('.exh-work .exh-cap, .exh-caps'), bg = el.querySelector('.exh-bg');
    const cx = R.left + R.width / 2;
    if (art) {
      if (!isM) {
        box.appendChild(S('작품 위', 'at', -500, 900, (art.top - R.top) / U));
        box.appendChild(slider('작품 높이', 30, 1300, 0.5, +(art.height / U).toFixed(1), v => v, v => {
          const img = top.find('.exh-art')[0]; const o = { ah: v };
          if (img && img.getClasses().includes('exh-pos')) { const a = el.querySelector('.exh-art'); o.aw = +(v * a.naturalWidth / a.naturalHeight).toFixed(1); }
          exhSet(top, o);
        }));
        box.appendChild(slider('작품 좌우 (가운데 기준)', -700, 700, 0.5, +(((art.left + art.width / 2) - cx) / U).toFixed(1), v => v, v => {
          const img = top.find('.exh-art')[0], a = el.querySelector('.exh-art').getBoundingClientRect(), w = +(a.width / U).toFixed(1);
          if (img && !img.getClasses().includes('exh-pos')) img.addClass('exh-pos');
          exhSet(top, { aw: w, ax: +(v - w / 2).toFixed(1) });
        }));
      } else {
        box.appendChild(S('작품 위', 'mt', -300, 500, (art.top - R.top) / U));
        box.appendChild(S('양옆 여백', 'mx', 0, 120, (art.left - R.left) / U));
      }
    }
    if (cap) {
      if (!isM) {
        box.appendChild(S('캡션 위', 'ct', 0, 1300, (cap.top - R.top) / U));
        box.appendChild(S('캡션 오른쪽 끝 (가운데 기준)', 'cr', -683, 683, (cap.right - cx) / U));
      } else {
        if (has('exh-work')) box.appendChild(S('캡션 간격 (사진 아래)', 'mcg', 0, 80, art ? (cap.top - art.bottom) / U : 15));
        if (has('exh-row')) box.appendChild(S('캡션 위', 'mct', 0, 600, (cap.top - R.top) / U));
        box.appendChild(S('캡션 오른쪽 여백', 'mcr', 0, 250, (R.right - cap.right) / U));
      }
    }
    if (has('exh-row')) {
      const one = !!top.find('.exh-art').length;
      box.appendChild(seg('사진 방식', [['many', '칸 여러 개'], ['one', '사진 한 장']], one ? 'one' : 'many', v => { rowMode(top, v); setTimeout(() => X.renderSide(), 80); }));
      if (!isM) { box.appendChild(S('캡션 간격', 'cg', 0, 120, 9)); box.appendChild(S('캡션 폭', 'cw', 30, 240, 80)); }
      else { box.appendChild(S('캡션 간격', 'mcgp', 0, 80, 9)); box.appendChild(S('캡션 폭', 'mcw', 20, 160, 64)); }
    }
    if (has('exh-cover')) {
      const t = rel('.exh-title'), sb = rel('.exh-sub');
      if (t) box.appendChild(S('제목 위', isM ? 'mtt' : 'tt', 0, 1200, (t.top - R.top) / U));
      if (sb) box.appendChild(S('부제 위', isM ? 'mst' : 'st', 0, 1200, (sb.top - R.top) / U));
    }
    if (bg) {
      const img = top.find('.exh-bg')[0], fitw = img && img.getClasses().includes('exh-fitw');
      box.appendChild(seg('그림 맞춤', [['cover', '채우기'], ['fitw', '폭에 맞춤 (위)']], fitw ? 'fitw' : 'cover', v => { if (!img) return; if (v === 'fitw') img.addClass('exh-fitw'); else img.removeClass('exh-fitw'); setTimeout(() => X.renderSide(), 50); }));
      if (fitw) box.appendChild(S('그림 위 여백', isM ? 'mft' : 'ft', -300, 400, (bg.getBoundingClientRect().top - R.top) / U));
      else {
        const z = isM ? 'm' : '';
        box.appendChild(slider('그림 확대 (%)', 100, 300, 0.5, cur(z + 'bz', 100), v => v + '%', v => exhSet(top, { [z + 'bz']: v })));
        box.appendChild(slider('그림 가로 위치 (%)', 0, 100, 0.5, cur(z + 'bx', 50), v => v + '%', v => exhSet(top, { [z + 'bx']: v })));
        box.appendChild(slider('그림 세로 위치 (%)', 0, 100, 0.5, isM ? cur('mby', 50) : (V['--op'] ? parseFloat(V['--op']) : cur('by', 50)), v => v + '%', v => exhSet(top, isM ? { mby: v } : { by: v, op: '' })));
      }
    }
    if (has('exh-cv')) {
      const ci = rel('.exh-cv-in'), li = rel('.exh-cv-links');
      if (ci) box.appendChild(S('약력 위', isM ? 'mcvt' : 'cvt', 0, 900, (ci.top - R.top) / U));
      if (ci && !isM) box.appendChild(S('약력 왼쪽 (가운데에서 왼쪽으로)', 'cvx', 0, 683, (cx - ci.left) / U));
      if (li) box.appendChild(S('링크 위', isM ? 'mlt' : 'lt', 0, 1200, (li.top - R.top) / U));
    }
    if (has('exh-links')) { const ln = rel('.exh-ln'); if (ln) box.appendChild(S('목록 위', isM ? 'mlnt' : 'lnt', 0, 900, (ln.top - R.top) / U)); }
    const keys = isM ? ['mh', 'mt', 'mx', 'mcg', 'mcr', 'mct', 'mtt', 'mst', 'mft', 'mcvt', 'mlt', 'mlnt', 'mcgp', 'mcw', 'mbz', 'mbx', 'mby'] : ['h', 'at', 'ah', 'ax', 'aw', 'ct', 'cr', 'tt', 'st', 'ft', 'op', 'cvt', 'cvx', 'lt', 'lnt', 'cg', 'cw', 'bz', 'bx', 'by'];
    const rb = h('button', { className: 'btn', textContent: (isM ? '모바일' : 'PC') + ' 배치 기본값으로' });
    rb.onclick = () => { exhSet(top, Object.fromEntries(keys.map(k => [k, '']))); setTimeout(() => X.renderSide(), 50); };
    box.appendChild(h('div', { className: 'row', style: 'margin-top:8px' }, [rb]));
  }

  Object.assign(X, { autoMobileFont, exhPanel, exhUnit, fitPosArt });
});
