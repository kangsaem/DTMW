// 기본 점검: 편집기가 열리는지, 세트 · 레이아웃 · 미리보기 · 내보내기 · 작업 파일이 동작하는지 확인합니다.
const { test, expect } = require('@playwright/test');

async function open(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.__kzEditor && document.getElementById('status').textContent !== '불러오는 중…', null, { timeout: 30000 });
  return errors;
}

test('편집기가 열리고 기본 세트가 적용된다', async ({ page }) => {
  const errors = await open(page);
  const info = await page.evaluate(() => {
    const e = window.__kzEditor;
    return { pages: e.Pages.getAll().map(p => p.getId()), layouts: KZ.layoutOrder.length, tpl: document.querySelectorAll('.tpl').length, css: !!e.Canvas.getDocument().getElementById('kz-base'), ver: document.getElementById('ver').textContent };
  });
  expect(info.pages).toEqual(['home', 'gallery', 'detail', 'news', 'journal', 'about', 'effects']);
  expect(info.layouts).toBeGreaterThanOrEqual(14);
  expect(info.tpl).toBe(info.layouts);
  expect(info.css).toBe(true);
  expect(info.ver).toMatch(/^v\d+\.\d+\.\d+$/);
  expect(errors).toEqual([]);
});

test('모든 레이아웃과 세트가 오류 없이 만들어진다', async ({ page }) => {
  const errors = await open(page);
  const bad = await page.evaluate(() => {
    const out = [];
    KZ.layoutOrder.forEach(id => { try { const h = KZ.layouts[id].html(); if (!h || h.length < 50) out.push(id); } catch (e) { out.push(id + ': ' + e.message); } });
    Object.values(KZ.sets).forEach(s => s.pages.forEach(p => { if (!KZ.layouts[p[2]]) out.push('set ' + s.id + ' → ' + p[2]); }));
    return out;
  });
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});

test('사이트 세트를 다시 적용하면 기본 페이지로 돌아간다', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.__kzEditor.Pages.add({ id: 'extra', name: '추가', component: '<p>x</p>' }); });
  await page.click('#setsFold');
  await page.locator('.set', { hasText: '기본 사이트' }).click();
  await page.locator('#dlgF button', { hasText: '적용' }).click();
  await expect.poll(() => page.evaluate(() => window.__kzEditor.Pages.getAll().map(p => p.getId()).join(','))).toBe('home,gallery,detail,news,journal,about,effects');
});

test('미리보기에서 페이지 이동과 팝업이 작동한다', async ({ page }) => {
  await open(page);
  await page.click('#previewBtn');
  const fr = page.frameLocator('#pvFrame');
  await fr.locator('.rt-page:not([hidden]) .nav a[href="#gallery"]').first().click();
  await expect(fr.locator('.rt-page[data-page="gallery"]')).toBeVisible();
  await fr.locator('.rt-page:not([hidden]) figure.work').first().click();
  await expect(fr.locator('#rt-ov')).toBeVisible();
});

test('내보낸 HTML에 모든 페이지와 런타임이 들어 있다', async ({ page }) => {
  await open(page);
  const html = await page.evaluate(() => {
    const e = window.__kzEditor;
    return KZ.buildSite({ pages: e.Pages.getAll().map(p => ({ id: p.getId(), name: p.get('name'), html: p.getMainComponent().getInnerHTML() })), css: e.getCss({ keepUnusedStyles: true }), S: KZ.C.DEFAULT_S() });
  });
  expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  expect((html.match(/class="rt-page"/g) || []).length).toBe(7);
  expect(html).toContain('id="rt-meta"');
  expect(html).toContain('IntersectionObserver');
});

test('작업 파일 형식이 읽히고 옛 형식도 변환된다', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const e = window.__kzEditor;
    const packed = KZ.store.pack(KZ.C.DEFAULT_S(), e.getProjectData());
    const a = KZ.store.migrate(JSON.parse(JSON.stringify(packed)));
    const old = KZ.store.migrate({ v: 1, S: {}, gjs: e.getProjectData() }); // 0.1 시제품 저장본
    let refused = false; try { KZ.store.migrate({ kind: 'other', gjs: {} }); } catch (x) { refused = true; }
    return [a.v, old.kind, refused];
  });
  expect(r).toEqual([1, 'kz-editor', true]);
});

test('기본 문구에 특정 업종 단어가 남아 있지 않다', async ({ page }) => {
  await open(page);
  const found = await page.evaluate(() => {
    const words = ['작가', '작품', '전시', '개인전', '단체전', '평론', 'Exhibitions'];
    const all = KZ.layoutOrder.map(id => KZ.layouts[id].html()).join('\n') + KZ.BLOCKS.map(b => typeof b[4] === 'function' ? b[4]() : (typeof b[4] === 'string' ? b[4] : '')).join('\n');
    return words.filter(w => all.includes(w));
  });
  expect(found).toEqual([]);
});

test('레이아웃에 내용 데이터를 넣을 수 있다 (세트용)', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => [KZ.layouts.t5.html({ title: '테스트 제목', items: [['가', '나', 1, '다']] }), KZ.layouts.t5.html()]);
  expect(r[0]).toContain('테스트 제목');
  expect(r[1]).not.toContain('테스트 제목');
});

test('모든 세트: 페이지 링크가 실제 페이지로 이어지고 스타일이 올바르다', async ({ page }) => {
  await open(page);
  const problems = await page.evaluate(() => {
    const out = [];
    KZ.setOrder.forEach(id => {
      const s = KZ.sets[id], ids = s.pages.map(p => p[0]);
      if (new Set(ids).size !== ids.length) out.push(id + ': 주소 중복');
      if (s.style && !KZ.C.THEMES[s.style.theme]) out.push(id + ': 없는 테마 ' + s.style.theme);
      if (s.style && !KZ.C.FONTS[s.style.font]) out.push(id + ': 없는 글꼴 ' + s.style.font);
      s.pages.forEach(p => {
        const html = KZ.setPageHtml(s, p);
        (html.match(/href="#([a-z0-9-]+)"/g) || []).map(m => m.slice(7, -1)).forEach(h => { if (!ids.includes(h)) out.push(id + '/' + p[0] + ': #' + h + ' 페이지 없음'); });
      });
    });
    return [...new Set(out)];
  });
  expect(problems).toEqual([]);
});

test('세트를 적용하면 테마와 글꼴도 바뀐다', async ({ page }) => {
  await open(page);
  await page.click('#setsFold');
  await page.locator('.set', { hasText: '카페' }).click();
  await page.locator('#dlgF button', { hasText: '적용' }).click();
  await expect.poll(() => page.evaluate(() => window.__kzEditor.Pages.getAll().map(p => p.getId()).join(','))).toBe('home,gallery,news,about');
  // 세트를 바꾸면 편집 화면이 다시 그려지는 동안 테마 스타일이 잠깐 없을 수 있어 기다림
  await expect.poll(() => page.evaluate(() => { const t = window.__kzEditor.Canvas.getDocument().getElementById('kz-theme'); return t ? t.textContent.includes('#EDE6D9') : false; })).toBe(true);
  const css = await page.evaluate(() => window.__kzEditor.Canvas.getDocument().getElementById('kz-theme').textContent);
  expect(css).toContain('#EDE6D9');
  expect(css).toContain('Gowun Batang');
});

