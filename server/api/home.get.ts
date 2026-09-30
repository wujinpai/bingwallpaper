/** 「最新聚焦」取另一个市场的当日壁纸，保证与「必应今日」不是同一张 */
const SPOTLIGHT_LANG = 'en-US'

export default defineEventHandler(async (event) => {
  const market = useValidMarket(event)
  const now = getDateWithMarketOffset(market.offset)
  const todayKey = toDateKey(now)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const lastYear = new Date(now)
  lastYear.setFullYear(lastYear.getFullYear() - 1)

  const [today, spotlightRaw, next, lastYearImage, timeline, latest] = await Promise.all([
    getImageByDateKey(todayKey, market.lang),
    getImageByDateKey(todayKey, SPOTLIGHT_LANG),
    getImageByDateKey(toDateKey(tomorrow), market.lang),
    getImageByDateKey(toDateKey(lastYear), market.lang),
    getYearlyImages(market, now),
    getCachedImagesFromStorage(0, 12, market),
  ])

  // 随机美图每次请求都会换一张，同时避开今日壁纸
  const random = await getRandomImage(market, today?.url)

  const spotlight = spotlightRaw && spotlightRaw.url !== today?.url
    ? spotlightRaw
    : latest.find(item => item.url !== today?.url) ?? spotlightRaw ?? today

  return {
    date: today?.date ?? '',
    market: market.lang,
    today,
    spotlight,
    random,
    next,
    lastYear: lastYearImage,
    timeline,
    latest,
  }
})