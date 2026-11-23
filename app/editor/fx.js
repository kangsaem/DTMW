/* 효과 탭 — 등장 · 마우스 올림 · 스크롤 연출 · 배경 고정
   편집기 조각 — main.js 가 순서대로 실행합니다. X: 조각끼리 함께 쓰는 것(editor · S · 공통 도구 · 다른 조각의 함수) */
KZ.part(function (X) {
  'use strict';
  const { editor, S, attr, hasCls, labelOf, setStyle, vids } = X;
  const { $, $$, esc, toast, confirmDlg, h, field, opts } = KZ.ui;
  const { SPEED, ANIMS, HOVERS, SCROLLS, ENTER_KF } = KZ.C;

  // ---------- 배경 고정 ----------
  const FIX_BAD_ANIM = v => !!v && v !== 'fade';        // 페이드(투명도만)는 함께 써도 됨
  const FIX_BAD_HOVER = v => v === 'lift';
  const FIX_MEDIA = '.bgfix-media,.hero-photo,.hero-video,.hero-bg,.band-img';
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
    const bad = [FIX_BAD_ANIM(attr(sel, 'data-anim')) && labelOf(ANIMS, attr(sel, 'data-anim')), FIX_BAD_HOVER(attr(sel, 'data-hover')) && labelOf(HOVERS, attr(sel, 'data-hover'))].filter(Boolean);
    if (bad.length) {
      if (!await confirmDlg('함께 쓸 수 없는 효과', '배경 고정을 걸면 <b>' + bad.map(esc).join(' · ') + '</b> 효과가 풀립니다 (고정이 풀리는 효과라서). 계속할까요?', '배경 고정')) return renderFx(sel);
      if (FIX_BAD_ANIM(attr(sel, 'data-anim'))) sel.removeAttributes('data-anim');
      if (FIX_BAD_HOVER(attr(sel, 'data-hover'))) sel.removeAttributes('data-hover');
    }
    sel.addAttributes({ 'data-scroll': 'bgfix' });
    toast(bgfixVideos() > 2 ? '배경 고정 영상이 많습니다 — 휴대폰이 무거워질 수 있어 페이지당 1~2개를 권합니다' : '스크롤해도 배경이 제자리에 남습니다 (미리보기에서 확인)');
    renderFx(sel);
  }
  function renderFx(sel) {
    const box = $('#tabFx'); box.innerHTML = '';
    const sec = (t, d) => { box.appendChild(h('h3', { textContent: t, style: 'font-size:12px;color:var(--ui-sub);font-weight:500;margin:16px 0 4px' })); if (d) box.appendChild(h('p', { className: 'hint', textContent: d, style: 'margin:0 0 8px' })); };
    const setA = (k, v) => { if (v) sel.addAttributes({ [k]: v }); else sel.removeAttributes(k); };
    // 배경 고정과 함께 쓰면 고정이 풀리는 효과 (요소 자체에 transform · clip-path)
    const isFix = attr(sel, 'data-scroll') === 'bgfix';
    const mark = (boxEl, list, bad) => { if (!isFix) return; $$('button', boxEl).forEach((b, i) => { if (bad(list[i][0])) { b.classList.add('fx-off'); b.title = '배경 고정과 함께 쓰면 고정이 풀립니다'; } }); };
    const unfix = async (what, then) => {
      if (await confirmDlg('배경 고정이 풀립니다', '<b>' + esc(what) + '</b> 효과를 걸면 이 요소의 배경 고정이 풀립니다. 바꿀까요?', '바꾸기')) { sel.removeAttributes('data-scroll'); then(); toast('배경 고정을 풀었습니다'); }
      renderFx(sel);
    };
    sec('스크롤 등장', '화면에 들어올 때 재생');
    if (isFix) box.appendChild(h('p', { className: 'hint fx-fixnote', textContent: '배경 고정 중 — 흐린 효과는 함께 쓸 수 없습니다 (안쪽 글 · 버튼에는 가능)' }));
    const animBox = opts(ANIMS, attr(sel, 'data-anim'), v => {
      if (isFix && FIX_BAD_ANIM(v)) return unfix(labelOf(ANIMS, v), () => { setA('data-anim', v); replay(sel); });
      setA('data-anim', v); if (v) replay(sel);
    });
    mark(animBox, ANIMS, FIX_BAD_ANIM); box.appendChild(animBox);
    const rp = h('button', { className: 'btn full', textContent: '▶ 다시 재생', style: 'margin-top:8px' }); rp.onclick = () => replay(sel); box.appendChild(rp);
    sec('마우스 올림');
    const hoverBox = opts(HOVERS, attr(sel, 'data-hover'), v => {
      if (isFix && FIX_BAD_HOVER(v)) return unfix(labelOf(HOVERS, v), () => setA('data-hover', v));
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
    if (isFix && hasCls(sel, 'bgfix')) {
      box.appendChild(h('div', { style: 'height:8px' }));
      box.appendChild(field('창 높이', opts([['100', '화면 100%'], ['70', '70%'], ['50', '50%']], attr(sel, 'data-h') || '100', v => sel.addAttributes({ 'data-h': v }))));
      box.appendChild(field('어둡게 덮기', opts([['0', '없음'], ['18', '약하게'], ['35', '보통'], ['55', '진하게']], attr(sel, 'data-dim') || '18', v => sel.addAttributes({ 'data-dim': v }))));
    }
    if (isFix) box.appendChild(h('p', { className: 'hint', textContent: '사진 · 영상은 업로드 탭에서 이 영역을 선택한 채 누르면 바뀝니다. 정확한 모양은 미리보기에서 확인하세요.', style: 'margin-top:8px' }));
    sec('누르면');
    box.appendChild(X.actionBox(sel));
    const pv = h('button', { className: 'btn pri full', textContent: '미리보기에서 확인', style: 'margin-top:18px' }); pv.onclick = () => X.openPreview(); box.appendChild(pv);
  }
  function replay(sel) {
    const el = sel.getEl(), a = attr(sel, 'data-anim'); if (!el || !el.animate) return;
    const kf = ENTER_KF[a]; if (!kf) return toast('등장 효과를 먼저 고르세요');
    el.animate(kf, { duration: SPEED[S.speed] * 1.3, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }

  Object.assign(X, { bgfixVideos, renderFx });
});
