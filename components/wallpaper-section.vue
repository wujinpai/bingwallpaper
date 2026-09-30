<script setup lang="ts">
const { mkt } = useMarket()
const { query } = useSearch()
const { isFetching, hasMore, imageMap, loadImages } = useImages()

const all = computed(() =>
  [...imageMap.value.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
)

const keyword = computed(() => query.value.trim().toLowerCase())

const images = computed(() => {
  if (!keyword.value)
    return all.value

  return all.value.filter(item =>
    item.title.toLowerCase().includes(keyword.value)
    || item.copyright.toLowerCase().includes(keyword.value),
  )
})

await loadImages({ idx: 0, count: 12, mkt: mkt.value })

async function loadMore() {
  await loadImages({ idx: all.value.length, count: 12, mkt: mkt.value })
}

// 搜索时自动多翻几页，尽量在已归档范围内凑够结果
watch(keyword, async (value) => {
  if (!value)
    return

  for (let i = 0; i < 6 && hasMore.value && images.value.length < 12; i++)
    await loadMore()
})
</script>

<template>
  <section id="wallpapers" class="section-block">
    <SectionHeading icon="i-system-uicons-calendar" title="必应壁纸" subtitle="一张壁纸，探索一个世界......" />

    <p v-if="keyword" class="meta-text -mt-2 mb-3">
      正在已加载的壁纸中搜索「{{ query }}」，共 {{ images.length }} 条结果
    </p>

    <div class="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 lg:grid-cols-4">
      <WallpaperCard v-for="image in images" :key="image.date" :image="image" />
    </div>

    <div class="mt-6 flex justify-center">
      <button v-if="hasMore" class="btn-soft" :disabled="isFetching" @click="loadMore">
        <i :class="isFetching ? 'i-system-uicons-loader animate-spin' : 'i-system-uicons-arrow-up-circle'" />
        <span>{{ isFetching ? '加载中' : '加载更多' }}</span>
      </button>
      <span v-else class="meta-text">已经看到底啦</span>
    </div>
  </section>
</template>