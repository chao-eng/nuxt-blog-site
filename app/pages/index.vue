<script setup lang="ts">
// 根据登录状态动态设置布局
definePageMeta({
  layout: 'blog' // 先禁用默认布局
})
</script>

<template>
  <div>
    <main class="container max-w-5xl mx-auto text-zinc-600">
      <BlogsMainHero />
      <BlogsMainRecent />
      <BlogsMainSticky />
      <!-- 旅游地图区域 -->
      <section class="w-full">
        <ClientOnly>
          <TravelMap />
        </ClientOnly>
      </section>
    </main>
  </div>
</template>
