import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { exit } from 'node:process'

const MARKETS = [
  'de-DE',
  'en-CA',
  'en-GB',
  'en-IN',
  'en-US',
  'fr-FR',
  'it-IT',
  'ja-JP',
  'zh-CN',
]

const BING_ENDPOINT = 'https://global.bing.com/HPImageArchive.aspx'

async function fetchMarketImage(mkt, idx = 0) {
  const query = new URLSearchParams({ format: 'js', n: '1', idx: String(idx), mkt })
  const response = await fetch(`${BING_ENDPOINT}?${query}`)

  if (!response.ok)
    throw new Error(`HTTP ${response.status}`)

  const { images = [] } = await response.json()

  return images.map(image => ({
    url: `https://www.bing.com${image.url.replace('&rf=LaDigue_1920x1080.jpg&pid=hp', '')}`,
    date: image.enddate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
    lang: mkt,
    title: image.title,
    copyright: image.copyright,
    copyrightlink: image.copyrightlink,
  }))
}

function updateFiles(updates) {
  console.log(`# applying ${updates.length} updates at ${new Date().toISOString()}`)
  let added = 0

  for (const update of updates) {
    const { lang, ...data } = update

    const key = data.date.replaceAll('-', '')
    const filepath = `archive/${lang}/${key.slice(0, 6)}.json`

    const group = existsSync(filepath)
      ? JSON.parse(readFileSync(filepath, 'utf-8'))
      : {}

    console.log()
    console.log(`- updating ${lang.toLowerCase()}...`)

    if (group[key]) {
      console.warn(`! ${key} already exists`)
    }
    else {
      group[key] = data
      added += 1
      console.log(`+ ${key} added`)
      writeFileSync(filepath, JSON.stringify(group, null, 2), 'utf-8')
      console.log(`+ updated ${filepath}`)
    }
  }

  console.log()
  console.log(`# ${added} new image(s) written to archive`)
}

// idx=0 取当日壁纸；idx=-1 尝试取 Bing 已提前发布的次日壁纸（用于首页「未来预览」，
// 若 Bing 还没发布，返回的会是当日图，与归档重复会被自动跳过）
const tasks = MARKETS.flatMap(mkt => [{ mkt, idx: 0 }, { mkt, idx: -1 }])
const results = await Promise.allSettled(tasks.map(task => fetchMarketImage(task.mkt, task.idx)))

const updates = []
for (const [index, result] of results.entries()) {
  if (result.status === 'fulfilled')
    updates.push(...result.value)
  else
    console.error(`? ${tasks[index].mkt} (idx=${tasks[index].idx}) failed: ${result.reason?.message ?? result.reason}`)
}

if (updates.length === 0) {
  console.error('? No updates fetched from Bing, aborting without touching archive')
  exit(1)
}

updateFiles(updates)