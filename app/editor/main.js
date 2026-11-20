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

    // 캔버스에 사이트 CSS 주입
    const docs = new Set();
    function injectDoc(doc) {
      if (!doc || !doc.head) return;
      if (!doc.getElementById('kz-base')) {
        const l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = C.FONT_LINK; doc.head.appendChild(l);
        const b = doc.createElement('style'); b.id = 'kz-base'; b.textContent = KZ.site.base + '\n' + KZ.site.motion; doc.head.appendChild(b);
        const t = doc.createElement('style'); t.id = 'kz-theme'; doc.head.appendChild(t);
      }
      doc.getElementById('kz-theme').textContent = KZ.themeCss(S);
      docs.add(doc);
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
    let booted = false, saveT;
    function save() {
      if (!booted) return;
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
      S.siteName = set.siteName || S.siteName; $('#siteName').value = S.siteName;
      if (set.style) {
        const st = set.style, th = THEMES[st.theme];
        if (th) { S.theme = st.theme; S.colors = { bg: th.bg, ink: th.ink, sub: th.sub, line: th.line, accent: th.accent }; }
        if (st.font && FONTS[st.font]) S.font = st.font;
        if (st.transition) S.transition = st.transition;
        if (st.speed) S.speed = st.speed;
        refreshTheme(); if (booted) renderSite();
      }
      editor.UndoManager.clear();
      renderPages(); save();
    }
    function renderSets() {
      const box = $('#sets'); box.innerHTML = '';
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
      const v = await dialog(t.name, '<p>이 템플릿을 어떻게 쓸까요?</p><p class="hint">현재 페이지에 적용하면 지금 페이지 내용이 바뀝니다 (Ctrl+Z로 되돌리기 가능).</p>', [['취소', null], ['새 페이지로 추가', 'new'], ['현재 페이지에 적용', 'cur', 'pri']]);
      if (v === 'cur') { editor.setComponents(t.html()); toast('현재 페이지에 적용했습니다'); }
      if (v === 'new') { const SLUG = { t1: 'home', t2: 'exhibitions', t3: 'works', t4: 'work', t5: 'apps', t6: 'series', t7: 'by-year', t8: 'index', t9: 'gallery', t10: 'cv', t11: 'text', t12: 'intro', t13: 'about', fx: 'effects' }; const p = addPage(t.name.replace(/\s*\(.*\)$/, ''), t.html(), SLUG[id]); if (p) toast('새 페이지 #' + p.getId() + ' 를 만들었습니다'); }
    }

    // ---------- 페이지 ----------
    const realPages = () => editor.Pages.getAll().filter(p => !String(p.getId()).startsWith('__'));
    function uniqueId(base) {
      let id = (base || 'page').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'page';
      let n = 1, out = id; while (editor.Pages.get(out)) out = id + '-' + (++n); return out;
    }
    function addPage(name, html, id) {
      const p = editor.Pages.add({ id: uniqueId(id || 'page'), name: name || '새 페이지', component: html || '<section class="wrap"><h1 class="title">새 페이지</h1><p class="body-p">요소 탭에서 섹션을 끌어 오세요.</p></section>' });
      editor.Pages.select(p); renderPages(); save(); return p;
    }
    function renderPages() {
      const box = $('#pages'); if (!box) return; box.innerHTML = '';
      const cur = editor.Pages.getSelected();
      realPages().forEach(p => {
        const row = document.createElement('div'); row.className = 'pg' + (p === cur ? ' on' : '');
        const inp = document.createElement('input'); inp.value = p.get('name') || p.getId(); inp.setAttribute('aria-label', '페이지 이름');
        inp.onchange = () => { p.set('name', inp.value); save(); };
        inp.onfocus = () => { if (editor.Pages.getSelected() !== p) { editor.Pages.select(p); } };
        const code = document.createElement('code'); code.textContent = '#' + p.getId();
        const open = document.createElement('button'); open.title = '열기'; open.textContent = '↗'; open.onclick = () => editor.Pages.select(p);
        const dup = document.createElement('button'); dup.title = '복제'; dup.textContent = '⧉'; dup.onclick = () => { addPage((p.get('name') || '') + ' 복사', p.getMainComponent().getInnerHTML(), p.getId() + '-copy'); };
        const del = document.createElement('button'); del.title = '삭제'; del.textContent = '✕';
        del.onclick = async () => { if (realPages().length < 2) return toast('마지막 페이지는 지울 수 없습니다'); if (await confirmDlg('페이지 삭제', '<b>' + esc(p.get('name')) + '</b> 페이지를 삭제할까요?', '삭제')) { const other = realPages().find(x => x !== p); editor.Pages.select(other); editor.Pages.remove(p); renderPages(); save(); } };
        row.append(inp, code, open, dup, del); box.appendChild(row);
      });
    }
    editor.on('page:select', () => { renderPages(); editor.select(null); renderSide(); });
    $('#addPage').onclick = async () => {
      const f = document.createElement('div');
      f.innerHTML = '<div class="field"><label for="npName">페이지 이름</label><input class="inp" id="npName" value="새 페이지"></div><div class="field"><label for="npId">주소 (영문 · 숫자 · -)</label><input class="inp" id="npId" value="new-page"></div>';
      const v = await dialog('빈 페이지 추가', f, [['취소', null], ['추가', d => d({ n: $('#npName').value, i: $('#npId').value }), 'pri']]);
      if (v) addPage(v.n, null, v.i);
    };

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
        const url = h('input', { className: 'inp', value: href, placeholder: 'https://… 또는 #주소' }); url.onchange = () => sel.addAttributes({ href: url.value });
        box.appendChild(field('이동할 페이지', ls)); box.appendChild(field('또는 직접 주소', url));
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
      box.appendChild(opts(CLICKS, attr(sel, 'data-click'), v => { setA('data-click', v); drawClick(v); }));
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
      $$('#speedSeg button').forEach(b => { b.classList.toggle('on', b.dataset.v === S.speed); b.onclick = () => { S.speed = b.dataset.v; $$('#speedSeg button').forEach(x => x.classList.toggle('on', x === b)); refreshTheme(); save(); }; });
    }
    $('#pvTrans').onclick = () => openPreview();
    $('#siteName').onchange = e => { S.siteName = e.target.value || 'site'; save(); };

    // ---------- 왼쪽 탭 ----------
    function openPane(id) {
      $('#main').classList.remove('no-drawer');
      $$('.rail button').forEach(b => b.classList.toggle('on', b.dataset.pane === id));
      $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === id));
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
      renderSide();
    });
    $('#modeFlow').onclick = () => { editor.setDragMode(''); $('#modeFlow').classList.add('on'); $('#modeFree').classList.remove('on'); toast('정렬 배치 — 요소가 위아래로 정렬됩니다'); };
    $('#modeFree').onclick = () => { editor.setDragMode('absolute'); $('#modeFree').classList.add('on'); $('#modeFlow').classList.remove('on'); toast('자유 배치 — 끌어서 원하는 위치에 놓습니다. 모바일 화면도 꼭 확인하세요'); };
    const fileMenu = $('#fileMenu');
    $('#fileBtn').onclick = e => { e.stopPropagation(); fileMenu.classList.toggle('open'); };
    document.addEventListener('click', () => fileMenu.classList.remove('open'));
    fileMenu.onclick = async e => {
      const b = e.target.closest('button'); if (!b) return; fileMenu.classList.remove('open');
      const act = b.dataset.act;
      if (act === 'export-json') offerFile((S.siteName || 'site') + '-project.json', JSON.stringify(KZ.store.pack(S, editor.getProjectData())), 'application/json');
      if (act === 'import-json') $('#jsonIn').click();
      if (act === 'export-html') offerFile('index.html', buildSite(), 'text/html');
      if (act === 'reset' && await confirmDlg('처음 상태로', '이 브라우저에 저장된 작업을 지우고 기본 세트로 돌아갑니다. 먼저 작업 파일을 저장해 두세요.', '되돌리기')) {
        try { await KZ.store.DB.del('project'); } catch (er) { /* 무시 */ }
        S = DEFAULT_S(); applySet(C.DEFAULT_SET); refreshTheme(); renderSite(); renderAssets(); toast('처음 상태로 돌아왔습니다');
      }
    };
    $('#jsonIn').onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      try {
        const d = KZ.store.migrate(JSON.parse(await f.text()));
        S = Object.assign(DEFAULT_S(), d.S || {}); editor.loadProjectData(d.gjs);
        syncAll(); save(); toast('작업 파일을 불러왔습니다');
      } catch (er) { dialog('불러오기 실패', '<p>' + esc(er.message || '이 편집기에서 저장한 .json 파일이 아닙니다.') + '</p>'); }
    };
    $('#publishBtn').onclick = () => dialog('게시 (2차에서 연결)', '<p>이 시제품에서는 아직 GitHub로 올리지 않습니다. 2차에서 연결할 흐름은 다음과 같습니다.</p><ol style="padding-left:18px"><li>GitHub 저장소와 접근 토큰을 한 번 등록</li><li>[게시]를 누르면 <code>index.html</code>과 작업 파일이 저장소에 올라감</li><li>GitHub Pages가 1~2분 안에 사이트에 반영</li></ol><p class="hint">지금은 [파일 → 사이트 HTML 내보내기]로 받은 파일을 직접 올릴 수 있습니다.</p>', [['닫기', null], ['HTML 내보내기', d => { d(null); offerFile('index.html', buildSite(), 'text/html'); }, 'pri']]);

    // ---------- 내보내기 ----------
    const offerFile = (name, data, mime) => KZ.offerFile(name, data, mime);
    function buildSite(startId) {
      return KZ.buildSite({
        pages: realPages().map(p => ({ id: p.getId(), name: p.get('name') || p.getId(), html: p.getMainComponent().getInnerHTML() })),
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
      $('#siteName').value = S.siteName; refreshTheme(); renderSite(); renderAssets(); renderPages(); renderSide();
    }
    editor.on('load', async () => {
      let saved = null;
      try { saved = await KZ.store.DB.get('project'); if (saved) saved = KZ.store.migrate(saved); } catch (e) { saved = null; }
      try {
        if (saved && saved.gjs) { S = Object.assign(DEFAULT_S(), saved.S || {}); editor.loadProjectData(saved.gjs); if (!realPages().length) applySet(C.DEFAULT_SET); }
        else applySet(C.DEFAULT_SET);
      } catch (e) { applySet(C.DEFAULT_SET); }
      editor.UndoManager.clear();
      booted = true;
      renderSets(); renderTemplates(); syncAll();
      try { injectDoc(editor.Canvas.getDocument()); } catch (e) { /* 프레임 대기 */ }
      setStatus(saved ? '저장됨 · 이 브라우저' : '새 작업');
    });
  }
})(window.KZ);
