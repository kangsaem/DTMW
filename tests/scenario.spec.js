// 사용 시나리오 점검: 내부 함수를 부르지 않고 화면 조작(누르기 · 두 번 누르기 · 글자 입력 · 파일 고르기)만으로
// 만들기 → 고치기 → 내보내기 → 올린 것처럼 열어 보기까지 확인합니다. (확인할 때만 상태를 읽음)
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');

async function openEditor(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.__kzEditor && document.getElementById('status').textContent !== '불러오는 중…', null, { timeout: 30000 });
  return errors;
}
async function applySet(page, name) {
  if (await page.locator('#sets').isHidden()) await page.click('#setsFold');
  await page.locator('#sets .set').filter({ has: page.locator('b', { hasText: new RegExp('^' + name + '$') }) }).click();
  await page.locator('#dlgF button', { hasText: /^적용$/ }).click();
  await expect(page.locator('#toast')).toContainText('세트를 적용했습니다');
}
// 글 고치기: 두 번 눌러 전체를 고른 뒤 새 글을 치고, 바닥글을 눌러 끝냄
async function retype(page, loc, text) {
  await loc.scrollIntoViewIfNeeded(); await loc.dblclick(); await page.keyboard.press('Control+a'); await page.keyboard.type(text);
  await page.frameLocator('.gjs-frame').locator('.foot').first().click(); await page.waitForTimeout(350);
}
// 내보낸 파일을 GitHub Pages 처럼 하위 주소(/repo/)로 올린 것처럼 띄움
function serve(dir) {
  const types = { html: 'text/html; charset=utf-8', webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4' };
  const srv = http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (!p.startsWith('/repo/')) { r.writeHead(404); return r.end(); }
    p = p.slice(6) || 'index.html'; const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': types[f.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  });
  return new Promise(res => srv.listen(0, () => res({ url: 'http://localhost:' + srv.address().port + '/repo/', close: () => srv.close() })));
}
function unzipStore(buf, dir) { // 편집기의 ZIP 은 무압축(store)
  let p = 0; const names = [];
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const size = buf.readUInt32LE(p + 18), n = buf.readUInt16LE(p + 26), x = buf.readUInt16LE(p + 28), name = buf.slice(p + 30, p + 30 + n).toString('utf8');
    const f = path.join(dir, name); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf.slice(p + 30 + n + x, p + 30 + n + x + size));
    names.push(name); p += 30 + n + x + size;
  }
  return names;
}
// 휴대폰으로 사이트를 열어 메뉴의 모든 페이지를 눌러 봄: 오류 · 가로 넘침 · 안 뜨는 그림 · 없는 페이지 링크가 없어야 함
async function visitOnPhone(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const m = await ctx.newPage(); const problems = [];
  m.on('pageerror', e => problems.push('오류: ' + e));
  m.on('response', r => { if (r.status() >= 400 && r.url().startsWith(url)) problems.push(r.status() + ' ' + r.url()); });
  await m.goto(url); await m.waitForTimeout(500);
  const ids = await m.evaluate(() => [...document.querySelectorAll('.rt-page')].map(p => p.dataset.page));
  const dead = await m.evaluate(ids => [...document.querySelectorAll('a[href^="#"],[data-go^="#"]')].map(a => (a.getAttribute('data-go') || a.getAttribute('href')).slice(1)).filter(id => id && !ids.includes(id)), ids);
  if (dead.length) problems.push('없는 페이지 링크: ' + [...new Set(dead)].join(','));
  const menu = m.locator('.rt-page:not([hidden]) .menu-btn').first();
  const seen = [];
  if (await menu.count()) {
    await menu.tap(); await m.waitForTimeout(600);
    const n = await m.locator('#rt-ov .rt-box a').count();
    await m.keyboard.press('Escape'); await m.waitForTimeout(500);
    for (let i = 0; i < n; i++) {
      const btn = m.locator('.rt-page:not([hidden]) .menu-btn').first();
      if (!(await btn.count())) { await m.goBack(); await m.waitForTimeout(800); }
      await m.locator('.rt-page:not([hidden]) .menu-btn').first().tap(); await m.waitForTimeout(600);
      await m.locator('#rt-ov .rt-box a').nth(i).tap(); await m.waitForTimeout(1100);
      const st = await m.evaluate(() => {
        const pg = document.querySelector('.rt-page:not([hidden])'), W = document.documentElement.clientWidth;
        return { id: pg.dataset.page, sw: document.documentElement.scrollWidth, W, ov: document.getElementById('rt-ov').hidden, imgs: [...pg.querySelectorAll('img')].filter(i => i.complete && !i.naturalWidth).length, title: document.title };
      });
      seen.push(st.id);
      if (st.sw > st.W + 1) problems.push(st.id + ': 가로 넘침 ' + st.sw + ' > ' + st.W);
      if (!st.ov) problems.push(st.id + ': 메뉴가 닫히지 않음');
      if (st.imgs) problems.push(st.id + ': 안 뜨는 그림 ' + st.imgs);
    }
  }
  const title = await m.title();
  await ctx.close();
  return { ids, seen, problems, title };
}

