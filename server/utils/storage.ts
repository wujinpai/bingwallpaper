import type { BingImageMeta } from '~/types'

async function getImageGroupFromStorage(group: string, mkt: string) {
  const storage = useStorage<Record<string, BingImageMeta>>('assets/archive')

  const groupkey = `${mkt}/${group}.json`
  if (!await storage.hasItem(groupkey))
    return null
  else
    return await storage.getItem(groupkey)
}

export const getCachedImageGroupWithStorageKey = cachedFunction(getImageGroupFromStorage, {
  getKey: (group: string, mkt: string) => `images_${mkt}_${group}`,
  maxAge: 1000 * 60 * 60 * 8, // 8 Hours
})

async function getImageFromStorage(date: string, mkt: string) {
  if (!/\d{8}/.test(date)) {
    console.warn(`Invalid date: ${date}`)
    return
  }

  const group = await getCachedImageGroupWithStorageKey(date.slice(0, 6), mkt)

  return group?.[date]
}

export const getCachedImageFromStorage = cachedFunction(getImageFromStorage, {
  getKey: (key: string, mkt: string) => `image_${mkt}_${key}`,
  maxAge: 1000 * 60 * 60 * 24 * 15, // 15 days
})

async function getImagesFromStorage(idx: number, count: number, market: { lang: string, offset: number }) {
  const images: BingImageMeta[] = []

  const today = getDateWithMarketOffset(market.offset)
  const start = new Date(today.setDate(today.getDate() - idx))
  const end = new Date(today.setDate(today.getDate() - count))

  while (start.getTime() > end.getTime()) {
    const key = [
      String(start.getFullYear()),
      String(start.getMonth() + 1).padStart(2, '0'),
      String(start.getDate()).padStart(2, '0')
    ].join("")

    const image = await getCachedImageFromStorage(key, market.lang)

    if (image)
      images.push(image)
    else
      console.warn(`No image find for ${key}`)

    // 递减一天
    start.setDate(start.getDate() - 1)
  }

  return images
}

export const getCachedImagesFromStorage = cachedFunction(getImagesFromStorage, {
  getKey: (idx, count, market) => `images_${market.lang}_${idx}_${count}`,
  maxAge: 1000 * 60 * 60 * 8, // 8 hours
})

interface MarketLike {
  lang: string
  offset: number
  startDate: string
}

/** 把 Date 转成归档用的 8 位 key，如 20260930 */
export function toDateKey(date: Date) {
  return [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
}

export async function getImageByDateKey(key: string, mkt: string) {
  return (await getCachedImageFromStorage(key, mkt)) ?? null
}

/** 解析 YYYY-MM-DD 为本地时间，避免 new Date(string) 按 UTC 解析而偏移一天 */
export function parseDateInput(value: string) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  return matched
    ? new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
    : new Date(value)
}

/** 在市场可用时间范围内随机取一张壁纸 */
export async function getRandomImage(market: MarketLike, excludeUrl?: string) {
  const start = new Date(market.startDate)
  start.setHours(0, 0, 0, 0)

  const today = getDateWithMarketOffset(market.offset)
  today.setHours(0, 0, 0, 0)

  const totalDays = Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000))

  for (let i = 0; i < 8; i++) {
    const offset = Math.floor(Math.random() * totalDays)
    const image = await getImageByDateKey(toDateKey(new Date(start.getTime() + offset * 86400000)), market.lang)
    if (image && image.url !== excludeUrl)
      return image
  }

  return null
}

/** 取「往年的今天」：按年份倒序，返回每年同一月日的壁纸 */
export async function getYearlyImages(market: MarketLike, reference: Date, maxYears = 16) {
  const items: { year: number, image: BingImageMeta }[] = []
  const startYear = new Date(market.startDate).getFullYear()

  for (let year = reference.getFullYear() - 1; year >= startYear && items.length < maxYears; year--) {
    const date = new Date(reference)
    date.setFullYear(year)

    const image = await getImageByDateKey(toDateKey(date), market.lang)
    if (image)
      items.push({ year, image })
  }

  return items
}