test('가림막(mask) 등장 효과가 실제로 나타난다', async ({ page }) => {
  await open(page);
  await page.click('#previewBtn');
  const fr = page.frameLocator('#pvFrame');
  await fr.locator('.rt-page:not([hidden]) .nav a[href="#journal"]').first().click();
  await expect(fr.locator('.rt-page[data-page="journal"] .ed-fig')).toHaveClass(/\bin\b/, { timeout: 5000 });
});

test('레이아웃 이미지는 회색 빈칸이 아닌 샘플 이미지다', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const all = KZ.layoutOrder.map(id => KZ.layouts[id].html()).join('\n');
    return { gray: /%23CFCBC3|%23BDB8AE|%23D8D4CC/.test(all), count: KZ.sampleCount, distinct: new Set(Array.from({ length: KZ.sampleCount }, (_, i) => KZ.sample(i, 600, 400))).size };
  });
  expect(r.gray).toBe(false);
  expect(r.count).toBeGreaterThanOrEqual(12);
  expect(r.distinct).toBe(r.count);
});

test('페이지 트리: 하위 페이지가 메뉴 드롭다운과 내보낸 메뉴에 들어간다', async ({ page }) => {
  const errors = await open(page);
  const r = await page.evaluate(() => {
    const e = window.__kzEditor, k = window.__kz;
    const order = k.orderedPages().map(p => p.getId());
    const html = e.Pages.get('home').getMainComponent().getInnerHTML();
    const sel = [...document.querySelectorAll('#pageSel option')].map(o => o.value);
    const strip = document.querySelectorAll('#pageStrip .ps:not(.add)').length;
    return { order, parent: k.S.tree.detail.parent, dropdown: /nav-item[^]*nav-sub[^]*#detail/.test(html), sel, strip };
  });
  expect(r.parent).toBe('gallery');
  expect(r.order.indexOf('detail')).toBe(r.order.indexOf('gallery') + 1);
  expect(r.dropdown).toBe(true);
  expect(r.sel.length).toBe(7);
  expect(r.strip).toBe(7);
  // 옮기기: 소개를 소식 아래로
  const after = await page.evaluate(() => { const k = window.__kz; k.movePage('about', 'news', 'inside'); return { p: k.S.tree.about.parent, html: window.__kzEditor.Pages.get('home').getMainComponent().getInnerHTML() }; });
  expect(after.p).toBe('news');
  expect(after.html).toMatch(/nav-sub[^]*#about/);
  expect(errors).toEqual([]);
});

test('위쪽 페이지 선택으로 이동하고 패널 떼기 · 도구 숨기기가 된다', async ({ page }) => {
  const errors = await open(page);
  await page.selectOption('#pageSel', 'about');
  expect(await page.evaluate(() => window.__kzEditor.Pages.getSelected().getId())).toBe('about');
  await expect(page.locator('#stageTitle')).toContainText('소개');
  await page.click('[data-detach="side"]');
  await expect(page.locator('#side')).toHaveClass(/floating/);
  await page.click('[data-detach="side"]');
  await expect(page.locator('#side')).not.toHaveClass(/floating/);
  await page.click('#zenBtn');
  await expect(page.locator('.app')).toHaveClass(/zen/);
  await expect(page.locator('#side')).toBeHidden();
  await page.click('#zenBtn');
  await expect(page.locator('#side')).toBeVisible();
  expect(errors).toEqual([]);
});

test('패널을 떼어내도 편집 화면이 그대로 보인다', async ({ page }) => {
  const errors = await open(page);
  const w0 = await page.locator('.stage').boundingBox();
  for (const n of ['drawer', 'side']) {
    await page.click(`[data-detach="${n}"]`);
    const b = await page.locator('.stage').boundingBox();
    expect(b.width).toBeGreaterThanOrEqual(w0.width);
    await expect(page.locator('#gjs')).toBeVisible();
  }
  const sb = await page.locator('.stage').boundingBox();
  expect(sb.x).toBeLessThan(80);
  // 떠 있는 창이 화면 안에 보여야 함
  const vw = page.viewportSize().width;
  for (const id of ['#drawer', '#side']) {
    const b = await page.locator(id).boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(vw);
  }
  await page.reload();
  await page.waitForFunction(() => window.__kzEditor && document.getElementById('status').textContent !== '불러오는 중…');
  const b2 = await page.locator('#side').boundingBox();
  expect(b2.x + b2.width).toBeLessThanOrEqual(vw);
  expect(errors).toEqual([]);
});

test('편집기 파일 주소의 ?v= 가 현재 버전과 같다', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => ({ v: KZ.VERSION, urls: [...document.querySelectorAll('script[src],link[rel=stylesheet][href]')].map(e => e.getAttribute('src') || e.getAttribute('href')).filter(u => !/^(https?:|data:|vendor\/)/.test(u)) }));
  expect(r.urls.length).toBeGreaterThan(30);
  for (const u of r.urls) expect(u).toContain('?v=' + r.v);
});

// ---------- 0.7.0 ----------
test('레이아웃을 섹션으로 붙이면 메뉴 · 바닥글 없이 바닥글 위에 들어간다', async ({ page }) => {
  const errors = await open(page);
  const r = await page.evaluate(() => {
    const out = {};
    KZ.layoutOrder.forEach(id => { const s = KZ.sectionHtml(id); if (/class="nav[ "]|class="foot"/.test(s) || s.length < 30) out[id] = 'bad'; });
    return out;
  });
  expect(r).toEqual({});
  await page.selectOption('#pageSel', 'about');
  await page.locator('.tpl').nth(2).click();
  await page.locator('#dlgF button', { hasText: '섹션으로 추가' }).click();
  const order = await page.evaluate(() => window.__kzEditor.getWrapper().components().map(c => (c.get('tagName') || '') + '.' + (c.getClasses()[0] || '')));
  expect(order[0]).toBe('header.nav');
  expect(order[order.length - 1]).toBe('footer.foot');
  expect(order.length).toBeGreaterThanOrEqual(4);
  expect(order.filter(x => x === 'header.nav').length).toBe(1);
  // 섹션 위로: 선택한 새 섹션이 한 칸 올라가고, 메뉴 위로는 못 간다
  const idx = await page.evaluate(() => { const e = window.__kzEditor; const s = e.getSelected(); return s.index(); });
  await page.locator('.sec-acts button', { hasText: '섹션 위로' }).click();
  const idx2 = await page.evaluate(() => window.__kzEditor.getSelected().index());
  expect(idx2).toBe(idx - 1);
  for (let i = 0; i < 5; i++) await page.locator('.sec-acts button', { hasText: '섹션 위로' }).click();
  expect(await page.evaluate(() => window.__kzEditor.getSelected().index())).toBe(1);
  expect(errors).toEqual([]);
});

test('누르면 → 페이지 이동: 미리보기에서 다른 페이지로 간다', async ({ page }) => {
  const errors = await open(page);
  await page.evaluate(() => {
    const e = window.__kzEditor; e.Pages.select('home');
    e.getWrapper().append('<div class="go-test" data-click="go" data-go="#about" style="padding:40px">이동</div>', { at: 1 });
  });
  await page.click('#previewBtn');
  const fr = page.frameLocator('#pvFrame');
  await fr.locator('.rt-page:not([hidden]) .go-test').click();
  await expect(fr.locator('.rt-page[data-page="about"]')).toBeVisible();
  await expect(fr.locator('#rt-ov')).toBeHidden();
  expect(errors).toEqual([]);
});

