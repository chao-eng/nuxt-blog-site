<script lang="ts" setup>
interface Props {
  path?: string
  title?: string
  date?: string
  description?: string
  image?: string
  alt?: string
  tags?: Array<string>
  isSticky?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  path: '/',
  title: 'no-title',
  date: 'no-date',
  description: 'no-description',
  image: '',
  alt: 'no-alt',
  tags: () => [],
  isSticky: false
})

const formatDate = (dateString: string) => {
  if (!dateString || dateString === 'no-date') return '暂无日期'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full group">
    <NuxtLink :to="path" class="flex flex-col h-full">
      <!-- 封面图区域 -->
      <div class="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-700">
        <!-- 封面图直接使用 img，如果没有则使用默认图 -->
        <img
          :src="image || '/not-found.webp'"
          :alt="alt"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        >
        
        <!-- 置顶标识 -->
        <div v-if="isSticky" class="absolute top-2 right-2">
           <UBadge color="warning" variant="solid" size="xs" class="shadow-sm">
             <UIcon name="i-lucide-pin" class="w-3 h-3 mr-1" />
             置顶
           </UBadge>
        </div>
      </div>

      <!-- 文字内容区域 -->
      <div class="p-4 flex flex-col flex-1">
        <h3 class="text-gray-900 dark:text-white font-medium text-[15px] line-clamp-2 mb-4 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {{ title }}
        </h3>
        
        <!-- 底部信息 -->
        <div class="mt-auto flex items-center text-[13px] text-gray-500 dark:text-gray-400 gap-1.5">
          <UIcon name="i-lucide-calendar-days" class="w-4 h-4 opacity-70" />
          <span>{{ formatDate(date) }}</span>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
