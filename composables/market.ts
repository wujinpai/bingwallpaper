import { defaultMarket, markets } from '~/config/market'

export function useMarket() {
  const route = useRoute()

  // 默认使用简体中文，仅在显式传入 ?mkt= 时切换语言
  const market = computed(() => {
    const mkt = route.query.mkt as string | undefined
    return markets.find(m => m.lang === mkt) || defaultMarket
  })

  return {
    market,
    markets,
    mkt: computed(() => market.value!.lang),
  }
}
