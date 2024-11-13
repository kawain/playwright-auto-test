const { chromium } = require('@playwright/test')

;(async () => {
  const browser = await chromium.launch({
    headless: false // ブラウザを表示モードで起動
  })
  const page = await browser.newPage()

  try {
    // ブラウザ操作の処理をここに記述
    await page.goto('https://www.jra.go.jp/')
    await page.waitForTimeout(3000)

    try {
      const pageid = 'pw151ou1008202406030120241109Z/21'
      await page.evaluate(id => {
        doAction('/JRADB/accessO.html', id)
      }, pageid)
    } catch (error) {
      console.log('要素が見つかりませんでした:', error)
    }
    await page.waitForTimeout(3000)

    try {
      // 両方の要素が読み込まれるまで待機
      await page.waitForSelector('td.num')
      await page.waitForSelector('td.odds_tan')

      // 要素を取得して辞書を作成
      const result = await page.evaluate(() => {
        const nums = Array.from(document.querySelectorAll('td.num')).map(el =>
          el.textContent.trim()
        )
        const odds = Array.from(document.querySelectorAll('td.odds_tan')).map(
          el => el.textContent.trim()
        )

        // 辞書オブジェクトを作成
        const dict = {}
        nums.forEach((num, index) => {
          dict[num] = odds[index]
        })

        return dict
      })

      console.log(result)
    } catch (error) {
      console.log('要素が見つかりませんでした:', error)
    }
    await page.waitForTimeout(3000)

    // pageid = "pw151ou1008202406030920241109Z/C9"
    // action = f"doAction('/JRADB/accessO.html', '{id}');"
    // driver.execute_script(action)

    // // オッズ
    // const targetXPath = '/html/body/div/div[6]/div/ul/li[3]/a'
    // try {
    //   // 要素が見つかるまで待機
    //   await page.waitForSelector(`xpath=${targetXPath}`, {
    //     timeout: 5000
    //   })

    //   // クリック実行
    //   await page.click(`xpath=${targetXPath}`)
    // } catch (error) {
    //   console.log('要素が見つかりませんでした:', error)
    // }
    // await page.waitForTimeout(3000)

    // // 競馬場
    // try {
    //   const targetLink = page.getByRole('link', { name: /京都3/ })
    //   await targetLink.waitFor({ state: 'visible', timeout: 10000 })
    //   await targetLink.click()
    // } catch (error) {
    //   console.log('要素が見つかりませんでした:', error)
    // }
    // await page.waitForTimeout(3000)

    // // レース一覧
    // try {
    //   const elements = page.locator('.tanpuku a')
    //   const count = await elements.count()
    //   const links2 = []

    //   for (let i = 0; i < count; i++) {
    //     const onclick = await elements.nth(i).getAttribute('onclick')
    //     console.log(onclick);

    //     const match = onclick.match(/'([^']+)'/g)[1]
    //     links2.push(match.replace(/'/g, ''))
    //   }

    //   console.log(links2)
    // } catch (error) {
    //   console.log('要素が見つかりませんでした:', error)
    // }

    await page.waitForTimeout(3000)
  } finally {
    await page.waitForTimeout(3000)
    await browser.close()
  }
})()
