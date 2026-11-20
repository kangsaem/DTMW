// 자동 점검 설정 — app/ 폴더를 작은 웹 서버로 띄우고 편집기를 실제 브라우저로 시험합니다.
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests',
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 1440, height: 900 },
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {}
  },
  webServer: { command: 'python3 -m http.server 8080 --directory app', url: 'http://localhost:8080/index.html', reuseExistingServer: !process.env.CI }
});
