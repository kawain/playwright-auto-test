// 実行例
// $ node scripts/jra.js 福島4 12

const fs = require('fs')
const path = require('path')
const { chromium } = require('@playwright/test')
const { setTimeout } = require('node:timers/promises')

const CONFIG = {
  TIMEOUT: 5000,
  BASE_URL: 'https://www.jra.go.jp/'
}

// トップページ
async function navigateToTopPage (page) {
  await page.goto(CONFIG.BASE_URL)
}

// オッズボタン探してクリック
async function navigateToOddsPage (page) {
  try {
    const targetElement = page.locator(
      'xpath=/html/body/div/div[6]/div/ul/li[3]/a'
    )
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
    await targetLink.click({ timeout: CONFIG.TIMEOUT })
  } catch (error) {
    console.log('要素が見つかりませんでした:', error)
    throw error
  }
}

// 該当競馬場のレース一覧
async function selectRace (page, raceNum) {
  try {
    // 要素の取得
    const elements = page.locator('.btn_list .tanpuku a')
    const count = await elements.count()
    const links = []

    // リンク情報の抽出
    for (let i = 0; i < count; i++) {
      const element = elements.nth(i)
      const onclick = await element.getAttribute('onclick')
      if (!onclick) {
        console.warn(`${i}番目の要素にonclick属性がありません`)
        continue
      }

      const matches = onclick.match(/'([^']+)'/g)
      if (!matches || matches.length < 2) {
        console.warn(
          `${i}番目の要素のonclick属性が期待された形式ではありません`
        )
        continue
      }

      links.push(matches[1].replace(/'/g, ''))
    }

    // インデックスの範囲チェック
    if (raceNum < 1 || raceNum > links.length) {
      throw new Error(
        `不正なraceNum: ${raceNum}。1から${links.length}の間である必要があります`
      )
    }

    // doActionの実行
    await page.evaluate(id => {
      if (typeof doAction === 'function') {
        doAction('/JRADB/accessO.html', id)
      } else {
        throw new Error('doAction関数が定義されていません')
      }
    }, links[raceNum - 1])
  } catch (error) {
    console.error('エラーが発生しました:', error)
    throw error
  }
}

// 該当レースのオッズページ
async function scrapeOddsData (page) {
  try {
    const numElements = page.locator('td.num')
    const oddsElements = page.locator('td.odds_tan')

    // 両方の要素が存在することを確認
    await Promise.all([
      numElements.first().waitFor({ state: 'visible' }),
      oddsElements.first().waitFor({ state: 'visible' })
    ])

    // 要素を取得して辞書を作成
    const result = await page.evaluate(() => {
      const nums = Array.from(document.querySelectorAll('td.num'))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0) // 空の要素を除外

      const odds = Array.from(document.querySelectorAll('td.odds_tan'))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0)

      // 長さチェック
      if (nums.length !== odds.length) {
        throw new Error('馬番号とオッズの数が一致しません')
      }

      // 辞書オブジェクトを作成
      return nums.reduce((dict, num, index) => {
        dict[num] = odds[index]
        return dict
      }, {})
    })

    // データの存在チェック
    if (Object.keys(result).length === 0) {
      throw new Error('データが取得できませんでした')
    }

    return result
  } catch (error) {
    console.error('エラーが発生しました:', error)
    throw error
  }
}

// ファイル保存
async function saveOddsData (data, filename = '_odds_data.json') {
  const outputPath = path.join(process.cwd(), filename)
  await fs.promises.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8')
  return outputPath
}

// メイン処理
async function scrapeOdds (raceCourse, raceNum) {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    await navigateToTopPage(page)
    await setTimeout(2000)

    await navigateToOddsPage(page)
    await setTimeout(2000)

    await selectRaceCourse(page, raceCourse)
    await setTimeout(2000)

    await selectRace(page, raceNum)
    await setTimeout(2000)

    const oddsData = await scrapeOddsData(page)
    await setTimeout(2000)

    await saveOddsData(oddsData)
  } finally {
    await browser.close()
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
  try {
    const raceCourse = process.argv[2]
    const raceNumStr = process.argv[3]
    const raceNum = validateInputs(raceCourse, raceNumStr)
    await scrapeOdds(raceCourse, raceNum)
    console.log('処理が完了しました')
  } catch (error) {
    console.error('エラーが発生しました:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
