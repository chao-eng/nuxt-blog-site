<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  layout: 'blog'
})

useHead({
  title: t('nav.travel'),
  meta: [
    {
      name: 'description',
      content: t('admin.tra.managementDesc')
    }
  ]
})
</script>

<template>
  <main class="container max-w-5xl mx-auto text-zinc-600 min-h-screen">
    <UContainer class="py-8">
      <!-- 移除多余的外部样式包裹，直接展示地图 -->
      <div class="overflow-hidden">
        <ClientOnly>
          <TravelMap />
        </ClientOnly>
      </div>
    </UContainer>
  </main>
</template>
