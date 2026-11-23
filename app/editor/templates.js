/* 템플릿 탭 — 사이트 세트 적용, 레이아웃 쓰기(섹션 · 현재 페이지 · 새 페이지), 섹션 넣기 · 옮기기
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S, attr, hasNav, isFootTop, topOf } = X;
  const { $, esc, toast, dialog } = KZ.ui;
  const { THEMES, FONTS } = KZ.C;

  // ---------- 사이트 세트 · 템플릿 ----------
  function applySet(key) {
    const set = KZ.sets[key], PM = editor.Pages;
    const old = PM.getAll().slice();
    const tmp = PM.add({ id: '__tmp' + Date.now(), name: 'tmp', component: '' });
    PM.select(tmp);
    old.forEach(p => PM.remove(p));
    set.pages.forEach(pg => PM.add({ id: pg[0], name: pg[1], component: KZ.setPageHtml(set, pg) }));
    PM.select(set.pages[0][0]);
    PM.remove(tmp);
    S.tree = {};
    set.pages.forEach((pg, i) => { const o = pg[4] || {}; S.tree[pg[0]] = { parent: o.parent || null, order: i, menu: o.menu !== false }; });
    S.siteName = set.siteName || S.siteName; $('#siteName').value = S.siteName;
    if (set.style) {
      const st = set.style, th = THEMES[st.theme];
      if (th) { S.theme = st.theme; S.colors = { bg: th.bg, ink: th.ink, sub: th.sub, line: th.line, accent: th.accent }; }
      if (st.font && FONTS[st.font]) S.font = st.font;
      if (st.transition) S.transition = st.transition;
      if (st.speed) S.speed = st.speed;
      X.refreshTheme(); if (X.booted) X.renderSite();
    }
    X.syncChrome(); X.recordTree();
    editor.UndoManager.clear();
    X.renderNav(); X.save();
  }
  function renderSets() {
    const box = $('#sets'); box.innerHTML = '';
    $('#setsCount').textContent = KZ.setOrder.length + '종 · 업종별 페이지 묶음';
    $('#setsFold').onclick = () => { const open = box.hidden; box.hidden = !open; $('#setsFold').setAttribute('aria-expanded', String(open)); $('#setsFold .fold-c').textContent = open ? '▾' : '▸'; };
    KZ.setOrder.map(k => [k, KZ.sets[k]]).forEach(([k, s]) => {
      const b = document.createElement('button'); b.className = 'set';
      const th = THEMES[(s.style || {}).theme] || THEMES.white; b.innerHTML = '<i class="set-sw"><b style="background:' + th.bg + '"></b><b style="background:' + th.ink + '"></b><b style="background:' + th.accent + '"></b></i><b>' + esc(s.name) + '</b><span>' + esc(s.desc) + '</span>';
      b.onclick = async () => {
        // 세트 적용은 되돌리기(Ctrl+Z)로 되돌릴 수 없으므로 작업 파일을 먼저 받을 수 있게 합니다
        const v = await dialog('사이트 세트 적용', '<p>지금 사이트의 모든 페이지가 <b>' + esc(s.name) + '</b> 세트로 바뀝니다.</p><p class="hint">⚠ 세트 적용은 <b>되돌리기(Ctrl+Z)로 되돌릴 수 없습니다.</b> 지금 작업을 남기려면 작업 파일을 먼저 받으세요.</p>',
          [['취소', false], ['작업 파일 받고 진행', 'save'], ['적용', true, 'pri']]);
        if (!v) return;
        if (v === 'save') X.saveProjectFile();
        applySet(k); toast('세트를 적용했습니다');
      };
      box.appendChild(b);
    });
  }
  let tplCat = '전체';
  function renderTemplates() {
    const T = KZ.layouts; const cats = ['전체', ...new Set(KZ.layoutOrder.map(id => T[id].cat))];
    const cb = $('#tplCats'); cb.innerHTML = '';
    cats.forEach(c => { const b = document.createElement('button'); b.textContent = c; b.className = c === tplCat ? 'on' : ''; b.onclick = () => { tplCat = c; renderTemplates(); }; cb.appendChild(b); });
    const g = $('#tplGrid'); g.innerHTML = '';
    KZ.layoutOrder.map(id => [id, T[id]]).filter(([, t]) => tplCat === '전체' || t.cat === tplCat).forEach(([id, t]) => {
      const b = document.createElement('button'); b.className = 'tpl'; b.innerHTML = KZ.thumbSvg(id) + '<span>' + esc(t.name) + '</span>';
      b.onclick = () => useTemplate(id); g.appendChild(b);
    });
  }
  async function useTemplate(id) {
    const t = KZ.layouts[id];
    const v = await dialog(t.name, '<p>이 레이아웃을 어떻게 쓸까요?</p><p class="hint"><b>섹션으로 추가</b>: 지금 페이지에 이어 붙입니다 (선택한 섹션 아래, 없으면 바닥글 위). 상단 메뉴 · 바닥글은 빼고 넣습니다.<br><b>현재 페이지에 적용</b>: 지금 페이지 내용이 바뀝니다. 모두 Ctrl+Z로 되돌릴 수 있습니다.</p>', [['취소', null], ['새 페이지로 추가', 'new'], ['현재 페이지에 적용', 'cur'], ['섹션으로 추가', 'sec', 'pri']]);
    if (v === 'sec') { addSection(KZ.sectionHtml(id)); toast('섹션을 추가했습니다'); }
    if (v === 'cur') { editor.setComponents(t.html()); toast('현재 페이지에 적용했습니다'); }
    if (v === 'new') { const SLUG = { t1: 'home', t2: 'exhibitions', t3: 'works', t4: 'work', t5: 'apps', t6: 'series', t7: 'by-year', t8: 'index', t9: 'gallery', t10: 'cv', t11: 'text', t12: 'intro', t13: 'about', fx: 'effects' }; const sl = t.slug || SLUG[id]; const p = X.addPage(t.name.replace(/\s*\(.*\)$/, ''), t.html(), sl === 'home' ? 'intro' : sl); if (p) toast('새 페이지 #' + p.getId() + ' 를 만들었습니다'); }
  }
  // ---------- 섹션 (페이지 바로 아래 요소) ----------
  function addSection(html) {
    const w = editor.getWrapper();
    // 빈 페이지의 안내 섹션(고치지 않은 것)은 첫 섹션을 넣을 때 지움
    w.components().filter(c => attr(c, 'data-blank') && /새 페이지/.test(c.toHTML())).forEach(c => { if (editor.getSelected() && topOf(editor.getSelected()) === c) editor.select(null); c.remove(); });
    const comps = w.components();
    const top = topOf(editor.getSelected());
    let at;
    if (top && isFootTop(top)) at = top.index();
    else if (top) at = top.index() + 1;
    else { const f = comps.filter(isFootTop).pop(); at = f ? f.index() : comps.length; }
    const added = w.append(html, { at });
    if (added[0]) { editor.select(added[0]); try { added[0].getEl().scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { /* 무시 */ } }
    return added;
  }
  // 섹션 옮기기: 상단 메뉴(메뉴를 품은 섹션 포함) 위 · 바닥글 아래로는 가지 않고, 메뉴 · 바닥글 자체도 움직이지 않음
  function moveSection(sec, d) {
    const w = editor.getWrapper(), list = w.components().models, i = list.indexOf(sec), j = i + d;
    if (i < 0 || j < 0 || j >= list.length || hasNav(sec) || isFootTop(sec) || hasNav(list[j]) || isFootTop(list[j])) return false;
    sec.move(w, { at: d > 0 ? j + 1 : j }); editor.select(sec); return true;
  }

  Object.assign(X, { applySet, moveSection, renderSets, renderTemplates });
});
