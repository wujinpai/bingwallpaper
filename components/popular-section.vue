<script setup lang="ts">
import type { BingImageMeta } from '~/types'

const props = defineProps<{ latest: BingImageMeta[] }>()

const { views, viewCount, loadStats } = useStats()

const ranked = ref<BingImageMeta[]>([])

const list = computed(() => ranked.value.length ? ranked.value : props.latest.slice(0, 6))

async function pickTop() {
  const entries = Object.entries(views.value ?? {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const seen = new Set<string>()
  const picked: BingImageMeta[] = []

  const results = await Promise.all(entries.map(async ([date]) => {
    try {
      return await $fetch<BingImageMeta>('/api/image', { query: { date } })
    }
    catch {
      return null
    }
  }))

  for (const item of results) {
    if (item && !seen.has(item.date)) {
      seen.add(item.date)
      picked.push(item)
    }
  }

  // 浏览量数据不足 6 条时，用最新壁纸补齐，保证该区块始终排满
  for (const item of props.latest) {
    if (picked.length >= 6)
      break

    if (!seen.has(item.date)) {
      seen.add(item.date)
      picked.push(item)
    }
  }

  ranked.value = picked.slice(0, 6)
}

onMounted(async () => {
  await loadStats()
  await pickTop()
})
</script>

<template>
  <section id="popular" class="section-block">
    <SectionHeading icon="i-system-uicons-heart" title="近期热门" subtitle="众之所好，或汝之所好" />

    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <NuxtLink
        v-for="image in list"
        :key="image.date"
        :to="`/${image.date}`"
        class="overlay-bottom card-round group block aspect-[3/4] bg-light transition-transform duration-300 hover:-translate-y-1"
      >
        <UiImage
          :src="thumbUrl(image.url, 480, 640)"
          :alt="image.title"
          class="transition-transform duration-500 group-hover:scale-[1.05]"
        />
        <span class="absolute right-2 top-2 z-1 flex items-center gap-1 rounded bg-black:45 px-2 py-0.5 text-[12.75px] text-white backdrop-blur">
          <i class="i-system-uicons-eye" />{{ viewCount(image.date) }}
        </span>
        <h6 class="absolute inset-x-0 bottom-0 z-1 p-3 text-sm font-medium text-white text-shadow-lg line-clamp-2">
          {{ image.title }}
        </h6>
      </NuxtLink>
    </div>
  </section>
</template>