/* 오른쪽 패널 — 고른 요소의 이름 · 정렬 버튼, 디자인 탭(글자 · 이미지 · 상자)
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, attr, cs, hasCls, isFootTop, isNavTop, mediaOpts, ruleStyle, setStyle, swatches, topOf, val } = X;
  const { $, $$, toast, h, field, slider, seg, num } = KZ.ui;
  const { FONTS } = KZ.C;

  // ---------- 오른쪽 패널 ----------
  const KIND_NAMES = { text: '글', textnode: '글', image: '이미지', video: '영상', link: '링크', wrapper: '페이지 전체', svg: '아이콘', default: '영역' };
  function kindOf(c) {
    const type = c.get('type'), tag = (c.get('tagName') || '').toLowerCase();
    if (type === 'image') return 'image';
    if (type === 'video') return 'video';
    if (type === 'wrapper') return 'wrapper';
    if (type === 'text' || type === 'link' || /^(h[1-6]|p|span|a|button|figcaption|blockquote|li|b|strong|em|dt|dd)$/.test(tag)) return 'text';
    return 'box';
  }
  function nameOf(c) {
    const tag = (c.get('tagName') || '').toLowerCase();
    const base = KIND_NAMES[c.get('type')] || KIND_NAMES.default;
    const tagName = { h1: '큰 제목', h2: '소제목', h3: '소제목', p: '문단', a: '링크', button: '버튼', figure: '이미지 카드', section: '섹션', header: '상단 메뉴', footer: '바닥글', nav: '메뉴', img: '이미지' }[tag];
    return (tagName || base) + (tag ? ' · ' + tag : '');
  }

  function renderSide() {
    const sel = editor.getSelected();
    $('#sideEmpty').hidden = !!sel; $('#sideBody').hidden = !sel;
    if (!sel) return;
    $('#selName').textContent = nameOf(sel);
    $('#selParent').disabled = !sel.parent();
    renderDesign(sel); X.renderFx(sel);
  }
  function arrangeRow(sel) {
    const mk = (label, svg, fn) => { const b = h('button', { title: label }); b.innerHTML = svg + '<span>' + label + '</span>'; b.onclick = fn; return b; };
    const P = 'fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"';
    const box = h('div', { className: 'acts' });
    const parent = sel.parent();
    const move = d => { if (!parent) return; if (parent === editor.getWrapper()) { if (!X.moveSection(sel, d)) toast(d < 0 ? '더 올릴 수 없습니다 (상단 메뉴 위로는 못 감)' : '더 내릴 수 없습니다 (바닥글 아래로는 못 감)'); return; } const i = sel.index(), n = i + d; if (n < 0 || n >= parent.components().length) return; if (sel.move) sel.move(parent, { at: d > 0 ? n + 1 : n }); editor.select(sel); };
    box.append(
      mk('복제', '<svg ' + P + '><rect x="8" y="8" width="12" height="12"/><path d="M4 16V4h12"/></svg>', () => { if (!parent) return; const cl = sel.clone(); parent.append(cl, { at: sel.index() + 1 }); editor.select(cl); }),
      mk('위로', '<svg ' + P + '><path d="M12 19V5M6 11l6-6 6 6"/></svg>', () => move(-1)),
      mk('아래로', '<svg ' + P + '><path d="M12 5v14M6 13l6 6 6-6"/></svg>', () => move(1)),
      mk('삭제', '<svg ' + P + '><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>', () => { if (!parent) return; sel.remove(); editor.select(null); renderSide(); }),
      mk('앞으로', '<svg ' + P + '><rect x="4" y="4" width="11" height="11"/><rect x="9" y="9" width="11" height="11" fill="currentColor" opacity=".25"/></svg>', () => { const z = num(val(sel, 'z-index'), 0) + 1; const p = val(sel, 'position'); setStyle(sel, Object.assign({ 'z-index': String(z) }, p === 'static' ? { position: 'relative' } : {})); toast('앞으로 (z ' + z + ')'); }),
      mk('뒤로', '<svg ' + P + '><rect x="9" y="9" width="11" height="11"/><rect x="4" y="4" width="11" height="11" fill="currentColor" opacity=".25"/></svg>', () => { const z = num(val(sel, 'z-index'), 0) - 1; const p = val(sel, 'position'); setStyle(sel, Object.assign({ 'z-index': String(z) }, p === 'static' ? { position: 'relative' } : {})); toast('뒤로 (z ' + z + ')'); }),
      mk('맞춤 해제', '<svg ' + P + '><path d="M4 4l16 16M20 4L4 20"/></svg>', () => { editor.Css.setRule('#' + sel.getId(), {}, mediaOpts()); renderSide(); toast('이 기기 화면에서 바꾼 스타일을 지웠습니다'); }),
      mk('페이지 끝', '<svg ' + P + '><path d="M12 4v12M6 10l6 6 6-6M5 20h14"/></svg>', () => { const w = editor.getWrapper(), f = w.components().filter(isFootTop).pop(); if (sel.move && sel !== f) sel.move(w, { at: f ? f.index() : w.components().length }); editor.select(sel); })
    );
    return box;
  }
  // ---------- 디자인 탭 ----------
  function renderDesign(sel) {
    const box = $('#tabDesign'); box.innerHTML = '';
    const kind = kindOf(sel);
    const devNote = editor.getDevice() !== 'desktop' ? h('p', { className: 'hint', innerHTML: '<b>' + (editor.getDevice() === 'mobile' ? '모바일' : '태블릿') + ' 화면</b>에서 바꾸는 중 — 이 화면 크기에만 적용됩니다.' }) : null;
    if (devNote) box.appendChild(devNote);
    if (sel.get('type') !== 'wrapper') box.appendChild(arrangeRow(sel));
    const sec = t => box.appendChild(h('h3', { textContent: t, style: 'font-size:12px;color:var(--ui-sub);font-weight:500;margin:18px 0 10px' }));
    const top = topOf(sel);
    if (top && !isNavTop(top) && !isFootTop(top)) {
      sec('섹션');
      const sb = (t, fn) => { const b = h('button', { className: 'btn', textContent: t }); b.onclick = fn; return b; };
      box.appendChild(h('div', { className: 'row sec-acts' }, [
        sb('↑ 섹션 위로', () => { if (!X.moveSection(top, -1)) toast('더 올릴 수 없습니다'); }),
        sb('↓ 섹션 아래로', () => { if (!X.moveSection(top, 1)) toast('더 내릴 수 없습니다'); }),
        top !== sel ? sb('섹션 선택', () => editor.select(top)) : null
      ]));
      if (hasCls(top, 'exh')) X.exhPanel(top, box, sec);
    }

    if (kind === 'text') {
      sec('글자');
      const fsel = h('select', { className: 'inp' });
      [['', '테마 기본'], ['var(--fh)', '제목 글꼴 (테마)'], ['var(--fb)', '본문 글꼴 (테마)'], ...Object.values(FONTS).map(f => [f.h, f.name.split(' (')[0].split(' +')[0]])].forEach(([v, t]) => fsel.appendChild(h('option', { value: v, textContent: t })));
      fsel.value = ruleStyle(sel)['font-family'] || ''; fsel.onchange = () => setStyle(sel, { 'font-family': fsel.value });
      box.appendChild(field('글꼴', fsel));
      const exhTop = top && hasCls(top, 'exh') ? top : null;
      if (exhTop) {
        // 전시 섹션: 판 단위로 저장 → 화면 크기에 비례. PC 에서 바꾸면 모바일은 화면에 맞게 자동 (모바일 보기에서 따로 바꾸면 그 값 유지)
        const U = X.exhUnit(exhTop), isM = editor.getDevice() === 'mobile';
        const cur = +(num(cs(sel) ? cs(sel).fontSize : '', 16) / U).toFixed(1);
        box.appendChild(slider('크기 (판 단위)', 4, 200, 0.5, cur, v => v + (isM ? ' · 375판' : ' · 1366판'), v => {
          setStyle(sel, Object.assign({ 'font-size': 'calc(var(--u) * ' + v + ')' }, isM ? { '--fsm': '1' } : {}));
          if (!isM) X.autoMobileFont(sel, exhTop, v);
        }));
        box.appendChild(h('p', { className: 'hint', textContent: isM ? '모바일에서 바꾼 크기는 이 화면에만 적용됩니다.' : 'PC 크기를 바꾸면 모바일은 화면 폭에 맞게 자동으로 줄어듭니다 (모바일 보기에서 따로 바꿀 수 있음).' }));
      } else {
        box.appendChild(slider('크기', 10, 160, 1, Math.round(num(val(sel, 'font-size'), 16)), v => v + 'px', v => {
          // 큰 글자는 작은 화면에서 비례해서 줄어들게 (PC 보기에서만) — 휴대폰에서 글이 화면 밖으로 나가지 않도록
          const big = editor.getDevice() === 'desktop' && v > 32;
          setStyle(sel, { 'font-size': big ? 'min(' + v + 'px, calc(' + (v / 2) + 'px + ' + (v * 0.0732).toFixed(2) + 'vw))' : v + 'px' }); // 683px 에서 원래 크기, 휴대폰(375)에서 약 0.77배
        }));
      }
      const w = h('select', { className: 'inp' });
      [['300', '가늘게'], ['400', '보통'], ['500', '중간'], ['600', '약간 굵게'], ['700', '굵게']].forEach(([v, t]) => w.appendChild(h('option', { value: v, textContent: t })));
      w.value = String(Math.round(num(val(sel, 'font-weight'), 400) / 100) * 100); w.onchange = () => setStyle(sel, { 'font-weight': w.value });
      box.appendChild(field('굵기', w));
      // 줄 간격 · 자간 환산용 글자 크기는 화면에 실제로 보이는 값 (calc(var(--u) * N) · min(…) 은 숫자로 못 읽어 16 으로 잘못 환산됐음)
      const fs = num(cs(sel) ? cs(sel).fontSize : '', num(val(sel, 'font-size'), 16));
      const lhRaw = val(sel, 'line-height'); const lh = /px/.test(lhRaw) ? num(lhRaw, fs * 1.5) / fs : num(lhRaw, 1.5);
      box.appendChild(slider('줄 간격', 0.9, 2.6, 0.05, +lh.toFixed(2), v => v.toFixed(2), v => setStyle(sel, { 'line-height': String(v) })));
      const lsRaw = val(sel, 'letter-spacing'); const ls = /em/.test(lsRaw) ? num(lsRaw, 0) : num(lsRaw, 0) / fs;
      box.appendChild(slider('자간', -0.08, 0.4, 0.01, +(isNaN(ls) ? 0 : ls).toFixed(2), v => v.toFixed(2) + 'em', v => setStyle(sel, { 'letter-spacing': v + 'em' })));
      box.appendChild(swatches('글자 색', val(sel, 'color'), v => setStyle(sel, { color: v })));
      box.appendChild(seg('정렬', [['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']], val(sel, 'text-align') === 'start' ? 'left' : val(sel, 'text-align'), v => setStyle(sel, { 'text-align': v })));
      box.appendChild(h('p', { className: 'hint', textContent: '글 내용은 화면에서 두 번 눌러 바로 고칩니다. 줄을 나누려면 Shift+Enter.' }));
    }
    if (kind === 'image' || kind === 'video') {
      sec(kind === 'image' ? '이미지' : '영상');
      const rep = h('button', { className: 'btn full', textContent: kind === 'image' ? '이미지 교체 (업로드 탭)' : '영상 교체 (업로드 탭)' }); rep.onclick = () => X.openPane('up');
      box.appendChild(rep); box.appendChild(h('div', { style: 'height:12px' }));
      box.appendChild(slider('너비', 10, 100, 1, Math.round(num(ruleStyle(sel).width, 100)), v => v + '%', v => setStyle(sel, { width: v + '%' })));
      const ar = h('select', { className: 'inp' });
      [['', '원본 비율'], ['1/1', '1:1 정사각'], ['4/5', '4:5 세로'], ['3/4', '3:4 세로'], ['3/2', '3:2 가로'], ['16/9', '16:9 와이드']].forEach(([v, t]) => ar.appendChild(h('option', { value: v, textContent: t })));
      ar.value = (ruleStyle(sel)['aspect-ratio'] || '').replace(/\s/g, ''); ar.onchange = () => setStyle(sel, ar.value ? { 'aspect-ratio': ar.value, 'object-fit': 'cover', height: 'auto' } : { 'aspect-ratio': '', 'object-fit': '' });
      box.appendChild(field('비율 (자르기)', ar));
      box.appendChild(seg('맞춤', [['cover', '채우기'], ['contain', '전체 보이기']], ruleStyle(sel)['object-fit'] || 'cover', v => setStyle(sel, { 'object-fit': v })));
      // 필터
      const fstr = ruleStyle(sel).filter || '';
      const pf = (n, d) => { const m = fstr.match(new RegExp(n + '\\(([\\d.]+)')); return m ? +m[1] : d; };
      const F = { brightness: pf('brightness', 100), contrast: pf('contrast', 100), saturate: pf('saturate', 100), grayscale: pf('grayscale', 0), blur: pf('blur', 0) };
      const applyF = () => { const s = 'brightness(' + F.brightness + '%) contrast(' + F.contrast + '%) saturate(' + F.saturate + '%) grayscale(' + F.grayscale + '%) blur(' + F.blur + 'px)'; setStyle(sel, { filter: (F.brightness === 100 && F.contrast === 100 && F.saturate === 100 && !F.grayscale && !F.blur) ? '' : s }); };
      sec('필터');
      box.appendChild(slider('밝기', 40, 160, 1, F.brightness, v => v + '%', v => { F.brightness = v; applyF(); }));
      box.appendChild(slider('대비', 40, 160, 1, F.contrast, v => v + '%', v => { F.contrast = v; applyF(); }));
      box.appendChild(slider('채도', 0, 200, 1, F.saturate, v => v + '%', v => { F.saturate = v; applyF(); }));
      box.appendChild(slider('흑백', 0, 100, 1, F.grayscale, v => v + '%', v => { F.grayscale = v; applyF(); }));
      box.appendChild(slider('흐림', 0, 12, 0.5, F.blur, v => v + 'px', v => { F.blur = v; applyF(); }));
      if (kind === 'image') {
        const alt = h('input', { className: 'inp', value: attr(sel, 'alt'), placeholder: '예: 매장 내부 사진' });
        alt.onchange = () => sel.addAttributes({ alt: alt.value });
        box.appendChild(field('대체 텍스트 (시각장애인 · 검색용)', alt));
      } else {
        sec('재생');
        [['autoplay', '자동 재생'], ['loop', '반복'], ['muted', '소리 끔'], ['controls', '재생 버튼 표시']].forEach(([k, t]) => {
          const cb = h('input', { type: 'checkbox', checked: !!sel.get(k) }); cb.onchange = () => sel.set(k, cb.checked);
          box.appendChild(h('label', { className: 'row', style: 'justify-content:flex-start;gap:8px;margin-bottom:8px' }, [cb, h('span', { textContent: t, style: 'flex:none' })]));
        });
      }
    }
    if (X.isLinkEl(sel)) { sec('누르면 (링크)'); box.appendChild(X.actionBox(sel)); }
    sec(kind === 'wrapper' ? '페이지 배경' : '상자');
    box.appendChild(swatches('배경 색', val(sel, 'background-color'), v => setStyle(sel, { 'background-color': v }), true));
    if (kind !== 'wrapper') {
      box.appendChild(slider('안쪽 여백', 0, 160, 2, Math.round(num(val(sel, 'padding-top'), 0)), v => v + 'px', v => setStyle(sel, { padding: v + 'px' })));
      box.appendChild(slider('바깥 여백 (위아래)', 0, 200, 2, Math.round(num(val(sel, 'margin-bottom'), 0)), v => v + 'px', v => setStyle(sel, { 'margin-top': v + 'px', 'margin-bottom': v + 'px' })));
      box.appendChild(slider('모서리 둥글게', 0, 80, 1, Math.round(num(val(sel, 'border-top-left-radius'), 0)), v => v + 'px', v => setStyle(sel, { 'border-radius': v + 'px' })));
      box.appendChild(slider('투명도', 0, 100, 1, Math.round(num(val(sel, 'opacity'), 1) * 100), v => v + '%', v => setStyle(sel, { opacity: String(v / 100) })));
      const sh = h('select', { className: 'inp' });
      [['', '그림자 없음'], ['0 6px 20px rgba(0,0,0,.08)', '약하게'], ['0 18px 50px rgba(0,0,0,.18)', '강하게'], ['0 0 0 1px var(--line)', '테두리 선']].forEach(([v, t]) => sh.appendChild(h('option', { value: v, textContent: t })));
      sh.value = ruleStyle(sel)['box-shadow'] || ''; sh.onchange = () => setStyle(sel, { 'box-shadow': sh.value });
      box.appendChild(field('그림자 · 테두리', sh));
    }
  }
  // 슬라이더를 한 번 끄는 동안 · 색 고르기 창을 여는 동안 생긴 변경을 되돌리기 한 단계로 묶음 (전에는 움직인 칸마다 한 단계)
  let dragFrom = -1;
  const isDrag = t => t && t.tagName === 'INPUT' && (t.type === 'range' || t.type === 'color');
  $('#side').addEventListener('input', e => { if (isDrag(e.target) && dragFrom < 0) dragFrom = editor.UndoManager.getStack().length; }, true);
  $('#side').addEventListener('change', e => {
    if (!isDrag(e.target) || dragFrom < 0) return; const from = dragFrom; dragFrom = -1;
    setTimeout(() => { const st = editor.UndoManager.getStack(), first = st.at(from), idx = first && first.get('magicFusionIndex'); if (idx != null) for (let i = from; i < st.length; i++) st.at(i).set('magicFusionIndex', idx); }, 100);
  }, true);

  // ---------- 오른쪽 패널 이벤트 ----------
  editor.on('component:selected', renderSide);
  editor.on('component:deselected', () => setTimeout(renderSide, 0));
  editor.on('undo redo', () => setTimeout(renderSide, 0));
  $('#selParent').onclick = () => { const s = editor.getSelected(); if (s && s.parent()) editor.select(s.parent()); };
  $$('.tabs button').forEach(b => b.onclick = () => { $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); $$('.tabpane').forEach(p => p.classList.toggle('on', p.dataset.tab === b.dataset.tab)); });

  Object.assign(X, { renderSide });
});
