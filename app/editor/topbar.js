/* 상단 바 — 되돌리기, 기기 전환, 배치 방식, 파일 메뉴
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, setS, attr, ruleStyle } = X;
  const { $, $$, esc, toast, dialog, confirmDlg } = KZ.ui;
  const C = KZ.C;

  // ---------- 상단 바 ----------
  // 되돌리기: 글 고치기 한 번이 GrapesJS 안에서 여러 단계로 쌓여, 한 번 눌러서는 화면이 그대로인 경우가 있음
  // → 화면(HTML · CSS)이 바뀔 때까지 몇 단계 더 되돌림
  const snap = () => editor.getHtml() + '\n' + editor.getCss({ keepUnusedStyles: true }) + '\n' + X.treeRec.get('t');
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
    X.renderSide(); X.renderStageHead();
    // 화면 크기가 바뀌는 동안 읽은 값(글자 크기 · 좁음 알림)이 틀릴 수 있어 바뀐 뒤 한 번 더
    setTimeout(() => { X.renderSide(); X.narrowCheck(); }, 500);
  });
  // 자유 배치로 옮긴 요소에 표시: 휴대폰 보기에서 옮겼으면 "m"(그 위치 유지), 아니면 "1"(휴대폰에서는 원래 자리 — site/base.css)
  editor.on('component:drag:end', o => {
    const c = o && o.target; if (!c || !c.getStyle) return;
    const moved = /translate/.test(String(ruleStyle(c).transform || c.getStyle().transform || '')); if (!moved) return;
    const m = editor.getDevice() === 'mobile'; if (attr(c, 'data-free') === 'm' && !m) return;
    c.addAttributes({ 'data-free': m ? 'm' : '1' });
  });
  $('#modeFlow').onclick = () => { editor.setDragMode(''); $('#modeFlow').classList.add('on'); $('#modeFree').classList.remove('on'); toast('정렬 배치 — 요소가 위아래로 정렬됩니다'); };
  $('#modeFree').onclick = () => { editor.setDragMode('translate'); $('#modeFree').classList.add('on'); $('#modeFlow').classList.remove('on'); toast('자유 배치 — 끌어서 원하는 위치에 놓습니다. 모바일 화면도 꼭 확인하세요'); };
  const fileMenu = $('#fileMenu');
  $('#fileBtn').onclick = e => { e.stopPropagation(); fileMenu.classList.toggle('open'); };
  document.addEventListener('click', () => fileMenu.classList.remove('open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fileMenu.classList.remove('open'); });
  fileMenu.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return; fileMenu.classList.remove('open');
    const act = b.dataset.act;
    if (act === 'export-json') X.saveProjectFile();
    if (act === 'import-json') $('#jsonIn').click();
    if (act === 'export-html') X.exportDialog();
    if (act === 'reset' && await confirmDlg('처음 상태로', '이 브라우저에 저장된 작업을 지우고 기본 세트로 돌아갑니다. 먼저 작업 파일을 저장해 두세요.', '되돌리기')) {
      try { await KZ.store.DB.del('project'); } catch (er) { /* 무시 */ }
      setS(); X.applySet(C.DEFAULT_SET); X.refreshTheme(); X.renderSite(); X.renderAssets(); setTimeout(() => X.fileDirty(false), 1200); toast('처음 상태로 돌아왔습니다');
    }
  };
  $('#jsonIn').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const d = KZ.store.migrate(JSON.parse(await f.text()));
      setS(d.S); editor.loadProjectData(d.gjs);
      X.treeEnsure(); X.upgradeProject(d.from); X.syncChrome(); X.recordTree(); editor.UndoManager.clear(); // 불러오기 전 되돌리기 기록은 버림 (남아 있으면 Ctrl+Z 가 불러온 내용을 어긋나게 바꿈)
      X.syncAll(); X.save(); setTimeout(() => X.fileDirty(false), 1200); toast('작업 파일을 불러왔습니다');
    } catch (er) { dialog('불러오기 실패', '<p>' + esc(er.message || '이 편집기에서 저장한 .json 파일이 아닙니다.') + '</p>'); }
  };
});
