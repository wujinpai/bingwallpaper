<script setup lang="ts">
const { query } = useSearch()

const isShuffling = ref(false)

async function openRandom() {
  if (isShuffling.value)
    return

  isShuffling.value = true
  try {
    const image = await $fetch<{ date: string }>('/api/random')
    if (image?.date)
      await navigateTo(`/${image.date}`)
  }
  catch {
    // 忽略随机失败
  }
  isShuffling.value = false
}
</script>

<template>
  <header class="border-b-1 border-black:5 bg-white">
    <div class="container-page h-[68px] flex items-center gap-3 md:h-[88px]">
      <NuxtLink to="/" class="flex shrink-0 items-center gap-2">
        <i class="i-logos-bing mt--2px text-2xl" />
        <span class="text-lg font-bold text-ink">必应壁纸</span>
      </NuxtLink>

      <div class="hidden h-10 w-[240px] items-center gap-2 rounded-full bg-light px-4 lg:flex">
        <input
          v-model="query"
          class="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-secondary"
          placeholder="探索世界，回车一下"
        >
        <i v-if="query" class="i-system-uicons-cross cursor-pointer text-secondary hover:text-ink" @click="query = ''" />
        <i v-else class="i-system-uicons-search text-secondary" />
      </div>

      <nav class="ml-auto hidden items-center gap-7 text-sm text-ink md:flex">
        <a href="#hero" class="transition-colors hover:text-primary">首页</a>
        <a href="#timeline" class="transition-colors hover:text-primary">时光印记</a>
        <a href="#wallpapers" class="transition-colors hover:text-primary">必应壁纸</a>
        <a href="#popular" class="transition-colors hover:text-primary">榜单</a>
      </nav>

      <button
        class="icon-btn ml-auto md:ml-4"
        title="随机一张"
        :disabled="isShuffling"
        @click="openRandom"
      >
        <i :class="isShuffling ? 'i-system-uicons-loader animate-spin' : 'i-system-uicons-shuffle'" />
      </button>
    </div>
  </header>
</template>