const { chromium } = require('@playwright/test')

;(async () => {
  const browser = await chromium.launch({
    headless: false // ブラウザを表示モードで起動
  })
  const page = await browser.newPage()

  try {
    // ブラウザ操作の処理をここに記述
    await page.goto('https://example.com/')
    await page.waitForTimeout(3000) // 3秒待機

    // More information... のリンクをクリック
    await page.getByText('More information...').click()

    await page.waitForTimeout(3000) // 3秒待機
  } finally {
    await browser.close()
  }
})()
