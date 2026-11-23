/* 편집기 시작 — GrapesJS 를 만들고, 조각(editor/*.js)을 순서대로 실행한 뒤, 저장된 작업을 불러옵니다.
   조각: canvas(편집 화면) · save(저장) · templates(템플릿) · chrome(사이트 이름 · 메뉴) · pages(페이지) · assets(업로드)
         · design(디자인 탭) · exhibit(전시 배치) · action(누르면) · fx(효과 탭) · site(사이트 탭) · topbar(상단 바) · output(내보내기 · 미리보기)
   새 기능은 맞는 조각에 넣고, 다른 조각이 써야 하는 함수만 조각 끝의 Object.assign(X, {...}) 에 추가합니다.
   의존: vendor/grapesjs, layouts/*, sets/*, blocks/blocks.js, editor/config.js · ui.js · storage.js · export.js · layout.js · popout.js */
(function (KZ) {
  'use strict';
  const C = KZ.C;
  const { DEFAULT_S } = C;
  const { $, $$, esc, toast, dialog, setStatus } = KZ.ui;
  const swatches = (label, cur, on, allowNone) => KZ.ui.swatches(label, cur, on, allowNone, S.colors);
  const S = DEFAULT_S();
  // 사이트 설정은 객체 하나를 계속 씀 — 통째로 바꿀 때도 내용만 갈아 끼움 (모든 파일이 같은 객체를 봄)
  function setS(o) { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, DEFAULT_S(), o || {}); }

  KZ.loadSiteAssets().then(start, err => {
    dialog('편집기를 시작하지 못했습니다', '<p>사이트 파일을 불러오지 못했습니다 (' + esc(err.message) + ').</p><p class="hint">파일을 직접 열었다면 웹 서버로 열어야 합니다. 예: <code>python3 -m http.server --directory app</code></p>');
  });

  function start() {
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

    const within = (c, root) => { for (let x = c; x; x = x.parent()) if (x === root) return true; return false; };
    const isNavTop = c => (c.get('tagName') || '').toLowerCase() === 'header' && hasCls(c, 'nav');
    const isFootTop = c => hasCls(c, 'foot');
    const hasNav = c => isNavTop(c) || c.find('header.nav').length > 0; // 첫 페이지 히어로처럼 메뉴를 품은 섹션
    function topOf(c) { const w = editor.getWrapper(); while (c && c.parent() && c.parent() !== w) c = c.parent(); return c && c.parent() === w ? c : null; }
    const realPages = () => editor.Pages.getAll().filter(p => !String(p.getId()).startsWith('__'));
    const pname = p => p.get('name') || p.getId();
    function walk(c, fn) { fn(c); c.components().forEach(x => walk(x, fn)); }
    function hasCls(c, n) { return (c.getClasses ? c.getClasses() : []).includes(n); }
    const vids = c => { const o = []; if (c) walk(c, x => { if (x !== c && x.get('type') === 'video') o.push(x); }); return o; }; // 영상 요소 찾기: GrapesJS 는 find('video') 로 영상 컴포넌트를 못 찾음 → 종류(type)로
    const up = (c, pred) => { while (c) { if (pred(c)) return c; c = c.parent(); } return null; };
    const attr = (c, k) => (c && c.getAttributes()[k]) || '';
    const labelOf = (list, v) => (list.find(x => x[0] === v) || [, v])[1];

    // ---------- 조각 실행 ----------
    // 조각(editor/*.js)이 함께 쓰는 것. booted: 저장본을 다 불러온 뒤 true
    const X = { editor, S, setS, swatches, booted: false, attr, cs, hasCls, hasNav, isFootTop, isNavTop, labelOf, mediaOpts, pname, realPages, ruleStyle, setStyle, topOf, up, val, vids, walk, within };
    X.syncAll = syncAll;
    KZ.parts.forEach(part => part(X));

    // ---------- 시작 ----------
    // 설정 · 페이지가 통째로 바뀐 뒤(불러오기 · 처음 상태로) 화면 전체를 다시 그림
    function syncAll() {
      $('#siteName').value = S.siteName; X.treeEnsure(); X.refreshTheme(); X.renderSite(); X.renderAssets(); X.renderNav(); X.renderSide();
    }
    editor.on('load', async () => {
      // 다른 탭에 알림: 이제 이 탭이 저장합니다 (먼저 알려야 다른 탭이 저장을 멈춤)
      X.claimTab();
      let saved = null, raw = null, loadErr = null;
      try {
        raw = await KZ.store.DB.get('project');
        // 예전 형식이면 바꾸기 전 저장본을 따로 보관 (변환이 잘못됐을 때 되찾을 수 있게)
        if (raw && raw.gjs && (raw.v || 1) < KZ.store.FORMAT) { try { await KZ.store.DB.set('backup-format' + (raw.v || 1), JSON.parse(JSON.stringify(raw))); } catch (e) { /* 보관 실패해도 계속 */ } }
        if (raw) saved = KZ.store.migrate(raw);
      } catch (e) { saved = null; loadErr = e; }
      try {
        if (saved && saved.gjs) { setS(saved.S); editor.loadProjectData(saved.gjs); if (!realPages().length) X.applySet(C.DEFAULT_SET); }
        else X.applySet(C.DEFAULT_SET);
      } catch (e) { loadErr = loadErr || e; setS(); X.applySet(C.DEFAULT_SET); }
      // 저장본을 못 열었으면 지우지 않고 따로 보관한 뒤 알립니다 (이전에는 기본 세트가 그대로 덮어썼음)
      if (loadErr && raw) {
        const key = 'backup-' + new Date().toISOString().replace(/[:.]/g, '-');
        try { await KZ.store.DB.set(key, raw); } catch (e) { /* 아래에서 파일로 받기 */ }
        dialog('저장된 작업을 열지 못했습니다', '<p>이 브라우저에 저장된 작업을 열 수 없어 기본 세트로 시작합니다.</p><p class="hint">이유: ' + esc(loadErr.message || String(loadErr)) + '<br>원래 저장본은 지우지 않고 보관했습니다. 아래 버튼으로 파일로 받아 두고, 편집기를 새로고침한 뒤 <b>파일 → 작업 파일 불러오기</b>로 열어 보세요.</p>',
          [['닫기', null], ['원래 저장본 받기', d => { d(null); KZ.offerFile('wmw-backup-project.json', JSON.stringify(raw), 'application/json'); }, 'pri']]);
      }
      X.treeEnsure(); if (saved) X.upgradeProject(saved.from); X.syncChrome(); X.recordTree();
      editor.UndoManager.clear();
      X.booted = true;
      X.renderSets(); X.renderTemplates(); syncAll(); KZ.layoutUi && KZ.layoutUi.init(editor);
      X.fxMarkInit();
      let smallOk = true; try { smallOk = !!sessionStorage.getItem('wmw-small-ok'); sessionStorage.setItem('wmw-small-ok', '1'); } catch (e) { /* 저장 막힘 */ }
      if ((window.innerWidth < 900 || window.matchMedia('(pointer:coarse)').matches) && !smallOk && !$('#dlg').classList.contains('open')) {
        dialog('PC에서 쓰기를 권합니다', '<p>WMW 편집기는 <b>PC 화면(가로 1024px 이상, 마우스)</b>에 맞춰져 있습니다. 휴대폰 · 작은 창에서는 패널이 화면을 가리고 일부 버튼이 숨겨집니다.</p><p class="hint">만든 사이트는 휴대폰에서도 잘 보입니다. 위쪽 모바일 버튼으로 확인할 수 있습니다.</p>');
      }
      // 패널을 브라우저 창 밖으로
      KZ.popout.onChange = () => setTimeout(() => { try { editor.refresh(); } catch (e) { /* 무시 */ } X.renderSide(); }, 60);
      $$('[data-popout]').forEach(b => b.onclick = () => KZ.popout.toggle(b.dataset.popout).then(kind => {
        if (kind) toast(kind === 'pip' ? '항상 위에 뜨는 창으로 꺼냈습니다. 창을 닫으면 제자리로 돌아옵니다' : '새 창으로 꺼냈습니다. 창을 닫거나 ⇲ 를 누르면 돌아옵니다');
      }, err => dialog('창 밖으로 꺼내지 못했습니다', '<p>' + esc(err.message || '브라우저가 새 창을 막았습니다.') + '</p>')));
      X.fileDirtyInit();
      window.__kz = { orderedPages: X.orderedPages, movePage: X.movePage, syncChrome: X.syncChrome, treeEnsure: X.treeEnsure, S: S }; // 자동 점검용
      try { X.injectDoc(editor.Canvas.getDocument()); } catch (e) { /* 프레임 대기 */ }
      setStatus(saved ? '저장됨 · 이 브라우저' : '새 작업');
    });
  }
})(window.KZ);
