<script setup lang="ts">
import type { BingImageMeta } from '~/types'

defineProps<{ items: { year: number, image: BingImageMeta }[] }>()

const scroller = ref<HTMLElement>()

function scrollByStep(direction: number) {
  scroller.value?.scrollBy({ left: direction * 290, behavior: 'smooth' })
}
</script>

<template>
  <section id="timeline" class="section-block">
    <SectionHeading icon="i-system-uicons-clock" title="时光印记" subtitle="穿越时空，感受历史的温度">
      <template #action>
        <div class="flex gap-2">
          <button class="icon-btn" title="向前" @click="scrollByStep(-1)">
            <i class="i-system-uicons-chevron-left" />
          </button>
          <button class="icon-btn" title="向后" @click="scrollByStep(1)">
            <i class="i-system-uicons-chevron-right" />
          </button>
        </div>
      </template>
    </SectionHeading>

    <div ref="scroller" class="scrollbar-none snap-x-mandatory flex gap-4 of-x-auto pb-2">
      <NuxtLink
        v-for="item in items"
        :key="item.year"
        :to="`/${item.image.date}`"
        class="snap-start-item card-round group h-[180px] w-[258px] shrink-0 bg-light shadow-md transition-shadow duration-300 hover:shadow-lg"
      >
        <UiImage
          :src="thumbUrl(item.image.url, 640, 450)"
          :alt="item.image.title"
          class="transition-transform duration-500 group-hover:scale-[1.05]"
        />

        <div class="absolute inset-0 z-1 grid place-items-center transition-all duration-300 group-hover:(scale-95 op-0)">
          <span class="text-[42px] font-extrabold text-white text-shadow-lg md:text-[48px]">{{ item.year }}</span>
        </div>

        <div class="overlay-bottom absolute inset-0 z-1 flex flex-col justify-end p-4 op-0 transition-opacity duration-300 group-hover:op-100">
          <p class="text-[15px] font-semibold text-white line-clamp-2">
            {{ item.image.title }}
          </p>
          <span class="btn-pill mt-2 w-fit bg-primary text-white">
            探索更多
            <i class="i-system-uicons-arrow-right" />
          </span>
        </div>
      </NuxtLink>

      <div v-if="!items.length" class="meta-text">
        暂无历史数据，等待归档更新
      </div>
    </div>
  </section>
</template>