test('효과 탭에서 페이지 이동을 고르면 페이지 목록이 나오고 값이 저장된다', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { const e = window.__kzEditor; e.select(e.getWrapper().find('figure.work')[0]); });
  await page.click('.tabs button[data-tab="fx"]');
  await page.locator('#tabFx .opts button', { hasText: '페이지 이동' }).click();
  await page.locator('#tabFx select').first().selectOption('#about');
  const a = await page.evaluate(() => window.__kzEditor.getSelected().getAttributes());
  expect(a['data-click']).toBe('go');
  expect(a['data-go']).toBe('#about');
});

test('효과 표시는 편집 화면에만 있고 끌 수 있다', async ({ page }) => {
  await open(page);
  const on = await page.evaluate(() => window.__kzEditor.Canvas.getDocument().documentElement.classList.contains('kz-fx'));
  expect(on).toBe(true);
  await page.click('#fxMarkBtn');
  expect(await page.evaluate(() => window.__kzEditor.Canvas.getDocument().documentElement.classList.contains('kz-fx'))).toBe(false);
  const html = await page.evaluate(() => { const e = window.__kzEditor; return KZ.buildSite({ pages: [{ id: 'a', name: 'a', html: '<p>x</p>' }], css: '', S: KZ.C.DEFAULT_S() }); });
  expect(html).not.toContain('kz-fx');
});

test('고친 뒤 작업 파일을 받지 않으면 미저장 표시가 뜨고, 받으면 사라진다', async ({ page }) => {
  await open(page);
  await expect(page.locator('#fileWarn')).toBeHidden();
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__kzEditor.getWrapper().append('<p>변경</p>'); });
  await expect(page.locator('#fileWarn')).toBeVisible();
  const dl = page.waitForEvent('download');
  await page.click('#fileWarn');
  await dl;
  await expect(page.locator('#fileWarn')).toBeHidden();
});

// ---------- 0.8.0 ----------
test('섹션 레이아웃 10종이 등록되고 가짜 수치 없이 자리표시만 쓴다', async ({ page }) => {
  const errors = await open(page);
  const r = await page.evaluate(() => {
    const ids = ['pricing', 'menuboard', 'faq', 'team', 'stats', 'events', 'location', 'contact', 'reviews', 'cta'];
    const missing = ids.filter(id => !KZ.layouts[id] || KZ.layouts[id].cat !== '섹션');
    const digits = [];
    ids.forEach(id => {
      if (!KZ.layouts[id]) return;
      const t = document.createElement('template'); t.innerHTML = KZ.sectionHtml(id);
      const text = t.content.textContent.replace(/\[[^\]]*\]/g, '');
      if (/\d/.test(text)) digits.push(id + ': ' + text.match(/.{0,12}\d.{0,12}/)[0]);
    });
    return { missing, digits };
  });
  expect(r.missing).toEqual([]);
  expect(r.digits).toEqual([]);
  expect(errors).toEqual([]);
});

test('세트 페이지에 섹션을 이어 붙이면 바닥글 위에 들어간다', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const out = [];
    KZ.setOrder.forEach(id => KZ.sets[id].pages.forEach(p => {
      const add = (p[4] && p[4].add) || []; if (!add.length) return;
      const html = KZ.setPageHtml(KZ.sets[id], p);
      const foot = html.lastIndexOf('<footer class="foot"');
      // 바닥글이 있는 레이아웃이면 하나뿐이고 맨 끝이어야 함 (타이포 히어로처럼 바닥글 없는 레이아웃은 맨 끝에 붙음)
      if (foot >= 0 && (html.indexOf('<footer class="foot"') !== foot || !/<\/footer>\s*$/.test(html))) out.push(id + '/' + p[0] + ': 바닥글');
      if ((html.match(/<header class="nav/g) || []).length > 1) out.push(id + '/' + p[0] + ': 메뉴 중복');
      add.forEach(a => { const lid = Array.isArray(a) ? a[0] : a; if (!KZ.layouts[lid]) out.push(id + ': ' + lid + ' 없음'); });
    }));
    return { out, sets: KZ.setOrder.length, cafe: KZ.setPageHtml(KZ.sets.cafe, KZ.sets.cafe.pages[1]).includes('class="mb"') };
  });
  expect(r.out).toEqual([]);
  expect(r.sets).toBeGreaterThanOrEqual(11);
  expect(r.cafe).toBe(true);
});

test('새 세트(숙소 · 비영리 · 동네 가게)가 적용되고 미리보기에서 열린다', async ({ page }) => {
  const errors = await open(page);
  await page.click('#setsFold');
  for (const [name, first] of [['숙소', 'home'], ['비영리', 'home'], ['동네 가게', 'home']]) {
    await page.locator('.set', { hasText: name }).click();
    await page.locator('#dlgF button', { hasText: '적용' }).click();
    await expect.poll(() => page.evaluate(() => window.__kzEditor.Pages.getSelected().getId())).toBe(first);
  }
  await page.click('#previewBtn');
  const fr = page.frameLocator('#pvFrame');
  await fr.locator('.rt-page:not([hidden]) .nav a[href="#about"]').first().click();
  await expect(fr.locator('.rt-page[data-page="about"] .loc')).toBeVisible();
  expect(errors).toEqual([]);
});

// ---------- 0.9.0 ----------
test('색 테마 12종 모두 글자 · 버튼 명암 대비가 4.5:1 이상이다', async ({ page }) => {
  await open(page);
  const bad = await page.evaluate(() => {
    const L = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const out = [];
    Object.entries(KZ.C.THEMES).forEach(([k, t]) => {
      if (cr(t.ink, t.bg) < 4.5) out.push(k + ' 글자');
      if (cr(t.sub, t.bg) < 4.5) out.push(k + ' 보조 글자');
      if (cr(t.bg, t.accent) < 4.5) out.push(k + ' 버튼');
    });
    return { out, n: Object.keys(KZ.C.THEMES).length };
  });
  expect(bad.out).toEqual([]);
  expect(bad.n).toBeGreaterThanOrEqual(12);
});

