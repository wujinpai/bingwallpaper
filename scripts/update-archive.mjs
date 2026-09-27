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

async function fetchMarketImage(mkt) {
  const query = new URLSearchParams({ format: 'js', n: '1', idx: '0', mkt })
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

const results = await Promise.allSettled(MARKETS.map(mkt => fetchMarketImage(mkt)))

const updates = []
for (const [index, result] of results.entries()) {
  if (result.status === 'fulfilled')
    updates.push(...result.value)
  else
    console.error(`? ${MARKETS[index]} failed: ${result.reason?.message ?? result.reason}`)
}

if (updates.length === 0) {
  console.error('? No updates fetched from Bing, aborting without touching archive')
  exit(1)
}

updateFiles(updates)