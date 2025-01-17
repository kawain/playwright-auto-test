// 実行例
// $ node scripts/jra.js 福島4 12

const fs = require('fs')
const path = require('path')
const { chromium } = require('@playwright/test')
const { setTimeout } = require('node:timers/promises')

const CONFIG = {
  TIMEOUT: 30000,
  BASE_URL: 'https://www.jra.go.jp/'
}

const RACECOURSE = [
  '札幌',
  '函館',
  '福島',
  '新潟',
  '東京',
  '中山',
  '中京',
  '京都',
  '阪神',
  '小倉'
]

async function navigateToTopePage (page) {
  try {
    await page.goto(CONFIG.BASE_URL)

    // 要素が表示されるまで待機
    await page.locator('.place_line .unit').first().waitFor({
      state: 'visible',
      timeout: CONFIG.TIMEOUT
    })

    // 競馬場名
    const elements = page.locator('.place_line .unit .rc_header h3')
    let count = await elements.count()
    const names = []
    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).textContent()
      names.push(text)
    }

    // 天候
    const weatherElements = page.locator('.place_line .unit .rc_header .cap')
    count = await weatherElements.count()
    const weathers = []
    for (let i = 0; i < count; i++) {
      const text = await weatherElements.nth(i).textContent()
      weathers.push(text)
    }

    // 芝状態
    const turfElements = page.locator('.place_line .unit .rc_body .turf')
    count = await turfElements.count()
    const turfs = []
    for (let i = 0; i < count; i++) {
      const text = await turfElements.nth(i).textContent()
      turfs.push(text)
    }

    // ダ状態
    const dirtElements = page.locator('.place_line .unit .rc_body .dirt')
    count = await dirtElements.count()
    const dirts = []
    for (let i = 0; i < count; i++) {
      const text = await dirtElements.nth(i).textContent()
      dirts.push(text)
    }

    // データ整形
    const newNames = []
    for (const name of names) {
      for (const v of RACECOURSE) {
        if (name.includes(v)) {
          newNames.push(v)
        }
      }
    }

    const opt = []
    for (let i = 0; i < newNames.length; i++) {
      const tmp = {
        競馬場: newNames[i],
        天候: weathers[i],
        芝: turfs[i].replace('芝', ''),
        ダ: dirts[i].replace('ダート', '')
      }
      opt.push(tmp)
    }

    // ファイル保存
    fs.writeFileSync(
      '/home/user/repo/playwright-auto-test/_conditions.json',
      JSON.stringify(opt, null, 2)
    )
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

// 出馬表ボタン探してクリック
async function navigateToShutsubaPage (page) {
  try {
    const targetElement = page.locator(
      'xpath=/html/body/div/div[5]/div/ul/li[2]/a'
    )
    // 要素が表示されるまで待機
    await targetElement.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUT })
    await targetElement.click({ timeout: CONFIG.TIMEOUT })
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

// コマンドで与えた競馬場
async function selectRaceCourse (page, raceCourse) {
  try {
    const targetLink = page.getByRole('link', { name: raceCourse })
    // 要素が表示されるまで待機
    await targetLink.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUT })
    await targetLink.click({ timeout: CONFIG.TIMEOUT })
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

// オッズページへ遷移
async function navigateToOddsPage (page, raceNum) {
  try {
    // 要素が表示されるまで待機
    await page.locator('td.odds a').first().waitFor({
      state: 'visible',
      timeout: CONFIG.TIMEOUT
    })

    const elements = page.locator('td.odds a')
    await elements.nth(raceNum - 1).click({ timeout: CONFIG.TIMEOUT })
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

async function getOddsData (page) {
  try {
    // 要素が表示されるまで待機
    await page.locator('td.num').first().waitFor({
      state: 'visible',
      timeout: CONFIG.TIMEOUT
    })

    const nums = await page.locator('td.num').allTextContents()
    const oddsTans = await page.locator('td.odds_tan').allTextContents()

    let csvData = '馬番,単勝\n'

    for (let i = 0; i < nums.length; i++) {
      const num = nums[i].trim()
      let odds = oddsTans[i].trim()
      odds = parseFloat(odds) || 1000.0
      csvData += `${num},${odds}\n`
    }
    // ファイル保存
    fs.writeFileSync(
      '/home/user/repo/playwright-auto-test/_odds_data.csv',
      csvData,
      'utf8'
    )
  } catch (error) {
    console.error('エラーが発生しました:', error)
    throw error
  }
}

// 引数チェック
function validateInputs (raceCourse, raceNumStr) {
  if (!raceCourse || !raceNumStr) {
    throw new Error('競馬場とレース番号を指定してください')
  }

  const raceNum = parseInt(raceNumStr, 10)
  if (isNaN(raceNum) || raceNum < 1 || raceNum > 12) {
    throw new Error('レース番号は1から12の間で指定してください')
  }

  return raceNum
}

async function main () {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    const raceCourse = process.argv[2]
    const raceNumStr = process.argv[3]
    const raceNum = validateInputs(raceCourse, raceNumStr)
    await navigateToTopePage(page)
    await navigateToShutsubaPage(page)
    await selectRaceCourse(page, raceCourse)
    await navigateToOddsPage(page, raceNum)
    await getOddsData(page)
    // await setTimeout(2000)
  } catch (error) {
    console.error('エラーが発生しました:', error.message)
  } finally {
    await browser.close()
  }
}

async function test_conditions () {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    await navigateToTopePage(page)
    await setTimeout(2000)
  } catch (error) {
    console.error('エラーが発生しました:', error.message)
  } finally {
    await browser.close()
  }
}

if (require.main === module) {
  main()
  // test_conditions()
}
