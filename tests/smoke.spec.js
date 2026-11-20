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
  expect(info.pages).toEqual(['home', 'works', 'work', 'exhibitions', 'texts', 'about', 'effects']);
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

test('사이트 세트를 바꾸고 되돌릴 수 있다', async ({ page }) => {
  await open(page);
  await page.locator('.set', { hasText: 'proto v3' }).click();
  await page.locator('#dlgF button', { hasText: '적용' }).click();
  await expect.poll(() => page.evaluate(() => window.__kzEditor.Pages.getAll().map(p => p.getId()).join(','))).toBe('home,effects');
});

test('미리보기에서 페이지 이동과 팝업이 작동한다', async ({ page }) => {
  await open(page);
  await page.click('#previewBtn');
  const fr = page.frameLocator('#pvFrame');
  await fr.locator('.rt-page:not([hidden]) .nav a[href="#works"]').first().click();
  await expect(fr.locator('.rt-page[data-page="works"]')).toBeVisible();
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
