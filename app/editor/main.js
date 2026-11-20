/* 편집기 본체 — GrapesJS 초기화, 왼쪽 탭(템플릿 · 요소 · 업로드 · 페이지 · 레이어 · 사이트), 오른쪽 패널, 상단 바, 미리보기
   의존: vendor/grapesjs, layouts/*, sets/*, blocks/blocks.js, editor/config.js · ui.js · storage.js · export.js */
(function (KZ) {
  'use strict';
  const C = KZ.C;
  const { THEMES, COLOR_KEYS, FONTS, TRANS, SPEED, ANIMS, HOVERS, SCROLLS, CLICKS, ENTER_KF, DEFAULT_S } = C;
  const { $, $$, esc, toast, dialog, confirmDlg, setStatus, h, field, slider, seg, opts, num } = KZ.ui;
  const swatches = (label, cur, on, allowNone) => KZ.ui.swatches(label, cur, on, allowNone, S.colors);
  let S = DEFAULT_S();

  KZ.loadSiteAssets().then(start, err => {
    dialog('편집기를 시작하지 못했습니다', '<p>사이트 파일을 불러오지 못했습니다 (' + esc(err.message) + ').</p><p class="hint">파일을 직접 열었다면 웹 서버로 열어야 합니다. 예: <code>python3 -m http.server --directory app</code></p>');
  });

  function start() {
    // ---------- 에디터 ----------
    const editor = grapesjs.init({
      container: '#gjs', height: '100%', width: 'auto', fromElement: false, cssIcons: '',
      storageManager: false, panels: { defaults: [] },
      deviceManager: { devices: C.DEVICES },
      blockManager: { appendTo: '#blocks' },
      layerManager: { appendTo: '#layers' },
      traitManager: { appendTo: '#traits' },
      selectorManager: { appendTo: '#selectors', componentFirst: true },
      styleManager: { appendTo: '#styles', sectors: C.SECTORS },
      assetManager: { upload: false, assets: [] },
      keepUnusedStyles: true,
      pageManager: { pages: [{ id: '__boot', name: 'boot', component: '' }] },
      richTextEditor: { actions: ['bold', 'italic', 'underline', 'strikethrough', 'link'] }
    });
    window.__kzEditor = editor;

    // 연결 안 된 버튼: 버튼 · 카드 모양 링크인데 href 가 비었거나 '#' 이고 팝업 등도 없는 것, 또는 '페이지 이동'인데 주소가 없는 것
    const UNLINKED_SEL = ['a.btn', 'a.btn-line', 'a.ct-i', 'a.hero-now', 'a.more'].map(c => c + '[href="#"]:not([data-click]),' + c + '[href=""]:not([data-click])').join(',') + ',[data-click="go"]:not([data-go])';
    function unlinkedReport() {
      const out = [];
      orderedPages().forEach(p => {
        const t = document.createElement('template'); t.innerHTML = p.getMainComponent().getInnerHTML();
        const n = t.content.querySelectorAll(UNLINKED_SEL).length; if (n) out.push({ name: pname(p), n });
      });
      return out;
    }

    // 캔버스에 사이트 CSS 주입
    const docs = new Set();
    function injectDoc(doc) {
      if (!doc || !doc.head) return;
      if (!doc.getElementById('kz-base')) {
        doc.head.insertAdjacentHTML('beforeend', KZ.fontHead('', { all: true, base: new URL('.', location.href).href }));
        const b = doc.createElement('style'); b.id = 'kz-base'; b.textContent = KZ.site.base + '\n' + KZ.site.motion; doc.head.appendChild(b);
        const t = doc.createElement('style'); t.id = 'kz-theme'; doc.head.appendChild(t);
        // 효과 표시: 편집 화면에서만 노란 점선 (미리보기 · 내보내기에는 없음)
        const fm = doc.createElement('style'); fm.id = 'kz-fxmark';
        fm.textContent = 'html.kz-fx [data-anim]:not([data-anim=""]),html.kz-fx [data-hover]:not([data-hover=""]),html.kz-fx [data-click]:not([data-click=""]),html.kz-fx [data-scroll]:not([data-scroll=""]){outline:1px dashed rgba(242,201,76,.95);outline-offset:3px}';
        doc.head.appendChild(fm);
        // 연결 안 된 버튼 · 카드: 빨간 점선 (편집 화면만)
        const ul = doc.createElement('style'); ul.id = 'kz-unlinked';
        ul.textContent = UNLINKED_SEL + '{outline:1px dashed #e5484d!important;outline-offset:3px}';
        doc.head.appendChild(ul);
        // Alt(⌥)+클릭: 링크가 가리키는 페이지로 이동
        const jump = e => {
          if (!e.altKey) return;
          const a = e.target.closest && e.target.closest('[data-click="go"][data-go^="#"], a[href^="#"]'); if (!a) return;
          const id = (a.getAttribute('data-go') || a.getAttribute('href') || '').slice(1);
          if (id && editor.Pages.get(id)) { e.preventDefault(); e.stopPropagation(); if (e.type === 'click') editor.Pages.select(id); }
        };
        doc.addEventListener('mousedown', jump, true); doc.addEventListener('click', jump, true);
      }
      doc.getElementById('kz-theme').textContent = KZ.themeCss(S);
      doc.documentElement.classList.toggle('kz-fx', fxMark);
      docs.add(doc);
    }
    let fxMark = true; try { fxMark = localStorage.getItem('kz-fxmark') !== '0'; } catch (e) { /* 기본 켬 */ }
    function setFxMark(on) {
      fxMark = on; try { localStorage.setItem('kz-fxmark', on ? '1' : '0'); } catch (e) { /* 무시 */ }
      docs.forEach(d => { try { d.documentElement.classList.toggle('kz-fx', on); } catch (e) { docs.delete(d); } });
      const b = $('#fxMarkBtn'); if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    }
    function refreshTheme() { docs.forEach(d => { try { const t = d.getElementById('kz-theme'); if (t) t.textContent = KZ.themeCss(S); else docs.delete(d); } catch (e) { docs.delete(d); } }); }
    editor.on('canvas:frame:load', ({ window: w }) => injectDoc(w.document));
    // 페이지 · 기기 전환 때 새 프레임에도 CSS가 들어가도록 주기적으로 확인
    setInterval(() => { try { const d = editor.Canvas.getDocument(); if (d && d.head && !d.getElementById('kz-base')) injectDoc(d); } catch (e) { /* 프레임 준비 중 */ } }, 250);

    // 블록
    KZ.BLOCKS.forEach(([id, label, category, media, content]) => {
      editor.Blocks.add(id, { label, category, media, content: typeof content === 'function' ? content() : content });
    });

    // ---------- 저장 (IndexedDB) ----------
    let booted = false, saveT, armed = false;
    // 작업 파일(.json) 미저장 표시: 받은 뒤 고친 내용이 있으면 상단에 노란 글씨. 상태는 이 브라우저에 기억
    const FILE_KEY = 'kz-file-dirty';
    function fileDirty(on) {
      try { localStorage.setItem(FILE_KEY, on ? '1' : '0'); } catch (e) { /* 무시 */ }
      const b = $('#fileWarn'); if (b) b.hidden = !on;
    }
    // 받는 파일 이름은 영문 · 숫자만 (한글 이름은 일부 브라우저에서 'download' 로 바뀜)
    function fileBase() {
      const n = String(S.siteName || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
      const d = new Date(), ymd = '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      return (/[a-z]/.test(n) ? n : 'site') + '-' + ymd;
    }
    function saveProjectFile() {
      offerFile(fileBase() + '-project.json', JSON.stringify(KZ.store.pack(S, editor.getProjectData())), 'application/json');
      fileDirty(false);
    }
    function save() {
      if (!booted) return;
      if (armed) fileDirty(true);
      setStatus('저장 중…'); clearTimeout(saveT);
      saveT = setTimeout(async () => {
        try { await KZ.store.DB.set('project', KZ.store.pack(S, editor.getProjectData())); setStatus('저장됨 · 이 브라우저'); }
        catch (e) { setStatus('브라우저 저장 불가 — 파일로 저장하세요'); }
      }, 900);
    }
    editor.on('update', save);

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
        refreshTheme(); if (booted) renderSite();
      }
      syncMenus();
      editor.UndoManager.clear();
      renderNav(); save();
    }
    function renderSets() {
      const box = $('#sets'); box.innerHTML = '';
      $('#setsCount').textContent = KZ.setOrder.length + '종 · 업종별 페이지 묶음';
      $('#setsFold').onclick = () => { const open = box.hidden; box.hidden = !open; $('#setsFold').setAttribute('aria-expanded', String(open)); $('#setsFold .fold-c').textContent = open ? '▾' : '▸'; };
      KZ.setOrder.map(k => [k, KZ.sets[k]]).forEach(([k, s]) => {
        const b = document.createElement('button'); b.className = 'set';
        const th = THEMES[(s.style || {}).theme] || THEMES.white; b.innerHTML = '<i class="set-sw"><b style="background:' + th.bg + '"></b><b style="background:' + th.ink + '"></b><b style="background:' + th.accent + '"></b></i><b>' + esc(s.name) + '</b><span>' + esc(s.desc) + '</span>';
        b.onclick = async () => { if (await confirmDlg('사이트 세트 적용', '지금 사이트의 모든 페이지가 <b>' + esc(s.name) + '</b> 세트로 바뀝니다. 계속할까요?', '적용')) { applySet(k); toast('세트를 적용했습니다'); } };
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
      if (v === 'new') { const SLUG = { t1: 'home', t2: 'exhibitions', t3: 'works', t4: 'work', t5: 'apps', t6: 'series', t7: 'by-year', t8: 'index', t9: 'gallery', t10: 'cv', t11: 'text', t12: 'intro', t13: 'about', fx: 'effects' }; const p = addPage(t.name.replace(/\s*\(.*\)$/, ''), t.html(), t.slug || SLUG[id]); if (p) toast('새 페이지 #' + p.getId() + ' 를 만들었습니다'); }
    }

    // ---------- 섹션 (페이지 바로 아래 요소) ----------
    const isNavTop = c => (c.get('tagName') || '').toLowerCase() === 'header' && hasCls(c, 'nav');
    const isFootTop = c => hasCls(c, 'foot');
    function topOf(c) { const w = editor.getWrapper(); while (c && c.parent() && c.parent() !== w) c = c.parent(); return c && c.parent() === w ? c : null; }
    function addSection(html) {
      const w = editor.getWrapper(), comps = w.components();
      const top = topOf(editor.getSelected());
      let at;
      if (top && isFootTop(top)) at = top.index();
      else if (top) at = top.index() + 1;
      else { const f = comps.filter(isFootTop).pop(); at = f ? f.index() : comps.length; }
      const added = w.append(html, { at });
      if (added[0]) { editor.select(added[0]); try { added[0].getEl().scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { /* 무시 */ } }
      return added;
    }
    // 섹션 옮기기: 상단 메뉴 위 · 바닥글 아래로는 가지 않음
    function moveSection(sec, d) {
      const w = editor.getWrapper(), list = w.components().models, i = list.indexOf(sec), j = i + d;
      if (i < 0 || j < 0 || j >= list.length || isNavTop(list[j]) || isFootTop(list[j])) return false;
      sec.move(w, { at: d > 0 ? j + 1 : j }); editor.select(sec); return true;
    }

    // ---------- 페이지 · 트리 ----------
    // S.tree[페이지 주소] = { parent: 상위 주소 | null, order: 순서, menu: 메뉴에 표시 }  — 2단계까지
    const realPages = () => editor.Pages.getAll().filter(p => !String(p.getId()).startsWith('__'));
    const pname = p => p.get('name') || p.getId();
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
    function afterTree() { syncMenus(); renderNav(); save(); }

    // 자동 메뉴: 모든 페이지의 nav.links · .th-menu 를 트리로 다시 만듭니다
    function walk(c, fn) { fn(c); c.components().forEach(x => walk(x, fn)); }
    function hasCls(c, n) { return (c.getClasses ? c.getClasses() : []).includes(n); }
    function menuItems() {
      const T = treeEnsure();
      return kids(null).filter(p => T[p.getId()].menu !== false).map(p => ({ id: p.getId(), name: pname(p), kids: kids(p.getId()).filter(c => T[c.getId()].menu !== false).map(c => ({ id: c.getId(), name: pname(c) })) }));
    }
    function syncMenus() {
      if (S.autoMenu === false) return;
      const first = (orderedPages()[0] || { getId: () => 'home' }).getId();
      const items = menuItems().filter(i => i.id !== first);
      const nav = items.map(i => i.kids.length
        ? '<div class="nav-item"><a href="#' + i.id + '">' + esc(i.name) + '</a><div class="nav-sub">' + i.kids.map(k => '<a href="#' + k.id + '">' + esc(k.name) + '</a>').join('') + '</div></div>'
        : '<a href="#' + i.id + '">' + esc(i.name) + '</a>').join('');
      const th = items.map(i => '<a href="#' + i.id + '" data-anim="fade-up">' + esc(i.name) + '</a>').join('');
      realPages().forEach(p => walk(p.getMainComponent(), c => {
        const tag = (c.get('tagName') || '').toLowerCase();
        if (tag === 'nav' && hasCls(c, 'links')) c.components(nav);
        else if (hasCls(c, 'th-menu')) c.components(th);
        else if (tag === 'a' && hasCls(c, 'brand')) c.addAttributes({ href: '#' + first });
      }));
    }

    function uniqueId(base) {
      let id = (base || 'page').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'page';
      let n = 1, out = id; while (editor.Pages.get(out)) out = id + '-' + (++n); return out;
    }
    function addPage(name, html, id, parent) {
      const p = editor.Pages.add({ id: uniqueId(id || 'page'), name: name || '새 페이지', component: html || '<section class="wrap"><h1 class="title">새 페이지</h1><p class="body-p">요소 탭에서 섹션을 끌어 오세요.</p></section>' });
      const T = treeEnsure(); if (parent && T[parent] && !T[parent].parent) { T[p.getId()].parent = parent; renumberAll(); }
      editor.Pages.select(p); afterTree(); return p;
    }
    async function deletePage(p) {
      if (realPages().length < 2) return toast('마지막 페이지는 지울 수 없습니다');
      const ks = kids(p.getId());
      if (!await confirmDlg('페이지 삭제', '<b>' + esc(pname(p)) + '</b> 페이지를 삭제할까요?' + (ks.length ? '<br>하위 페이지 ' + ks.length + '개는 위 단계로 올라갑니다.' : ''), '삭제')) return;
      const T = treeEnsure(); ks.forEach(c => { T[c.getId()].parent = null; T[c.getId()].order = T[p.getId()].order + 0.5; });
      const other = orderedPages().find(x => x !== p); editor.Pages.select(other); editor.Pages.remove(p); renumberAll(); afterTree();
    }
    function iconBtn(label, txt, fn) { const b = h('button', { className: 'ib', title: label, textContent: txt }); b.setAttribute('aria-label', label); b.onclick = e => { e.stopPropagation(); fn(); }; return b; }
    let dragId = null;
    function renderPages() {
      const box = $('#pages'); if (!box) return; box.innerHTML = '';
      const T = treeEnsure(), cur = editor.Pages.getSelected();
      kids(null).forEach(p => { row(p, 0); if (!collapsed.has(p.getId())) kids(p.getId()).forEach(c => row(c, 1)); });
      function row(p, depth) {
        const id = p.getId(), t = T[id], ks = depth ? [] : kids(id);
        const r = h('div', { className: 'pg' + (p === cur ? ' on' : '') + (t.menu === false ? ' hid' : ''), draggable: true });
        r.style.paddingLeft = (6 + depth * 20) + 'px';
        const car = h('button', { className: 'ib car', textContent: ks.length ? (collapsed.has(id) ? '▸' : '▾') : (depth ? '└' : '') });
        car.setAttribute('aria-label', '하위 페이지 접기 · 펼치기'); car.tabIndex = ks.length ? 0 : -1;
        car.onclick = e => { e.stopPropagation(); if (!ks.length) return; collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); renderPages(); };
        const inp = h('input', { value: pname(p) }); inp.setAttribute('aria-label', '페이지 이름');
        inp.onchange = () => { p.set('name', inp.value || id); afterTree(); };
        inp.onfocus = () => { if (editor.Pages.getSelected() !== p) editor.Pages.select(p); };
        const code = h('code', { textContent: '#' + id });
        const acts = h('span', { className: 'pg-acts' }, [
          iconBtn(t.menu === false ? '메뉴에 표시' : '메뉴에서 숨기기', t.menu === false ? '◌' : '●', () => { t.menu = t.menu === false; afterTree(); }),
          iconBtn('위로', '↑', () => step(id, -1)), iconBtn('아래로', '↓', () => step(id, 1)),
          depth ? iconBtn('위 단계로', '⇤', () => outdent(id)) : iconBtn('위 페이지의 하위로', '⇥', () => indent(id)),
          iconBtn('하위 페이지 추가', '+', () => addPage('새 하위 페이지', null, id + '-sub', depth ? t.parent : id)),
          iconBtn('복제', '⧉', () => addPage(pname(p) + ' 복사', p.getMainComponent().components().map(c => c.clone()), id + '-copy', t.parent)), // clone: 요소별 스타일도 새 id로 복사
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
    editor.on('page:select', () => { renderNav(); editor.select(null); renderSide(); });
    $('#addPage').onclick = async () => {
      const f = document.createElement('div');
      f.innerHTML = '<div class="field"><label for="npName">페이지 이름</label><input class="inp" id="npName" value="새 페이지"></div><div class="field"><label for="npId">주소 (영문 · 숫자 · -)</label><input class="inp" id="npId" value="new-page"></div>';
      const v = await dialog('빈 페이지 추가', f, [['취소', null], ['추가', d => d({ n: $('#npName').value, i: $('#npId').value }), 'pri']]);
      if (v) addPage(v.n, null, v.i);
    };

    // 상단 페이지 선택 · 작업대 머리글 · 아래 페이지 띠
    function thumbOf(p) {
      let src = '';
      try { walk(p.getMainComponent(), c => { if (src) return; if (c.get('type') === 'image' && c.get('src')) src = c.get('src'); else { const bg = (c.getStyle && c.getStyle()['background-image']) || ''; const m = bg.match(/url\(["']?(.*?)["']?\)$/); if (m) src = m[1]; } }); } catch (e) { src = ''; }
      return src;
    }
    function renderNav() {
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
    }
    $('#pageSel').onchange = e => editor.Pages.select(e.target.value);

    // ---------- 업로드 ----------
    const readDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
    function resizeImage(file) {
      return new Promise(res => {
        if (/svg|gif/.test(file.type)) { readDataURL(file).then(res); return; }
        const url = URL.createObjectURL(file); const img = new Image();
        img.onload = () => {
          const m = 1920, sc = Math.min(1, m / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          let d = c.toDataURL('image/webp', 0.85); if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/jpeg', 0.88);
          URL.revokeObjectURL(url); res(d);
        };
        img.onerror = () => { URL.revokeObjectURL(url); readDataURL(file).then(res); };
        img.src = url;
      });
    }
    async function handleFiles(files) {
      let n = 0;
      for (const f of files) {
        try {
          if (f.type.startsWith('image/')) { S.assets.unshift({ id: 'a' + Date.now() + n, type: 'image', name: f.name, src: await resizeImage(f) }); n++; }
          else if (f.type.startsWith('video/')) {
            if (f.size > 40e6) { toast(f.name + ': 40MB가 넘어 올리지 않았습니다. 20MB 이하로 줄여 주세요.'); continue; }
            if (f.size > 20e6) toast('20MB가 넘는 영상은 사이트가 느려질 수 있습니다.');
            S.assets.unshift({ id: 'a' + Date.now() + n, type: 'video', name: f.name, src: await readDataURL(f) }); n++;
          }
        } catch (e) { toast(f.name + ' 파일을 읽지 못했습니다'); }
      }
      if (n) { renderAssets(); save(); toast(n + '개를 올렸습니다. 눌러서 적용하세요'); }
    }
    function renderAssets() {
      const box = $('#assets'); box.innerHTML = '';
      if (!S.assets.length) { box.innerHTML = '<p class="hint" style="grid-column:1/-1">아직 올린 파일이 없습니다.</p>'; return; }
      S.assets.forEach(a => {
        const b = document.createElement('button'); b.className = 'asset'; b.title = a.name + ' — 눌러서 적용';
        if (a.type === 'image') { const i = document.createElement('img'); i.src = a.src; i.alt = a.name; b.appendChild(i); }
        else { const v = document.createElement('video'); v.src = a.src; v.muted = true; v.loop = true; v.playsInline = true; b.onmouseenter = () => v.play().catch(() => {}); b.onmouseleave = () => v.pause(); b.appendChild(v); }
        const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = a.type === 'image' ? '사진' : '영상'; b.appendChild(tag);
        b.onclick = () => applyAsset(a);
        b.oncontextmenu = async e => { e.preventDefault(); if (await confirmDlg('파일 삭제', '이 파일을 목록에서 지울까요? (이미 넣은 곳은 그대로 남습니다)', '지우기')) { S.assets = S.assets.filter(x => x !== a); renderAssets(); save(); } };
        box.appendChild(b);
      });
    }
    const up = (c, pred) => { while (c) { if (pred(c)) return c; c = c.parent(); } return null; };
    const attr = (c, k) => (c && c.getAttributes()[k]) || '';
    function insertNear(sel, def) {
      const wrapper = editor.getWrapper();
      let target = wrapper, at;
      if (sel && sel !== wrapper) {
        const leaf = sel.is('text') || sel.is('image') || sel.is('video') || sel.is('link') || sel.get('tagName') === 'button';
        if (leaf && sel.parent()) { target = sel.parent(); at = sel.index() + 1; } else target = sel;
      }
      const added = target.append(def, at != null ? { at } : {})[0];
      if (added) editor.select(added);
      return added;
    }
    function applyAsset(a) {
      const sel = editor.getSelected();
      if (a.type === 'image') {
        if (sel && sel.is('image')) { sel.set('src', a.src); return toast('이미지를 바꿨습니다'); }
        if (sel && attr(sel, 'data-hover') === 'cursor') { sel.addAttributes({ 'data-preview': a.src }); return toast('커서 미리보기 이미지를 바꿨습니다'); }
        const inner = sel && sel.find('img')[0];
        if (inner) { inner.set('src', a.src); return toast('선택한 영역의 이미지를 바꿨습니다'); }
        if (sel && attr(sel, 'data-click') === 'lightbox') { sel.addAttributes({ 'data-src': a.src }); return toast('라이트박스 이미지를 지정했습니다'); }
        insertNear(sel, { type: 'image', src: a.src, attributes: { alt: '' }, style: { 'max-width': '100%' } });
        return toast('이미지를 넣었습니다');
      }
      const vprops = { src: a.src, autoplay: true, loop: true, muted: true, controls: false };
      if (sel && sel.is('video')) { sel.set(vprops); return toast('영상을 바꿨습니다'); }
      const hero = up(sel, c => !!attr(c, 'data-bgvideo'));
      if (hero) {
        const ex = hero.find('video')[0];
        if (ex) ex.set(vprops); else hero.append(Object.assign({ type: 'video', classes: ['hero-video'] }, vprops), { at: 1 });
        const note = hero.find('.hero-note')[0]; if (note) note.remove();
      const photo = hero.find('.hero-photo')[0]; if (photo) photo.remove();
        return toast('배경 영상을 넣었습니다');
      }
      const iv = sel && sel.find('video')[0];
      if (iv) { iv.set(vprops); return toast('영상을 바꿨습니다'); }
      insertNear(sel, Object.assign({ type: 'video', style: { width: '100%', 'aspect-ratio': '16/9' } }, vprops));
      toast('영상을 넣었습니다');
    }
    const drop = $('#drop'), fileIn = $('#fileIn');
    fileIn.onchange = () => { handleFiles([...fileIn.files]); fileIn.value = ''; };
    drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } };
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => handleFiles([...(e.dataTransfer.files || [])]));

    // ---------- 스타일 쓰기 (기기별) ----------
    function mediaOpts() { const d = editor.Devices.get(editor.getDevice()); const wm = d && d.get('widthMedia'); return wm ? { atRuleType: 'media', atRuleParams: '(max-width: ' + wm + ')' } : {}; }
    function ruleStyle(c) { const r = editor.Css.getRule('#' + c.getId(), mediaOpts()); return r ? r.getStyle() : {}; }
    function setStyle(c, obj) {
      const o = mediaOpts(), sel = '#' + c.getId();
      const st = Object.assign({}, ruleStyle(c));
      Object.entries(obj).forEach(([k, v]) => { if (v === '' || v == null) delete st[k]; else st[k] = v; });
      editor.Css.setRule(sel, st, o);
    }
    function cs(c) { const el = c.getEl(); try { return el ? el.ownerDocument.defaultView.getComputedStyle(el) : null; } catch (e) { return null; } }
    function val(c, prop) { const r = ruleStyle(c)[prop]; if (r) return r; const s = cs(c); return s ? s.getPropertyValue(prop) : ''; }

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
      renderDesign(sel); renderFx(sel);
    }
    function arrangeRow(sel) {
      const mk = (label, svg, fn) => { const b = h('button', { title: label }); b.innerHTML = svg + '<span>' + label + '</span>'; b.onclick = fn; return b; };
      const P = 'fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"';
      const box = h('div', { className: 'acts' });
      const parent = sel.parent();
      const move = d => { if (!parent) return; const i = sel.index(), n = i + d; if (n < 0 || n >= parent.components().length) return; if (sel.move) sel.move(parent, { at: d > 0 ? n + 1 : n }); editor.select(sel); };
      box.append(
        mk('복제', '<svg ' + P + '><rect x="8" y="8" width="12" height="12"/><path d="M4 16V4h12"/></svg>', () => { if (!parent) return; const cl = sel.clone(); parent.append(cl, { at: sel.index() + 1 }); editor.select(cl); }),
        mk('위로', '<svg ' + P + '><path d="M12 19V5M6 11l6-6 6 6"/></svg>', () => move(-1)),
        mk('아래로', '<svg ' + P + '><path d="M12 5v14M6 13l6 6 6-6"/></svg>', () => move(1)),
        mk('삭제', '<svg ' + P + '><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>', () => { if (!parent) return; sel.remove(); editor.select(null); renderSide(); }),
        mk('앞으로', '<svg ' + P + '><rect x="4" y="4" width="11" height="11"/><rect x="9" y="9" width="11" height="11" fill="currentColor" opacity=".25"/></svg>', () => { const z = num(val(sel, 'z-index'), 0) + 1; const p = val(sel, 'position'); setStyle(sel, Object.assign({ 'z-index': String(z) }, p === 'static' ? { position: 'relative' } : {})); toast('앞으로 (z ' + z + ')'); }),
        mk('뒤로', '<svg ' + P + '><rect x="9" y="9" width="11" height="11"/><rect x="4" y="4" width="11" height="11" fill="currentColor" opacity=".25"/></svg>', () => { const z = num(val(sel, 'z-index'), 0) - 1; const p = val(sel, 'position'); setStyle(sel, Object.assign({ 'z-index': String(z) }, p === 'static' ? { position: 'relative' } : {})); toast('뒤로 (z ' + z + ')'); }),
        mk('맞춤 해제', '<svg ' + P + '><path d="M4 4l16 16M20 4L4 20"/></svg>', () => { editor.Css.setRule('#' + sel.getId(), {}, mediaOpts()); renderSide(); toast('이 기기 화면에서 바꾼 스타일을 지웠습니다'); }),
        mk('페이지 끝', '<svg ' + P + '><path d="M12 4v12M6 10l6 6 6-6M5 20h14"/></svg>', () => { const w = editor.getWrapper(); if (sel.move) sel.move(w, { at: w.components().length }); editor.select(sel); })
      );
      return box;
    }
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
          sb('↑ 섹션 위로', () => { if (!moveSection(top, -1)) toast('더 올릴 수 없습니다'); }),
          sb('↓ 섹션 아래로', () => { if (!moveSection(top, 1)) toast('더 내릴 수 없습니다'); }),
          top !== sel ? sb('섹션 선택', () => editor.select(top)) : null
        ]));
      }

      if (kind === 'text') {
        sec('글자');
        const fsel = h('select', { className: 'inp' });
        [['', '테마 기본'], ['var(--fh)', '제목 글꼴 (테마)'], ['var(--fb)', '본문 글꼴 (테마)'], ...Object.values(FONTS).map(f => [f.h, f.name.split(' (')[0].split(' +')[0]])].forEach(([v, t]) => fsel.appendChild(h('option', { value: v, textContent: t })));
        fsel.value = ruleStyle(sel)['font-family'] || ''; fsel.onchange = () => setStyle(sel, { 'font-family': fsel.value });
        box.appendChild(field('글꼴', fsel));
        box.appendChild(slider('크기', 10, 160, 1, Math.round(num(val(sel, 'font-size'), 16)), v => v + 'px', v => setStyle(sel, { 'font-size': v + 'px' })));
        const w = h('select', { className: 'inp' });
        [['300', '가늘게'], ['400', '보통'], ['500', '중간'], ['600', '약간 굵게'], ['700', '굵게']].forEach(([v, t]) => w.appendChild(h('option', { value: v, textContent: t })));
        w.value = String(Math.round(num(val(sel, 'font-weight'), 400) / 100) * 100); w.onchange = () => setStyle(sel, { 'font-weight': w.value });
        box.appendChild(field('굵기', w));
        const fs = num(val(sel, 'font-size'), 16);
        const lhRaw = val(sel, 'line-height'); const lh = /px/.test(lhRaw) ? num(lhRaw, fs * 1.5) / fs : num(lhRaw, 1.5);
        box.appendChild(slider('줄 간격', 0.9, 2.6, 0.05, +lh.toFixed(2), v => v.toFixed(2), v => setStyle(sel, { 'line-height': String(v) })));
        const lsRaw = val(sel, 'letter-spacing'); const ls = /em/.test(lsRaw) ? num(lsRaw, 0) : num(lsRaw, 0) / fs;
        box.appendChild(slider('자간', -0.08, 0.4, 0.01, +(isNaN(ls) ? 0 : ls).toFixed(2), v => v.toFixed(2) + 'em', v => setStyle(sel, { 'letter-spacing': v + 'em' })));
        box.appendChild(swatches('글자 색', val(sel, 'color'), v => setStyle(sel, { color: v })));
        box.appendChild(seg('정렬', [['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']], val(sel, 'text-align') === 'start' ? 'left' : val(sel, 'text-align'), v => setStyle(sel, { 'text-align': v })));
        box.appendChild(h('p', { className: 'hint', textContent: '글 내용은 화면에서 두 번 눌러 바로 고칩니다.' }));
      }
      if (kind === 'image' || kind === 'video') {
        sec(kind === 'image' ? '이미지' : '영상');
        const rep = h('button', { className: 'btn full', textContent: kind === 'image' ? '이미지 교체 (업로드 탭)' : '영상 교체 (업로드 탭)' }); rep.onclick = () => openPane('up');
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
      if (kind === 'text' && ((sel.get('tagName') || '') === 'a' || sel.is('link'))) {
        sec('링크');
        const ls = h('select', { className: 'inp' });
        ls.appendChild(h('option', { value: '', textContent: '— 페이지 선택 —' }));
        realPages().forEach(p => ls.appendChild(h('option', { value: '#' + p.getId(), textContent: (p.get('name') || p.getId()) + '  (#' + p.getId() + ')' })));
        const href = attr(sel, 'href'); ls.value = realPages().some(p => '#' + p.getId() === href) ? href : '';
        ls.onchange = () => { if (ls.value) { sel.addAttributes({ href: ls.value }); url.value = ls.value; } };
        const url = h('input', { className: 'inp', value: href, placeholder: 'https://… 또는 #주소' });
        url.onchange = () => { const u = url.value.trim(); sel.addAttributes({ href: u }); if (/^https?:/i.test(u)) sel.addAttributes({ target: '_blank', rel: 'noopener' }); else sel.removeAttributes(['target', 'rel']); };
        box.appendChild(field('이동할 페이지', ls)); box.appendChild(field('또는 직접 주소', url)); box.appendChild(presetField(url));
      }
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
    // 링크 빠른 입력: 앞부분만 채우고 뒤는 사용자가 이어서 씀
    const PRESETS = [['', '빠른 입력 …'], ['tel:', '전화 (tel:번호)'], ['mailto:', '이메일 (mailto:주소)'], ['https://pf.kakao.com/', '카카오톡 채널'], ['https://booking.naver.com/', '네이버 예약'], ['https://forms.gle/', '구글 폼'], ['https://instagram.com/', '인스타그램']];
    function presetField(url) {
      const ps = h('select', { className: 'inp' }); PRESETS.forEach(([v, t]) => ps.appendChild(h('option', { value: v, textContent: t })));
      ps.onchange = () => { if (!ps.value) return; url.value = ps.value; url.focus(); try { url.setSelectionRange(url.value.length, url.value.length); } catch (e) { /* 무시 */ } ps.value = ''; toast('뒤에 번호 · 주소를 이어서 쓰고 Enter'); };
      url.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); url.dispatchEvent(new Event('change')); url.blur(); } };
      return field('', ps);
    }
    function renderFx(sel) {
      const box = $('#tabFx'); box.innerHTML = '';
      const sec = (t, d) => { box.appendChild(h('h3', { textContent: t, style: 'font-size:12px;color:var(--ui-sub);font-weight:500;margin:16px 0 4px' })); if (d) box.appendChild(h('p', { className: 'hint', textContent: d, style: 'margin:0 0 8px' })); };
      const setA = (k, v) => { if (v) sel.addAttributes({ [k]: v }); else sel.removeAttributes(k); };
      sec('스크롤 등장', '화면에 들어올 때 재생');
      box.appendChild(opts(ANIMS, attr(sel, 'data-anim'), v => { setA('data-anim', v); if (v) replay(sel); }));
      const rp = h('button', { className: 'btn full', textContent: '▶ 다시 재생', style: 'margin-top:8px' }); rp.onclick = () => replay(sel); box.appendChild(rp);
      sec('마우스 올림');
      box.appendChild(opts(HOVERS, attr(sel, 'data-hover'), v => {
        setA('data-hover', v);
        if (v === 'cursor' && !attr(sel, 'data-preview')) { const im = sel.find('img')[0]; sel.addAttributes({ 'data-preview': im ? im.get('src') : KZ.H.ph('미리보기', 440, 560, 2) }); toast('업로드 탭에서 사진을 누르면 미리보기 이미지가 바뀝니다'); }
        if (v === 'caption' && !sel.find('figcaption').length) toast('캡션(figcaption)이 있는 이미지 카드에서 작동합니다');
      }));
      sec('스크롤 연출');
      box.appendChild(opts(SCROLLS, attr(sel, 'data-scroll'), v => {
        setA('data-scroll', v);
        if (v === 'parallax' && sel.parent()) { setStyle(sel.parent(), { overflow: 'hidden' }); toast('바깥 영역 안에서 느리게 움직입니다 (미리보기에서 확인)'); }
        if (v === 'sticky') toast('스크롤해도 화면 위에 고정됩니다 (미리보기에서 확인)');
      }));
      sec('누르면');
      const clickBox = h('div');
      box.appendChild(opts(CLICKS, attr(sel, 'data-click'), v => { setA('data-click', v); if (v !== 'go') sel.removeAttributes('data-go'); drawClick(v); }));
      box.appendChild(clickBox);
      function drawClick(v) {
        clickBox.innerHTML = '';
        if (['panel', 'sheet', 'modal'].includes(v)) {
          const t = h('input', { className: 'inp', value: attr(sel, 'data-title') }); t.onchange = () => sel.addAttributes({ 'data-title': t.value });
          const x = h('textarea', { className: 'inp', value: attr(sel, 'data-text') }); x.onchange = () => sel.addAttributes({ 'data-text': x.value });
          clickBox.append(h('div', { style: 'height:10px' }), field('팝업 제목', t), field('팝업 내용 (줄바꿈 가능)', x));
        } else if (v === 'lightbox') {
          const t = h('input', { className: 'inp', value: attr(sel, 'data-title'), placeholder: '[항목 이름], 2026' }); t.onchange = () => sel.addAttributes({ 'data-title': t.value });
          clickBox.append(h('div', { style: 'height:10px' }), field('캡션', t), h('p', { className: 'hint', textContent: '같은 페이지의 라이트박스끼리 화살표로 넘겨 봅니다.' }));
        } else if (v === 'menu') clickBox.append(h('p', { className: 'hint', textContent: '모든 페이지 목록이 전체 화면으로 펼쳐집니다.', style: 'margin-top:8px' }));
        else if (v === 'go') {
          const cur = attr(sel, 'data-go');
          const ls = h('select', { className: 'inp' });
          ls.appendChild(h('option', { value: '', textContent: '— 페이지 선택 —' }));
          orderedPages().forEach(p => ls.appendChild(h('option', { value: '#' + p.getId(), textContent: (treeEnsure()[p.getId()].parent ? '└ ' : '') + pname(p) + '  (#' + p.getId() + ')' })));
          ls.value = realPages().some(p => '#' + p.getId() === cur) ? cur : '';
          const url = h('input', { className: 'inp', value: cur, placeholder: 'https://… (새 창으로 열림)' });
          ls.onchange = () => { if (ls.value) { sel.addAttributes({ 'data-go': ls.value }); url.value = ls.value; } };
          url.onchange = () => { const u = url.value.trim(); if (u) sel.addAttributes({ 'data-go': u }); else sel.removeAttributes('data-go'); ls.value = realPages().some(p => '#' + p.getId() === u) ? u : ''; };
          clickBox.append(h('div', { style: 'height:10px' }), field('이동할 페이지', ls), field('또는 바깥 주소', url), presetField(url),
            h('p', { className: 'hint', textContent: '편집 화면에서는 Alt+클릭으로 따라갑니다.' }));
        }
      }
      drawClick(attr(sel, 'data-click'));
      const pv = h('button', { className: 'btn pri full', textContent: '미리보기에서 확인', style: 'margin-top:18px' }); pv.onclick = () => openPreview(); box.appendChild(pv);
    }
    function replay(sel) {
      const el = sel.getEl(), a = attr(sel, 'data-anim'); if (!el || !el.animate) return;
      const kf = ENTER_KF[a]; if (!kf) return toast('등장 효과를 먼저 고르세요');
      el.animate(kf, { duration: SPEED[S.speed] * 1.3, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    editor.on('component:selected', renderSide);
    editor.on('component:deselected', () => setTimeout(renderSide, 0));
    editor.on('undo redo', () => setTimeout(renderSide, 0));
    $('#selParent').onclick = () => { const s = editor.getSelected(); if (s && s.parent()) editor.select(s.parent()); };
    $$('.tabs button').forEach(b => b.onclick = () => { $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); $$('.tabpane').forEach(p => p.classList.toggle('on', p.dataset.tab === b.dataset.tab)); });

    // ---------- 사이트 탭 ----------
    function renderSite() {
      const th = $('#themes'); th.innerHTML = '';
      Object.entries(THEMES).forEach(([k, t]) => {
        const b = h('button', { className: 'theme' + (S.theme === k ? ' on' : '') });
        b.innerHTML = '<i><b style="background:' + t.bg + '"></b><b style="background:' + t.ink + '"></b><b style="background:' + t.line + '"></b><b style="background:' + t.accent + '"></b></i>' + esc(t.name);
        b.onclick = () => { S.theme = k; S.colors = { bg: t.bg, ink: t.ink, sub: t.sub, line: t.line, accent: t.accent }; refreshTheme(); renderSite(); save(); };
        th.appendChild(b);
      });
      const cf = $('#colorFields'); cf.innerHTML = '';
      COLOR_KEYS.forEach(([k, label]) => {
        const i = h('input', { type: 'color', value: S.colors[k] }); i.setAttribute('aria-label', label);
        i.oninput = () => { S.colors[k] = i.value; S.theme = 'custom'; refreshTheme(); $$('.theme', th).forEach(x => x.classList.remove('on')); };
        i.onchange = save;
        cf.appendChild(h('label', { className: 'row', style: 'justify-content:space-between;margin-bottom:6px' }, [h('span', { textContent: label, style: 'flex:1' }), i]));
      });
      const fs = $('#fontSel'); fs.innerHTML = '';
      Object.entries(FONTS).forEach(([k, f]) => fs.appendChild(h('option', { value: k, textContent: f.name })));
      fs.value = S.font; fs.onchange = () => { S.font = fs.value; refreshTheme(); save(); };
      const to = $('#transOpts'); to.innerHTML = ''; to.appendChild(opts(TRANS, S.transition, v => { S.transition = v; save(); }));
      const am = $('#autoMenu'); am.checked = S.autoMenu !== false; am.onchange = () => { S.autoMenu = am.checked; if (am.checked) syncMenus(); save(); toast(am.checked ? '메뉴를 페이지 트리대로 자동으로 만듭니다' : '메뉴를 직접 고칩니다 (자동 갱신 꺼짐)'); };
      $$('#speedSeg button').forEach(b => { b.classList.toggle('on', b.dataset.v === S.speed); b.onclick = () => { S.speed = b.dataset.v; $$('#speedSeg button').forEach(x => x.classList.toggle('on', x === b)); refreshTheme(); save(); }; });
    }
    $('#pvTrans').onclick = () => openPreview();
    $('#siteName').onchange = e => { S.siteName = e.target.value || 'site'; save(); };

    // ---------- 왼쪽 탭 ----------
    function openPane(id) {
      $('#main').classList.remove('no-drawer');
      $$('.rail button').forEach(b => b.classList.toggle('on', b.dataset.pane === id));
      $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === id));
      const rb = $('.rail button[data-pane="' + id + '"]'); $('#drawerTitle').textContent = rb ? rb.textContent.trim() : '';
      if (id === 'pg') renderPages();
      setTimeout(() => editor.refresh(), 50);
    }
    $$('.rail button').forEach(b => b.onclick = () => {
      if (b.classList.contains('on') && !$('#main').classList.contains('no-drawer')) { $('#main').classList.add('no-drawer'); b.classList.remove('on'); setTimeout(() => editor.refresh(), 50); return; }
      openPane(b.dataset.pane);
    });
    $('#sideToggle').onclick = () => $('#side').classList.toggle('mob-open');
    const mq = window.matchMedia('(max-width: 820px)');
    const onMq = () => { $('#sideToggle').style.display = mq.matches ? '' : 'none'; };
    mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener(onMq); onMq();

    // ---------- 상단 바 ----------
    $('#undo').onclick = () => editor.UndoManager.undo();
    $('#redo').onclick = () => editor.UndoManager.redo();
    $$('[data-dev]').forEach(b => b.onclick = () => {
      editor.setDevice(b.dataset.dev); $$('[data-dev]').forEach(x => x.classList.toggle('on', x === b));
      if (b.dataset.dev !== 'desktop') toast((b.dataset.dev === 'mobile' ? '모바일' : '태블릿') + ' 화면 — 여기서 바꾼 디자인은 이 크기에만 적용됩니다');
      renderSide(); renderStageHead();
    });
    $('#modeFlow').onclick = () => { editor.setDragMode(''); $('#modeFlow').classList.add('on'); $('#modeFree').classList.remove('on'); toast('정렬 배치 — 요소가 위아래로 정렬됩니다'); };
    $('#modeFree').onclick = () => { editor.setDragMode('absolute'); $('#modeFree').classList.add('on'); $('#modeFlow').classList.remove('on'); toast('자유 배치 — 끌어서 원하는 위치에 놓습니다. 모바일 화면도 꼭 확인하세요'); };
    const fileMenu = $('#fileMenu');
    $('#fileBtn').onclick = e => { e.stopPropagation(); fileMenu.classList.toggle('open'); };
    document.addEventListener('click', () => fileMenu.classList.remove('open'));
    fileMenu.onclick = async e => {
      const b = e.target.closest('button'); if (!b) return; fileMenu.classList.remove('open');
      const act = b.dataset.act;
      if (act === 'export-json') saveProjectFile();
      if (act === 'import-json') $('#jsonIn').click();
      if (act === 'export-html') exportDialog();
      if (act === 'reset' && await confirmDlg('처음 상태로', '이 브라우저에 저장된 작업을 지우고 기본 세트로 돌아갑니다. 먼저 작업 파일을 저장해 두세요.', '되돌리기')) {
        try { await KZ.store.DB.del('project'); } catch (er) { /* 무시 */ }
        S = DEFAULT_S(); applySet(C.DEFAULT_SET); refreshTheme(); renderSite(); renderAssets(); setTimeout(() => fileDirty(false), 1200); toast('처음 상태로 돌아왔습니다');
      }
    };
    $('#jsonIn').onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      try {
        const d = KZ.store.migrate(JSON.parse(await f.text()));
        S = Object.assign(DEFAULT_S(), d.S || {}); editor.loadProjectData(d.gjs);
        treeEnsure(); syncMenus(); syncAll(); save(); setTimeout(() => fileDirty(false), 1200); toast('작업 파일을 불러왔습니다');
      } catch (er) { dialog('불러오기 실패', '<p>' + esc(er.message || '이 편집기에서 저장한 .json 파일이 아닙니다.') + '</p>'); }
    };
    $('#publishBtn').onclick = () => exportDialog();
    // 내보내기: 올린 사진 · 영상이 있으면 ZIP(index.html + media/), 없으면 index.html 하나
    const GUIDE = 'guide/';
    const mb = n => (n / 1048576).toFixed(n > 10485760 ? 0 : 1) + 'MB';
    function exportDialog() {
      const html = buildSite(), pkg = KZ.packSite(html, S.assets), media = pkg.media;
      const big = media.filter(m => m.size > KZ.GH_LIMIT), htmlBig = html.length > KZ.GH_LIMIT, ul = unlinkedReport();
      const warn = [];
      if (big.length) warn.push('<b>25MB가 넘는 파일</b>: ' + big.map(m => esc(m.path.slice(6)) + ' (' + mb(m.size) + ')').join(', ') + ' — GitHub에 올릴 수 없습니다. 영상을 더 짧게 · 작게 줄여 주세요.');
      if (!media.length && htmlBig) warn.push('<b>index.html이 25MB를 넘습니다</b> (' + mb(html.length) + ') — GitHub 웹 업로드 한도를 넘습니다.');
      if (ul.length) warn.push('<b>연결 안 된 버튼 ' + ul.reduce((s, x) => s + x.n, 0) + '개</b> (편집 화면의 빨간 점선): ' + ul.map(x => esc(x.name) + ' ' + x.n).join(' · ') + ' — 눌러도 아무 일도 없습니다. 디자인 탭 → 링크에서 연결하세요.');
      const what = media.length
        ? '<p>올린 사진 · 영상이 <b>' + media.length + '개</b> 있어 <b>ZIP</b>(index.html + media 폴더)으로 받기를 권합니다.</p><p class="hint">받은 ZIP을 압축 풀고, 폴더 <b>안의 것을 전부</b> 선택해 GitHub에 끌어다 놓으세요.</p>'
        : '<p>완성한 사이트를 <b>index.html</b> 한 파일로 받습니다. 이 파일 하나만 올리면 됩니다.</p>';
      const body = what + (warn.length ? '<div class="ex-warn">' + warn.map(w => '<p>⚠ ' + w + '</p>').join('') + '</div>' : '') +
        '<p class="hint"><a href="' + GUIDE + '" target="_blank" rel="noopener">GitHub에 올리는 방법 보기 ↗</a> · 나중에 고치려면 <b>작업 파일</b>도 받아 두세요 (GitHub에는 올리지 않음).</p>';
      const btns = [['닫기', null], ['작업 파일', d => { d(null); saveProjectFile(); }]];
      if (media.length) {
        btns.push(['index.html 하나', d => { d(null); offerFile('index.html', html, 'text/html'); }]);
        btns.push(['ZIP 받기', d => { d(null); offerFile(fileBase() + '.zip', KZ.zip([{ path: 'index.html', text: pkg.html }].concat(media)), 'application/zip'); }, 'pri']);
      } else btns.push(['index.html 받기', d => { d(null); offerFile('index.html', html, 'text/html'); }, 'pri']);
      return dialog('내보내기', body, btns);
    }

    // ---------- 내보내기 ----------
    const offerFile = (name, data, mime) => KZ.offerFile(name, data, mime);
    function buildSite(startId) {
      return KZ.buildSite({
        pages: orderedPages().map(p => { const t = treeEnsure()[p.getId()]; return { id: p.getId(), name: pname(p), parent: t.parent || null, menu: t.menu !== false, html: p.getMainComponent().getInnerHTML() }; }),
        css: editor.getCss({ keepUnusedStyles: true }) || '', S, startId
      });
    }

    // ---------- 미리보기 ----------
    const pv = $('#pv'), pvFrame = $('#pvFrame');
    let pvStart = null;
    function openPreview() {
      const cur = editor.Pages.getSelected(); pvStart = cur ? cur.getId() : null;
      pvFrame.srcdoc = buildSite(pvStart); pv.classList.add('open');
    }
    $('#previewBtn').onclick = openPreview;
    $('#pvClose').onclick = () => { pv.classList.remove('open'); pvFrame.srcdoc = ''; };
    $('#pvReload').onclick = () => { pvFrame.srcdoc = buildSite(pvStart); };
    $$('[data-pw]').forEach(b => b.onclick = () => { pvFrame.style.width = b.dataset.pw; $$('[data-pw]').forEach(x => x.classList.toggle('on', x === b)); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pv.classList.contains('open')) $('#pvClose').click(); });

    // ---------- 시작 ----------
    function syncAll() {
      $('#siteName').value = S.siteName; treeEnsure(); refreshTheme(); renderSite(); renderAssets(); renderNav(); renderSide();
    }
    editor.on('load', async () => {
      let saved = null;
      try { saved = await KZ.store.DB.get('project'); if (saved) saved = KZ.store.migrate(saved); } catch (e) { saved = null; }
      try {
        if (saved && saved.gjs) { S = Object.assign(DEFAULT_S(), saved.S || {}); editor.loadProjectData(saved.gjs); if (!realPages().length) applySet(C.DEFAULT_SET); }
        else applySet(C.DEFAULT_SET);
      } catch (e) { applySet(C.DEFAULT_SET); }
      treeEnsure(); syncMenus();
      editor.UndoManager.clear();
      booted = true;
      renderSets(); renderTemplates(); syncAll(); KZ.layoutUi && KZ.layoutUi.init(editor);
      $('#fxMarkBtn').onclick = () => setFxMark(!fxMark); setFxMark(fxMark);
      $('#fileWarn').onclick = saveProjectFile;
      let wasDirty = false; try { wasDirty = localStorage.getItem(FILE_KEY) === '1'; } catch (e) { /* 무시 */ }
      fileDirty(wasDirty);
      setTimeout(() => { armed = true; }, 1000); // 시작할 때 생기는 변경은 세지 않음
      window.__kz = { orderedPages, movePage, syncMenus, treeEnsure, get S() { return S; } };
      try { injectDoc(editor.Canvas.getDocument()); } catch (e) { /* 프레임 대기 */ }
      setStatus(saved ? '저장됨 · 이 브라우저' : '새 작업');
    });
  }
})(window.KZ);
