/* 페이지 — 페이지 목록(트리) · 순서 · 추가 · 삭제 · 주소 바꾸기, 상단 페이지 선택 · 아래 페이지 띠
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S, isFootTop, isNavTop, pname, realPages, walk } = X;
  const { $, $$, esc, toast, dialog, confirmDlg, h } = KZ.ui;

  // ---------- 페이지 · 트리 ----------
  // S.tree[페이지 주소] = { parent: 상위 주소 | null, order: 순서, menu: 메뉴에 표시 }  — 2단계까지
  const collapsed = new Set();
  function treeEnsure() {
    if (!S.tree || typeof S.tree !== 'object') S.tree = {};
    const T = S.tree, pages = realPages();
    let max = Math.max(-1, ...Object.values(T).map(t => +t.order || 0));
    pages.forEach(p => { const id = p.getId(); if (!T[id]) T[id] = { parent: null, order: ++max, menu: true }; });
    Object.keys(T).forEach(id => { if (!editor.Pages.get(id)) delete T[id]; });
    Object.keys(T).forEach(id => { const pa = T[id].parent; if (pa && (!T[pa] || T[pa].parent)) T[id].parent = null; });
    return T;
  }
  function kids(pid) { const T = treeEnsure(); return realPages().filter(p => (T[p.getId()].parent || null) === pid).sort((x, y) => T[x.getId()].order - T[y.getId()].order); }
  function orderedPages() { const out = []; kids(null).forEach(p => { out.push(p); kids(p.getId()).forEach(c => out.push(c)); }); return out; }
  function renumberAll() { const T = treeEnsure(); [null, ...Object.keys(T)].forEach(pid => kids(pid).forEach((p, i) => { T[p.getId()].order = i; })); }
  function movePage(id, targetId, where) {
    const T = treeEnsure(); if (!T[id] || !T[targetId] || id === targetId) return false;
    const hasKids = kids(id).length > 0;
    if (where === 'inside') {
      if (T[targetId].parent) { toast('2단계까지만 넣을 수 있습니다'); return false; }
      if (hasKids) { toast('하위 페이지가 있는 페이지는 다른 페이지 아래로 넣을 수 없습니다'); return false; }
      T[id].parent = targetId; T[id].order = 1e6;
    } else {
      const np = T[targetId].parent || null;
      if (np && hasKids) { toast('하위 페이지가 있는 페이지는 2단계로 내릴 수 없습니다'); return false; }
      T[id].parent = np; T[id].order = T[targetId].order + (where === 'before' ? -0.5 : 0.5);
    }
    renumberAll(); afterTree(); return true;
  }
  function indent(id) { const T = treeEnsure(); const sib = kids(T[id].parent || null); const i = sib.findIndex(p => p.getId() === id); if (T[id].parent) return toast('2단계까지만 넣을 수 있습니다'); if (i < 1) return toast('위에 같은 단계 페이지가 있어야 합니다'); movePage(id, sib[i - 1].getId(), 'inside'); }
  function outdent(id) { const T = treeEnsure(); const pa = T[id].parent; if (!pa) return; movePage(id, pa, 'after'); }
  function step(id, d) { const T = treeEnsure(); const sib = kids(T[id].parent || null); const i = sib.findIndex(p => p.getId() === id); const j = i + d; if (j < 0 || j >= sib.length) return; movePage(id, sib[j].getId(), d < 0 ? 'before' : 'after'); }
  // 페이지 목록(순서 · 단계 · 메뉴 표시)도 되돌리기에 넣음: 작은 기록 모델을 GrapesJS 되돌리기에 등록.
  // 같은 동기 호출 안의 변경(페이지 삭제 · 메뉴 다시 만들기 등)과 한 단계로 묶임 (0.16.5 — 전에는 되돌리면 페이지가 맨 끝으로 가거나 메뉴만 예전으로)
  const treeRec = window.Backbone ? new Backbone.Model({ t: '{}', _undo: true }) : { a: '{}', get() { return this.a; }, set(k, v) { this.a = v; }, on() {} };
  if (window.Backbone) editor.UndoManager.add(treeRec);
  function recordTree() { const j = JSON.stringify(S.tree || {}); if (treeRec.get('t') !== j) treeRec.set('t', j); }
  treeRec.on('change:t', () => {
    const j = treeRec.get('t'); if (j === JSON.stringify(S.tree || {})) return; // 직접 기록한 것 (되돌리기 아님)
    try { S.tree = JSON.parse(j); } catch (e) { return; }
    if (X.booted) setTimeout(() => { X.syncChrome(); renderNav(); X.save(); }, 0);
  });
  function afterTree() { recordTree(); X.syncChrome(); renderNav(); X.save(); }

  // ---------- 페이지 추가 · 삭제 · 목록 ----------
  function dupNameWarn(n) { if (realPages().filter(p => pname(p) === n).length > 1) toast('같은 이름의 페이지가 있어 메뉴에 \'' + n + '\' 이(가) 두 번 보입니다'); }
  function uniqueId(base) {
    let id = (base || 'page').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'page';
    let n = 1, out = id; while (editor.Pages.get(out)) out = id + '-' + (++n); return out;
  }
  // 빈 페이지에 넣을 상단 메뉴 · 바닥글: 다른 페이지에 맨 위 단계로 있는 것을 복사 (없으면 기본). 메뉴 글은 자동 메뉴가 다시 맞춤
  function frameHtml() {
    let navH = '', footH = '';
    for (const pg of orderedPages()) {
      const cs = pg.getMainComponent().components();
      if (!navH) { const n = cs.find(isNavTop); if (n) navH = n.toHTML(); }
      if (!footH) { const f = cs.find(isFootTop); if (f) footH = f.toHTML(); }
      if (navH && footH) break;
    }
    const strip = h => h.replace(/\sid="[^"]*"/g, '');
    return [strip(navH || KZ.H.nav()), strip(footH || KZ.H.FOOT)];
  }
  function addPage(name, html, id, parent) {
    let comp = html;
    if (!comp) { const [nv, ft] = frameHtml(); comp = nv + '<section class="wrap" data-blank="1"><h1 class="title">새 페이지</h1><p class="body-p">템플릿 탭에서 섹션을 고르거나 요소 탭에서 끌어 오세요. 첫 섹션을 넣으면 이 안내는 사라집니다.</p></section>' + ft; }
    const p = editor.Pages.add({ id: uniqueId(id || 'page'), name: name || '새 페이지', component: comp });
    const T = treeEnsure(); if (parent && T[parent] && !T[parent].parent) { T[p.getId()].parent = parent; renumberAll(); }
    editor.Pages.select(p); afterTree(); return p;
  }
  // 페이지 주소 바꾸기: 모든 페이지의 #옛주소 링크 · 트리도 함께
  async function renamePageId(p) {
    const old = p.getId(), f = document.createElement('div');
    f.innerHTML = '<div class="field"><label for="npNewId">새 주소 (영문 · 숫자 · -)</label><input class="inp" id="npNewId"></div><p class="hint">이 페이지로 가는 링크(#' + esc(old) + ')도 모두 새 주소로 바뀝니다. 이미 공유한 주소는 바뀌니 주의하세요.</p>';
    f.querySelector('#npNewId').value = old;
    const v = await dialog('페이지 주소 바꾸기', f, [['취소', null], ['바꾸기', d => d(f.querySelector('#npNewId').value), 'pri']]);
    if (!v) return;
    const want = v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!want || want === old) return;
    const nid = uniqueId(want); treeEnsure();
    p.set('id', nid); // 트리 옮기기는 아래 change:id 에서 (되돌리기로 주소가 돌아갈 때도 같은 처리)
    let n = 0;
    editor.Pages.getAll().forEach(pg => walk(pg.getMainComponent(), c => {
      const at = c.getAttributes(); const ch = {};
      ['href', 'data-go'].forEach(k => { if (at[k] === '#' + old) ch[k] = '#' + nid; });
      if (Object.keys(ch).length) { c.addAttributes(ch); n++; }
    }));
    afterTree(); renderPages(); toast('주소를 #' + nid + ' (으)로 바꿨습니다' + (n ? ' — 링크 ' + n + '곳도' : ''));
  }
  // 페이지 주소가 바뀌면(주소 바꾸기 · 그 되돌리기) 트리의 순서 · 하위 관계를 새 주소로 옮김
  // (전에는 되돌리면 그 페이지가 목록 맨 끝으로 가고 하위 관계가 풀렸음)
  editor.Pages.pages.on('change:id', p => {
    const old = p.previous('id'), nid = p.getId(), T = S.tree;
    if (!T || old == null || old === nid || !T[old]) return;
    T[nid] = T[old]; delete T[old];
    Object.values(T).forEach(x => { if (x.parent === old) x.parent = nid; });
    if (collapsed.delete(old)) collapsed.add(nid);
    if (X.booted) setTimeout(() => { renderNav(); renderPages(); }, 0);
  });
  async function deletePage(p) {
    if (realPages().length < 2) return toast('마지막 페이지는 지울 수 없습니다');
    if (orderedPages()[0] === p) return toast('첫 페이지(사이트를 열면 보이는 페이지)는 지울 수 없습니다 — 다른 페이지를 \'첫 페이지로\' 지정한 뒤 지우세요');
    const ks = kids(p.getId());
    if (!await confirmDlg('페이지 삭제', '<b>' + esc(pname(p)) + '</b> 페이지를 삭제할까요?' + (ks.length ? '<br>하위 페이지 ' + ks.length + '개는 위 단계로 올라갑니다.' : ''), '삭제')) return;
    const T = treeEnsure(); ks.forEach(c => { T[c.getId()].parent = null; T[c.getId()].order = T[p.getId()].order + 0.5; });
    const gone = p.getId(), other = orderedPages().find(x => x !== p); editor.Pages.select(other); editor.Pages.remove(p); renumberAll(); afterTree();
    // 지운 페이지로 가던 링크(자동 메뉴 밖)는 남으므로 알림 — 편집 화면에서는 빨간 점선
    let left = 0; realPages().forEach(pg => walk(pg.getMainComponent(), c => { const a = c.getAttributes(); if (a.href === '#' + gone || a['data-go'] === '#' + gone) left++; }));
    if (left) toast('이 페이지로 가던 링크 ' + left + '곳이 남았습니다 (빨간 점선) — 다른 페이지로 바꿔 주세요');
  }
  function iconBtn(label, txt, fn) { const b = h('button', { className: 'ib', title: label, textContent: txt }); b.setAttribute('aria-label', label); b.onclick = e => { e.stopPropagation(); fn(); }; return b; }
  let dragId = null;
  function renderPages() {
    const box = $('#pages'); if (!box) return;
    const T = treeEnsure(), cur = editor.Pages.getSelected();
    const list = []; kids(null).forEach(p => { list.push([p, 0]); if (!collapsed.has(p.getId())) kids(p.getId()).forEach(c => list.push([c, 1])); });
    // 목록 짜임이 그대로면(고른 페이지 · 이름만 바뀜) 줄을 다시 만들지 않고 표시 · 이름만 고침 — 다시 만들면 이름 칸을 누른 순간 그 칸이 사라져 입력 · 클릭이 끊김
    const sig = JSON.stringify(list.map(([p, d]) => [p.cid, p.getId(), d, T[p.getId()].menu !== false, d ? 0 : kids(p.getId()).length, collapsed.has(p.getId())]));
    if (box.dataset.sig === sig && box.children.length === list.length) {
      const act = box.ownerDocument.activeElement;
      list.forEach(([p], i) => { const r = box.children[i], inp = r.querySelector('input'); r.classList.toggle('on', p === cur); if (inp && inp !== act && inp.value !== pname(p)) inp.value = pname(p); });
      return;
    }
    box.dataset.sig = sig; box.innerHTML = '';
    list.forEach(([p, d]) => row(p, d));
    function row(p, depth) {
      const id = p.getId(), t = T[id], ks = depth ? [] : kids(id);
      const r = h('div', { className: 'pg' + (p === cur ? ' on' : '') + (t.menu === false ? ' hid' : ''), draggable: true });
      r.style.paddingLeft = (6 + depth * 20) + 'px';
      const car = h('button', { className: 'ib car', textContent: ks.length ? (collapsed.has(id) ? '▸' : '▾') : (depth ? '└' : '') });
      car.setAttribute('aria-label', '하위 페이지 접기 · 펼치기'); car.tabIndex = ks.length ? 0 : -1;
      car.onclick = e => { e.stopPropagation(); if (!ks.length) return; collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); renderPages(); };
      const inp = h('input', { value: pname(p) }); inp.setAttribute('aria-label', '페이지 이름');
      inp.onchange = () => { p.set('name', inp.value || id); afterTree(); dupNameWarn(pname(p)); };
      inp.onfocus = () => { if (editor.Pages.getSelected() !== p) editor.Pages.select(p); };
      const code = h('button', { className: 'pg-id', textContent: '#' + id, title: '눌러서 주소 바꾸기' });
      code.onclick = e => { e.stopPropagation(); renamePageId(p); };
      const acts = h('span', { className: 'pg-acts' }, [
        iconBtn(t.menu === false ? '메뉴에 표시' : '메뉴에서 숨기기', t.menu === false ? '◌' : '●', () => { const now = treeEnsure()[id]; now.menu = now.menu === false; afterTree(); }),
        iconBtn('위로', '↑', () => step(id, -1)), iconBtn('아래로', '↓', () => step(id, 1)),
        depth ? iconBtn('위 단계로', '⇤', () => outdent(id)) : iconBtn('위 페이지의 하위로', '⇥', () => indent(id)),
        iconBtn('하위 페이지 추가', '+', () => addPage('새 하위 페이지', null, id + '-sub', depth ? treeEnsure()[id].parent : id)),
        iconBtn('복제', '⧉', () => addPage(pname(p) + ' 복사', p.getMainComponent().components().map(c => c.clone()), id + '-copy', treeEnsure()[id].parent)), // clone: 요소별 스타일도 새 id로 복사
        (!depth && orderedPages()[0] !== p) ? iconBtn('첫 페이지로 (사이트를 열면 보이는 페이지)', '⌂', () => { const first = orderedPages()[0]; if (first) { movePage(id, first.getId(), 'before'); toast(pname(p) + ' 이(가) 첫 페이지가 되었습니다'); } }) : null,
        iconBtn('삭제', '✕', () => deletePage(p))
      ]);
      r.append(car, inp, code, acts);
      r.onclick = () => { if (editor.Pages.getSelected() !== p) editor.Pages.select(p); };
      r.ondragstart = e => { dragId = id; r.classList.add('drag'); try { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; } catch (er) { /* 무시 */ } };
      r.ondragend = () => { dragId = null; $$('.pg', box).forEach(x => x.classList.remove('drag', 'dz-before', 'dz-after', 'dz-inside')); };
      const zone = e => { const b = r.getBoundingClientRect(), y = (e.clientY - b.top) / b.height; return y < 0.28 ? 'before' : y > 0.72 ? 'after' : (depth ? (y < 0.5 ? 'before' : 'after') : 'inside'); };
      r.ondragover = e => { if (!dragId || dragId === id) return; e.preventDefault(); const z = zone(e); r.classList.remove('dz-before', 'dz-after', 'dz-inside'); r.classList.add('dz-' + z); };
      r.ondragleave = () => r.classList.remove('dz-before', 'dz-after', 'dz-inside');
      r.ondrop = e => { e.preventDefault(); const z = zone(e); r.classList.remove('dz-before', 'dz-after', 'dz-inside'); if (dragId) movePage(dragId, id, z); };
      box.appendChild(r);
    }
  }
  editor.on('page:select', () => { renderNav(); editor.select(null); X.renderSide(); });
  $('#addPage').onclick = async () => {
    const f = document.createElement('div');
    f.innerHTML = '<div class="field"><label for="npName">페이지 이름</label><input class="inp" id="npName" value="새 페이지"></div><div class="field"><label for="npId">주소 (영문 · 숫자 · -)</label><input class="inp" id="npId" value="new-page"></div>';
    const nm = f.querySelector('#npName'), ad = f.querySelector('#npId'); let adTouched = false;
    ad.oninput = () => { adTouched = true; };
    nm.oninput = () => { if (adTouched) return; const sl = nm.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); ad.value = /[a-z]/.test(sl) ? sl : 'new-page'; };
    const v = await dialog('빈 페이지 추가', f, [['취소', null], ['추가', d => d({ n: $('#npName').value, i: $('#npId').value }), 'pri']]);
    if (v) { addPage(v.n, null, v.i); dupNameWarn(v.n); }
  };

  // 상단 페이지 선택 · 작업대 머리글 · 아래 페이지 띠
  function thumbOf(p) {
    let src = '';
    try { walk(p.getMainComponent(), c => { if (src) return; if (c.get('type') === 'image' && c.get('src')) src = c.get('src'); else { const bg = (c.getStyle && c.getStyle()['background-image']) || ''; const m = bg.match(/url\(["']?(.*?)["']?\)$/); if (m) src = m[1]; } }); } catch (e) { src = ''; }
    return src;
  }
  function renderNav() {
    X.refreshLinkCss();
    const T = treeEnsure(), cur = editor.Pages.getSelected(), list = orderedPages();
    const sel = $('#pageSel'); sel.innerHTML = '';
    list.forEach(p => sel.appendChild(h('option', { value: p.getId(), textContent: (T[p.getId()].parent ? '　└ ' : '') + pname(p) })));
    if (cur) sel.value = cur.getId();
    const strip = $('#pageStrip'); strip.innerHTML = '';
    list.forEach(p => {
      const b = h('button', { className: 'ps' + (p === cur ? ' on' : '') + (T[p.getId()].parent ? ' sub' : ''), title: pname(p) + ' (#' + p.getId() + ')' });
      const th = h('span', { className: 'ps-th' }); const src = thumbOf(p); if (src) th.style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")';
      b.append(th, h('span', { className: 'ps-n', textContent: (T[p.getId()].parent ? '└ ' : '') + pname(p) }));
      b.onclick = () => editor.Pages.select(p); strip.appendChild(b);
    });
    const add = h('button', { className: 'ps add', textContent: '+ 페이지' }); add.onclick = () => $('#addPage').click(); strip.appendChild(add);
    renderStageHead();
    if ($('.pane[data-pane="pg"]').classList.contains('on')) renderPages();
  }
  function renderStageHead() {
    const cur = editor.Pages.getSelected(); if (!cur) return;
    const T = treeEnsure(), pa = T[cur.getId()] && T[cur.getId()].parent;
    const dev = { desktop: 'PC · 전체 폭', tablet: '태블릿 · 820px', mobile: '모바일 · 390px' }[editor.getDevice()] || '';
    $('#stageTitle').innerHTML = (pa ? '<span class="dim">' + esc(pname(editor.Pages.get(pa))) + ' ›</span> ' : '') + '<b>' + esc(pname(cur)) + '</b> <span class="dim">#' + esc(cur.getId()) + '</span>';
    $('#stageDev').textContent = dev;
    narrowCheck();
  }
  // PC 화면인데 편집 화면이 좁으면(사이트 대부분이 모양을 바꾸는 760px 미만) 모바일 모양으로 보인다고 알림
  // 편집 화면이 640px 보다 좁으면 PC 모양(메뉴 ≡)이 안 보임 → 처음 한 번은 왼쪽 패널을 자동으로 접고, 그 뒤로는 알림만
  let autoFolded = false;
  function narrowCheck() {
    const cv = editor.Canvas.getElement(), w = cv ? cv.clientWidth : 0, n = $('#narrowNote');
    const narrow = editor.getDevice() === 'desktop' && w > 0 && w < 640;
    if (narrow && !autoFolded && !$('#main').classList.contains('no-drawer') && !(KZ.popout && KZ.popout.isOut('drawer'))) {
      autoFolded = true; $('#main').classList.add('no-drawer'); $$('.rail button').forEach(b => b.classList.remove('on'));
      setTimeout(() => editor.refresh(), 50);
      toast('편집 화면이 좁아 왼쪽 패널을 접었습니다 — 왼쪽 아이콘을 누르면 다시 열립니다');
      return setTimeout(narrowCheck, 300);
    }
    if (n) n.hidden = !narrow;
  }
  if (window.ResizeObserver) new ResizeObserver(() => narrowCheck()).observe($('#gjs'));
  $('#pageSel').onchange = e => editor.Pages.select(e.target.value);

  Object.assign(X, { addPage, kids, movePage, narrowCheck, orderedPages, recordTree, renderNav, renderPages, renderStageHead, treeEnsure, treeRec });
});
