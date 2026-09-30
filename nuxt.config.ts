import { resolve } from 'node:path'
import { cwd, env } from 'node:process'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxtjs/sitemap',
    'nuxt-simple-robots',
  ],

  css: [
    '@unocss/reset/tailwind.css',
    '~/styles/base.css',
  ],

  nitro: {
    serverAssets: [{
      baseName: 'archive',
      dir: resolve(cwd(), 'archive'),
    }],
  },

  site: {
    // 部署平台必须配置该环境变量，否则 sitemap / robots 会生成 undefined 域名
    url: env.NUXT_SITE_URL || 'http://localhost:3000',
  },

  sitemap: {
    debug: true,
    sources: ['/api/sitemap'],
    defaultSitemapsChunkSize: 1000,
  },

  robots: {
    sitemap: [
      `/sitemap.xml`,
    ],
  },

  compatibilityDate: '2024-10-10',
})