test('내보낸 사이트에는 실제로 쓴 글꼴만 들어가고, 헬베티카풍 글꼴은 파일 안에 담긴다', async ({ page }) => {
  const errors = await open(page);
  const r = await page.evaluate(() => {
    const e = window.__kzEditor, pages = e.Pages.getAll().map(p => ({ id: p.getId(), name: p.get('name'), html: p.getMainComponent().getInnerHTML() }));
    const a = KZ.buildSite({ pages, css: '', S: Object.assign(KZ.C.DEFAULT_S(), { font: 'serif' }) });
    const b = KZ.buildSite({ pages, css: '', S: Object.assign(KZ.C.DEFAULT_S(), { font: 'heros' }) });
    const c = KZ.buildSite({ pages, css: '', S: Object.assign(KZ.C.DEFAULT_S(), { font: 'exhibit' }) });
    return {
      cFig: c.includes('family=Figtree'), cPop: c.includes('family=Poppins'), cFx: c.includes('--fx:Poppins'),
      aSerif: a.includes('Noto+Serif+KR'), aPret: a.includes('pretendard'), aHeros: a.includes('WMW Heros'),
      bHeros: /@font-face\{font-family:'WMW Heros';src:url\(data:font\/woff2;base64,/.test(b), bPret: b.includes('pretendardvariable-dynamic-subset'), bSerif: b.includes('Noto+Serif+KR'),
      loaded: Object.keys(KZ.site.fonts).sort(), fonts: Object.keys(KZ.C.FONTS).length,
      canvas: !!e.Canvas.getDocument().querySelector('link[href*="pretendard"]')
    };
  });
  expect(r).toMatchObject({ aSerif: true, aPret: false, aHeros: false, bHeros: true, bPret: true, bSerif: false, canvas: true, cFig: true, cPop: true, cFx: true });
  expect(r.loaded).toEqual(['wmw-heros-bold', 'wmw-heros-regular']);
  expect(r.fonts).toBe(11);
  expect(errors).toEqual([]);
});

// ---------- 0.9.1 ----------
test('페이지를 복제해도 요소별 스타일(히어로 배경 그림)이 남는다', async ({ page }) => {
  const errors = await open(page);
  await page.click('.rail button[data-pane="pg"]');
  await page.locator('.pg', { has: page.locator('code', { hasText: '#home' }) }).locator('button[aria-label="복제"]').click();
  const r = await page.evaluate(() => {
    const e = window.__kzEditor;
    const info = c => { const m = c.getInnerHTML().match(/class="hero-photo" id="([^"]+)"/); if (!m) return null; const r = e.Css.getRule('#' + m[1]); return { id: m[1], bg: !!(r && r.getStyle()['background-image']) }; };
    return { src: info(e.Pages.get('home').getMainComponent()), copy: info(e.Pages.getSelected().getMainComponent()), sel: e.Pages.getSelected().getId() };
  });
  expect(r.sel).toBe('home-copy');
  expect(r.src.bg).toBe(true);
  expect(r.copy.bg).toBe(true);
  expect(r.copy.id).not.toBe(r.src.id);
  expect(errors).toEqual([]);
});

// ---------- 0.10.0 ----------
async function addFakePhoto(page) {
  await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 40; c.height = 30; const g = c.getContext('2d'); g.fillStyle = '#c0392b'; g.fillRect(0, 0, 40, 30);
    const src = c.toDataURL('image/png'), e = window.__kzEditor, S = window.__kz.S;
    S.assets.unshift({ id: 'a-test', type: 'image', name: '가게 사진 1.PNG', src });
    e.Pages.select('home'); const img = e.getWrapper().find('img')[0]; img.set('src', src);
  });
}

test('히어로 안내 문구는 편집 화면에만 보이고 미리보기에서는 숨겨진다', async ({ page }) => {
  await open(page);
  const inCanvas = await page.evaluate(() => { const el = window.__kzEditor.Canvas.getDocument().querySelector('.hero-note'); return el && getComputedStyle(el).display; });
  expect(inCanvas).not.toBe('none');
  await page.click('#previewBtn');
  await expect(page.frameLocator('#pvFrame').locator('.rt-page:not([hidden]) .hero-note')).toBeHidden();
});

test('올린 사진이 있으면 ZIP(index.html + media/)으로 받고, 없으면 index.html 하나다', async ({ page }) => {
  await open(page);
  await page.click('#publishBtn');
  await expect(page.locator('#dlgF button', { hasText: 'index.html 받기' })).toBeVisible();
  await expect(page.locator('#dlgF button', { hasText: 'ZIP' })).toHaveCount(0);
  await page.locator('#dlgF button', { hasText: '닫기' }).click();
  await addFakePhoto(page);
  await page.click('#publishBtn');
  await expect(page.locator('#dlgB')).toContainText('1개');
  const dl = page.waitForEvent('download');
  await page.locator('#dlgF button', { hasText: 'ZIP 받기' }).click();
  const d = await dl; const buf = require('fs').readFileSync(await d.path());
  // ZIP 구조 읽기 (무압축)
  const files = {}; let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const size = buf.readUInt32LE(p + 18), nl = buf.readUInt16LE(p + 26), xl = buf.readUInt16LE(p + 28);
    const name = buf.slice(p + 30, p + 30 + nl).toString('utf8'); files[name] = buf.slice(p + 30 + nl + xl, p + 30 + nl + xl + size); p += 30 + nl + xl + size;
  }
  expect(Object.keys(files).sort()).toEqual(['index.html', 'media/photo-1.png']);
  const media = 'media/photo-1.png';
  const html = files['index.html'].toString('utf8');
  expect(html).toContain('src="' + media + '"');
  expect(html).not.toContain('data:image/png');
  expect(files[media].slice(1, 4).toString()).toBe('PNG');
  expect(buf.readUInt32LE(buf.length - 22)).toBe(0x06054b50);
});

test('연결 안 된 버튼은 편집 화면에 빨간 점선, 내보내기 창에서 개수를 알려 준다 · 25MB 경고', async ({ page }) => {
  await open(page);
  await page.selectOption('#pageSel', 'about');
  await expect.poll(() => page.evaluate(() => { const d = window.__kzEditor.Canvas.getDocument(); const el = d.querySelector('a.ct-i[href="#"]'); return el && getComputedStyle(el).outlineColor; }), { timeout: 5000 }).toBe('rgb(229, 72, 77)');
  await addFakePhoto(page);
  await page.evaluate(() => { KZ.GH_LIMIT = 10; });
  await page.click('#publishBtn');
  await expect(page.locator('#dlgB')).toContainText('연결 안 된 버튼');
  await expect(page.locator('#dlgB')).toContainText('25MB가 넘는 파일');
});

test('링크 빠른 입력: 전화를 고르면 tel: 이 채워지고 저장된다', async ({ page }) => {
  await open(page);
  await page.selectOption('#pageSel', 'about');
  await page.evaluate(() => { const e = window.__kzEditor; e.select(e.getWrapper().find('a.btn-line')[0]); });
  const url = page.locator('#tabDesign input[placeholder^="https://"]');
  await page.locator('#tabDesign select').filter({ hasText: '빠른 입력' }).selectOption('tel:');
  await expect(url).toHaveValue('tel:');
  await url.type('01012345678'); await url.press('Enter');
  expect(await page.evaluate(() => window.__kzEditor.getSelected().getAttributes().href)).toBe('tel:01012345678');
});

