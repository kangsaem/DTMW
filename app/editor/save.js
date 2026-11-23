/* 저장 — 브라우저 자동 저장, 작업 파일, 두 탭 처리, 예전 형식 변환
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S, hasCls, realPages, up, walk } = X;
  const { $, esc, toast, dialog, setStatus } = KZ.ui;

  // ---------- 저장 (IndexedDB) ----------
  let saveT, armed = false;
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
    KZ.offerFile(fileBase() + '-project.json', JSON.stringify(KZ.store.pack(S, editor.getProjectData())), 'application/json');
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
    if (!X.booted) return;
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
  function claimTab() { if (bc) bc.postMessage({ t: 'claim', id: TAB_ID }); }
  // 시작할 때: 지난번 미저장 표시를 되살리고, 시작 직후 생기는 변경은 미저장으로 세지 않음
  function fileDirtyInit() { let was = false; try { was = localStorage.getItem(FILE_KEY) === '1'; } catch (e) { /* 무시 */ } fileDirty(was); $('#fileWarn').onclick = saveProjectFile; setTimeout(() => { armed = true; }, 1000); }
  editor.on('update', save);

  // ---------- 예전 형식 변환 ----------
  // 예전 형식(1)의 작업을 지금 형식으로: 이름 자리에 표시를 달고, 링크와 팝업이 함께 걸린 버튼은 실제 동작(팝업)대로 정리
  function upgradeProject(from) {
    if (from >= 2) return;
    const name = esc(S.siteName || ''), isPh = t => /^\[[^\]]+\]$/.test(t.trim());
    const textOnly = c => c.components().length && c.components().every(x => x.is('textnode'));
    const span = '<span ' + X.NAME_ATTR + '="1">' + name + '</span>';
    let ph = ''; // 세트의 로고 자리표시 ([가게 이름] 등)
    realPages().forEach(p => walk(p.getMainComponent(), c => { if (!ph && hasCls(c, 'brand') && textOnly(c) && isPh(c.getInnerHTML())) ph = c.getInnerHTML().trim(); }));
    const names = [name, esc('[사이트 이름]'), ph].filter(Boolean);
    realPages().forEach(p => p.getMainComponent().find('.nav .lang').forEach(c => c.remove())); // 숨겨져 있던 언어 버튼
    realPages().forEach(p => walk(p.getMainComponent(), c => {
      const at = c.getAttributes();
      if ((c.get('tagName') || '').toLowerCase() === 'a' && at['data-click']) {
        if (at['data-click'] === 'go') X.setAction(c, 'go', at['data-go'] || '');
        else if (at.href && at.href !== '#') c.addAttributes({ href: '#' });
      }
      if (!textOnly(c) || at[X.NAME_ATTR]) return;
      const html = c.getInnerHTML(), whole = names.includes(html.trim());
      if ((hasCls(c, 'brand') || hasCls(c, 'hero-name') || hasCls(c, 'th-name')) && whole) c.addAttributes({ [X.NAME_ATTR]: '1' });
      else if (up(c, x => hasCls(x, 'foot'))) { const hit = names.find(n => html.includes(n)); if (hit) c.components(html.split(hit).join(span)); }
    }));
  }

  Object.assign(X, { claimTab, fileBase, fileDirty, fileDirtyInit, save, saveKey, saveProjectFile, upgradeProject });
});
