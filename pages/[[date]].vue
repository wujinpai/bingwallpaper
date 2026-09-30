<script setup lang="ts">
const { height: windowHeight } = useWindowSize()
const { y: scrollY } = useWindowScroll()

const { data: home } = await useFetch('/api/home', { key: 'home' })

const { loadStats } = useStats()

// 「随机美图」在 SSR 已给出一张，挂载后再换一张，保证每次刷新都不一样
const randomImage = ref(home.value?.random ?? null)

onMounted(async () => {
  loadStats()

  try {
    const image = await $fetch('/api/random', { query: { exclude: home.value?.today?.url } })
    if (image)
      randomImage.value = image
  }
  catch {
    // 保持 SSR 给出的那张
  }
})

const isBackTopVisible = computed(() => scrollY.value > windowHeight.value * 0.5)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const requestUrl = useRequestURL()
const { market } = useMarket()

useHead({
  htmlAttrs: { lang: market.value.lang },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'canonical', href: requestUrl.toString() },
  ],
  meta: [
    { name: 'keywords', content: market.value.keywords },
    { name: 'viewport', content: 'width=device-width,user-scalable=no,initial-scale=1,maximum-scale=1,minimum-scale=1,viewport-fit=cover' },
    { name: 'theme-color', content: '#8B3DFF' },
  ],
})

useCustomSeoMeta({
  title: `${market.value.title} · 必应每日一图`,
  description: market.value.description,
  ogUrl: requestUrl.toString(),
  ogImage: home.value?.today?.url || `${requestUrl.origin}/og.jpeg`,
})
</script>

<template>
  <div class="pb-2">
    <template v-if="home">
      <HeroSection
        :today="home.today"
        :spotlight="home.spotlight"
        :random="randomImage"
        :next="home.next"
        :last-year="home.lastYear"
      />

      <TimelineSection :items="home.timeline" />

      <WallpaperSection />

      <PopularSection :latest="home.latest" />
    </template>

    <div v-else class="container-page py-20 text-center text-secondary">
      正在加载必应壁纸…
    </div>

    <ImagePreview />

    <button
      v-show="isBackTopVisible"
      class="icon-btn fixed bottom-6 right-6 z-30 bg-white shadow-lg"
      title="回到顶部"
      @click="scrollToTop"
    >
      <i class="i-system-uicons-arrow-up-circle" />
    </button>
  </div>
</template>