test('GitHub 안내 페이지가 열리고 편집기에서 연결된다', async ({ page }) => {
  await page.goto('/guide/');
  await expect(page.locator('h1')).toContainText('GitHub');
  for (const id of ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7']) await expect(page.locator('#' + id)).toHaveCount(1);
  await open(page);
  expect(await page.locator('#fileMenu a[href="guide/"]').count()).toBe(1);
});

// ---------- 0.11.0 ----------
test('디자인 패널을 창 밖(팝업)으로 꺼내도 선택 · 수정이 되고, 창을 닫으면 제자리로 돌아온다', async ({ page }) => {
  const errors = await open(page);
  const w0 = (await page.locator('.stage').boundingBox()).width;
  await page.evaluate(() => { KZ.forcePopup = true; });
  const [pop] = await Promise.all([page.waitForEvent('popup'), page.click('[data-popout="side"]')]);
  await expect(pop.locator('#side')).toHaveCount(1);
  await expect(page.locator('.main #side')).toHaveCount(0);
  expect((await page.locator('.stage').boundingBox()).width).toBeGreaterThan(w0);
  // 편집기에서 고르면 바깥 창 패널이 바뀌고, 바깥 창에서 고치면 편집기에 반영
  await page.evaluate(() => { const e = window.__kzEditor; e.select(e.getWrapper().find('h1')[0]); });
  await expect(pop.locator('#sideBody')).toBeVisible();
  await expect(pop.locator('#selName')).toContainText('큰 제목');
  await pop.locator('#tabDesign .seg button', { hasText: '가운데' }).first().click();
  expect(await page.evaluate(() => { const e = window.__kzEditor, s = e.getSelected(); const r = e.Css.getRule('#' + s.getId()); return r && r.getStyle()['text-align']; })).toBe('center');
  // 효과 탭 전환도 바깥 창 안에서
  await pop.locator('.tabs button[data-tab="fx"]').click();
  await expect(pop.locator('#tabFx')).toBeVisible();
  await pop.close();
  await expect(page.locator('.main #side')).toHaveCount(1);
  await expect(page.locator('[data-popout="side"]')).toHaveText('↗');
  expect(errors).toEqual([]);
});

test('도구 패널을 창 밖으로 꺼내면 왼쪽 아이콘으로 탭을 바꿀 수 있다', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { KZ.forcePopup = true; });
  const [pop] = await Promise.all([page.waitForEvent('popup'), page.click('[data-popout="drawer"]')]);
  await page.click('.rail button[data-pane="site"]');
  await expect(pop.locator('.pane[data-pane="site"]')).toBeVisible();
  await expect(pop.locator('#drawerTitle')).toHaveText('사이트');
  await page.click('.rail button[data-pane="site"]'); // 같은 탭을 다시 눌러도 바깥 창은 그대로
  await expect(pop.locator('.pane[data-pane="site"]')).toBeVisible();
  await pop.locator('[data-popout="drawer"]').click(); // ⇲ 로 되돌리기
  await expect(page.locator('.main #drawer')).toHaveCount(1);
});

test('요소 탭의 블록을 누르면 선택한 요소 아래에 들어간다 (창 밖 패널에서도)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { KZ.forcePopup = true; const e = window.__kzEditor; e.select(e.getWrapper().find('h1')[0]); });
  const [pop] = await Promise.all([page.waitForEvent('popup'), page.click('[data-popout="drawer"]')]);
  await page.click('.rail button[data-pane="el"]');
  const n0 = await page.evaluate(() => window.__kzEditor.getWrapper().find('.body-p').length);
  await pop.locator('#blocks .gjs-block[data-bid="b-p"]').click();
  expect(await page.evaluate(() => window.__kzEditor.getWrapper().find('.body-p').length)).toBe(n0 + 1);
  expect(await page.evaluate(() => window.__kzEditor.getSelected().getClasses())).toContain('body-p');
});

