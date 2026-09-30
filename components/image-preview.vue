<script setup lang="ts">
const route = useRoute()
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const { previewImage, getPreviewImage, isFeching } = usePreview()
const { viewCount, likeCount, isLiked, toggleLike, recordView } = useStats()

/** 不用 new Date('YYYY-MM-DD')，避免被解析成 UTC 导致时区偏移一天 */
function parseDate(value: string) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return matched
    ? new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
    : new Date(value)
}

function toIso(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

const previewDate = computed(() => {
  const date = Array.isArray(route.params.date) ? route.params.date[0] : route.params.date
  return ISO_DATE.test(date) ? date : null
})

function shiftDate(step: number) {
  if (!previewDate.value)
    return ''

  const date = parseDate(previewDate.value)
  date.setDate(date.getDate() + step)

  if (date < parseDate('2016-03-05') || date > new Date())
    return ''

  return toIso(date)
}

const previewDatePrev = computed(() => shiftDate(-1))
const previewDateNext = computed(() => shiftDate(1))

watch(() => previewDate.value, async (date) => {
  if (date)
    await getPreviewImage(date)
  else
    previewImage.value = null
}, { immediate: true })

watch(previewImage, (image) => {
  if (image?.date)
    recordView(image.date)
})

const previewUrl = computed(() => {
  if (!previewImage.value)
    return ''

  return thumbUrl(previewImage.value.url, 1280, 720)
})

const downloads = computed(() => {
  if (!previewImage.value)
    return []

  const { url, date } = previewImage.value
  const filename = `bing-${date}-1920x1080.jpg`

  if (!url.includes('/th?id=')) {
    return [{ label: '1920x1080', url, filename }]
  }

  return [
    { label: '4k·UHD', url: url.replace('1920x1080', 'UHD'), filename: filename.replace('1920x1080', '4k_UHD') },
    { label: '1920x1200', url: url.replace('1920x1080', '1920x1200'), filename: filename.replace('1920x1080', '1920x1200') },
    { label: '1920x1080', url, filename },
    { label: '1366x768', url: url.replace('1920x1080', '1366x768'), filename: filename.replace('1920x1080', '1366x768') },
    { label: '1024x768', url: url.replace('1920x1080', '1024x768'), filename: filename.replace('1920x1080', '1024x768') },
    { label: '768x1280', url: url.replace('1920x1080', '768x1280'), filename: filename.replace('1920x1080', '768x1280') },
  ]
})

const busyUrl = ref('')

function downloadFile(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

async function downloadImage(item: { url: string, filename: string }) {
  if (busyUrl.value)
    return

  busyUrl.value = item.url
  try {
    const sameOrigin = new URL(item.url, window.location.origin).origin === window.location.origin
    if (sameOrigin) {
      downloadFile(item.url, item.filename)
    }
    else {
      const response = await fetch(item.url)
      const blob = await response.blob()
      downloadFile(URL.createObjectURL(blob), item.filename)
    }
  }
  catch {
    // 跨域下载失败时退化为新标签打开原图
    window.open(item.url, '_blank')
  }
  busyUrl.value = ''
}

function close() {
  navigateTo('/')
}
</script>

<template>
  <UiDialog :visible="!!previewDate" @close="close">
    <div class="w-[92vw] max-w-[1024px] rounded-[5px] bg-white">
      <div class="flex items-center justify-between gap-2 border-b-1 border-black:8 px-4 py-3">
        <div class="flex items-center gap-2 text-sm text-secondary">
          <i class="i-system-uicons-calendar-day" />
          <span>{{ previewDate }}</span>
        </div>

        <div class="flex items-center gap-2">
          <NuxtLink v-if="previewDatePrev" :to="`/${previewDatePrev}`" class="icon-btn" title="前一天">
            <i class="i-system-uicons-arrow-left" />
          </NuxtLink>
          <NuxtLink v-if="previewDateNext" :to="`/${previewDateNext}`" class="icon-btn" title="后一天">
            <i class="i-system-uicons-arrow-right" />
          </NuxtLink>
          <button class="icon-btn" title="关闭" @click="close">
            <i class="i-system-uicons-cross" />
          </button>
        </div>
      </div>

      <div class="relative aspect-video bg-light">
        <div v-if="isFeching" class="absolute inset-0 grid place-items-center">
          <i class="i-system-uicons-loader animate-spin text-3xl text-secondary" />
        </div>
        <UiImage v-else-if="previewImage" :src="previewUrl" :alt="previewImage.title" loading="eager" />
        <div v-else class="absolute inset-0 grid place-items-center text-sm text-secondary">
          这张壁纸还没有归档
        </div>
      </div>

      <div v-if="previewImage" class="p-4 md:p-5">
        <h3 class="text-lg font-bold text-ink md:text-xl">
          {{ previewImage.title }}
        </h3>
        <p class="mt-1 text-sm text-secondary">
          {{ previewImage.copyright }}
        </p>

        <div class="meta-text mt-3 flex flex-wrap items-center gap-4">
          <span class="flex items-center gap-1">
            <i class="i-system-uicons-eye" />{{ viewCount(previewImage.date) }} 次浏览
          </span>
          <button
            class="flex items-center gap-1 transition-colors"
            :class="isLiked(previewImage.date) ? 'text-danger' : 'hover:text-primary'"
            @click="toggleLike(previewImage.date)"
          >
            <i class="i-system-uicons-heart" />{{ likeCount(previewImage.date) }} 点赞
          </button>
          <a
            v-if="previewImage.copyrightlink"
            class="flex items-center gap-1 transition-colors hover:text-primary"
            :href="previewImage.copyrightlink"
            target="_blank"
            rel="noopener"
          >
            <i class="i-logos-bing" />在 Bing 中搜索
          </a>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2 md:flex md:flex-wrap">
          <button
            v-for="item in downloads"
            :key="item.url"
            class="btn-pill border-1 border-primary:30 bg-primary:10 text-primary transition-colors hover:bg-primary hover:text-white"
            :disabled="busyUrl === item.url"
            @click="downloadImage(item)"
          >
            <i :class="busyUrl === item.url ? 'i-system-uicons-loader animate-spin' : 'i-system-uicons-cloud-download-alt'" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </UiDialog>
</template>