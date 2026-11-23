/* 사이트 이름 · 상단 메뉴 — 원본(S.siteName · 페이지 목록)에서 모든 페이지의 로고 · 메뉴를 한 곳에서 맞춤
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S, attr, hasCls, pname, realPages, walk, within } = X;
  const { $, esc, toast } = KZ.ui;

  // ---------- 사이트 이름 · 상단 메뉴: 한 곳(syncChrome)에서만 맞춤 (0.17.0) ----------
  // 사이트 이름은 S.siteName 하나. 페이지 안에서는 data-site-name 표시가 붙은 요소(로고 · 바닥글 · 첫 화면 제목)가 그 이름을 보여 줌.
  // 상단 메뉴는 페이지 목록(S.tree)에서 만듦. 둘 다 되돌리기 기록에는 넣지 않음 — 원본(이름 · 페이지 목록)이 바뀌면 다시 만들면 되므로.
  const NAME_ATTR = 'data-site-name';
  let syncing = false, chromeT, rteModel = null; // rteModel: 지금 글을 고치는 중(또는 막 고친) 요소 — 그 안의 이름 자리는 덮어쓰지 않음
  function syncNames() {
    const want = esc(S.siteName || '');
    realPages().forEach(p => walk(p.getMainComponent(), c => { if (attr(c, NAME_ATTR) && c.getInnerHTML() !== want && !(rteModel && within(c, rteModel))) c.components(want); }));
  }
  function syncChrome() {
    if (syncing) return; syncing = true;
    try { editor.UndoManager.skip(() => { syncNames(); syncMenus(); }); } finally { syncing = false; }
  }
  // 요소가 들어오거나(템플릿 · 블록 · 새 페이지) 되돌리기를 하면 곧바로 다시 맞춤
  function chromeSoon() { if (!X.booted || syncing) return; clearTimeout(chromeT); chromeT = setTimeout(() => { syncChrome(); X.renderNav(); }, 0); }
  editor.on('component:add undo redo', chromeSoon);
  function setSiteName(name) {
    S.siteName = String(name || '').trim() || '내 사이트'; $('#siteName').value = S.siteName;
    syncChrome(); X.save();
  }
  // 화면에서 글을 고친 뒤: 로고를 고쳤으면 사이트 이름을 바꾸고(모든 페이지에 적용), 그 밖의 이름 자리(첫 화면 제목 · 바닥글)를 다른 글로 고쳤으면 연동을 풂
  function nameEdited(root) {
    const text = c => { const el = c.getEl(); if (el) return el.textContent; const t = document.createElement('div'); t.innerHTML = c.getInnerHTML(); return t.textContent; }; // 화면의 글이 기준
    let brand = null;
    walk(root, c => { if (!attr(c, NAME_ATTR) || text(c) === (S.siteName || '')) return; if (hasCls(c, 'brand')) brand = c; else c.removeAttributes(NAME_ATTR); });
    rteModel = null;
    const name = brand ? text(brand).trim() : '';
    if (name) { setSiteName(name); toast('사이트 이름을 \'' + name + '\' (으)로 바꿨습니다 — 모든 페이지의 로고에 적용'); } else chromeSoon();
  }
  editor.on('rte:enable', view => { rteModel = (view && view.model) || null; });
  editor.on('rte:disable', view => setTimeout(() => { if (view && view.model) nameEdited(view.model); else rteModel = null; }, 0));

  // ---------- 상단 메뉴 만들기 ----------
  // 자동 메뉴: 모든 페이지의 nav.links · .th-menu 를 트리로 다시 만듭니다
  function menuItems() {
    const T = X.treeEnsure();
    return X.kids(null).filter(p => T[p.getId()].menu !== false).map(p => ({ id: p.getId(), name: pname(p), kids: X.kids(p.getId()).filter(c => T[c.getId()].menu !== false).map(c => ({ id: c.getId(), name: pname(c) })) }));
  }
  function syncMenus() {
    if (S.autoMenu === false) return;
    const first = (X.orderedPages()[0] || { getId: () => 'home' }).getId(), T = X.treeEnsure();
    // 첫 페이지는 메뉴에서 빼되(로고가 첫 페이지로 감), 그 하위 페이지는 메뉴 맨 앞에 (전에는 함께 사라졌음)
    const firstKids = T[first] ? X.kids(first).filter(c => T[c.getId()].menu !== false).map(c => ({ id: c.getId(), name: pname(c), kids: [] })) : [];
    const items = firstKids.concat(menuItems().filter(i => i.id !== first));
    const nav = items.map(i => i.kids.length
      ? '<div class="nav-item"><a href="#' + i.id + '">' + esc(i.name) + '</a><div class="nav-sub">' + i.kids.map(k => '<a href="#' + k.id + '">' + esc(k.name) + '</a>').join('') + '</div></div>'
      : '<a href="#' + i.id + '">' + esc(i.name) + '</a>').join('');
    const th = items.map(i => '<a href="#' + i.id + '" data-anim="fade-up">' + esc(i.name) + '</a>').join('');
    realPages().forEach(p => walk(p.getMainComponent(), c => {
      const tag = (c.get('tagName') || '').toLowerCase();
      if (tag === 'nav' && hasCls(c, 'links')) { if (c.getInnerHTML() !== nav) c.components(nav); }
      else if (hasCls(c, 'th-menu')) { if (c.getInnerHTML() !== th) c.components(th); }
      else if (tag === 'a' && hasCls(c, 'brand') && attr(c, 'href') !== '#' + first) c.addAttributes({ href: '#' + first });
    }));
  }

  Object.assign(X, { NAME_ATTR, setSiteName, syncChrome });
});
