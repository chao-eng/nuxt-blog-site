<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = '布吉岛'
const description = '布吉岛'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <!-- Nuxt 内置的页面加载指示器（进度条），在页面切换时显示加载状态 -->
    <NuxtLoadingIndicator />

    <!-- NuxtLayout 是 Nuxt.js（特别是 Nuxt 3）中用于管理页面布局的核心组件，它的作用是将布局模板与页面内容结合起来，实现应用中公共 UI 结构（如导航栏、侧边栏、页脚等）的复用，同时让页面专注于自身的业务内容 -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
