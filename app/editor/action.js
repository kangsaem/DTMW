/* 누르면 무엇을 할지 — 링크 · 팝업 · 페이지 이동을 설정 하나로 (디자인 탭 · 효과 탭 공통 칸)
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, attr, pname, realPages } = X;
  const { toast, h, field, opts } = KZ.ui;
  const { CLICKS } = KZ.C;

  // ---------- 누르면 무엇을 할지: 설정 하나 (0.17.0 — 전에는 링크 주소와 '누르면' 효과가 따로라 서로 충돌) ----------
  // 저장: 링크(a)의 페이지 · 주소 이동은 href, 그 밖의 요소는 data-click="go" + data-go, 팝업류는 data-click (이때 a 의 href 는 '#'). 둘이 함께 걸리지 않음
  const isLinkEl = c => (c.get('tagName') || '').toLowerCase() === 'a' || c.is('link');
  function getAction(c) {
    const k = attr(c, 'data-click'), a = isLinkEl(c);
    if (k && k !== 'go') return { kind: k, to: '' };
    const to = k === 'go' ? attr(c, 'data-go') : (a ? attr(c, 'href') : '');
    return (k === 'go' || (to && to !== '#')) ? { kind: 'go', to: to === '#' ? '' : to } : { kind: '', to: '' };
  }
  function setAction(c, kind, to) {
    const a = isLinkEl(c); to = String(to || '').trim();
    c.removeAttributes(['data-click', 'data-go', 'target', 'rel'].concat(kind === 'go' || !kind ? ['data-title', 'data-text', 'data-src'] : []));
    if (kind === 'go') {
      if (a) { c.addAttributes(Object.assign({ href: to || '#' }, /^https?:/i.test(to) ? { target: '_blank', rel: 'noopener' } : {})); }
      else c.addAttributes(Object.assign({ 'data-click': 'go' }, to ? { 'data-go': to } : {}));
    } else { if (a) c.addAttributes({ href: '#' }); if (kind) c.addAttributes({ 'data-click': kind }); }
  }
  // 디자인 탭(링크 · 버튼)과 효과 탭에 같은 칸을 보여 줌 — 어느 쪽에서 바꿔도 같은 설정
  function actionBox(sel) {
    const wrap = h('div'), detail = h('div'), a = isLinkEl(sel);
    const again = () => setTimeout(() => { if (editor.getSelected() === sel) X.renderSide(); }, 0);
    wrap.append(opts(CLICKS, getAction(sel).kind, v => { setAction(sel, v, v === 'go' ? getAction(sel).to : ''); again(); }), detail);
    const act = getAction(sel), v = act.kind;
    if (v === 'go' || (!v && a)) { // 링크 · 버튼은 고르지 않아도 주소 칸이 바로 보임
      const isPage = u => realPages().some(p => '#' + p.getId() === u);
      const ls = h('select', { className: 'inp' });
      ls.appendChild(h('option', { value: '', textContent: '— 페이지 선택 —' }));
      X.orderedPages().forEach(p => ls.appendChild(h('option', { value: '#' + p.getId(), textContent: (X.treeEnsure()[p.getId()].parent ? '└ ' : '') + pname(p) + '  (#' + p.getId() + ')' })));
      ls.value = isPage(act.to) ? act.to : '';
      const url = h('input', { className: 'inp', value: act.to, placeholder: 'https://… (새 창으로 열림) 또는 #주소' });
      ls.onchange = () => { if (ls.value) { setAction(sel, 'go', ls.value); again(); } };
      url.onchange = () => { const u = url.value.trim(); setAction(sel, u || !a ? 'go' : '', u); again(); };
      detail.append(h('div', { style: 'height:10px' }), field('이동할 페이지', ls), field('또는 직접 주소', url), presetField(url),
        h('p', { className: 'hint', textContent: '편집 화면에서는 Alt+클릭으로 따라갑니다.' }));
    } else if (['panel', 'sheet', 'modal'].includes(v)) {
      const t = h('input', { className: 'inp', value: attr(sel, 'data-title') }); t.onchange = () => sel.addAttributes({ 'data-title': t.value });
      const x = h('textarea', { className: 'inp', value: attr(sel, 'data-text') }); x.onchange = () => sel.addAttributes({ 'data-text': x.value });
      detail.append(h('div', { style: 'height:10px' }), field('팝업 제목', t), field('팝업 내용 (줄바꿈 가능)', x));
    } else if (v === 'lightbox') {
      const t = h('input', { className: 'inp', value: attr(sel, 'data-title'), placeholder: '[항목 이름], 2026' }); t.onchange = () => sel.addAttributes({ 'data-title': t.value });
      detail.append(h('div', { style: 'height:10px' }), field('캡션', t), h('p', { className: 'hint', textContent: '같은 페이지의 라이트박스끼리 화살표로 넘겨 봅니다.' }));
    } else if (v === 'menu') detail.append(h('p', { className: 'hint', textContent: '모든 페이지 목록이 전체 화면으로 펼쳐집니다.', style: 'margin-top:8px' }));
    return wrap;
  }
  // ---------- 링크 빠른 입력 ----------
  // 링크 빠른 입력: 앞부분만 채우고 뒤는 사용자가 이어서 씀
  const PRESETS = [['', '빠른 입력 …'], ['tel:', '전화 (tel:번호)'], ['mailto:', '이메일 (mailto:주소)'], ['https://pf.kakao.com/', '카카오톡 채널'], ['https://booking.naver.com/', '네이버 예약'], ['https://forms.gle/', '구글 폼'], ['https://instagram.com/', '인스타그램']];
  function presetField(url) {
    const ps = h('select', { className: 'inp' }); PRESETS.forEach(([v, t]) => ps.appendChild(h('option', { value: v, textContent: t })));
    ps.onchange = () => { if (!ps.value) return; url.value = ps.value; url.focus(); try { url.setSelectionRange(url.value.length, url.value.length); } catch (e) { /* 무시 */ } ps.value = ''; toast('뒤에 번호 · 주소를 이어서 쓰고 Enter'); };
    url.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); url.dispatchEvent(new Event('change')); url.blur(); } };
    return field('', ps);
  }

  Object.assign(X, { actionBox, isLinkEl, setAction });
});
