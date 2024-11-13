const { chromium } = require('@playwright/test')
const { setTimeout } = require('node:timers/promises')
require('dotenv').config()

const CONFIG = {
  TIMEOUT: 5000,
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
    await targetLink.click({ timeout: CONFIG.TIMEOUT })
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

// 俺プロ
async function taskToOrePro (page) {
  try {
    await page.locator('#ml1-8').click()
    await page.locator('#ml2-12').click()
    await page.locator('#ml3-5').click()

    
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

async function main () {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    const raceID = process.argv[2]
    if (!raceID) {
      throw new Error('レースIDを指定してください')
    }

    await navigateToLoginPage(page)
    await setTimeout(CONFIG.TIMEOUT)

    await navigateToShutubaPage(page, raceID)
    await setTimeout(CONFIG.TIMEOUT)

    await findAToOrePro(page)
    await setTimeout(CONFIG.TIMEOUT)

    taskToOrePro (page)
    await setTimeout(8000)

    console.log('処理が完了しました')
  } catch (error) {
    console.error('エラーが発生しました:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

if (require.main === module) {
  main()
}
