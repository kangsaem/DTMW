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
    // 없는 페이지로 가는 링크: #주소 인데 그런 페이지가 없음 (지운 페이지 등) — 내보낸 사이트에서 누르면 첫 페이지로 가 버림
    function deadSel() {
      const ids = realPages().map(p => String(p.getId()).replace(/["\\]/g, ''));
      return 'a[href^="#"]:not([href="#"]):not([data-click])' + ids.map(i => ':not([href="#' + i + '"])').join('') +
        ',[data-click="go"][data-go^="#"]:not([data-go="#"])' + ids.map(i => ':not([data-go="#' + i + '"])').join('');
    }
    function unlinkedReport() {
      const out = [], dead = deadSel();
      orderedPages().forEach(p => {
        const t = document.createElement('template'); t.innerHTML = p.getMainComponent().getInnerHTML();
        const n = t.content.querySelectorAll(UNLINKED_SEL).length, d = t.content.querySelectorAll(dead).length;
        if (n || d) out.push({ name: pname(p), n, d });
      });
      return out;
    }
    function linkCss() { let d = ''; try { d = ',' + deadSel(); } catch (e) { /* 페이지 준비 전 */ } return UNLINKED_SEL + d + '{outline:1px dashed #e5484d!important;outline-offset:3px}'; }
    function refreshLinkCss() { const c = linkCss(); docs.forEach(d => { try { const u = d.getElementById('kz-unlinked'); if (u && u.textContent !== c) u.textContent = c; } catch (e) { docs.delete(d); } }); }

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
        ul.textContent = linkCss();
        doc.head.appendChild(ul);
        // 편집 화면만: 바탕을 테마 색으로 (GrapesJS 기본 흰 바탕보다 우선), 다 지운 글은 높이를 남기고 [빈 글] 표시
        const ed = doc.createElement('style'); ed.id = 'kz-edit';
        ed.textContent = 'html body{background:var(--bg)}' +
          ':is(p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption):empty{min-height:1em;min-width:3em}' +
          ':is(p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption):empty:not(:focus)::before{content:"[빈 글]";opacity:.35;font-size:max(12px,.6em)}' +
          ':is(a,button):empty{display:inline-block;min-width:3em;min-height:1em;vertical-align:middle}' +
          ':is(a,button):empty:not(:focus)::before{content:"[빈 링크]";opacity:.45;font-size:12px}';
        doc.head.appendChild(ed);
        // Alt(⌥)+클릭: 링크가 가리키는 페이지로 이동
        const jump = e => {
          if (!e.altKey) return;
          const a = e.target.closest && e.target.closest('[data-click="go"][data-go^="#"], a[href^="#"]'); if (!a) return;
          const id = (a.getAttribute('data-go') || a.getAttribute('href') || '').slice(1);
          if (id && editor.Pages.get(id)) { e.preventDefault(); e.stopPropagation(); if (e.type === 'click') editor.Pages.select(id); }
        };
        doc.addEventListener('mousedown', jump, true); doc.addEventListener('click', jump, true);
        // 붙여넣기: 워드 · 웹의 서식은 버리고 글만 (굵게 · 기울임 · 줄바꿈 · 링크만 남김, 링크 안에서는 링크도 뺌)
        doc.addEventListener('paste', e => {
          const t = e.target && (e.target.nodeType === 1 ? e.target : e.target.parentElement);
          const ed = t && t.closest && t.closest('[contenteditable="true"]'); if (!ed || !e.clipboardData) return;
          e.preventDefault(); e.stopPropagation();
          const sel = doc.getSelection(), at = sel && sel.anchorNode, inLink = !!(at && (at.nodeType === 1 ? at : at.parentElement).closest('a'));
          const html = KZ.cleanPaste(e.clipboardData.getData('text/html'), e.clipboardData.getData('text/plain'), inLink);
          if (html) doc.execCommand('insertHTML', false, html);
        }, true);
        doc.addEventListener('keydown', saveKey, true);
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
      editor.Blocks.add(id, { label, category, media, content: typeof content === 'function' ? content() : content, attributes: { 'data-bid': id } });
    });
    // 블록을 누르기만 해도 넣기 (선택한 요소 아래) — 패널을 창 밖으로 꺼냈을 때 끌어다 놓기 대신
    $('#blocks').addEventListener('click', e => {
      const el = e.target.closest && e.target.closest('.gjs-block'); if (!el) return;
      const b = editor.Blocks.get(el.getAttribute('data-bid')); if (!b) return;
      const c = b.get('content'); afterBlock(insertNear(editor.getSelected(), typeof c === 'string' ? c : JSON.parse(JSON.stringify(c))));
      toast(b.get('label') + ' 을(를) 넣었습니다');
    });

    // 레이어 이름 · 글 도구줄 설명을 한국어로 (GrapesJS 기본은 영어)
    try {
      const N = { box: '영역', div: '영역', br: '줄바꿈', section: '섹션', header: '머리', footer: '바닥글', nav: '메뉴', wrapper: '페이지', text: '글', textnode: '글', image: '그림', video: '영상', link: '링크', figure: '그림 묶음', figcaption: '캡션', span: '글 조각', ul: '목록', ol: '목록', li: '목록 항목', button: '버튼', svg: '아이콘', form: '양식', input: '입력', label: '라벨', iframe: '삽입', map: '지도', table: '표', row: '행', cell: '칸', comment: '주석', article: '글 묶음', aside: '곁', main: '본문', p: '문단', h1: '큰 제목', h2: '제목', h3: '소제목', blockquote: '인용' };
      editor.I18n.addMessages({ ko: { domComponents: { names: N } } }); editor.I18n.setLocale('ko');
      const RT = { bold: '굵게', italic: '기울임', underline: '밑줄', strikethrough: '취소선', link: '링크 (주소는 오른쪽 디자인 탭에서)', wrap: '묶기' };
      const rtKo = () => editor.RichTextEditor.getAll().forEach(a => { if (!RT[a.name]) return; if (a.attributes) a.attributes.title = RT[a.name]; if (a.btn) a.btn.title = RT[a.name]; });
      rtKo(); editor.on('rte:enable', rtKo);
    } catch (e) { /* 이름 번역 실패해도 편집에는 문제 없음 */ }

    // 블록을 넣은 뒤: 상단 메뉴 · 바닥글 블록이면 메뉴를 페이지 목록대로, 사이트 이름 자리표시를 맞춤 (끌어다 놓기 · 누르기 모두)
    function afterBlock(c) {
      if (!c || !booted) return;
      if (hasNav(c) || isFootTop(c) || c.find('.foot').length) { syncMenus(); fillSiteName(c); }
    }
    editor.on('block:drag:stop', c => { try { afterBlock(Array.isArray(c) ? c[0] : c); } catch (e) { /* 무시 */ } });

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
    // Ctrl+S (맥 ⌘S): 브라우저 '페이지 저장' 대신 작업 파일 받기
    function saveKey(e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); e.stopPropagation(); saveProjectFile(); toast('작업 파일을 받았습니다 (Ctrl+S)'); }
    }
    document.addEventListener('keydown', saveKey, true); KZ.saveKey = saveKey;
    function saveProjectFile() {
      offerFile(fileBase() + '-project.json', JSON.stringify(KZ.store.pack(S, editor.getProjectData())), 'application/json');
      fileDirty(false);
    }
    // 브라우저 저장: 고친 뒤 0.9초 모아서 저장. 창을 닫거나 탭을 숨길 때는 바로 저장(flush)
    let pending = false, passive = false;
    async function writeNow() {
      clearTimeout(saveT); if (!pending) return; pending = false;
      if (passive) { setStatus('다른 탭에서 편집 중 — 이 탭은 저장 안 함', true); return; }
      try { await KZ.store.DB.set('project', KZ.store.pack(S, editor.getProjectData())); if (!pending) setStatus('저장됨 · 이 브라우저'); }
      catch (e) { setStatus('브라우저 저장 불가 — 파일로 저장하세요', true); }
    }
    function save() {
      if (!booted) return;
      if (armed) fileDirty(true);
      if (passive) { setStatus('다른 탭에서 편집 중 — 이 탭은 저장 안 함', true); passiveDialog(); return; }
      setStatus('저장 중…'); clearTimeout(saveT); pending = true;
      saveT = setTimeout(writeNow, 900);
    }
    window.addEventListener('beforeunload', e => {
      if (!pending || passive) return;
      // 그 자리에서 바로 저장을 시작하고(대기 없음), 혹시 못 끝날 때를 대비해 닫기 확인도 띄움
      clearTimeout(saveT);
      if (KZ.store.DB.putNow('project', KZ.store.pack(S, editor.getProjectData()))) pending = false; else writeNow();
      e.preventDefault(); e.returnValue = '';
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') writeNow(); });
    // 두 탭: 나중에 연 탭(또는 '이 탭에서 계속'을 누른 탭)만 저장합니다. 나머지 탭은 저장을 멈추고 알립니다
    const TAB_ID = Math.random().toString(36).slice(2);
    const bc = 'BroadcastChannel' in window ? new BroadcastChannel('wmw-editor') : null;
    let passiveShown = false;
    function passiveDialog() {
      if (passiveShown) return; passiveShown = true;
      dialog('다른 탭에서 편집기를 열었습니다', '<p>같은 브라우저의 다른 탭에서 편집기가 열려 있어, <b>이 탭은 더 이상 저장하지 않습니다</b> (두 탭이 서로 덮어쓰지 않도록).</p><p class="hint">다른 탭에서 계속하거나, 이 탭에서 계속하려면 아래 버튼을 누르세요. 이 탭을 최신 저장본으로 다시 엽니다.</p>',
        [['닫기', null], ['이 탭에서 계속', () => { location.reload(); }, 'pri']]);
    }
    if (bc) bc.onmessage = e => {
      const m = e.data || {}; if (m.id === TAB_ID) return;
      if (m.t === 'claim') { clearTimeout(saveT); if (pending) { pending = false; } passive = true; setStatus('다른 탭에서 편집 중 — 이 탭은 저장 안 함', true); passiveDialog(); bc.postMessage({ t: 'here', id: TAB_ID }); }
      if (m.t === 'here' && !passive) toast('다른 탭에도 편집기가 열려 있습니다 — 이 탭에서 저장합니다');
    };
    KZ.tabState = () => ({ passive, pending });
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
      syncMenus(); recordTree();
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
        b.onclick = async () => {
          // 세트 적용은 되돌리기(Ctrl+Z)로 되돌릴 수 없으므로 작업 파일을 먼저 받을 수 있게 합니다
          const v = await dialog('사이트 세트 적용', '<p>지금 사이트의 모든 페이지가 <b>' + esc(s.name) + '</b> 세트로 바뀝니다.</p><p class="hint">⚠ 세트 적용은 <b>되돌리기(Ctrl+Z)로 되돌릴 수 없습니다.</b> 지금 작업을 남기려면 작업 파일을 먼저 받으세요.</p>',
            [['취소', false], ['작업 파일 받고 진행', 'save'], ['적용', true, 'pri']]);
          if (!v) return;
          if (v === 'save') saveProjectFile();
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
      if (v === 'sec') { addSection(KZ.sectionHtml(id)).forEach(fillSiteName); toast('섹션을 추가했습니다'); }
      if (v === 'cur') { editor.setComponents(t.html()); fillSiteName(editor.getWrapper()); syncMenus(); renderNav(); toast('현재 페이지에 적용했습니다'); }
      if (v === 'new') { const SLUG = { t1: 'home', t2: 'exhibitions', t3: 'works', t4: 'work', t5: 'apps', t6: 'series', t7: 'by-year', t8: 'index', t9: 'gallery', t10: 'cv', t11: 'text', t12: 'intro', t13: 'about', fx: 'effects' }; const sl = t.slug || SLUG[id]; const p = addPage(t.name.replace(/\s*\(.*\)$/, ''), t.html(), sl === 'home' ? 'intro' : sl); if (p) { fillSiteName(p.getMainComponent()); toast('새 페이지 #' + p.getId() + ' 를 만들었습니다'); } }
    }
    // 사이트 이름 자리표시: 기본은 [사이트 이름], 세트마다 로고가 [가게 이름] · [행사 이름] 등 (0.16.6)
    const NAME_PH = '[사이트 이름]';
    const textOnly = c => c.components().length && c.components().every(x => x.is('textnode'));
    const inBrandOrFoot = c => { for (let x = c; x; x = x.parent()) if (hasCls(x, 'brand') || hasCls(x, 'foot')) return true; return false; };
    // 로고(.brand) 글이 [ … ] 인 것 = 아직 이름을 안 정한 자리표시. skip 안의 로고는 세지 않음
    function brandPlaceholders(skip) {
      const out = new Set();
      realPages().forEach(pg => walk(pg.getMainComponent(), c => {
        if (!hasCls(c, 'brand') || (skip && inside(c, skip))) return;
        const t = (c.getEl() ? c.getEl().textContent : c.components().map(x => x.get('content') || '').join('')).trim();
        if (/^\[[^\]]+\]$/.test(t)) out.add(t);
      }));
      return out;
    }
    function inside(c, root) { for (let x = c; x; x = x.parent()) if (x === root) return true; return false; }
    // 템플릿 · 블록으로 넣은 내용의 [사이트 이름]: 사이트가 아직 자리표시를 쓰면 그 자리표시로(세트의 [가게 이름] 등), 이름을 정했으면 그 이름으로
    function fillSiteName(root) {
      const ph = esc(NAME_PH), others = brandPlaceholders(root);
      const count = r => { let n = 0; walk(r, c => { if (textOnly(c) && c.getInnerHTML().includes(ph)) n++; }); return n; };
      const leftDefault = realPages().reduce((n, pg) => n + count(pg.getMainComponent()), 0) > count(root);
      let to = null;
      if (others.size) { const o = [...others][0]; if (o !== NAME_PH) to = o; } // 아직 이름 안 정함 → 다른 페이지와 같은 자리표시
      else if (!leftDefault && S.siteName && S.siteName !== NAME_PH) to = S.siteName;
      if (!to) return;
      walk(root, c => { if (!textOnly(c)) return; const h = c.getInnerHTML(); if (h.includes(ph)) c.components(h.split(ph).join(esc(to))); });
    }

    // ---------- 섹션 (페이지 바로 아래 요소) ----------
    const isNavTop = c => (c.get('tagName') || '').toLowerCase() === 'header' && hasCls(c, 'nav');
    const isFootTop = c => hasCls(c, 'foot');
    const hasNav = c => isNavTop(c) || c.find('header.nav').length > 0; // 첫 페이지 히어로처럼 메뉴를 품은 섹션
    function topOf(c) { const w = editor.getWrapper(); while (c && c.parent() && c.parent() !== w) c = c.parent(); return c && c.parent() === w ? c : null; }
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
    // 페이지 목록(순서 · 단계 · 메뉴 표시)도 되돌리기에 넣음: 작은 기록 모델을 GrapesJS 되돌리기에 등록.
    // 같은 동기 호출 안의 변경(페이지 삭제 · 메뉴 다시 만들기 등)과 한 단계로 묶임 (0.16.5 — 전에는 되돌리면 페이지가 맨 끝으로 가거나 메뉴만 예전으로)
    const treeRec = window.Backbone ? new Backbone.Model({ t: '{}', _undo: true }) : { a: '{}', get() { return this.a; }, set(k, v) { this.a = v; }, on() {} };
    if (window.Backbone) editor.UndoManager.add(treeRec);
    function recordTree() { const j = JSON.stringify(S.tree || {}); if (treeRec.get('t') !== j) treeRec.set('t', j); }
    treeRec.on('change:t', () => {
      const j = treeRec.get('t'); if (j === JSON.stringify(S.tree || {})) return; // 직접 기록한 것 (되돌리기 아님)
      try { S.tree = JSON.parse(j); } catch (e) { return; }
      if (booted) setTimeout(() => { renderNav(); save(); }, 0);
    });
    function afterTree() { recordTree(); syncMenus(); renderNav(); save(); }

    // 자동 메뉴: 모든 페이지의 nav.links · .th-menu 를 트리로 다시 만듭니다
    function walk(c, fn) { fn(c); c.components().forEach(x => walk(x, fn)); }
    function hasCls(c, n) { return (c.getClasses ? c.getClasses() : []).includes(n); }
    function menuItems() {
      const T = treeEnsure();
      return kids(null).filter(p => T[p.getId()].menu !== false).map(p => ({ id: p.getId(), name: pname(p), kids: kids(p.getId()).filter(c => T[c.getId()].menu !== false).map(c => ({ id: c.getId(), name: pname(c) })) }));
    }
    function syncMenus() {
      if (S.autoMenu === false) return;
      const first = (orderedPages()[0] || { getId: () => 'home' }).getId(), T = treeEnsure();
      // 첫 페이지는 메뉴에서 빼되(로고가 첫 페이지로 감), 그 하위 페이지는 메뉴 맨 앞에 (전에는 함께 사라졌음)
      const firstKids = T[first] ? kids(first).filter(c => T[c.getId()].menu !== false).map(c => ({ id: c.getId(), name: pname(c), kids: [] })) : [];
      const items = firstKids.concat(menuItems().filter(i => i.id !== first));
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
      if (booted) setTimeout(() => { renderNav(); renderPages(); }, 0);
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
        inp.onchange = () => { p.set('name', inp.value || id); afterTree(); dupNameWarn(pname(p)); };
        inp.onfocus = () => { if (editor.Pages.getSelected() !== p) editor.Pages.select(p); };
        const code = h('button', { className: 'pg-id', textContent: '#' + id, title: '눌러서 주소 바꾸기' });
        code.onclick = e => { e.stopPropagation(); renamePageId(p); };
        const acts = h('span', { className: 'pg-acts' }, [
          iconBtn(t.menu === false ? '메뉴에 표시' : '메뉴에서 숨기기', t.menu === false ? '◌' : '●', () => { t.menu = t.menu === false; afterTree(); }),
          iconBtn('위로', '↑', () => step(id, -1)), iconBtn('아래로', '↓', () => step(id, 1)),
          depth ? iconBtn('위 단계로', '⇤', () => outdent(id)) : iconBtn('위 페이지의 하위로', '⇥', () => indent(id)),
          iconBtn('하위 페이지 추가', '+', () => addPage('새 하위 페이지', null, id + '-sub', depth ? t.parent : id)),
          iconBtn('복제', '⧉', () => addPage(pname(p) + ' 복사', p.getMainComponent().components().map(c => c.clone()), id + '-copy', t.parent)), // clone: 요소별 스타일도 새 id로 복사
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
    editor.on('page:select', () => { renderNav(); editor.select(null); renderSide(); });
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
      refreshLinkCss();
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

    // ---------- 업로드 ----------
    const readDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
    function resizeImage(file) {
      return new Promise((res, rej) => {
        if (/svg|gif/.test(file.type)) { readDataURL(file).then(res); return; }
        const url = URL.createObjectURL(file); const img = new Image();
        img.onload = () => {
          const m = 1920, sc = Math.min(1, m / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          let d = c.toDataURL('image/webp', 0.85); if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/jpeg', 0.88);
          URL.revokeObjectURL(url); res(d);
        };
        img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')); }; // 열 수 없는 그림(HEIC 등)은 넣지 않음
        img.src = url;
      });
    }
    async function handleFiles(files) {
      let n = 0;
      for (const f of files) {
        const heic = /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type);
        try {
          if (f.type.startsWith('image/') || heic) { S.assets.unshift({ id: 'a' + Date.now() + n, type: 'image', name: f.name, src: await resizeImage(f) }); n++; }
          else if (f.type.startsWith('video/')) {
            if (f.size > 40e6) { toast(f.name + ': 40MB가 넘어 올리지 않았습니다. 20MB 이하로 줄여 주세요.'); continue; }
            if (f.size > 20e6) toast('20MB가 넘는 영상은 사이트가 느려질 수 있습니다.');
            S.assets.unshift({ id: 'a' + Date.now() + n, type: 'video', name: f.name, src: await readDataURL(f) }); n++;
          }
        } catch (e) {
          if (heic) await dialog('아이폰 사진(HEIC)', '<p><b>' + esc(f.name) + '</b> 은(는) HEIC 형식이라 이 브라우저에서 열 수 없어 올리지 않았습니다.</p><p class="hint">JPG 로 바꿔 올려 주세요. 아이폰: <b>설정 → 카메라 → 포맷 → 높은 호환성</b> 으로 바꾸면 다음부터 JPG 로 찍힙니다. 이미 찍은 사진은 사진 앱에서 공유 → 사본으로 저장하거나, 메일 · 메신저로 보내면 JPG 로 바뀝니다.</p>', [['확인', true, 'pri']]);
          else toast(f.name + ' 파일을 읽지 못했습니다 (열 수 없는 형식)');
        }
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
        const del = async () => {
          const used = editor.Pages.getAll().some(p => p.getMainComponent().toHTML().includes(a.src)) || editor.getCss().includes(a.src);
          if (used && !await confirmDlg('파일 지우기', '이 파일은 사이트에 쓰이고 있습니다. 목록에서만 지울까요? (이미 넣은 곳은 그대로 남습니다)', '지우기')) return;
          S.assets = S.assets.filter(x => x !== a); renderAssets(); save(); toast('목록에서 지웠습니다');
        };
        b.oncontextmenu = e => { e.preventDefault(); del(); };
        const x = document.createElement('button'); x.className = 'asset-x'; x.textContent = '✕'; x.title = '목록에서 지우기'; x.setAttribute('aria-label', a.name + ' 목록에서 지우기');
        x.onclick = e => { e.stopPropagation(); del(); };
        const w = document.createElement('div'); w.className = 'asset-w'; w.append(b, x);
        box.appendChild(w);
      });
    }
    // 영상 요소 찾기: GrapesJS 는 find('video') 로 영상 컴포넌트를 못 찾음 → 종류(type)로 (0.16.6)
    const vids = c => { const o = []; if (c) walk(c, x => { if (x !== c && x.get('type') === 'video') o.push(x); }); return o; };
    const up = (c, pred) => { while (c) { if (pred(c)) return c; c = c.parent(); } return null; };
    const attr = (c, k) => (c && c.getAttributes()[k]) || '';
    function insertNear(sel, def) {
      const wrapper = editor.getWrapper();
      let target = wrapper, at;
      if (sel && sel !== wrapper) {
        const leaf = sel.is('text') || sel.is('image') || sel.is('video') || sel.is('link') || sel.get('tagName') === 'button';
        if (leaf && sel.parent()) { target = sel.parent(); at = sel.index() + 1; } else target = sel;
      }
      let added;
      if (target === wrapper) {
        // 아무것도 고르지 않았으면 새 섹션으로 감싸 바닥글 바로 위에 (바닥글 아래 · 맨 끝에 들어가 안 보이던 문제)
        const f = wrapper.components().filter(isFootTop).pop();
        const sec = wrapper.append({ tagName: 'section', classes: ['wrap'], components: [def] }, { at: f ? f.index() : wrapper.components().length })[0];
        added = sec && sec.components().at(0);
      } else added = target.append(def, at != null ? { at } : {})[0];
      if (added) { editor.select(added); try { added.getEl().scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { /* 무시 */ } }
      return added;
    }
    function applyAsset(a) {
      const sel = editor.getSelected();
      if (a.type === 'image') {
        if (sel && sel.is('image')) { sel.set('src', a.src); fitPosArt(sel); return toast('이미지를 바꿨습니다'); }
        const fx = up(sel, c => !!attr(c, 'data-bgvideo')), fxm = fx && fx.find('.bgfix-media')[0];
        if (fxm && !fxm.find('img').length) { fxm.components(''); fxm.append({ type: 'image', src: a.src, attributes: { alt: '' } }); return toast('배경 사진을 넣었습니다'); }
        // 히어로(사진 · 영상 배경): 고른 곳이 히어로 안이면 배경 사진으로 — 배경 영상 · 안내 문구는 뺌
        const hero = up(sel, c => !!attr(c, 'data-bgvideo'));
        if (hero && !(sel && sel.is('link'))) {
          let ph = hero.find('.hero-photo')[0];
          if (!ph) ph = hero.append({ tagName: 'div', classes: ['hero-photo'] }, { at: 1 })[0];
          ph.addStyle({ 'background-image': 'url("' + a.src + '")' });
          vids(hero).forEach(v => v.remove());
          const note = hero.find('.hero-note')[0]; if (note) note.remove();
          return toast('배경 사진을 바꿨습니다');
        }
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
      const fixm = hero && hero.find('.bgfix-media')[0];
      if (fixm) {
        fixm.components(''); fixm.append(Object.assign({ type: 'video' }, vprops));
        toast(bgfixVideos() > 2 ? '배경 영상을 넣었습니다 — 고정 영상이 많아 휴대폰이 무거워질 수 있습니다 (페이지당 1~2개 권장)' : '배경 영상을 넣었습니다');
        return;
      }
      if (hero) {
        const ex = vids(hero)[0];
        if (ex) ex.set(vprops); else hero.append(Object.assign({ type: 'video', classes: ['hero-video'] }, vprops), { at: 1 });
        const note = hero.find('.hero-note')[0]; if (note) note.remove();
      const photo = hero.find('.hero-photo')[0]; if (photo) photo.remove();
        return toast('배경 영상을 넣었습니다');
      }
      const iv = sel && vids(sel)[0];
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
      const move = d => { if (!parent) return; if (parent === editor.getWrapper()) { if (!moveSection(sel, d)) toast(d < 0 ? '더 올릴 수 없습니다 (상단 메뉴 위로는 못 감)' : '더 내릴 수 없습니다 (바닥글 아래로는 못 감)'); return; } const i = sel.index(), n = i + d; if (n < 0 || n >= parent.components().length) return; if (sel.move) sel.move(parent, { at: d > 0 ? n + 1 : n }); editor.select(sel); };
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
      const top = topOf(img); if (!top || !hasClass(top, 'exh')) return;
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
        box.appendChild(seg('사진 방식', [['many', '칸 여러 개'], ['one', '사진 한 장']], one ? 'one' : 'many', v => { rowMode(top, v); setTimeout(() => renderSide(), 80); }));
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
        box.appendChild(seg('그림 맞춤', [['cover', '채우기'], ['fitw', '폭에 맞춤 (위)']], fitw ? 'fitw' : 'cover', v => { if (!img) return; if (v === 'fitw') img.addClass('exh-fitw'); else img.removeClass('exh-fitw'); setTimeout(() => renderSide(), 50); }));
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
      rb.onclick = () => { exhSet(top, Object.fromEntries(keys.map(k => [k, '']))); setTimeout(() => renderSide(), 50); };
      box.appendChild(h('div', { className: 'row', style: 'margin-top:8px' }, [rb]));
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
        if (hasClass(top, 'exh')) exhPanel(top, box, sec);
      }

      if (kind === 'text') {
        sec('글자');
        const fsel = h('select', { className: 'inp' });
        [['', '테마 기본'], ['var(--fh)', '제목 글꼴 (테마)'], ['var(--fb)', '본문 글꼴 (테마)'], ...Object.values(FONTS).map(f => [f.h, f.name.split(' (')[0].split(' +')[0]])].forEach(([v, t]) => fsel.appendChild(h('option', { value: v, textContent: t })));
        fsel.value = ruleStyle(sel)['font-family'] || ''; fsel.onchange = () => setStyle(sel, { 'font-family': fsel.value });
        box.appendChild(field('글꼴', fsel));
        const exhTop = top && hasClass(top, 'exh') ? top : null;
        if (exhTop) {
          // 전시 섹션: 판 단위로 저장 → 화면 크기에 비례. PC 에서 바꾸면 모바일은 화면에 맞게 자동 (모바일 보기에서 따로 바꾸면 그 값 유지)
          const U = exhUnit(exhTop), isM = editor.getDevice() === 'mobile';
          const cur = +(num(cs(sel) ? cs(sel).fontSize : '', 16) / U).toFixed(1);
          box.appendChild(slider('크기 (판 단위)', 4, 200, 0.5, cur, v => v + (isM ? ' · 375판' : ' · 1366판'), v => {
            setStyle(sel, Object.assign({ 'font-size': 'calc(var(--u) * ' + v + ')' }, isM ? { '--fsm': '1' } : {}));
            if (!isM) autoMobileFont(sel, exhTop, v);
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
    // ---------- 배경 고정 ----------
    const FIX_BAD_ANIM = v => !!v && v !== 'fade';        // 페이드(투명도만)는 함께 써도 됨
    const FIX_BAD_HOVER = v => v === 'lift';
    const FIX_MEDIA = '.bgfix-media,.hero-photo,.hero-video,.hero-bg,.band-img';
    const hasClass = (c, k) => c.getClasses().includes(k);
    function fixMedia(sel) { return sel.components().filter(c => c.getEl && c.getEl() && c.getEl().matches && c.getEl().matches(FIX_MEDIA)); }
    function bgfixVideos() { const w = editor.getWrapper(); return w.find('[data-scroll="bgfix"]').filter(c => vids(c).length).length; }
    async function applyBgfix(sel) {
      const el = sel.getEl();
      if (!fixMedia(sel).length) {
        // 요소 자체의 배경 사진이면 안쪽 고정 층으로 옮김
        const bg = el ? getComputedStyle(el).backgroundImage : 'none';
        if (bg && bg !== 'none' && /url\(/.test(bg)) {
          sel.append({ tagName: 'div', classes: ['bgfix-media'], style: { 'background-image': bg } }, { at: 0 });
          setStyle(sel, { 'background-image': 'none' });
        } else {
          toast('배경 사진 · 영상이 있는 섹션에 거세요 — 요소 탭 대신 템플릿의 「배경 고정 창」 섹션을 넣어도 됩니다');
          return renderFx(sel);
        }
      }
      const bad = [FIX_BAD_ANIM(attr(sel, 'data-anim')) && label2(ANIMS, attr(sel, 'data-anim')), FIX_BAD_HOVER(attr(sel, 'data-hover')) && label2(HOVERS, attr(sel, 'data-hover'))].filter(Boolean);
      if (bad.length) {
        if (!await confirmDlg('함께 쓸 수 없는 효과', '배경 고정을 걸면 <b>' + bad.map(esc).join(' · ') + '</b> 효과가 풀립니다 (고정이 풀리는 효과라서). 계속할까요?', '배경 고정')) return renderFx(sel);
        if (FIX_BAD_ANIM(attr(sel, 'data-anim'))) sel.removeAttributes('data-anim');
        if (FIX_BAD_HOVER(attr(sel, 'data-hover'))) sel.removeAttributes('data-hover');
      }
      sel.addAttributes({ 'data-scroll': 'bgfix' });
      toast(bgfixVideos() > 2 ? '배경 고정 영상이 많습니다 — 휴대폰이 무거워질 수 있어 페이지당 1~2개를 권합니다' : '스크롤해도 배경이 제자리에 남습니다 (미리보기에서 확인)');
      renderFx(sel);
    }
    const label2 = (list, v) => (list.find(x => x[0] === v) || [, v])[1];
    function renderFx(sel) {
      const box = $('#tabFx'); box.innerHTML = '';
      const sec = (t, d) => { box.appendChild(h('h3', { textContent: t, style: 'font-size:12px;color:var(--ui-sub);font-weight:500;margin:16px 0 4px' })); if (d) box.appendChild(h('p', { className: 'hint', textContent: d, style: 'margin:0 0 8px' })); };
      const setA = (k, v) => { if (v) sel.addAttributes({ [k]: v }); else sel.removeAttributes(k); };
      // 배경 고정과 함께 쓰면 고정이 풀리는 효과 (요소 자체에 transform · clip-path)
      const isFix = attr(sel, 'data-scroll') === 'bgfix';
      const label = (list, v) => (list.find(x => x[0] === v) || [, v])[1];
      const mark = (boxEl, list, bad) => { if (!isFix) return; $$('button', boxEl).forEach((b, i) => { if (bad(list[i][0])) { b.classList.add('fx-off'); b.title = '배경 고정과 함께 쓰면 고정이 풀립니다'; } }); };
      const unfix = async (what, then) => {
        if (await confirmDlg('배경 고정이 풀립니다', '<b>' + esc(what) + '</b> 효과를 걸면 이 요소의 배경 고정이 풀립니다. 바꿀까요?', '바꾸기')) { sel.removeAttributes('data-scroll'); then(); toast('배경 고정을 풀었습니다'); }
        renderFx(sel);
      };
      sec('스크롤 등장', '화면에 들어올 때 재생');
      if (isFix) box.appendChild(h('p', { className: 'hint fx-fixnote', textContent: '배경 고정 중 — 흐린 효과는 함께 쓸 수 없습니다 (안쪽 글 · 버튼에는 가능)' }));
      const animBox = opts(ANIMS, attr(sel, 'data-anim'), v => {
        if (isFix && FIX_BAD_ANIM(v)) return unfix(label(ANIMS, v), () => { setA('data-anim', v); replay(sel); });
        setA('data-anim', v); if (v) replay(sel);
      });
      mark(animBox, ANIMS, FIX_BAD_ANIM); box.appendChild(animBox);
      const rp = h('button', { className: 'btn full', textContent: '▶ 다시 재생', style: 'margin-top:8px' }); rp.onclick = () => replay(sel); box.appendChild(rp);
      sec('마우스 올림');
      const hoverBox = opts(HOVERS, attr(sel, 'data-hover'), v => {
        if (isFix && FIX_BAD_HOVER(v)) return unfix(label(HOVERS, v), () => setA('data-hover', v));
        setA('data-hover', v);
        if (v === 'cursor' && !attr(sel, 'data-preview')) { const im = sel.find('img')[0]; sel.addAttributes({ 'data-preview': im ? im.get('src') : KZ.H.ph('미리보기', 440, 560, 2) }); toast('업로드 탭에서 사진을 누르면 미리보기 이미지가 바뀝니다'); }
        if (v === 'caption' && !sel.find('figcaption').length) toast('캡션(figcaption)이 있는 이미지 카드에서 작동합니다');
      });
      mark(hoverBox, HOVERS, FIX_BAD_HOVER); box.appendChild(hoverBox);
      sec('스크롤 연출');
      box.appendChild(opts(SCROLLS, attr(sel, 'data-scroll'), async v => {
        if (v === 'bgfix') return applyBgfix(sel);
        if (isFix) toast('배경 고정을 풀었습니다');
        setA('data-scroll', v);
        if (isFix) setTimeout(() => renderFx(sel), 0);
        if (v === 'parallax' && sel.parent()) { setStyle(sel.parent(), { overflow: 'hidden' }); toast('바깥 영역 안에서 느리게 움직입니다 (미리보기에서 확인)'); }
        if (v === 'sticky') toast('스크롤해도 화면 위에 고정됩니다 (미리보기에서 확인)');
      }));
      if (isFix && hasClass(sel, 'bgfix')) {
        box.appendChild(h('div', { style: 'height:8px' }));
        box.appendChild(field('창 높이', opts([['100', '화면 100%'], ['70', '70%'], ['50', '50%']], attr(sel, 'data-h') || '100', v => sel.addAttributes({ 'data-h': v }))));
        box.appendChild(field('어둡게 덮기', opts([['0', '없음'], ['18', '약하게'], ['35', '보통'], ['55', '진하게']], attr(sel, 'data-dim') || '18', v => sel.addAttributes({ 'data-dim': v }))));
      }
      if (isFix) box.appendChild(h('p', { className: 'hint', textContent: '사진 · 영상은 업로드 탭에서 이 영역을 선택한 채 누르면 바뀝니다. 정확한 모양은 미리보기에서 확인하세요.', style: 'margin-top:8px' }));
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
      const am = $('#autoMenu'); am.checked = S.autoMenu !== false; am.onchange = () => { S.autoMenu = am.checked; if (am.checked) syncMenus(); save(); toast(am.checked ? '상단 메뉴를 페이지 목록대로 자동으로 만듭니다' : '메뉴를 직접 고칩니다 (자동 갱신 꺼짐)'); };
      $$('#speedSeg button').forEach(b => { b.classList.toggle('on', b.dataset.v === S.speed); b.onclick = () => { S.speed = b.dataset.v; $$('#speedSeg button').forEach(x => x.classList.toggle('on', x === b)); refreshTheme(); save(); }; });
    }
    // 공유 · 검색: 설명, 사이트 주소, 공유 이미지, 파비콘 (내보낸 사이트의 <head>)
    function renderMeta() {
      const box = $('#metaFields'); if (!box) return; box.innerHTML = '';
      const imgs = S.assets.filter(a => a.type === 'image');
      const lab = (t, el, hint) => h('label', { className: 'meta-f' }, [h('span', { className: 'lbl', textContent: t }), el].concat(hint ? [h('small', { className: 'hint', textContent: hint })] : []));
      const ds = h('textarea', { className: 'inp', rows: 2, value: S.desc || '', placeholder: '예: 강이조 개인전 · 작업 소개' }); ds.onchange = () => { S.desc = ds.value.trim(); save(); };
      const url = h('input', { className: 'inp', value: S.siteUrl || '', placeholder: 'https://아이디.github.io/저장소' }); url.onchange = () => { S.siteUrl = url.value.trim(); save(); renderMeta(); };
      const pick = (key, none) => { const sl = h('select', { className: 'inp' }); sl.appendChild(h('option', { value: '', textContent: none })); imgs.forEach(a => sl.appendChild(h('option', { value: a.id, textContent: a.name }))); sl.value = imgs.some(a => a.id === S[key]) ? S[key] : ''; sl.onchange = () => { S[key] = sl.value; save(); }; return sl; };
      box.append(
        lab('사이트 설명', ds, '검색 결과와 링크 공유 때 보이는 한두 줄'),
        lab('사이트 주소 (선택)', url, '올린 뒤의 주소. 넣어야 카카오톡 등에서 공유 이미지가 보입니다'),
        lab('공유 이미지', pick('shareImg', imgs.length ? '없음' : '없음 — 업로드 탭에서 사진을 올리세요'), S.siteUrl ? '' : '사이트 주소를 넣어야 적용됩니다'),
        lab('파비콘 (탭 아이콘)', pick('favicon', '사이트 이름 첫 글자 (자동)'))
      );
    }
    $('#pvTrans').onclick = () => openPreview();
    // 사이트 이름: 페이지 안의 [사이트 이름] · 이전 이름도 함께 바꿈 (직접 다른 글로 고친 곳은 그대로)
    // [사이트 이름] 자리표시는 글 중간에 있어도 바꾸고, 이전 이름은 글 전체가 그 이름일 때만 바꿈 ('카페' → '카페 루나' 가 '카페 메뉴' 까지 바꾸던 문제)
    $('#siteName').onchange = e => {
      const prev = S.siteName, next = e.target.value.trim() || '내 사이트'; S.siteName = next;
      const PH = NAME_PH, whole = prev && prev !== next && prev !== '내 사이트' && prev !== PH ? esc(prev) : null;
      // 세트별 자리표시([가게 이름] 등)는 로고 · 바닥글 안에서만 바꿈 ([이름] 처럼 본문의 다른 자리표시와 같은 글자일 수 있어서)
      const setPH = [...brandPlaceholders()].filter(t => t !== PH && t !== next).map(esc);
      let n = 0;
      editor.Pages.getAll().forEach(pg => walk(pg.getMainComponent(), c => {
        if (!textOnly(c)) return;
        const html = c.getInnerHTML(); let out = html;
        if (next !== PH) out = out.split(esc(PH)).join(esc(next));
        if (setPH.length && inBrandOrFoot(c)) setPH.forEach(t => { out = out.split(t).join(esc(next)); });
        if (whole && out.trim() === whole) out = esc(next);
        if (out !== html) { c.components(out); n++; }
      }));
      save(); if (n) toast('페이지 안의 사이트 이름 ' + n + '곳도 바꿨습니다');
    };

    // ---------- 왼쪽 탭 ----------
    function openPane(id) {
      $('#main').classList.remove('no-drawer');
      $$('.rail button').forEach(b => b.classList.toggle('on', b.dataset.pane === id));
      $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === id));
      const rb = $('.rail button[data-pane="' + id + '"]'); $('#drawerTitle').textContent = rb ? rb.textContent.trim() : '';
      if (id === 'pg') renderPages();
      if (id === 'site') renderMeta();
      setTimeout(() => editor.refresh(), 50);
    }
    // 그림을 두 번 누르면: GrapesJS 영어 'Select Image' 창 대신 업로드 탭 (올린 사진이 없으면 파일 고르기)
    ['core:open-assets', 'open-assets'].forEach(cmd => editor.Commands.add(cmd, { run() {
      const out = KZ.popout && KZ.popout.isOut('drawer'); if (!out) openPane('up');
      if (!S.assets.some(a => a.type === 'image')) fileIn.click(); else toast('올린 사진을 누르면 고른 그림이 바뀝니다');
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

    // ---------- 상단 바 ----------
    // 되돌리기: 글 고치기 한 번이 GrapesJS 안에서 여러 단계로 쌓여, 한 번 눌러서는 화면이 그대로인 경우가 있음
    // → 화면(HTML · CSS)이 바뀔 때까지 몇 단계 더 되돌림
    const snap = () => editor.getHtml() + '\n' + editor.getCss({ keepUnusedStyles: true }) + '\n' + treeRec.get('t');
    function stepUndo(redo) {
      const um = editor.UndoManager, has = () => redo ? um.hasRedo() : um.hasUndo();
      if (!has()) return;
      const before = snap(); let n = 0;
      do { redo ? um.redo() : um.undo(); n++; } while (has() && n < 8 && snap() === before);
    }
    ['core:undo', 'core:redo'].forEach(id => editor.Commands.add(id, { run() { stepUndo(id === 'core:redo'); } }));
    // 글 고치기 한 번(두 번 눌러 편집 ~ 끝)에 쌓인 단계를 하나로 묶음: 되돌리기 한 번에 편집 전 글로
    let rteFrom = -1;
    editor.on('rte:enable', () => { rteFrom = editor.UndoManager.getStack().length; });
    editor.on('rte:disable', () => setTimeout(() => {
      const st = editor.UndoManager.getStack(); if (rteFrom < 0 || st.length - rteFrom < 2) return;
      const first = st.at(rteFrom); const idx = first && first.get('magicFusionIndex');
      if (idx != null) for (let i = rteFrom; i < st.length; i++) st.at(i).set('magicFusionIndex', idx);
      rteFrom = -1;
    }, 0));
    $('#undo').onclick = () => stepUndo(false);
    $('#redo').onclick = () => stepUndo(true);
    $$('[data-dev]').forEach(b => b.onclick = () => {
      editor.setDevice(b.dataset.dev); $$('[data-dev]').forEach(x => x.classList.toggle('on', x === b));
      if (b.dataset.dev !== 'desktop') toast((b.dataset.dev === 'mobile' ? '모바일' : '태블릿') + ' 화면 — 여기서 바꾼 디자인은 이 크기에만 적용됩니다');
      renderSide(); renderStageHead();
      // 화면 크기가 바뀌는 동안 읽은 값(글자 크기 · 좁음 알림)이 틀릴 수 있어 바뀐 뒤 한 번 더
      setTimeout(() => { renderSide(); narrowCheck(); }, 500);
    });
    $('#modeFlow').onclick = () => { editor.setDragMode(''); $('#modeFlow').classList.add('on'); $('#modeFree').classList.remove('on'); toast('정렬 배치 — 요소가 위아래로 정렬됩니다'); };
    $('#modeFree').onclick = () => { editor.setDragMode('translate'); $('#modeFree').classList.add('on'); $('#modeFlow').classList.remove('on'); toast('자유 배치 — 끌어서 원하는 위치에 놓습니다. 모바일 화면도 꼭 확인하세요'); };
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
        treeEnsure(); syncMenus(); recordTree(); editor.UndoManager.clear(); // 불러오기 전 되돌리기 기록은 버림 (남아 있으면 Ctrl+Z 가 불러온 내용을 어긋나게 바꿈)
        syncAll(); save(); setTimeout(() => fileDirty(false), 1200); toast('작업 파일을 불러왔습니다');
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
      const uN = ul.filter(x => x.n), uD = ul.filter(x => x.d);
      if (uN.length) warn.push('<b>연결 안 된 버튼 ' + uN.reduce((s, x) => s + x.n, 0) + '개</b> (편집 화면의 빨간 점선): ' + uN.map(x => esc(x.name) + ' ' + x.n).join(' · ') + ' — 눌러도 아무 일도 없습니다. 디자인 탭 → 링크에서 연결하세요.');
      if (uD.length) warn.push('<b>없는 페이지로 가는 링크 ' + uD.reduce((s, x) => s + x.d, 0) + '개</b> (지운 페이지 등, 빨간 점선): ' + uD.map(x => esc(x.name) + ' ' + x.d).join(' · ') + ' — 누르면 첫 페이지로 갑니다. 디자인 탭 → 링크에서 다른 페이지로 바꾸세요.');
      const what = media.length
        ? '<p>올린 사진 · 영상이 <b>' + media.length + '개</b> 있어 <b>ZIP</b>(index.html + media 폴더)으로 받기를 권합니다.</p><p class="hint">받은 ZIP을 압축 풀고, 폴더 <b>안의 것을 전부</b> 선택해 GitHub에 끌어다 놓으세요.</p>'
        : '<p>완성한 사이트를 <b>index.html</b> 한 파일로 받습니다. 이 파일 하나만 올리면 됩니다.</p>';
      const body = what + (warn.length ? '<div class="ex-warn">' + warn.map(w => '<p>⚠ ' + w + '</p>').join('') + '</div>' : '') +
        '<p class="hint"><a href="' + GUIDE + '" target="_blank" rel="noopener">GitHub에 올리는 방법 보기 ↗</a> · 나중에 고치려면 <b>작업 파일</b>도 받아 두세요 (GitHub에는 올리지 않음).</p>';
      const btns = [['닫기', null], ['작업 파일', d => { d(null); saveProjectFile(); }]];
      if (media.length) {
        btns.push(['index.html 하나', d => { d(null); offerFile('index.html', html.replace(/<meta property="og:image" content="[^"]*data:[^"]*">\n/, ''), 'text/html'); }]);
        btns.push(['ZIP 받기', d => { d(null); offerFile(fileBase() + '.zip', KZ.zip([{ path: 'index.html', text: pkg.html }].concat(media)), 'application/zip'); }, 'pri']);
      } else btns.push(['index.html 받기', d => { d(null); offerFile('index.html', html, 'text/html'); }, 'pri']);
      return dialog('내보내기', body, btns);
    }

    // ---------- 내보내기 ----------
    const offerFile = (name, data, mime) => KZ.offerFile(name, data, mime);
    const assetSrc = id => { const a = id && S.assets.find(x => x.id === id && x.type === 'image'); return a ? a.src : ''; };
    function buildSite(startId) {
      return KZ.buildSite({
        pages: orderedPages().map(p => { const t = treeEnsure()[p.getId()]; return { id: p.getId(), name: pname(p), parent: t.parent || null, menu: t.menu !== false, html: p.getMainComponent().getInnerHTML() }; }),
        css: editor.getCss({ keepUnusedStyles: true }) || '', S, startId,
        shareSrc: assetSrc(S.shareImg), iconSrc: assetSrc(S.favicon)
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
      // 다른 탭에 알림: 이제 이 탭이 저장합니다 (먼저 알려야 다른 탭이 저장을 멈춤)
      if (bc) bc.postMessage({ t: 'claim', id: TAB_ID });
      let saved = null, raw = null, loadErr = null;
      try { raw = await KZ.store.DB.get('project'); if (raw) saved = KZ.store.migrate(raw); } catch (e) { saved = null; loadErr = e; }
      try {
        if (saved && saved.gjs) { S = Object.assign(DEFAULT_S(), saved.S || {}); editor.loadProjectData(saved.gjs); if (!realPages().length) applySet(C.DEFAULT_SET); }
        else applySet(C.DEFAULT_SET);
      } catch (e) { loadErr = loadErr || e; S = DEFAULT_S(); applySet(C.DEFAULT_SET); }
      // 저장본을 못 열었으면 지우지 않고 따로 보관한 뒤 알립니다 (이전에는 기본 세트가 그대로 덮어썼음)
      if (loadErr && raw) {
        const key = 'backup-' + new Date().toISOString().replace(/[:.]/g, '-');
        try { await KZ.store.DB.set(key, raw); } catch (e) { /* 아래에서 파일로 받기 */ }
        dialog('저장된 작업을 열지 못했습니다', '<p>이 브라우저에 저장된 작업을 열 수 없어 기본 세트로 시작합니다.</p><p class="hint">이유: ' + esc(loadErr.message || String(loadErr)) + '<br>원래 저장본은 지우지 않고 보관했습니다. 아래 버튼으로 파일로 받아 두고, 편집기를 새로고침한 뒤 <b>파일 → 작업 파일 불러오기</b>로 열어 보세요.</p>',
          [['닫기', null], ['원래 저장본 받기', d => { d(null); offerFile('wmw-backup-project.json', JSON.stringify(raw), 'application/json'); }, 'pri']]);
      }
      treeEnsure(); syncMenus(); recordTree();
      editor.UndoManager.clear();
      booted = true;
      renderSets(); renderTemplates(); syncAll(); KZ.layoutUi && KZ.layoutUi.init(editor);
      $('#fxMarkBtn').onclick = () => setFxMark(!fxMark); setFxMark(fxMark);
      $('#fileWarn').onclick = saveProjectFile;
      let smallOk = true; try { smallOk = !!sessionStorage.getItem('wmw-small-ok'); sessionStorage.setItem('wmw-small-ok', '1'); } catch (e) { /* 저장 막힘 */ }
      if ((window.innerWidth < 900 || window.matchMedia('(pointer:coarse)').matches) && !smallOk && !$('#dlg').classList.contains('open')) {
        dialog('PC에서 쓰기를 권합니다', '<p>WMW 편집기는 <b>PC 화면(가로 1024px 이상, 마우스)</b>에 맞춰져 있습니다. 휴대폰 · 작은 창에서는 패널이 화면을 가리고 일부 버튼이 숨겨집니다.</p><p class="hint">만든 사이트는 휴대폰에서도 잘 보입니다. 위쪽 모바일 버튼으로 확인할 수 있습니다.</p>');
      }
      // 패널을 브라우저 창 밖으로
      KZ.popout.onChange = () => setTimeout(() => { try { editor.refresh(); } catch (e) { /* 무시 */ } renderSide(); }, 60);
      $$('[data-popout]').forEach(b => b.onclick = () => KZ.popout.toggle(b.dataset.popout).then(kind => {
        if (kind) toast(kind === 'pip' ? '항상 위에 뜨는 창으로 꺼냈습니다. 창을 닫으면 제자리로 돌아옵니다' : '새 창으로 꺼냈습니다. 창을 닫거나 ⇲ 를 누르면 돌아옵니다');
      }, err => dialog('창 밖으로 꺼내지 못했습니다', '<p>' + esc(err.message || '브라우저가 새 창을 막았습니다.') + '</p>')));
      let wasDirty = false; try { wasDirty = localStorage.getItem(FILE_KEY) === '1'; } catch (e) { /* 무시 */ }
      fileDirty(wasDirty);
      setTimeout(() => { armed = true; }, 1000); // 시작할 때 생기는 변경은 세지 않음
      window.__kz = { orderedPages, movePage, syncMenus, treeEnsure, get S() { return S; } };
      try { injectDoc(editor.Canvas.getDocument()); } catch (e) { /* 프레임 대기 */ }
      setStatus(saved ? '저장됨 · 이 브라우저' : '새 작업');
    });
  }
})(window.KZ);
