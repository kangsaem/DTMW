/* 업로드 — 사진 · 영상 올리기(줄이기), 올린 파일 목록, 고른 요소에 적용 · 넣기
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S, attr, isFootTop, up, vids } = X;
  const { $, esc, toast, dialog, confirmDlg } = KZ.ui;

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
  // 파일 종류: 브라우저가 알려 주는 종류(type)가 비어 있는 경우가 있어(윈도우의 webp · heic · avif 등) 확장자로도 판단 (0.16.7)
  const IMG_EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif' };
  const VID_EXT = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg' };
  function kindOfFile(f) {
    const ext = (f.name.match(/\.([a-z0-9]+)$/i) || [])[1]; const e = ext ? ext.toLowerCase() : '';
    if (f.type.startsWith('image/')) return ['image', f.type];
    if (f.type.startsWith('video/')) return ['video', f.type];
    if (IMG_EXT[e]) return ['image', IMG_EXT[e]];
    if (VID_EXT[e]) return ['video', VID_EXT[e]];
    return [null, ''];
  }
  let applyNext = false; // 다음에 올리는 사진을 고른 요소에 바로 적용 (그림을 두 번 눌러 파일을 고를 때)
  function applyNextUpload() { applyNext = true; }
  async function handleFiles(files) {
    let n = 0; const skipped = [];
    for (const f0 of files) {
      const [kind, mime] = kindOfFile(f0);
      const f = f0.type ? f0 : new File([f0], f0.name, { type: mime }); // 종류가 빈 파일은 확장자의 종류로
      const heic = /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type);
      if (!kind) { skipped.push(f.name); continue; }
      try {
        if (kind === 'image') { S.assets.unshift({ id: 'a' + Date.now() + n, type: 'image', name: f.name, src: await resizeImage(f) }); n++; }
        else {
          if (f.size > 40e6) { toast(f.name + ': 40MB가 넘어 올리지 않았습니다. 20MB 이하로 줄여 주세요.'); continue; }
          if (f.size > 20e6) toast('20MB가 넘는 영상은 사이트가 느려질 수 있습니다.');
          S.assets.unshift({ id: 'a' + Date.now() + n, type: 'video', name: f.name, src: await readDataURL(f) }); n++;
        }
      } catch (e) {
        if (heic) await dialog('아이폰 사진(HEIC)', '<p><b>' + esc(f.name) + '</b> 은(는) HEIC 형식이라 이 브라우저에서 열 수 없어 올리지 않았습니다.</p><p class="hint">JPG 로 바꿔 올려 주세요. 아이폰: <b>설정 → 카메라 → 포맷 → 높은 호환성</b> 으로 바꾸면 다음부터 JPG 로 찍힙니다. 이미 찍은 사진은 사진 앱에서 공유 → 사본으로 저장하거나, 메일 · 메신저로 보내면 JPG 로 바뀝니다.</p>', [['확인', true, 'pri']]);
        else toast(f.name + ' 파일을 읽지 못했습니다 (열 수 없는 형식)');
      }
    }
    // 그림을 두 번 눌러 고른 사진이면 그 그림에 바로 적용
    const direct = applyNext; applyNext = false;
    if (n && direct) { renderAssets(); X.save(); const a = S.assets.find(x => x.type === 'image'); if (a && editor.getSelected()) return applyAsset(a); }
    if (n) { renderAssets(); X.save(); toast(n + '개를 올렸습니다. 눌러서 적용하세요' + (skipped.length ? ' (' + skipped.length + '개는 사진 · 영상이 아니라 뺐습니다)' : '')); }
    else if (skipped.length) toast('사진 · 영상만 올릴 수 있습니다 — ' + skipped.slice(0, 3).join(', ') + (skipped.length > 3 ? ' 외 ' + (skipped.length - 3) + '개' : ''));
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
        S.assets = S.assets.filter(x => x !== a); renderAssets(); X.save(); toast('목록에서 지웠습니다');
      };
      b.oncontextmenu = e => { e.preventDefault(); del(); };
      const x = document.createElement('button'); x.className = 'asset-x'; x.textContent = '✕'; x.title = '목록에서 지우기'; x.setAttribute('aria-label', a.name + ' 목록에서 지우기');
      x.onclick = e => { e.stopPropagation(); del(); };
      const w = document.createElement('div'); w.className = 'asset-w'; w.append(b, x);
      box.appendChild(w);
    });
  }
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
      if (sel && sel.is('image')) { sel.set('src', a.src); X.fitPosArt(sel); return toast('이미지를 바꿨습니다'); }
      const hero = up(sel, c => !!attr(c, 'data-bgvideo')), fxm = hero && hero.find('.bgfix-media')[0];
      if (fxm && !fxm.find('img').length) { fxm.components(''); fxm.append({ type: 'image', src: a.src, attributes: { alt: '' } }); return toast('배경 사진을 넣었습니다'); }
      // 히어로(사진 · 영상 배경): 고른 곳이 히어로 안이면 배경 사진으로 — 배경 영상 · 안내 문구는 뺌
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
      toast(X.bgfixVideos() > 2 ? '배경 영상을 넣었습니다 — 고정 영상이 많아 휴대폰이 무거워질 수 있습니다 (페이지당 1~2개 권장)' : '배경 영상을 넣었습니다');
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
  const drop = $('#drop');
  const fileIn = $('#fileIn');
  fileIn.onchange = () => { handleFiles([...fileIn.files]); fileIn.value = ''; };
  drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } };
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => handleFiles([...(e.dataTransfer.files || [])]));

  Object.assign(X, { applyNextUpload, fileIn, insertNear, renderAssets });
});
