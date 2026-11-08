export type Market = 'zh-CN'

interface MarketConfig {
  lang: Market
  flag: string
  name: string
  offset: number
  title: string
  keywords: string
  description: string
  startDate: string
}

export const markets: MarketConfig[] = [
  {
    lang: 'zh-CN',
    flag: '🇨🇳',
    name: '简体中文',
    offset: +8 * 60,
    title: '必应壁纸',
    description: '每日一图，带你领略世界之美-Jisu',
    keywords: '壁纸, Jisu，壁纸下载, 壁纸免费下载, 必应壁纸, 必应壁纸下载, 必应壁纸免费下载, 4k 壁纸, 4k 壁纸下载, 4k 壁纸免费下载, 高清壁纸, 高清壁纸下载, 高清壁纸免费下载',
    startDate: '2016-03-05 00:00:00',
  },
]

export const allMkt: string[] = markets.map(m => m.lang)

// 站点默认语言：简体中文
export const defaultMarket = markets.find(m => m.lang === 'zh-CN')!