// ---------- 0.12.0 작업 손실 방지 ----------
test('저장본을 열지 못하면 덮어쓰지 않고 백업으로 남기고 알린다', async ({ page }) => {
  await open(page);
  await page.waitForTimeout(2000); // 시작 직후 한 번 더 일어나는 자동 저장을 기다림
  await page.waitForFunction(() => !KZ.tabState().pending);
  await page.evaluate(async () => { const d = KZ.store.pack({}, window.__kzEditor.getProjectData()); d.v = 99; d.marker = 'MINE'; await KZ.store.DB.set('project', d); });
  await page.reload();
  await page.waitForFunction(() => window.__kzEditor && document.getElementById('status').textContent !== '불러오는 중…');
  await expect(page.locator('#dlgT')).toHaveText('저장된 작업을 열지 못했습니다');
  await expect(page.locator('#dlgF button', { hasText: '원래 저장본 받기' })).toBeVisible();
  const backup = await page.evaluate(() => new Promise(res => { const r = indexedDB.open('kz-editor', 1); r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').getAllKeys(); q.onsuccess = async () => { const k = q.result.find(x => String(x).startsWith('backup-')); res(k ? (await KZ.store.DB.get(k)).marker : null); }; }; }));
  expect(backup).toBe('MINE');
});

test('세트 적용 창은 되돌릴 수 없다고 알리고 작업 파일을 먼저 받을 수 있다', async ({ page }) => {
  await open(page);
  await expect(page.locator('.pane[data-pane="tpl"] .hint').first()).not.toContainText('언제든');
  await page.click('#setsFold');
  await page.locator('.set', { hasText: '카페' }).click();
  await expect(page.locator('#dlgB')).toContainText('되돌릴 수 없습니다');
  const dl = page.waitForEvent('download');
  await page.locator('#dlgF button', { hasText: '작업 파일 받고 진행' }).click();
  expect((await dl).suggestedFilename()).toMatch(/-project\.json$/);
  await expect.poll(() => page.evaluate(() => window.__kzEditor.Pages.getAll().map(p => p.getId()).join(','))).toBe('home,gallery,news,about');
});

test('다른 탭에서 편집기를 열면 먼저 연 탭은 저장을 멈추고 알린다', async ({ page, context }) => {
  await open(page);
  const p2 = await context.newPage(); await open(p2);
  await expect.poll(() => page.evaluate(() => KZ.tabState().passive)).toBe(true);
  expect(await p2.evaluate(() => KZ.tabState().passive)).toBe(false);
  await expect(page.locator('#dlgT')).toHaveText('다른 탭에서 편집기를 열었습니다');
  await page.evaluate(() => { window.__kzEditor.getWrapper().find('h1')[0].components('OLD-TAB'); });
  await p2.evaluate(() => { window.__kzEditor.getWrapper().find('h1')[0].components('NEW-TAB'); });
  await p2.waitForTimeout(1500);
  const saved = await p2.evaluate(async () => JSON.stringify((await KZ.store.DB.get('project')).gjs));
  expect(saved).toContain('NEW-TAB'); expect(saved).not.toContain('OLD-TAB');
});

test('고친 직후 바로 새로고침해도 마지막 수정이 남는다', async ({ page }) => {
  await open(page);
  let asked = false; page.on('dialog', d => { asked = d.type() === 'beforeunload'; d.accept(); }); // 확인 창을 바로 눌러도 남아야 함 (저장은 즉시 확정)
  await page.click('#stageTitle'); // 사용자 조작(브라우저가 닫기 확인을 띄우는 조건)
  await page.evaluate(() => { window.__kzEditor.getWrapper().find('h1')[0].components('QUICK-1'); });
  expect(await page.evaluate(() => KZ.tabState().pending)).toBe(true);
  await page.reload();
  await page.waitForFunction(() => window.__kzEditor && document.getElementById('status').textContent !== '불러오는 중…');
  expect(await page.evaluate(() => window.__kzEditor.getWrapper().find('h1')[0].toHTML())).toContain('QUICK-1');
  expect(asked).toBe(true);
});

test('글을 고치는 중에 Tab 을 눌러도 도구가 숨겨지지 않는다', async ({ page }) => {
  await open(page);
  await page.frameLocator('.gjs-frame').locator('h1').first().dblclick();
  await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  expect(await page.evaluate(() => !!document.querySelector('.app.zen'))).toBe(false);
});

// ---------- 0.12.0 화면 · 창 밖 패널 ----------
for (const w of [1024, 1280, 1440]) {
  test(`상단 줄 버튼이 ${w}px 폭에서 꺾이거나 겹치지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 800 });
    await open(page);
    const r = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.top > *')].filter(e => e.offsetParent && !e.classList.contains('grow') && !e.classList.contains('sep'))
        .map(e => ({ id: e.id || e.className, r: e.getBoundingClientRect() }));
      const bad = [];
      items.forEach((a, i) => { if (a.r.right > innerWidth + 1) bad.push('밖: ' + a.id); if (a.r.height > 40) bad.push('높이: ' + a.id);
        items.slice(i + 1).forEach(b => { if (a.r.right > b.r.left + 1 && a.r.left < b.r.right - 1) bad.push('겹침: ' + a.id + ' / ' + b.id); }); });
      document.querySelectorAll('.top button, .top .seg button').forEach(b => { if (b.offsetParent && b.getBoundingClientRect().height > 40) bad.push('꺾임: ' + (b.id || b.textContent)); });
      const sh = document.querySelector('.stage-head'); if (sh.scrollHeight > sh.clientHeight + 1) bad.push('편집 화면 머리 줄 넘침');
      return bad;
    });
    expect(r).toEqual([]);
  });
}

test('PC 화면인데 편집 화면이 좁으면 알림이 뜨고, 넓으면 없다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await expect(page.locator('#narrowNote')).toBeVisible();
  await page.setViewportSize({ width: 1600, height: 900 });
  await expect(page.locator('#narrowNote')).toBeHidden();
});

test('모양만 있는 언어 버튼(KR · EN · JP)은 내보낸 사이트에서 보이지 않는다', async ({ page }) => {
  await open(page);
  await page.click('#previewBtn');
  const fr = page.frameLocator('#pvFrame');
  await expect(fr.locator('.rt-page:not([hidden]) .nav').first()).toBeVisible();
  await expect(fr.locator('.rt-page:not([hidden]) .nav .lang').first()).toBeHidden();
});

test('좁은 화면에서 처음 열면 PC 사용 안내가 한 번 뜬다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await expect(page.locator('#dlgT')).toHaveText('PC에서 쓰기를 권합니다');
  await page.locator('#dlgF button').first().click();
  await page.reload(); await page.waitForFunction(() => window.__kzEditor && document.getElementById('status').textContent !== '불러오는 중…');
  await page.waitForTimeout(500);
  await expect(page.locator('#dlg')).not.toHaveClass(/open/);
});

test('창 밖 패널은 한 번에 하나: 두 번째를 꺼내면 첫 번째는 돌아오고, 새 창은 비어 있지 않다', async ({ page, context }) => {
  await open(page);
  await page.evaluate(() => { KZ.forcePopup = true; });
  const p1 = context.waitForEvent('page'); await page.click('[data-popout="drawer"]'); const w1 = await p1;
  await expect.poll(() => w1.evaluate(() => !!document.getElementById('drawer'))).toBe(true);
  const p2 = context.waitForEvent('page'); await page.click('[data-popout="side"]'); const w2 = await p2;
  await page.waitForTimeout(1200);
  expect(await w2.evaluate(() => !!document.getElementById('side'))).toBe(true);
  expect(await page.evaluate(() => !!document.querySelector('#main #drawer'))).toBe(true);
  expect(await page.evaluate(() => KZ.popout.list().map(x => x.name).join(','))).toBe('side');
});

// ---------- 0.13.0 배경 고정 ----------
async function addBgfixPage(page) {
  await page.evaluate(() => {
    const e = window.__kzEditor;
    e.Pages.add({ id: 'fixt', name: '고정 시험', component: KZ.layouts.bgfix.html() }, { select: true });
  });
  await page.waitForTimeout(500);
}
test('배경 고정 창: 미리보기에서 스크롤해도 사진은 제자리, 섹션은 지나간다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const errors = await open(page);
  expect(await page.evaluate(() => KZ.layouts.bgfix && KZ.layouts.bgfix.cat)).toBe('섹션');
  await addBgfixPage(page);
  await page.click('#previewBtn');
  const fr = page.frameLocator('#pvFrame');
  await expect(fr.locator('.rt-page:not([hidden]) .bgfix')).toBeVisible();
  const f = page.frame({ url: /about:srcdoc/ }) || page.frames().find(x => x !== page.mainFrame());
  const at = async () => f.evaluate(() => { const s = document.querySelector('.rt-page:not([hidden]) .bgfix'); const m = s.querySelector('.bgfix-media'); return { sec: Math.round(s.getBoundingClientRect().top), media: Math.round(m.getBoundingClientRect().top), pos: getComputedStyle(m).position, clip: getComputedStyle(s).clipPath }; });
  await f.evaluate(() => { const s = document.querySelector('.rt-page:not([hidden]) .bgfix'); window.scrollTo(0, s.offsetTop - 200); });
  await page.waitForTimeout(300);
  const a = await at();
  await f.evaluate(() => window.scrollBy(0, 300)); await page.waitForTimeout(300);
  const b = await at();
  expect(a.pos).toBe('fixed'); expect(a.clip).toContain('inset');
  expect(b.sec).toBe(a.sec - 300);   // 섹션은 올라감
  expect(b.media).toBe(a.media);      // 사진은 제자리
  expect(a.media).toBe(0);
  expect(errors).toEqual([]);
});

test('배경 고정: 함께 쓸 수 없는 효과는 흐리게, 고르면 풀린다고 묻는다', async ({ page }) => {
  await open(page);
  await addBgfixPage(page);
  await page.evaluate(() => { const e = window.__kzEditor; e.select(e.getWrapper().find('.bgfix')[0]); });
  await page.click('#side [data-tab="fx"]');
  const anim = page.locator('#tabFx .opts').first();
  await expect(anim.locator('button', { hasText: '떠오르기' })).toHaveClass(/fx-off/);
  await expect(anim.locator('button', { hasText: '페이드' })).not.toHaveClass(/fx-off/);
  await anim.locator('button', { hasText: '떠오르기' }).click();
  await expect(page.locator('#dlgT')).toHaveText('배경 고정이 풀립니다');
  await page.locator('#dlgF button', { hasText: '취소' }).click();
  expect(await page.evaluate(() => { const c = window.__kzEditor.getSelected().getAttributes(); return [c['data-scroll'], c['data-anim'] || '']; })).toEqual(['bgfix', '']);
  await page.locator('#tabFx .opts').first().locator('button', { hasText: '떠오르기' }).click();
  await page.locator('#dlgF button', { hasText: '바꾸기' }).click();
  expect(await page.evaluate(() => { const c = window.__kzEditor.getSelected().getAttributes(); return [c['data-scroll'] || '', c['data-anim']]; })).toEqual(['', 'fade-up']);
  // 반대: 등장 효과가 있는 요소에 배경 고정을 고르면 묻는다
  await page.locator('#tabFx .opts').nth(2).locator('button', { hasText: '배경 고정' }).click();
  await expect(page.locator('#dlgT')).toHaveText('함께 쓸 수 없는 효과');
  await page.locator('#dlgF button', { hasText: '배경 고정' }).click();
  expect(await page.evaluate(() => { const c = window.__kzEditor.getSelected().getAttributes(); return [c['data-scroll'], c['data-anim'] || '']; })).toEqual(['bgfix', '']);
});

test('배경 고정 창: 높이 · 어둡게 고르기, 히어로에도 걸 수 있다', async ({ page }) => {
  await open(page);
  await addBgfixPage(page);
  await page.evaluate(() => { const e = window.__kzEditor; e.select(e.getWrapper().find('.bgfix')[0]); });
  await page.click('#side [data-tab="fx"]');
  await page.locator('#tabFx button', { hasText: '70%' }).click();
  await page.locator('#tabFx button', { hasText: '진하게' }).click();
  expect(await page.evaluate(() => { const a = window.__kzEditor.getSelected().getAttributes(); return [a['data-h'], a['data-dim']]; })).toEqual(['70', '55']);
  // 기본 세트 첫 화면(히어로)에 배경 고정
  await page.evaluate(() => { const e = window.__kzEditor; e.Pages.select('home'); });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const e = window.__kzEditor; e.select(e.getWrapper().find('.hero')[0]); });
  await page.click('#side [data-tab="fx"]');
  await page.locator('#tabFx .opts').nth(2).locator('button', { hasText: '배경 고정' }).click();
  expect(await page.evaluate(() => window.__kzEditor.getSelected().getAttributes()['data-scroll'])).toBe('bgfix');
});

test('패널을 창 밖으로 꺼낸 뒤 편집기 창 크기를 바꿔도 빈 칸이 생기지 않는다', async ({ page, context }) => {
  await open(page);
  await page.evaluate(() => { KZ.forcePopup = true; });
  const p1 = context.waitForEvent('page'); await page.click('[data-popout="drawer"]'); await p1;
  await page.waitForTimeout(500);
  const w0 = await page.evaluate(() => document.querySelector('.stage').getBoundingClientRect().width);
  await page.setViewportSize({ width: 1500, height: 900 }); await page.waitForTimeout(400);
  await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.getElementById('main').classList.contains('float-drawer'))).toBe(true);
  expect(await page.evaluate(() => document.querySelector('.stage').getBoundingClientRect().width)).toBe(w0);
});

// ---------- 0.14.0 전시 섹션 · 작가 전시 세트 ----------
test('전시 섹션 7종: 자리표시만 쓰고, 세트가 적용된다', async ({ page }) => {
  const errors = await open(page);
  const r = await page.evaluate(() => {
    const ids = ['exh-cover', 'exh-work', 'exh-row', 'exh-space', 'exh-photo', 'exh-cv', 'exh-links'];
    const missing = ids.filter(id => !KZ.layouts[id] || KZ.layouts[id].cat !== '섹션');
    const digits = ids.filter(id => { const t = document.createElement('template'); t.innerHTML = KZ.sectionHtml(id); return /\d/.test(t.content.textContent.replace(/\[[^\]]*\]/g, '')); });
    return { missing, digits, set: !!KZ.sets.exhibit, theme: KZ.C.THEMES.exhibit.bg };
  });
  expect(r).toEqual({ missing: [], digits: [], set: true, theme: '#EBEBEB' });
  await page.click('#setsFold');
  await page.locator('.set', { hasText: '작가 전시' }).click();
  await page.locator('#dlgF button', { hasText: '적용' }).click();
  await expect.poll(() => page.evaluate(() => window.__kzEditor.Pages.getAll().map(p => p.getId()).join(','))).toBe('home,show2,show1');
  expect(errors).toEqual([]);
});

for (const [w, h] of [[1366, 768], [2560, 1300], [390, 844]]) {
  test(`작가 전시: ${w}px 에서 Canva 판과 같은 위치 · 크기`, async ({ page, context }, info) => {
    await open(page);
    const html = await page.evaluate(() => {
      const set = KZ.sets.exhibit, pages = set.pages.map(p => ({ id: p[0], name: p[1], html: KZ.setPageHtml(set, p) }));
      return KZ.buildSite({ pages, css: '', S: Object.assign(KZ.C.DEFAULT_S(), { theme: 'exhibit', colors: Object.assign({}, KZ.C.THEMES.exhibit), font: 'exhibit' }) });
    });
    const q = await context.newPage();
    await q.setViewportSize({ width: w, height: h });
    const file = info.outputPath('exhibit.html'); require('fs').writeFileSync(file, html);
    await q.goto('file://' + file + '#show2'); await q.waitForTimeout(800);
    const m = await q.evaluate(() => {
      const pg = document.querySelector('.rt-page[data-page="show2"]'), S = [...pg.querySelectorAll('section')], W = document.documentElement.clientWidth;
      const rel = (e, s) => { const r = e.getBoundingClientRect(), R = s.getBoundingClientRect(); return { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height, right: r.right - R.left }; };
      const cover = S[0], work = S[1], cv = S.find(s => s.classList.contains('exh-cv'));
      return { W, coverH: cover.getBoundingClientRect().height, title: rel(cover.querySelector('.exh-title'), cover), art: rel(work.querySelector('.exh-art'), work),
        cap: rel(work.querySelector('.exh-cap-t'), work), workH: work.getBoundingClientRect().height, cvName: rel(cv.querySelectorAll('.exh-cv-name')[1], cv), overflow: document.documentElement.scrollWidth - W };
    });
    const near = (a, b, d = 2) => expect(Math.abs(a - b)).toBeLessThanOrEqual(d);
    expect(m.overflow).toBe(0);
    if (w >= 1366) {
      // 1366 판 그대로, 가운데 (Canva 측정값: 표지 제목 355, 작품 463 × 522 위 123, 캡션 오른쪽 끝 = 가운데 + 460, 약력 영문 이름 338)
      near(m.coverH, 768); near(m.title.y, 355); near(m.art.y, 123); near(m.art.h, 522); near(m.art.w, 463);
      near(m.cap.right, m.W / 2 + 460); near(m.cap.y, 687); near(m.cvName.y, 338);
    } else {
      // 모바일: Canva 모바일 보기 (표지 525, 사진 양옆 15px · 위 97, 캡션은 사진 아래 15px · 오른쪽 64px, 영문 이름 240)
      const k = m.W / 375; // 모바일은 Canva 모바일 판(375) 기준으로 비례
      near(m.coverH, 525 * k); near(m.title.y, 281 * k); near(m.art.x, 15 * k); near(m.art.w, m.W - 30 * k); near(m.art.y, 97 * k);
      near(m.cap.right, m.W - 64 * k); near(m.cvName.y, 240 * k);
    }
  });
}

// ---------- 0.14.1 ----------
test('내보낸 사이트: 메뉴로 옮긴 뒤 뒤로 가기 · 주소의 #페이지 바꾸기로 페이지가 바뀐다', async ({ page, context }, info) => {
  await open(page);
  const html = await page.evaluate(() => { const e = window.__kzEditor; return KZ.buildSite({ pages: e.Pages.getAll().map(p => ({ id: p.getId(), name: p.get('name'), html: p.getMainComponent().getInnerHTML() })), css: e.getCss(), S: Object.assign(KZ.C.DEFAULT_S(), { transition: 'none' }) }); });
  const file = info.outputPath('site.html'); require('fs').writeFileSync(file, html);
  const q = await context.newPage(); await q.goto('file://' + file); await q.waitForTimeout(500);
  const shown = () => q.evaluate(() => document.querySelector('.rt-page:not([hidden])').dataset.page);
  expect(await shown()).toBe('home');
  await q.locator('.rt-page:not([hidden]) .nav a[href="#about"]').first().click(); await q.waitForTimeout(300);
  expect(await shown()).toBe('about');
  await q.goBack(); await q.waitForTimeout(300);
  expect(await shown()).toBe('home');
  await q.evaluate(() => { location.hash = 'gallery'; }); await q.waitForTimeout(300);
  expect(await shown()).toBe('gallery');
});

test('전시 섹션: 섹션 style 의 변수로 위치를 섹션마다 바꿀 수 있다 (PC · 모바일)', async ({ page, context }, info) => {
  await open(page);
  const html = await page.evaluate(() => {
    const t = document.createElement('template'); t.innerHTML = KZ.sectionHtml('exh-work', {});
    const s = t.content.firstElementChild; s.setAttribute('style', '--at:0;--ah:600;--ct:500;--cr:400;--mt:0;--mx:24;--mh:600');
    return KZ.buildSite({ pages: [{ id: 'home', name: '홈', html: s.outerHTML }], css: '', S: Object.assign(KZ.C.DEFAULT_S(), { theme: 'exhibit', colors: Object.assign({}, KZ.C.THEMES.exhibit), font: 'exhibit' }) });
  });
  const file = info.outputPath('v.html'); require('fs').writeFileSync(file, html);
  const q = await context.newPage();
  await q.setViewportSize({ width: 1366, height: 768 }); await q.goto('file://' + file); await q.waitForTimeout(400);
  const d = await q.evaluate(() => { const s = document.querySelector('.exh-work'), a = s.querySelector('.exh-art').getBoundingClientRect(), c = s.querySelector('.exh-cap').getBoundingClientRect(); return [a.top, a.height, c.top, c.right]; });
  expect(d.map(Math.round)).toEqual([0, 600, 500, 683 + 400]);
  await q.setViewportSize({ width: 375, height: 800 }); await q.waitForTimeout(300);
  const m = await q.evaluate(() => { const s = document.querySelector('.exh-work'), a = s.querySelector('.exh-art').getBoundingClientRect(); return [s.getBoundingClientRect().height, a.left, a.top]; });
  expect(m.map(Math.round)).toEqual([600, 24, 0]);
});

// ---------- 0.15.0 전시 배치 칸 · 글자 크기 · 빈 페이지 ----------
test('전시 배치 칸: 숫자를 눌러 입력하면 섹션 변수로 저장되고, PC · 모바일이 따로 저장된다', async ({ page }) => {
  const errors = await open(page);
  await page.evaluate(() => { const e = window.__kzEditor; e.getWrapper().append(KZ.sectionHtml('exh-work', {})); e.select(e.getWrapper().find('.exh-work .exh-cap-t')[0]); });
  await page.click('#side [data-tab="design"]');
  await expect(page.locator('#tabDesign')).toContainText('전시 배치 — PC');
  const setF = async (label, v) => { const f = page.locator('#tabDesign .field').filter({ has: page.locator('.lbl', { hasText: label }) }).first(); await f.locator('output').click(); await page.keyboard.press('Control+a'); await page.keyboard.type(String(v)); await page.keyboard.press('Enter'); };
  await setF('작품 위', 40); await setF('캡션 위', 600);
  await page.click('[data-dev="mobile"]'); await page.waitForTimeout(400);
  await page.evaluate(() => { const e = window.__kzEditor; e.select(e.getWrapper().find('.exh-work .exh-cap-t')[0]); });
  await page.click('#side [data-tab="design"]');
  await expect(page.locator('#tabDesign')).toContainText('전시 배치 — 모바일');
  await setF('섹션 높이', 500); await setF('양옆 여백', 30);
  const v = await page.evaluate(() => { const e = window.__kzEditor, s = e.getWrapper().find('.exh-work')[0]; return e.Css.getRule('#' + s.getId()).getStyle(); });
  expect(v).toMatchObject({ '--at': '40', '--ct': '600', '--mh': '500', '--mx': '30' });
  await page.locator('#tabDesign .field').filter({ has: page.locator('.lbl', { hasText: '배경' }) }).first().locator('select').selectOption('orange');
  expect(await page.evaluate(() => window.__kzEditor.getWrapper().find('.exh-work')[0].getAttributes()['data-bg'])).toBe('orange');
  expect(errors).toEqual([]);
});

test('글자 크기: 전시 섹션은 판 단위(모바일 자동), 일반 섹션의 큰 글자는 작은 화면에서 줄어든다', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { const e = window.__kzEditor; e.getWrapper().append(KZ.sectionHtml('exh-cover', { title: 'MEMORY BIAS' })); e.select(e.getWrapper().find('.exh-title')[0]); });
  await page.click('#side [data-tab="design"]');
  const f = page.locator('#tabDesign .field').filter({ has: page.locator('.lbl', { hasText: '크기 (판 단위)' }) }).first();
  await f.locator('output').click(); await page.keyboard.press('Control+a'); await page.keyboard.type('123'); await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => { const e = window.__kzEditor, t = e.getWrapper().find('.exh-title')[0], id = '#' + t.getId();
    return [e.Css.getRule(id).getStyle()['font-size'], (e.Css.getRule(id, { atRuleType: 'media', atRuleParams: '(max-width: 640px)' }) || { getStyle: () => ({}) }).getStyle()['font-size']]; });
  expect(r[0]).toBe('calc(var(--u) * 123)');
  const m = parseFloat(String(r[1]).replace(/[^\d.]+/g, ' ').trim().split(' ').pop());
  expect(m).toBeLessThan(123 * 0.79); // 375 판의 폭 안에 들어가도록 자동으로 줄임
  // 일반 섹션
  await page.evaluate(() => { const e = window.__kzEditor; e.select(e.getWrapper().find('h1.hero-name')[0] || e.getWrapper().find('h1')[0]); });
  await page.click('#side [data-tab="design"]');
  const g = page.locator('#tabDesign .field').filter({ has: page.locator('.lbl', { hasText: /^크기$/ }) }).first();
  await g.locator('output').click(); await page.keyboard.press('Control+a'); await page.keyboard.type('120'); await page.keyboard.press('Enter');
  expect(await page.evaluate(() => { const e = window.__kzEditor, t = e.getSelected(); return e.Css.getRule('#' + t.getId()).getStyle()['font-size']; })).toBe('min(120px, 17.57vw)');
});

test('빈 페이지에 첫 섹션을 넣으면 안내 섹션이 사라지고, 약력 링크 글은 따로 고칠 수 있다', async ({ page }) => {
  await open(page);
  await page.click('.rail button[data-pane="pg"]'); await page.click('#addPage');
  await page.fill('#npName', '시험'); await page.fill('#npId', 'test-p'); await page.locator('#dlgF button', { hasText: '추가' }).click();
  await page.click('.rail button[data-pane="tpl"]');
  await page.locator('.tpl', { hasText: '약력 · 연락처' }).first().click(); await page.locator('#dlgF button', { hasText: '섹션으로 추가' }).click();
  const tops = await page.evaluate(() => window.__kzEditor.getWrapper().components().map(c => c.getClasses().join('.')));
  expect(tops).toEqual(['exh.exh-cv']);
  const t = page.frameLocator('.gjs-frame').locator('.exh-cv-t').first();
  await t.dblclick(); await page.keyboard.press('Control+a'); await page.keyboard.type('my_account'); await page.mouse.click(800, 60);
  expect(await t.innerText()).toBe('my_account');
});
