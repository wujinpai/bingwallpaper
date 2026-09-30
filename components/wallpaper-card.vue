<script setup lang="ts">
import type { BingImageMeta } from '~/types'

const props = defineProps<{ image: BingImageMeta, rank?: number }>()

const { viewCount, likeCount } = useStats()
</script>

<template>
  <NuxtLink :to="`/${props.image.date}`" class="group block">
    <div class="card-round aspect-[4/3] bg-light">
      <UiImage
        :src="thumbUrl(props.image.url, 640, 480)"
        :alt="props.image.title"
        class="transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <span
        v-if="props.rank"
        class="absolute left-2 top-2 z-1 grid h-6 w-6 place-items-center rounded-full bg-black:45 text-xs font-bold text-white backdrop-blur"
      >
        {{ props.rank }}
      </span>
    </div>

    <div class="pt-3">
      <h6 class="text-[15px] font-medium leading-[1.25] text-ink transition-colors line-clamp-2 group-hover:text-primary">
        {{ props.image.title }}
      </h6>
      <ul class="meta-text mt-2 flex items-center gap-3">
        <li class="flex items-center gap-1">
          <i class="i-system-uicons-calendar-day" />{{ props.image.date }}
        </li>
        <li class="flex items-center gap-1">
          <i class="i-system-uicons-eye" />{{ viewCount(props.image.date) }}
        </li>
        <li class="flex items-center gap-1">
          <i class="i-system-uicons-heart" />{{ likeCount(props.image.date) }}
        </li>
      </ul>
    </div>
  </NuxtLink>
</template>