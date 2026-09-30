<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-10 bg-gradient-to-br from-[#1A1F2E] to-[#2D3548] text-white md:mt-16">
    <div class="container-page py-10 text-center">
      <div class="flex items-center justify-center gap-2 text-lg font-bold">
        <i class="i-logos-bing mt--2px text-2xl" />
        <span>有图必应</span>
      </div>

      <p class="mt-3 text-sm text-white:75">
        每日更新，一张壁纸探索一个世界
      </p>
      <p class="mt-1 text-xs text-white:55">
        本站所有图片均来自 Bing 搜索，仅供学习交流使用
      </p>

      <div class="mt-5 text-xs text-white:55">
        © {{ year }}
        <NuxtLink to="/" class="ml-1 text-white:85 hover:text-white">必应壁纸归档</NuxtLink>
      </div>
    </div>
  </footer>
</template>