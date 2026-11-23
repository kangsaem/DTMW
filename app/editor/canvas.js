/* 편집 화면(캔버스) — 사이트 CSS 넣기, 효과 · 연결 안 된 버튼 표시, 붙여넣기 정리, 블록, 한국어 이름
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S, pname, realPages } = X;
  const { $, toast } = KZ.ui;

  // ---------- 편집 화면(캔버스): 사이트 CSS · 표시 · 블록 ----------
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
    X.orderedPages().forEach(p => {
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
      doc.addEventListener('keydown', X.saveKey, true);
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
  function fxMarkInit() { $('#fxMarkBtn').onclick = () => setFxMark(!fxMark); setFxMark(fxMark); }
  function refreshTheme() { docs.forEach(d => { try { const t = d.getElementById('kz-theme'); if (t) t.textContent = KZ.themeCss(S); else docs.delete(d); } catch (e) { docs.delete(d); } }); }
  // 프레임(페이지 · 기기 전환 때 새로 생김)의 머리 · 본문이 다 만들어진 뒤에 넣음 — 'canvas:frame:load' 때 넣으면 GrapesJS 가 머리를 다시 써서 지워짐
  editor.on('canvas:frame:load:body', ({ window: w }) => injectDoc(w.document));

  // 블록
  KZ.BLOCKS.forEach(([id, label, category, media, content]) => {
    editor.Blocks.add(id, { label, category, media, content: typeof content === 'function' ? content() : content, attributes: { 'data-bid': id } });
  });
  // 블록을 누르기만 해도 넣기 (선택한 요소 아래) — 패널을 창 밖으로 꺼냈을 때 끌어다 놓기 대신
  $('#blocks').addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('.gjs-block'); if (!el) return;
    const b = editor.Blocks.get(el.getAttribute('data-bid')); if (!b) return;
    const c = b.get('content'); X.insertNear(editor.getSelected(), typeof c === 'string' ? c : JSON.parse(JSON.stringify(c)));
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

  Object.assign(X, { fxMarkInit, injectDoc, refreshLinkCss, refreshTheme, unlinkedReport });
});
