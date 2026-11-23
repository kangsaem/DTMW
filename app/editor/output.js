/* 내보내기 창 · 완성 HTML 만들기 · 미리보기
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S, pname } = X;
  const { $, $$, esc, dialog } = KZ.ui;

  // ---------- 내보내기 창 ----------
  $('#publishBtn').onclick = () => exportDialog();
  // 내보내기: 올린 사진 · 영상이 있으면 ZIP(index.html + media/), 없으면 index.html 하나
  const GUIDE = 'guide/';
  const mb = n => (n / 1048576).toFixed(n > 10485760 ? 0 : 1) + 'MB';
  function exportDialog() {
    const html = buildSite(), pkg = KZ.packSite(html, S.assets), media = pkg.media;
    const big = media.filter(m => m.size > KZ.GH_LIMIT), htmlBig = html.length > KZ.GH_LIMIT, ul = X.unlinkedReport();
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
    const btns = [['닫기', null], ['작업 파일', d => { d(null); X.saveProjectFile(); }]];
    if (media.length) {
      btns.push(['index.html 하나', d => { d(null); KZ.offerFile('index.html', html.replace(/<meta property="og:image" content="[^"]*data:[^"]*">\n/, ''), 'text/html'); }]);
      btns.push(['ZIP 받기', d => { d(null); KZ.offerFile(X.fileBase() + '.zip', KZ.zip([{ path: 'index.html', text: pkg.html }].concat(media)), 'application/zip'); }, 'pri']);
    } else btns.push(['index.html 받기', d => { d(null); KZ.offerFile('index.html', html, 'text/html'); }, 'pri']);
    return dialog('내보내기', body, btns);
  }

  // ---------- 내보내기 ----------
  const assetSrc = id => { const a = id && S.assets.find(x => x.id === id && x.type === 'image'); return a ? a.src : ''; };
  function buildSite(startId) {
    return KZ.buildSite({
      pages: X.orderedPages().map(p => { const t = X.treeEnsure()[p.getId()]; return { id: p.getId(), name: pname(p), parent: t.parent || null, menu: t.menu !== false, html: p.getMainComponent().getInnerHTML() }; }),
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
  // 미리보기 안을 누른 뒤에는 키 입력이 미리보기 쪽으로 감 → 거기서도 Esc 로 닫기 (팝업이 열려 있으면 팝업만 닫힘)
  pvFrame.addEventListener('load', () => { try { const w = pvFrame.contentWindow; w.addEventListener('keydown', e => { const ov = w.document.getElementById('rt-ov'); if (e.key === 'Escape' && pv.classList.contains('open') && (!ov || ov.hidden)) $('#pvClose').click(); }); } catch (e) { /* 무시 */ } });

  Object.assign(X, { exportDialog, openPreview });
});
