/* 사이트 탭(테마 · 글꼴 · 전환 · 공유 정보) · 왼쪽 탭 열기
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S } = X;
  const { $, $$, esc, toast, h, opts } = KZ.ui;
  const { THEMES, COLOR_KEYS, FONTS, TRANS } = KZ.C;

  // ---------- 사이트 탭 ----------
  function renderSite() {
    const th = $('#themes'); th.innerHTML = '';
    Object.entries(THEMES).forEach(([k, t]) => {
      const b = h('button', { className: 'theme' + (S.theme === k ? ' on' : '') });
      b.innerHTML = '<i><b style="background:' + t.bg + '"></b><b style="background:' + t.ink + '"></b><b style="background:' + t.line + '"></b><b style="background:' + t.accent + '"></b></i>' + esc(t.name);
      b.onclick = () => { S.theme = k; S.colors = { bg: t.bg, ink: t.ink, sub: t.sub, line: t.line, accent: t.accent }; X.refreshTheme(); renderSite(); X.save(); };
      th.appendChild(b);
    });
    const cf = $('#colorFields'); cf.innerHTML = '';
    COLOR_KEYS.forEach(([k, label]) => {
      const i = h('input', { type: 'color', value: S.colors[k] }); i.setAttribute('aria-label', label);
      i.oninput = () => { S.colors[k] = i.value; S.theme = 'custom'; X.refreshTheme(); $$('.theme', th).forEach(x => x.classList.remove('on')); };
      i.onchange = X.save;
      cf.appendChild(h('label', { className: 'row', style: 'justify-content:space-between;margin-bottom:6px' }, [h('span', { textContent: label, style: 'flex:1' }), i]));
    });
    const fs = $('#fontSel'); fs.innerHTML = '';
    Object.entries(FONTS).forEach(([k, f]) => fs.appendChild(h('option', { value: k, textContent: f.name })));
    fs.value = S.font; fs.onchange = () => { S.font = fs.value; X.refreshTheme(); X.save(); };
    const to = $('#transOpts'); to.innerHTML = ''; to.appendChild(opts(TRANS, S.transition, v => { S.transition = v; X.save(); }));
    const am = $('#autoMenu'); am.checked = S.autoMenu !== false; am.onchange = () => { S.autoMenu = am.checked; X.syncChrome(); X.save(); toast(am.checked ? '상단 메뉴를 페이지 목록대로 자동으로 만듭니다' : '메뉴를 직접 고칩니다 (자동 갱신 꺼짐)'); };
    $$('#speedSeg button').forEach(b => { b.classList.toggle('on', b.dataset.v === S.speed); b.onclick = () => { S.speed = b.dataset.v; $$('#speedSeg button').forEach(x => x.classList.toggle('on', x === b)); X.refreshTheme(); X.save(); }; });
  }
  // 공유 · 검색: 설명, 사이트 주소, 공유 이미지, 파비콘 (내보낸 사이트의 <head>)
  function renderMeta() {
    const box = $('#metaFields'); if (!box) return; box.innerHTML = '';
    const imgs = S.assets.filter(a => a.type === 'image');
    const lab = (t, el, hint) => h('label', { className: 'meta-f' }, [h('span', { className: 'lbl', textContent: t }), el].concat(hint ? [h('small', { className: 'hint', textContent: hint })] : []));
    const ds = h('textarea', { className: 'inp', rows: 2, value: S.desc || '', placeholder: '예: 강이조 개인전 · 작업 소개' }); ds.onchange = () => { S.desc = ds.value.trim(); X.save(); };
    const url = h('input', { className: 'inp', value: S.siteUrl || '', placeholder: 'https://아이디.github.io/저장소' }); url.onchange = () => { S.siteUrl = url.value.trim(); X.save(); renderMeta(); };
    const pick = (key, none) => { const sl = h('select', { className: 'inp' }); sl.appendChild(h('option', { value: '', textContent: none })); imgs.forEach(a => sl.appendChild(h('option', { value: a.id, textContent: a.name }))); sl.value = imgs.some(a => a.id === S[key]) ? S[key] : ''; sl.onchange = () => { S[key] = sl.value; X.save(); }; return sl; };
    box.append(
      lab('사이트 설명', ds, '검색 결과와 링크 공유 때 보이는 한두 줄'),
      lab('사이트 주소 (선택)', url, '올린 뒤의 주소. 넣어야 카카오톡 등에서 공유 이미지가 보입니다'),
      lab('공유 이미지', pick('shareImg', imgs.length ? '없음' : '없음 — 업로드 탭에서 사진을 올리세요'), S.siteUrl ? '' : '사이트 주소를 넣어야 적용됩니다'),
      lab('파비콘 (탭 아이콘)', pick('favicon', '사이트 이름 첫 글자 (자동)'))
    );
  }
  $('#pvTrans').onclick = () => X.openPreview();
  $('#siteName').onchange = e => X.setSiteName(e.target.value);

  // ---------- 왼쪽 탭 ----------
  function openPane(id) {
    $('#main').classList.remove('no-drawer');
    $$('.rail button').forEach(b => b.classList.toggle('on', b.dataset.pane === id));
    $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === id));
    const rb = $('.rail button[data-pane="' + id + '"]'); $('#drawerTitle').textContent = rb ? rb.textContent.trim() : '';
    if (id === 'pg') X.renderPages();
    if (id === 'site') renderMeta();
    setTimeout(() => editor.refresh(), 50);
  }
  // 그림을 두 번 누르면: GrapesJS 영어 'Select Image' 창 대신 업로드 탭 (올린 사진이 없으면 파일 고르기)
  ['core:open-assets', 'open-assets'].forEach(cmd => editor.Commands.add(cmd, { run() {
    const out = KZ.popout && KZ.popout.isOut('drawer'); if (!out) openPane('up');
    // 올린 사진이 없으면 파일을 고르게 하고, 고른 사진은 그 그림에 바로 넣음 (전에는 올린 뒤 한 번 더 눌러야 했음)
    if (!S.assets.some(a => a.type === 'image')) { X.applyNextUpload(); X.fileIn.click(); } else toast('올린 사진을 누르면 고른 그림이 바뀝니다');
  } }));
  $$('.rail button').forEach(b => b.onclick = () => {
    const drawerOut = KZ.popout && KZ.popout.isOut('drawer');
    if (!drawerOut && b.classList.contains('on') && !$('#main').classList.contains('no-drawer')) { $('#main').classList.add('no-drawer'); b.classList.remove('on'); setTimeout(() => editor.refresh(), 50); return; }
    openPane(b.dataset.pane);
  });
  $('#sideToggle').onclick = () => $('#side').classList.toggle('mob-open');
  const mq = window.matchMedia('(max-width: 820px)');
  const onMq = () => { $('#sideToggle').style.display = mq.matches ? '' : 'none'; };
  mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener(onMq); onMq();

  Object.assign(X, { openPane, renderSite });
});
