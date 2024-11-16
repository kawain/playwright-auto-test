const { chromium } = require('@playwright/test')
const { setTimeout } = require('node:timers/promises')
require('dotenv').config({
  path: '/home/user/repo/playwright-auto-test/.env'
})

const CONFIG = {
  TIMEOUT: 30000,
  BASE_URL: 'https://regist.netkeiba.com/account/?pid=login'
}

const gotoParam = {
  waitUntil: 'domcontentloaded',
  timeout: 60000 // タイムアウトを60秒に設定
}

// ログインページ
async function navigateToLoginPage (page) {
  try {
    await page.goto(CONFIG.BASE_URL, gotoParam)
    // input要素にテキストを入力
    await page.fill('input[name="login_id"]', process.env.LOGIN_ID)
    await page.fill('input[name="pswd"]', process.env.PSWD)
    await page.press('input[name="pswd"]', 'Enter')
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

// 出馬ページ
async function navigateToShutubaPage (page, raceID) {
  try {
    await page.goto(
      `https://race.netkeiba.com/race/shutuba.html?race_id=${raceID}&rf=race_list`,
      gotoParam
    )
  } catch (error) {
    console.log('移動できませんでした:', error)
    throw error
  }
}

// 俺プロへクリック
async function findAToOrePro (page) {
  try {
    const targetLink = page.getByRole('link', { name: '俺プロへ' })
    // 要素が表示されるまで待機
    await targetLink.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUT })
    await targetLink.click({ timeout: CONFIG.TIMEOUT })
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

// 俺プロ
async function taskToOrePro (page, preds, raceID) {
  try {
    const elements = page.locator('tr.HorseList')
    await elements
      .first()
      .waitFor({ state: 'visible', timeout: CONFIG.TIMEOUT })

    const button = page.locator(`#act-bet_${raceID}`)
    await button.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUT })

    const ids = []
    for (const element of await elements.all()) {
      const id = await element.getAttribute('id')
      ids.push(id)
    }

    // 馬番:trのid数字の辞書作成
    const dict = Object.fromEntries(
      ids.map((item, index) => [index + 1, item.split('_')[1]])
    )

    // もしもクリックされているものがあればオフにする
    for (const v of Object.values(dict)) {
      let element = page.locator(`#ml1-${v}`)
      let className = await element.getAttribute('class')
      // class属性の判定
      if (className === 'Selected') {
        await element.click({ timeout: CONFIG.TIMEOUT })
      }

      element = page.locator(`#ml2-${v}`)
      className = await element.getAttribute('class')
      // class属性の判定
      if (className === 'Selected') {
        await element.click({ timeout: CONFIG.TIMEOUT })
      }

      element = page.locator(`#ml3-${v}`)
      className = await element.getAttribute('class')
      // class属性の判定
      if (className === 'Selected') {
        await element.click({ timeout: CONFIG.TIMEOUT })
      }

      element = page.locator(`#ml4-${v}`)
      className = await element.getAttribute('class')
      // class属性の判定
      if (className === 'Selected') {
        await element.click({ timeout: CONFIG.TIMEOUT })
      }
    }

    // クリック
    for (let i = 0; i < preds.length; i++) {
      if (i === 0) {
        await page.locator(`#ml1-${dict[preds[i]]}`).click()
      } else if (i === 1) {
        await page.locator(`#ml2-${dict[preds[i]]}`).click()
      } else if (i === 2) {
        await page.locator(`#ml3-${dict[preds[i]]}`).click()
      } else {
        await page.locator(`#ml4-${dict[preds[i]]}`).click()
      }
    }

    // ボタンクリック
    await Promise.all([
      page.waitForLoadState('load'),
      button.click({ timeout: CONFIG.TIMEOUT })
    ])
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

async function main () {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    size = process.argv.length
    if (size < 4) {
      throw new Error('正しい引数を指定してください')
    }

    const raceID = process.argv[2]

    const preds = []
    for (let i = 0; i < size; i++) {
      if (i > 2) {
        preds.push(process.argv[i])
      }
    }

    await navigateToLoginPage(page)
    await navigateToShutubaPage(page, raceID)
    await findAToOrePro(page)
    await taskToOrePro(page, preds, raceID)
    await setTimeout(10000)
  } catch (error) {
    console.error('エラーが発生しました:', error.message)
  } finally {
    await browser.close()
  }
}

if (require.main === module) {
  main()
}