test('시나리오 — 카페 사이트: 세트 → 이름 → 글 → 사진 → 페이지 → 예약 버튼 → 미리보기 → ZIP → 휴대폰으로 열기 → 다시 열어도 그대로', async ({ page, browser }) => {
  test.setTimeout(180000);
  const errors = await openEditor(page);
  const F = page.frameLocator('.gjs-frame');
  await applySet(page, '카페 · 식당');
  // 이름: 맨 위 칸에 입력 → 로고 · 첫 화면 제목 · 바닥글
  await page.click('#siteName'); await page.keyboard.press('Control+a'); await page.keyboard.type('카페 루나'); await page.keyboard.press('Enter');
  await expect(F.locator('.brand').first()).toHaveText('카페 루나');
  await expect(F.locator('h1').first()).toHaveText('카페 루나');
  // 첫 화면 제목을 다른 글로
  await retype(page, F.locator('h1').first(), '따뜻한 한 잔');
  await expect(F.locator('h1').first()).toHaveText('따뜻한 한 잔');
  await expect(F.locator('.brand').first()).toHaveText('카페 루나');
  // 사진 올리고 화면의 그림 바꾸기
  await page.click('.rail button[data-pane="up"]');
  await page.setInputFiles('#fileIn', { name: 'IMG_0001.webp', mimeType: 'image/webp', buffer: fs.readFileSync('app/demo/media/d-heros.webp') });
  await expect(page.locator('#assets .asset')).toHaveCount(1);
  await page.locator('#pageStrip .ps', { hasText: '메뉴' }).click(); await page.waitForTimeout(500);
  const img = F.locator('img').first(); await img.scrollIntoViewIfNeeded(); await img.click();
  await page.locator('#assets .asset').first().click();
  await expect(page.locator('#toast')).toContainText('이미지를 바꿨습니다');
  // 페이지 추가 → 메뉴에 자동으로
  await page.locator('#pageStrip .ps.add').click(); await page.locator('#npName').fill('Events'); await page.locator('#dlgF button', { hasText: '추가' }).click();
  await expect(F.locator('nav.links a', { hasText: 'Events' })).toHaveCount(1);
  await expect(F.locator('.brand').first()).toHaveText('카페 루나'); // 새 페이지의 로고도 이름으로
  // 팝업이 걸린 '예약 · 문의' 버튼을 네이버 예약 링크로
  await page.locator('#pageStrip .ps', { hasText: '매장 안내' }).click(); await page.waitForTimeout(500);
  const book = F.locator('a.btn', { hasText: '예약' }).first(); await book.scrollIntoViewIfNeeded(); await book.click();
  await page.click('#side [data-tab="design"]');
  await page.locator('#tabDesign .opts button', { hasText: '페이지 이동' }).click();
  await page.locator('#tabDesign select').filter({ has: page.locator('option', { hasText: '네이버 예약' }) }).selectOption({ label: '네이버 예약' });
  await page.keyboard.type('lunacafe'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  // 미리보기: 메뉴로 이동, 예약 버튼은 링크
  await page.click('#previewBtn');
  const P = page.frameLocator('#pvFrame');
  await P.locator('.rt-page:not([hidden]) nav.links a', { hasText: 'Events' }).click();
  await expect(P.locator('.rt-page[data-page="events"]')).toBeVisible();
  const bookP = P.locator('.rt-page[data-page="about"] a.btn', { hasText: '예약' }).first();
  expect(await bookP.getAttribute('href')).toBe('https://booking.naver.com/lunacafe');
  expect(await bookP.getAttribute('data-click')).toBeNull();
  await page.click('#pvClose');
  // 내보내기: ZIP
  await page.click('#publishBtn');
  await expect(page.locator('#dlgB')).toContainText('ZIP');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#dlgF button', { hasText: 'ZIP 받기' }).click()]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wmw-')); const zip = path.join(dir, 'site.zip'); await dl.saveAs(zip);
  const out = path.join(dir, 'out'); const names = unzipStore(fs.readFileSync(zip), out);
  expect(names).toContain('index.html'); expect(names.some(n => /^media\/.+\.webp$/.test(n))).toBe(true);
  expect(fs.readFileSync(path.join(out, 'index.html'), 'utf8')).not.toContain('KR</a>');
  const srv = await serve(out);
  const r = await visitOnPhone(browser, srv.url); srv.close();
  expect(r.problems).toEqual([]);
  expect(r.title).toContain('카페 루나');
  expect(r.seen).toContain('events');
  // 편집기를 다시 열어도 그대로
  await page.waitForTimeout(1300); await page.reload();
  await page.waitForFunction(() => window.__kzEditor && document.getElementById('status').textContent !== '불러오는 중…');
  await expect(page.locator('#siteName')).toHaveValue('카페 루나');
  await expect(F.locator('h1').first()).toHaveText('따뜻한 한 잔');
  await expect(page.locator('#pageStrip .ps', { hasText: 'Events' })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('시나리오 — 세트 12종: 적용 → index.html 받기 → 휴대폰으로 모든 메뉴 눌러 보기', async ({ page, browser }) => {
  test.setTimeout(420000);
  const errors = await openEditor(page);
  if (await page.locator('#sets').isHidden()) await page.click('#setsFold');
  const names = await page.locator('#sets .set > b').allTextContents();
  expect(names.length).toBeGreaterThanOrEqual(12);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wmw-sets-'));
  for (const [i, name] of names.entries()) {
    await page.locator('#sets .set').nth(i).click();
    await page.locator('#dlgF button', { hasText: /^적용$/ }).click(); await page.waitForTimeout(500);
    await page.click('#publishBtn');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#dlgF button', { hasText: 'index.html 받기' }).click()]);
    const out = path.join(dir, 's' + i); fs.mkdirSync(out); await dl.saveAs(path.join(out, 'index.html'));
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    expect(html, name + ': 이름 자리표시가 남음').not.toContain('[사이트 이름]');
    const srv = await serve(out);
    const r = await visitOnPhone(browser, srv.url); srv.close();
    expect(r.problems, name).toEqual([]);
    expect(r.ids.length, name).toBeGreaterThan(1);
  }
  expect(errors).toEqual([]);
});

test('시나리오 — 페이지 관리: 추가 · 하위로 · 숨기기 · 삭제 · 되돌리기 · 주소 바꾸기가 메뉴와 미리보기에 그대로', async ({ page }) => {
  const errors = await openEditor(page);
  const F = page.frameLocator('.gjs-frame');
  const menu = async () => (await F.locator('nav.links').first().locator('a').allTextContents()).join(',');
  await page.click('.rail button[data-pane="pg"]');
  const rowOf = async name => { const n = await page.locator('#pages .pg').count(); for (let i = 0; i < n; i++) if (await page.locator('#pages .pg').nth(i).locator('input').inputValue() === name) return page.locator('#pages .pg').nth(i); throw new Error('페이지 줄 없음: ' + name); };
  expect(await menu()).toBe('갤러리,상세,소식,글,소개,효과 샘플');
  // 메뉴에서 숨기기
  await (await rowOf('효과 샘플')).locator('input').click(); await (await rowOf('효과 샘플')).locator('button[aria-label="메뉴에서 숨기기"]').click();
  expect(await menu()).toBe('갤러리,상세,소식,글,소개');
  // 하위로 넣기
  await (await rowOf('소개')).locator('input').click(); await (await rowOf('소개')).locator('button[aria-label="위 페이지의 하위로"]').click();
  await expect(F.locator('nav.links').first().locator('.nav-sub a', { hasText: '소개' })).toHaveCount(1);
  // 삭제 → 메뉴에서 빠지고 남은 링크 알림 → 되돌리기
  await (await rowOf('소식')).locator('input').click(); await (await rowOf('소식')).locator('button[aria-label="삭제"]').click();
  await page.locator('#dlgF button', { hasText: '삭제' }).click(); await page.waitForTimeout(300);
  expect(await menu()).not.toContain('소식');
  await page.click('#undo'); await page.waitForTimeout(400);
  expect(await menu()).toBe('갤러리,상세,소식,글,소개');
  await expect(page.locator('#pages .pg')).toHaveCount(7);
  // 이름 바꾸기 → 메뉴
  await (await rowOf('글')).locator('input').click(); await page.keyboard.press('Control+a'); await page.keyboard.type('Blog'); await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  expect(await menu()).toBe('갤러리,상세,소식,Blog,소개');
  // 주소 바꾸기 → 미리보기에서 그 주소로 이동
  await (await rowOf('Blog')).locator('.pg-id').click(); await page.locator('#npNewId').fill('blog'); await page.locator('#dlgF button', { hasText: '바꾸기' }).click(); await page.waitForTimeout(300);
  await page.click('#previewBtn');
  const P = page.frameLocator('#pvFrame');
  await P.locator('.rt-page:not([hidden]) nav.links a', { hasText: 'Blog' }).first().click();
  await expect(P.locator('.rt-page[data-page="blog"]')).toBeVisible();
  expect(await P.locator('.rt-page:not([hidden]) nav.links').first().innerText()).not.toContain('효과 샘플');
  expect(errors).toEqual([]);
});
