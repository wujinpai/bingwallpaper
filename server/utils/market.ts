import type { H3Event } from 'h3'
import type { Market } from '~/config/market'
import { allMkt, defaultMarket, markets } from '~/config/market'

const OFFSET_SYSTEM = new Date().getTimezoneOffset()
export function getDateWithMarketOffset(offset: number) {
  return new Date(Date.now() + (offset + OFFSET_SYSTEM) * 60 * 1000)
}

export function isAllowedMkt(mkt: string): mkt is Market {
  return allMkt.includes(mkt)
}

export function useValidMarket(event: H3Event) {
  // 默认使用简体中文，仅在显式传入 ?mkt= 时切换语言
  const mkt = getQuery<{ mkt?: string }>(event).mkt
  if (mkt && isAllowedMkt(mkt))
    return markets.find(m => m.lang === mkt)!
  return defaultMarket
}
