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
