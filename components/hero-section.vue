<script setup lang="ts">
import type { BingImageMeta } from '~/types'

const props = defineProps<{
  today?: BingImageMeta | null
  spotlight?: BingImageMeta | null
  random?: BingImageMeta | null
  next?: BingImageMeta | null
  lastYear?: BingImageMeta | null
}>()

const { viewCount, recordView } = useStats()

onMounted(() => {
  if (props.today?.date)
    recordView(props.today.date)
})

const smallCards = computed(() => [
  { key: 'spotlight', label: '最新聚焦', badge: 'bg-danger text-white', image: props.spotlight },
  { key: 'random', label: '随机美图', badge: 'bg-warning text-ink', image: props.random },
  { key: 'next', label: '未来预览', badge: 'bg-success text-white', image: props.next },
  { key: 'lastYear', label: '去年今日', badge: 'bg-info text-white', image: props.lastYear },
])
</script>

<template>
  <section id="hero" class="container-page mt-4 md:mt-6">
    <div class="grid gap-3 md:grid-cols-2 md:gap-4">
      <NuxtLink
        v-if="today"
        :to="`/${today.date}`"
        class="card-round overlay-bottom group block aspect-[1/1.03] bg-light"
      >
        <UiImage
          :src="thumbUrl(today.url, 1100, 1130)"
          :alt="today.title"
          class="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div class="absolute inset-x-0 bottom-0 z-1 p-4 text-white md:p-6">
          <span class="rounded bg-primary px-2 py-0.5 text-[12.75px] font-medium">必应今日</span>
          <h2 class="mt-2 text-[22px] font-bold leading-snug text-shadow-lg line-clamp-2 md:text-[32px]">
            {{ today.title }}
          </h2>
          <p class="mt-1 text-xs text-white:75 line-clamp-1">
            {{ today.copyright }}
          </p>
          <div class="mt-2 flex items-center gap-4 text-xs text-white:85">
            <span class="flex items-center gap-1">
              <i class="i-system-uicons-calendar-day" />{{ today.date }}
            </span>
            <span class="flex items-center gap-1">
              <i class="i-system-uicons-eye" />{{ viewCount(today.date) }}
            </span>
          </div>
        </div>
      </NuxtLink>

      <div v-else class="card-round flex aspect-[1/1.03] items-center justify-center bg-light text-secondary">
        <span class="text-sm">今日壁纸正在路上…</span>
      </div>

      <div class="grid grid-cols-2 gap-3 md:gap-4">
        <template v-for="card in smallCards" :key="card.key">
          <NuxtLink
            v-if="card.image"
            :to="`/${card.image.date}`"
            class="card-round overlay-bottom group block aspect-square bg-light"
          >
            <UiImage
              :src="thumbUrl(card.image.url, 520, 520)"
              :alt="card.image.title"
              class="transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <span class="absolute left-2 top-2 z-1 rounded px-2 py-0.5 text-[12.75px] font-medium" :class="card.badge">
              {{ card.label }}
            </span>
            <p class="absolute inset-x-0 bottom-0 z-1 p-3 text-sm font-medium text-white text-shadow-lg line-clamp-2">
              {{ card.image.title }}
            </p>
          </NuxtLink>

          <div
            v-else
            class="card-round flex aspect-square flex-col items-center justify-center gap-2 bg-light p-3 text-center"
          >
            <span class="rounded px-2 py-0.5 text-[12.75px] font-medium" :class="card.badge">{{ card.label }}</span>
            <span class="text-xs text-secondary">明日壁纸更新后揭晓</span>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>