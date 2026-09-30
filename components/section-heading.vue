<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="mb-3 flex items-end justify-between gap-3 md:mb-5">
    <div class="min-w-0">
      <h2 class="section-title flex items-center gap-2">
        <i :class="icon" class="shrink-0 text-[26px] text-primary md:text-[30px]" />
        <span class="truncate">{{ title }}</span>
      </h2>
      <p v-if="subtitle" class="section-subtitle truncate">
        {{ subtitle }}
      </p>
    </div>

    <div class="shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>