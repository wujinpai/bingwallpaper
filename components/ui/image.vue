<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ src: string, alt?: string }>()

const el = ref<HTMLImageElement>()
const loaded = ref(false)

// 图片可能在 hydration 之前就加载完成，此时不会再触发 load 事件
onMounted(() => {
  if (el.value?.complete)
    loaded.value = true
})
</script>

<template>
  <img
    ref="el" v-bind="$attrs" :src="src" :alt="alt" loading="lazy" decoding="async"
    class="h-full w-full object-cover transition-opacity duration-500"
    :class="loaded ? 'op-100' : 'op-0'"
    @load="loaded = true"
    @error="loaded = true"
  >
</template>